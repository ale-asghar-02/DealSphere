const Stripe = require('stripe');
const config = require('../configs/config');
const stripe = Stripe(config.STRIPE_SECRET_KEY);

const advertisementModel = require('../models/advertisementModel');
const productModel = require('../models/productModel');
const FeatureOrderModel = require('../models/featureOrderModel');
const FeaturePlanModel = require('../models/featurePlanModel');
const AppError = require('../utils/AppError');
const { convertPkrToUsdCents } = require('../utils/currency');
const { checkFeaturedLimit } = require("../utils/subscriptionUsage");
const { buildCheckoutUrls } = require("../configs/buildCheckoutUrls");

const getItemModel = (itemType) => {
  if (itemType === 'advertisement') return advertisementModel;
  if (itemType === 'product') return productModel;
  return null;
};

const getFeaturePlans = async (req, res, next) => {
  try {
    const plans = await FeaturePlanModel.find({ isActive: true });

    const plansWithPkr = {};

    for (const plan of plans) {
      const effectivePricePkr = plan.getEffectivePrice();

      const { usdCents } = await convertPkrToUsdCents(effectivePricePkr);

      plansWithPkr[plan.name] = {
        duration: plan.duration,
        pkr: plan.price,
        effectivePkr: effectivePricePkr,
        discountPercentage: effectivePricePkr < plan.price ? plan.discountPercentage : 0,
        effectivePriceUsdCents: usdCents,
      };
    }

    res.status(200).json({ success: true, plans: plansWithPkr });
  } catch (error) {
    next(error);
  }
};

const getFeatureStatus = async (req, res, next) => {
  try {
    const { itemType, itemId } = req.params;
    const Model = getItemModel(itemType);
    if (!Model) return next(new AppError('Invalid item type', 400));

    const selectFields = itemType === 'advertisement'
      ? 'isFeatured featuredPlan featuredUntil'
      : 'featured';

    const item = await Model.findById(itemId).select(selectFields);
    if (!item) return next(new AppError(`${itemType} not found`, 404));

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

const createCheckoutSession = async (req, res, next) => {
  try {
    const { itemType, itemId } = req.params;
    const { plan: planName } = req.body;

    const Model = getItemModel(itemType);
    if (!Model) return next(new AppError('Invalid item type', 400));

    const plan = await FeaturePlanModel.findOne({ name: planName, isActive: true });
    if (!plan) return next(new AppError('Invalid plan', 400));

    const item = await Model.findById(itemId);
    if (!item) return next(new AppError(`${itemType} not found`, 404));

    if (item.seller.toString() !== req.user.id.toString()) {
      return next(new AppError('Not authorized', 403));
    }

    // OPTIONAL (not blocking): agar item already active-featured hai, dobara paid
    // checkout allow karna waste-of-money hai for the seller. featureWithSubscription
    // me ye check already hai, yahan bhi consistent hona chahiye:
    const alreadyFeatured = itemType === "advertisement"
      ? item.isFeatured && item.featuredUntil > new Date()
      : item.featured?.isFeatured && item.featured?.until > new Date();
    if (alreadyFeatured) {
      return next(new AppError(`This ${itemType} is already featured`, 400));
    }

    const effectivePricePkr = plan.getEffectivePrice(); // PKR
    const { usdCents } = await convertPkrToUsdCents(effectivePricePkr); // Stripe ke liye USD cents

    const order = await FeatureOrderModel.create({
      itemType,
      item: item._id,
      seller: req.user.id,
      plan: plan.name,
      duration: plan.duration,
      // FIX: amount ab PKR mein save ho raha hai (matches model's currency:'pkr'
      // default, aur matches order/wallet/subscription - poore system mein amount
      // hamesha PKR hota hai). Pehle yahan USD cents save ho rahe thay jo
      // transaction ledger ko corrupt kar deta.
      amount: effectivePricePkr,
      currency: 'pkr',
      status: 'pending',
    });

    const meta = {
      flow: "featured",
      userId: String(req.user.id),
      orderId: order._id.toString(),
      itemId: item._id.toString(),
      itemType,
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: `Feature ${itemType} - ${plan.name} (${plan.duration} days)` },
            unit_amount: usdCents,
          },
          quantity: 1,
        },
      ],
      ...buildCheckoutUrls("featured", { itemType, itemId: item._id.toString() }),
      metadata: meta,
      payment_intent_data: { metadata: meta },
    });

    order.stripeSessionId = session.id;
    await order.save();

    res.status(200).json({ success: true, url: session.url });
  } catch (error) {
    next(error);
  }
};

const featureWithSubscription = async (req, res, next) => {
  try {
    const { itemType, itemId } = req.params;

    const Model = getItemModel(itemType);
    if (!Model) return next(new AppError('Invalid item type', 400));

    const item = await Model.findById(itemId);
    if (!item) return next(new AppError(`${itemType} not found`, 404));

    if (item.seller.toString() !== req.user.id.toString()) {
      return next(new AppError('Not authorized', 403));
    }

    const alreadyFeatured = itemType === "advertisement"
      ? item.isFeatured && item.featuredUntil > new Date()
      : item.featured?.isFeatured && item.featured?.until > new Date();

    if (alreadyFeatured) {
      return next(new AppError(`This ${itemType} is already featured`, 400));
    }

    const featuredDurationDays = await checkFeaturedLimit(req.user.id, itemType);

    const until = new Date();
    until.setDate(until.getDate() + featuredDurationDays);

    const updatePayload = itemType === "advertisement"
      ? { isFeatured: true, featuredPlan: "subscription", featuredUntil: until }
      : { featured: { isFeatured: true, plan: "subscription", until } };

    const updatedItem = await Model.findByIdAndUpdate(itemId, updatePayload, { new: true });

    res.status(200).json({
      success: true,
      message: `Your ${itemType} is now featured until ${until.toDateString()}.`,
      data: updatedItem,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getFeaturePlans, getFeatureStatus, createCheckoutSession, featureWithSubscription };