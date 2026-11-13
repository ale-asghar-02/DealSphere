const Stripe = require('stripe');
const config = require('../configs/config');
const stripe = Stripe(config.STRIPE_SECRET_KEY);

const userModel = require("../models/userModel");
const orderModel = require("../models/orderModel");
const cartModel = require("../models/cartModel");
const productModel = require("../models/productModel");
const advertisementModel = require("../models/advertisementModel");
const FeatureOrderModel = require("../models/featureOrderModel");
const subscriptionPlanModel = require("../models/subscriptionPlanModel");
const { DesignPlan } = require("../models/designModel");
const transactionModel = require("../models/transactionModel");
const transactionHelper = require("../utils/transactionHelper");
const AppError = require("../utils/AppError");
const { sendNotification } = require("../socket/notificationSocket");

const getItemModel = (itemType) => {
  if (itemType === 'advertisement') return advertisementModel;
  if (itemType === 'product') return productModel;
  return null;
};

const buildFeatureUpdate = (itemType, plan, featuredUntil) => {
  if (itemType === 'advertisement') {
    return { isFeatured: true, featuredPlan: plan, featuredUntil };
  }
  return { 'featured.isFeatured': true, 'featured.plan': plan, 'featured.until': featuredUntil };
};

const reduceStockForOrder = async (order) => {
  for (const item of order.items) {
    const product = await productModel.findById(item.product);
    if (product) {
      product.stock -= item.quantity;
      if (product.stock <= 0) {
        product.stock = 0;
        product.status = "soldout";
      } else if (product.stock < 0) {
        product.stock = 0;
      }
      await product.save();
    }
  }
};

// ════════════════════════════════════════════════════════
// FLOW DETECTION
// Naye sessions me metadata.flow hota hai. Purane (already khule hue)
// sessions ke liye purane metadata par fallback hai.
// ════════════════════════════════════════════════════════
const getFlow = (meta = {}) => {
  if (meta.flow) return meta.flow;
  if (meta.type === "subscription") return "subscription";
  if (meta.type === "design_subscription") return "design_subscription";
  if (meta.itemType) return "featured";
  if (meta.orderId) return "order";
  return null;
};

// ════════════════════════════════════════════════════════
// NORMAL ORDER (cart / buy-now) handlers
// ════════════════════════════════════════════════════════
const handleOrderPaymentSuccess = async (session) => {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;

  // verify-session se session expanded aata hai (object), webhook se string
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  const existing = await orderModel.findById(orderId);
  if (!existing || ["paid", "refunded"].includes(existing.paymentStatus)) return;

  // ── Order pehle hi cancel ho chuka tha: payment auto-refund ──
  if (existing.orderStatus === "cancelled") {
    // atomic claim, taake refund transaction do baar na bane
    const refundedOrder = await orderModel.findOneAndUpdate(
      {
        _id: orderId,
        orderStatus: "cancelled",
        paymentStatus: { $in: ["pending", "failed"] },
      },
      { paymentStatus: "refunded", stripePaymentIntentId: paymentIntentId },
      { new: true }
    );
    if (!refundedOrder) return;

    if (paymentIntentId) {
      await stripe.refunds.create(
        { payment_intent: paymentIntentId },
        { idempotencyKey: `order-refund-${session.id}` }
      );
    }

    await transactionHelper.createTransaction({
      user: refundedOrder.user,
      type: "order_refund",
      amount: refundedOrder.totalPrice,
      paymentMethod: "stripe",
      relatedRef: refundedOrder._id,
      relatedModel: "Order",
      status: "completed",
      description: `Auto-refund: payment completed after order #${refundedOrder._id} was already cancelled`,
    });

    await sendNotification({
      userId: refundedOrder.user,
      type: "payment",
      title: "Payment Refunded",
      message: `Your order was already cancelled, so the payment you just made has been refunded.`,
      actionUrl: `/orders/${refundedOrder._id}`,
      metadata: { orderId: refundedOrder._id, status: "refunded" },
    });
    return;
  }

  // ── Normal flow: atomic claim, sirf ek request jeetegi ──
  const order = await orderModel.findOneAndUpdate(
    {
      _id: orderId,
      paymentStatus: { $in: ["pending", "failed"] },
      orderStatus: { $ne: "cancelled" },
    },
    {
      paymentStatus: "paid",
      orderStatus: "processing",
      stripePaymentIntentId: paymentIntentId,
    },
    { new: true }
  );
  if (!order) return; // kisi aur request ne pehle hi claim kar liya

  await reduceStockForOrder(order);

  // card decline ke baad retry par transaction "failed" ho sakti hai, isliye dono
  await transactionModel.findOneAndUpdate(
    {
      relatedRef: order._id,
      relatedModel: "Order",
      status: { $in: ["pending", "failed"] },
    },
    { status: "completed" }
  );

  if (order.placedFrom === "cart") {
    const cart = await cartModel.findOne({ user: order.user });
    if (cart) {
      // sirf kharide gaye products hatao, baqi items cart mein rehne do
      const orderedIds = new Set(order.items.map((i) => i.product.toString()));
      cart.items = cart.items.filter((i) => !orderedIds.has(i.product.toString()));
      if (typeof cart.calculateTotal === "function") cart.calculateTotal();
      else if (cart.items.length === 0) cart.totalPrice = 0;
      await cart.save();
    }
  }

  await sendNotification({
    userId: order.user,
    type: "payment",
    title: "Payment Successful",
    message: `Your payment of Rs ${order.totalPrice} was successful. Your order is being processed.`,
    actionUrl: `/orders/${order._id}`,
    metadata: { orderId: order._id, status: "success" },
  });
};

