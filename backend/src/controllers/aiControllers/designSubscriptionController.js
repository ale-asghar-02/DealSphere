const Stripe = require("stripe");
const config = require("../../configs/config");
const stripe = Stripe(config.STRIPE_SECRET_KEY);

const userModel = require("../../models/userModel");
const { DesignPlan } = require("../../models/designModel");
const AppError = require("../../utils/AppError");
const { convertPkrToUsdCents } = require("../../utils/currency");
const { SUBSCRIPTION } = require("../../configs/designConfig");
const { buildCheckoutUrls } = require("../../configs/buildCheckoutUrls");

const MIN_CHARGE_USD_CENTS = 50; // Stripe ki kam se kam raqam

const isPlanActive = (sub) =>
  !!sub &&
  sub.plan !== "free" &&
  sub.status === "active" &&
  !!sub.expiryDate &&
  new Date(sub.expiryDate) > new Date();

/* ------------------------------------------------------------------ */
/* PUBLIC: plans ki list                                               */
/* ------------------------------------------------------------------ */
const readPlans = async (req, res, next) => {
  try {
    const plans = await DesignPlan.find({ isActive: true }).sort({ price: 1 });

    const data = plans.map((plan) => {
      const effectivePrice = plan.getEffectivePrice();
      return {
        name: plan.name,
        price: plan.price,
        effectivePrice,
        hasActiveDiscount: effectivePrice < plan.price,
        discountPercentage: plan.discountPercentage,
        discountValidUntil: plan.discountValidUntil,
        durationInDays: plan.durationInDays,
        dailyLimit: plan.dailyLimit,
        monthlyLimit: plan.monthlyLimit,
        editsPerDesign: plan.editsPerDesign,
        watermark: plan.watermark,
        // Paid plan jis par monthly limit nahi, usay "Unlimited" dikhayen (daily fair-use cap peeche rehta hai)
        unlimitedDisplay: plan.name !== "free" && plan.monthlyLimit == null,
      };
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/* ------------------------------------------------------------------ */
/* USER: apna design subscription                                      */
/* ------------------------------------------------------------------ */
const getMySubscription = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user.id).select("designSubscription").lean();
    if (!user) return next(new AppError("User not found", 404));

    const sub = user.designSubscription || {};
    const active = isPlanActive(sub);

    res.status(200).json({
      success: true,
      data: {
        plan: active ? sub.plan : "free",
        status: active ? "active" : sub.plan && sub.plan !== "free" ? "expired" : "active",
        startDate: active ? sub.startDate : null,
        expiryDate: active ? sub.expiryDate : null,
        // Active plan ke dauran dobara kharidna band; expire ke baad koi bhi plan
        canPurchase: !active,
        availableAfter: active ? sub.expiryDate : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ------------------------------------------------------------------ */
/* USER: plan kharidna (Stripe Checkout)                               */
/* ------------------------------------------------------------------ */
const purchaseDesignPlan = async (req, res, next) => {
  try {
    const { planName } = req.validated.body;
    const userId = String(req.user.id);

    const user = await userModel.findById(userId).select("designSubscription").lean();
    if (!user) return next(new AppError("User not found", 404));

    if (isPlanActive(user.designSubscription)) {
      return res.status(409).json({
        success: false,
        code: "PLAN_ALREADY_ACTIVE",
        message: "You already have an active Design Studio plan. You can buy a new plan after it expires.",
        availableAfter: user.designSubscription.expiryDate,
      });
    }

    const plan = await DesignPlan.findOne({ name: planName, isActive: true });
    if (!plan) return next(new AppError("Plan not found", 404));

    const finalPrice = plan.getEffectivePrice(); // PKR, discount ke saath
    const { usdCents } = await convertPkrToUsdCents(finalPrice);
    if (usdCents < MIN_CHARGE_USD_CENTS) {
      return next(new AppError("This plan's price is below the minimum chargeable amount.", 400));
    }

    // type alag hai ("design_subscription"), taake seller wali subscription ke saath takrao na ho
    const metadata = {
      flow: "design_subscription",
      type: "design_subscription",
      userId,
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
            product_data: { name: `Design Studio - ${plan.name} plan` },
            unit_amount: usdCents,
          },
          quantity: 1,
        },
      ],
      metadata,
      // PaymentIntent par bhi metadata, warna payment_intent.payment_failed webhook ko type/userId nahi milta
      payment_intent_data: { metadata },
      // Purana checkout session baad mein istemal na ho (double-payment ka khatra kam)
      expires_at: Math.floor(Date.now() / 1000) + (SUBSCRIPTION.CHECKOUT_EXPIRY_MINUTES + 1) * 60,
      ...buildCheckoutUrls("design_subscription"),
    });

    res.status(200).json({ success: true, checkoutUrl: session.url });
  } catch (error) {
    next(error);
  }
};

module.exports = { readPlans, getMySubscription, purchaseDesignPlan };