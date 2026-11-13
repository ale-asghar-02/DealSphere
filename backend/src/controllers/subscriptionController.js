const Stripe = require("stripe");
const config = require("../configs/config");
const stripe = Stripe(config.STRIPE_SECRET_KEY);

const SubscriptionPlanModel = require("../models/subscriptionPlanModel");
const AppError = require("../utils/AppError");
const { convertPkrToUsdCents } = require("../utils/currency");
const { buildCheckoutUrls } = require("../configs/buildCheckoutUrls");
const { getSellerPlan, countByStatus, COUNTED, countFeaturedBreakdown, isUnlimited, getDaysLeft } = require("../utils/subscriptionUsage");

const EXPIRING_SOON_DAYS = 7;
const STRIPE_MIN_USD_CENTS = 50;

//* ── PUBLIC ──

const readAllPlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlanModel.find({ isActive: true });

    const plansWithEffectivePrice = plans.map((plan) => {
      const planObj = plan.toObject();
      planObj.effectivePrice = plan.getEffectivePrice();
      planObj.hasActiveDiscount = planObj.effectivePrice < plan.price;
      return planObj;
    });

    res.status(200).json({ success: true, data: plansWithEffectivePrice });
  } catch (error) {
    next(error);
  }
};

//* ── SELLER ──

const buildLimit = (limit, used) => {
  const unlimited = isUnlimited(limit);
  return {
    limit: unlimited ? null : limit,
    unlimited,
    used,
    remaining: unlimited ? null : Math.max(limit - used, 0),
    overLimit: !unlimited && used > limit,
    percent: unlimited || limit === 0 ? 0 : Math.min(Math.round((used / limit) * 100), 100),
  };
};

const sellerReadSubscription = async (req, res, next) => {
  try {
    if (req.user.accountType !== "seller") {
      return next(new AppError("Only sellers have a subscription", 403));
    }

    const { user, plan, planName, isExpired } = await getSellerPlan(req.user.id);

    const [adStats, productStats, featured] = await Promise.all([
      countByStatus(req.user.id, "ad"),
      countByStatus(req.user.id, "product"),
      countFeaturedBreakdown(req.user.id),
    ]);

    // Only active + pending listings occupy a slot
    const usedOf = (stats) => COUNTED.reduce((n, key) => n + (stats.byStatus[key] || 0), 0);

    const daysLeft =
      planName === "free" ? null : getDaysLeft(user.subscription?.expiryDate);

    res.status(200).json({
      success: true,
      data: {
        ...user.subscription.toObject(),
        plan: planName,
        status: isExpired ? "expired" : user.subscription.status,
        daysLeft,
        expiringSoon: daysLeft !== null && daysLeft <= EXPIRING_SOON_DAYS,
      },
      limits: {
        // used = live now (counts toward the limit), total = created all-time, byStatus = full record
        ads: { ...buildLimit(plan.maxAds, usedOf(adStats)), total: adStats.total, byStatus: adStats.byStatus },
        products: {
          ...buildLimit(plan.maxProducts, usedOf(productStats)),
          total: productStats.total,
          byStatus: productStats.byStatus,
        },
        // Featured slots are shared between ads and products
        featured: {
          ...buildLimit(plan.featuredSlots, featured.total),
          ads: featured.ads,
          products: featured.products,
        },
      },
      images: { ads: plan.maxAdImages, products: plan.maxProductImages },
    });
  } catch (error) {
    next(error);
  }
};

const sellerPurchaseSubscription = async (req, res, next) => {
  try {
    if (req.user.accountType !== "seller") {
      return next(new AppError("Only sellers can purchase a subscription", 403));
    }

    const { planName } = req.body;

    if (!["monthly", "yearly"].includes(planName)) {
      return next(new AppError("Invalid plan selected", 400));
    }

    const plan = await SubscriptionPlanModel.findOne({ name: planName, isActive: true });
    if (!plan) {
      return next(new AppError("Plan not found", 404));
    }

    // Block BEFORE creating any Stripe session: no downgrade from an active yearly plan
    const current = await getSellerPlan(req.user.id);
    if (current.planName === "yearly" && plan.name === "monthly") {
      return next(
        new AppError(
          "Your yearly plan is still active. You can renew it or wait until it expires.",
          400
        )
      );
    }

    // Discount-aware price (always calculated on the server)
    const finalPrice = plan.getEffectivePrice();
    const { usdCents } = await convertPkrToUsdCents(finalPrice);

    if (usdCents < STRIPE_MIN_USD_CENTS) {
      return next(new AppError("Plan price is too low to be processed", 400));
    }

    const meta = {
      flow: "subscription",
      type: "subscription",
      userId: String(req.user.id),
      planName: plan.name,
      amount: finalPrice.toString(),
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `${plan.name} subscription` },
            unit_amount: usdCents,
          },
          quantity: 1,
        },
      ],
      metadata: meta,
      payment_intent_data: { metadata: meta },
      ...buildCheckoutUrls("subscription"),
    });

    res.status(200).json({ success: true, checkoutUrl: session.url });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  readAllPlans,
  sellerReadSubscription,
  sellerPurchaseSubscription,
};