const handleOrderPaymentExpired = async (session) => {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;

  // atomic: sirf unpaid order cancel hoga ("failed" bhi, jahan card decline ke baad user ne tab chhor di)
  const order = await orderModel.findOneAndUpdate(
    {
      _id: orderId,
      paymentStatus: { $in: ["pending", "failed"] },
      orderStatus: { $ne: "cancelled" },
    },
    {
      paymentStatus: "failed",
      orderStatus: "cancelled",
      cancelReason: "Payment session expired",
      cancelledAt: new Date(),
    },
    { new: true }
  );
  if (!order) return;

  await transactionModel.findOneAndUpdate(
    {
      relatedRef: order._id,
      relatedModel: "Order",
      status: { $in: ["pending", "failed"] },
    },
    { status: "failed" }
  );

  await sendNotification({
    userId: order.user,
    type: "payment",
    title: "Payment Failed",
    message: `Your payment session expired. Your order was not completed.`,
    actionUrl: `/orders/${order._id}`,
    metadata: { orderId: order._id, status: "expired" },
  });
};

const handleOrderPaymentFailed = async (paymentIntent) => {
  const orderId = paymentIntent.metadata?.orderId;
  if (!orderId) return;

  const order = await orderModel.findById(orderId);
  if (!order || order.paymentStatus !== "pending") return;

  order.paymentStatus = "failed";
  order.stripePaymentIntentId = paymentIntent.id;
  await order.save();

  await transactionModel.findOneAndUpdate(
    { relatedRef: order._id, relatedModel: "Order", status: "pending" }, // FIX: capital "Order"
    { status: "failed" }
  );

  await sendNotification({
    userId: order.user,
    type: "payment",
    title: "Payment Failed",
    message: `Your payment could not be completed. Please try again.`,
    actionUrl: `/orders/${order._id}`,
    metadata: {
      orderId: order._id,
      status: "failed",
      reason: paymentIntent.last_payment_error?.message || "Unknown error",
    },
  });
};

// ════════════════════════════════════════════════════════
// FEATURE ORDER (ads / product featuring) handlers
// ════════════════════════════════════════════════════════
const handleFeaturePaymentSuccess = async (session) => {
  const { orderId, itemId, itemType } = session.metadata;

  const order = await FeatureOrderModel.findById(orderId);
  if (!order || order.status === "paid") return;

  const featuredFrom = new Date();
  const featuredUntil = new Date();
  featuredUntil.setDate(featuredUntil.getDate() + order.duration);

  order.status = "paid";
  order.stripePaymentIntentId = session.payment_intent;
  order.featuredFrom = featuredFrom;
  order.featuredUntil = featuredUntil;
  await order.save();

  const Model = getItemModel(itemType);
  const updatePayload = buildFeatureUpdate(itemType, order.plan, featuredUntil);
  const item = await Model.findByIdAndUpdate(itemId, updatePayload, { new: true });

  // FIX: pehle feature/subscription purchases ki koi transaction record hi nahi banti thi,
  // isliye admin transaction history me ye payments kabhi dikhti nahi thin.
  await transactionHelper.createTransaction({
    user: order.seller,
    type: "featured_purchase",
    amount: order.amount,
    paymentMethod: "stripe",
    relatedRef: order._id,
    relatedModel: "FeatureOrder",
    status: "completed",
    stripeSessionId: session.id,
    description: `Featured ${itemType} purchase (${order.plan} plan, ${order.duration} days)`,
  });

  await sendNotification({
    userId: order.seller,
    type: "payment",
    title: "Payment Successful",
    message: `Your ${itemType} "${item ? item.title : ""}" is now featured (${order.plan} plan, ${order.duration} days).`,
    actionUrl: itemType === "advertisement" ? `/ads/${itemId}` : `/products/${itemId}`,
    metadata: {
      orderId: order._id,
      itemId,
      itemType,
      amount: order.amount,
      plan: order.plan,
      status: "success",
      image: itemType === "advertisement" ? item?.adsImages?.[0]?.url : item?.productImages?.[0]?.url,
      code: item?.adCode || null,
    },
  });
};

const handleFeaturePaymentExpired = async (session) => {
  const { orderId, itemId, itemType } = session.metadata;

  const order = await FeatureOrderModel.findById(orderId);
  if (!order || order.status !== "pending") return;

  order.status = "cancelled";
  await order.save();

  const Model = getItemModel(itemType);
  const item = await Model.findById(itemId);

  await sendNotification({
    userId: order.seller,
    type: "payment",
    title: "Payment Cancelled",
    message: `Payment for your ${itemType} "${item ? item.title : ""}" was cancelled. The checkout session expired.`,
    actionUrl: itemType === "advertisement" ? `/ads/${itemId}` : `/products/${itemId}`,
    metadata: { orderId: order._id, itemId, itemType, plan: order.plan, status: "cancelled" },
  });
};

const handleFeaturePaymentFailed = async (paymentIntent) => {
  const { orderId, itemId, itemType } = paymentIntent.metadata || {};
  if (!orderId) return;

  const order = await FeatureOrderModel.findById(orderId);
  if (!order || order.status !== "pending") return;

  order.status = "failed";
  order.stripePaymentIntentId = paymentIntent.id;
  await order.save();

  const Model = getItemModel(itemType);
  const item = await Model.findById(itemId);

  await transactionHelper.createTransaction({
    user: order.seller,
    type: "featured_purchase",
    amount: order.amount,
    paymentMethod: "stripe",
    relatedRef: order._id,
    relatedModel: "FeatureOrder",
    status: "failed",
    description: `Failed featured ${itemType} purchase attempt`,
  });

  await sendNotification({
    userId: order.seller,
    type: "payment",
    title: "Payment Failed",
    message: `Payment for your ${itemType} "${item ? item.title : ""}" failed. Please try again.`,
    actionUrl: itemType === "advertisement" ? `/ads/${itemId}` : `/products/${itemId}`,
    metadata: {
      orderId: order._id,
      itemId,
      itemType,
      plan: order.plan,
      status: "failed",
      reason: paymentIntent.last_payment_error?.message || "Unknown error",
    },
  });
};

// ════════════════════════════════════════════════════════
// SUBSCRIPTION (seller plan purchase) handlers
// ════════════════════════════════════════════════════════
const handleSubscriptionPaymentSuccess = async (session) => {
  const { userId, planName, amount } = session.metadata;
 
  // Only activate when Stripe confirms the money was actually received
  if (session.payment_status && session.payment_status !== "paid") return;
 
  const plan = await subscriptionPlanModel.findOne({ name: planName });
  if (!plan) return;
 
  const user = await userModel.findById(userId);
  if (!user) return;
 
  // Idempotency: a webhook retry for the same checkout session must not add days again
  const alreadyProcessed = await transactionModel.findOne({
    stripeSessionId: session.id,
    status: "completed",
  });
  if (alreadyProcessed) return;
 
  const now = new Date();
  const current = user.subscription;
  const stillActiveSamePlan =
    current?.plan === plan.name &&
    current?.status === "active" &&
    current?.expiryDate &&
    current.expiryDate > now;
 
  // Same plan renewed early: remaining days are kept and the new period is added on top.
  // Different plan (e.g. monthly -> yearly upgrade): the new plan starts now.
  const baseDate = stillActiveSamePlan ? new Date(current.expiryDate) : now;
  const expiryDate = new Date(baseDate);
  expiryDate.setDate(expiryDate.getDate() + plan.durationInDays);
 
  user.subscription = {
    plan: plan.name,
    status: "active",
    startDate: stillActiveSamePlan ? current.startDate : now,
    expiryDate,
    lastReminderDays: null, // restart expiry reminders
  };
  await user.save();
 
  await transactionHelper.createTransaction({
    user: user._id,
    type: "subscription_purchase",
    amount: Number(amount) || plan.price,
    paymentMethod: "stripe",
    relatedRef: user._id,
    relatedModel: "Subscription",
    status: "completed",
    stripeSessionId: session.id,
    description: `${plan.name} subscription purchase`,
  });
 
  await sendNotification({
    userId: user._id,
    type: "payment",
    title: "Subscription Activated",
    message: `Your ${plan.name} subscription is now active until ${expiryDate.toDateString()}.`,
    actionUrl: `/dashboard/subscription`,
    metadata: { plan: plan.name, status: "success", expiryDate },
  });
};

const handleSubscriptionPaymentExpired = async (session) => {
  const { userId, planName } = session.metadata;

  await sendNotification({
    userId,
    type: "payment",
    title: "Payment Cancelled",
    message: `Your ${planName} subscription checkout session expired. Your plan was not activated.`,
    actionUrl: `/dashboard/subscription`,
    metadata: { plan: planName, status: "cancelled" },
  });
};

const handleSubscriptionPaymentFailed = async (paymentIntent) => {
  const { userId, planName } = paymentIntent.metadata || {};
  if (!userId) return;

  await sendNotification({
    userId,
    type: "payment",
    title: "Payment Failed",
    message: `Payment for your ${planName} subscription failed. Please try again.`,
    actionUrl: `/dashboard/subscription`,
    metadata: {
      plan: planName,
      status: "failed",
      reason: paymentIntent.last_payment_error?.message || "Unknown error",
    },
  });
};

// ════════════════════════════════════════════════════════
// DESIGN STUDIO SUBSCRIPTION handlers
// (seller wali subscription se alag: flow === "design_subscription")
// ════════════════════════════════════════════════════════
const DESIGN_PRICING_URL = "/design/pricing";

const handleDesignPaymentSuccess = async (session) => {

  if (session.payment_status && session.payment_status !== "paid") return;
  
  const { userId, planName, amount } = session.metadata;

  const plan = await DesignPlan.findOne({ name: planName });
  if (!plan) return;

  // Idempotency: Stripe webhook dobara bheje to is session ka kaam dobara nahi hota
  // (na extra din milte hain, na dobara refund hota hai)
  const alreadyProcessed = await transactionModel.findOne({ stripeSessionId: session.id });
  if (alreadyProcessed) return;

  const chargedAmount = Number(amount) || plan.price;

  const startDate = new Date();
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + plan.durationInDays);

  // Activation atomic hai: sirf tab hoti hai jab user ka design plan abhi active NAHI hai.
  // Do checkout alag alag tab mein khol kar dono ka payment karne par doosra yahan rok liya jata hai.
  const activated = await userModel.updateOne(
    {
      _id: userId,
      $or: [
        { "designSubscription.expiryDate": null },
        { "designSubscription.expiryDate": { $lte: new Date() } },
        { "designSubscription.status": "expired" },
        { "designSubscription.plan": "free" },
      ],
    },
    {
      $set: {
        designSubscription: {
          plan: plan.name,
          status: "active",
          startDate,
          expiryDate,
          expiryReminderSent: false,
          lastCheckoutSessionId: session.id,
        },
      },
    }
  );

  // Agar isi session ne plan pehle activate kar diya tha (transaction likhne se pehle crash hua aur Stripe ne
  // webhook dobara bheja), to na dobara activate karna hai, na refund; bas transaction aur notification baqi hain
  const activatedByThisSession =
    activated.modifiedCount === 0 &&
    !!(await userModel.exists({ _id: userId, "designSubscription.lastCheckoutSessionId": session.id }));

  if (activated.modifiedCount === 0 && !activatedByThisSession) {
    // Plan pehle se active tha (ya account nahi mila): payment khud refund karo, order wale auto-refund jaisa
    if (session.payment_intent) {
      await stripe.refunds.create(
        { payment_intent: session.payment_intent },
        { idempotencyKey: `design-refund-${session.id}` }
      );
    }

    await transactionHelper.createTransaction({
      user: userId,
      type: "design_purchase",
      amount: chargedAmount,
      paymentMethod: "stripe",
      relatedRef: userId,
      relatedModel: "DesignSubscription",
      status: "refunded",
      stripeSessionId: session.id,
      description: `Auto-refund: ${plan.name} Design Studio plan payment received while a plan was already active`,
    });

    await sendNotification({
      userId,
      type: "payment",
      title: "Payment Refunded",
      message: `You already have an active Design Studio plan, so the payment you just made for the ${plan.name} plan has been refunded. You can buy a new plan after the current one expires.`,
      actionUrl: DESIGN_PRICING_URL,
      metadata: { plan: plan.name, status: "refunded" },
    });
    return;
  }

  await transactionHelper.createTransaction({
    user: userId,
    type: "design_purchase",
    amount: chargedAmount,
    paymentMethod: "stripe",
    relatedRef: userId,
    relatedModel: "DesignSubscription",
    status: "completed",
    stripeSessionId: session.id,
    description: `${plan.name} Design Studio plan purchase`,
  });

  await sendNotification({
    userId,
    type: "payment",
    title: "Design Studio Plan Activated",
    message: `Your ${plan.name} Design Studio plan is now active until ${expiryDate.toDateString()}.`,
    actionUrl: DESIGN_PRICING_URL,
    metadata: { plan: plan.name, status: "success", expiryDate },
  });
};

const handleDesignPaymentExpired = async (session) => {
  const { userId, planName } = session.metadata;

  await sendNotification({
    userId,
    type: "payment",
    title: "Payment Cancelled",
    message: `Your ${planName} Design Studio checkout session expired. Your plan was not activated.`,
    actionUrl: DESIGN_PRICING_URL,
    metadata: { plan: planName, status: "cancelled" },
  });
};

const handleDesignPaymentFailed = async (paymentIntent) => {
  const { userId, planName } = paymentIntent.metadata || {};
  if (!userId) return;

  await sendNotification({
    userId,
    type: "payment",
    title: "Payment Failed",
    message: `Payment for your ${planName} Design Studio plan failed. Please try again.`,
    actionUrl: DESIGN_PRICING_URL,
    metadata: {
      plan: planName,
      status: "failed",
      reason: paymentIntent.last_payment_error?.message || "Unknown error",
    },
  });
};

// ════════════════════════════════════════════════════════
// UNIFIED WEBHOOK
// ════════════════════════════════════════════════════════
const HANDLERS = {
  order: {
    completed: handleOrderPaymentSuccess,
    expired: handleOrderPaymentExpired,
    failed: handleOrderPaymentFailed,
  },
  featured: {
    completed: handleFeaturePaymentSuccess,
    expired: handleFeaturePaymentExpired,
    failed: handleFeaturePaymentFailed,
  },
  subscription: {
    completed: handleSubscriptionPaymentSuccess,
    expired: handleSubscriptionPaymentExpired,
    failed: handleSubscriptionPaymentFailed,
  },
  design_subscription: {
    completed: handleDesignPaymentSuccess,
    expired: handleDesignPaymentExpired,
    failed: handleDesignPaymentFailed,
  },
};

const EVENT_MAP = {
  "checkout.session.completed": "completed",
  "checkout.session.expired": "expired",
  "payment_intent.payment_failed": "failed",
};

const stripeWebhook = async (req, res, next) => {
  try {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, config.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      return next(new AppError(`Webhook Error: ${err.message}`, 400));
    }

    const action = EVENT_MAP[event.type];
    if (action) {
      const obj = event.data.object;
      const handler = HANDLERS[getFlow(obj.metadata)]?.[action];
      if (handler) await handler(obj);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};

// ════════════════════════════════════════════════════════
// VERIFY SESSION (success page ke liye)
// GET /api/payments/verify-session?session_id=cs_xxx  (auth middleware ke saath)
// ════════════════════════════════════════════════════════
const getCardInfo = (session) => {
  const card = session.payment_intent?.payment_method?.card;
  return card ? { brand: card.brand, last4: card.last4 } : null;
};

// Success page ki receipt ke liye flow ke hisaab se details
const buildPaymentDetails = async (flow, session) => {
  const meta = session.metadata || {};

  const details = {
    title: "",
    tags: [],
    items: [],
    amountPkr: null,
    amountUsd: session.amount_total != null ? session.amount_total / 100 : null,
    paymentMethod: getCardInfo(session),
    paidAt: new Date(session.created * 1000),
    reference: session.payment_intent?.id || session.id,
    email: session.customer_details?.email || session.customer_email || null,
  };

  if (flow === "order") {
    const order = await orderModel.findById(meta.orderId).lean();
    if (order) {
      details.title = order.items.length === 1 ? order.items[0].title : `${order.items.length} items`;
      details.amountPkr = order.totalPrice;
      details.items = order.items.map((i) => ({
        title: i.title,
        quantity: i.quantity,
        price: i.price,
        image: i.image || null,
      }));
      details.tags = ["Order"];
    }
  } else if (flow === "featured") {
    const [order, Model] = [await FeatureOrderModel.findById(meta.orderId).lean(), getItemModel(meta.itemType)];
    const item = Model ? await Model.findById(meta.itemId).select("title").lean() : null;
    if (order) {
      details.title = item?.title || `Featured ${meta.itemType}`;
      details.amountPkr = order.amount;
      details.tags = [
        meta.itemType === "advertisement" ? "Advertisement" : "Product",
        `${capitalize(order.plan)} plan`,
        `${order.duration} days`,
      ];
    }
  } else if (flow === "subscription") {
    const plan = await subscriptionPlanModel.findOne({ name: meta.planName }).lean();
    details.title = `${capitalize(meta.planName)} seller subscription`;
    details.amountPkr = Number(meta.amount) || plan?.price || null;
    details.tags = ["Subscription", ...(plan ? [`${plan.durationInDays} days`] : [])];
  } else if (flow === "design_subscription") {
    const plan = await DesignPlan.findOne({ name: meta.planName }).lean();
    details.title = `Design Studio - ${capitalize(meta.planName)} plan`;
    details.amountPkr = Number(meta.amount) || plan?.price || null;
    details.tags = ["Design Studio", ...(plan ? [`${plan.durationInDays} days`] : [])];
  }

  return details;
};

const capitalize = (text = "") => text.charAt(0).toUpperCase() + text.slice(1);

const verifyCheckoutSession = async (req, res, next) => {
  try {
    const { session_id } = req.query;
    if (!session_id) return next(new AppError("session_id is required", 400));

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["payment_intent.payment_method"],
    });

    if (session.metadata?.userId !== String(req.user.id)) {
      return next(new AppError("Not authorized", 403));
    }

    const flow = getFlow(session.metadata);
    const isPaid = session.payment_status === "paid";

    // webhook late ho to bhi success page khulte hi order paid ho jaye
    // (atomic claim ki wajah se double processing nahi hogi)
    if (isPaid && flow === "order") {
      await handleOrderPaymentSuccess(session);
    }

    res.status(200).json({
      success: true,
      flow,
      paymentStatus: session.payment_status,
      status: session.status,
      details: isPaid ? await buildPaymentDetails(flow, session) : null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { stripeWebhook, verifyCheckoutSession };