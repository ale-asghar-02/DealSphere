const Stripe = require("stripe");
const config = require("../configs/config");
const stripe = Stripe(config.STRIPE_SECRET_KEY);

const orderModel = require("../models/orderModel");
const cartModel = require("../models/cartModel");
const productModel = require("../models/productModel");
const userModel = require("../models/userModel");
const AppError = require("../utils/AppError");
const { getPkrToUsdRate } = require("../utils/currency");
const { sendNotification } = require("../socket/notificationSocket");
const { creditWallet } = require("../utils/walletHelper");
const transactionHelper = require("../utils/transactionHelper");
const transactionModel = require("../models/transactionModel");
const { buildCheckoutUrls } = require("../configs/buildCheckoutUrls");

// order status flow - seller sirf isi sequence me status change kar sakta hai
const ORDER_STATUS_FLOW = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

const SELLER_ALLOWED_STATUSES = ["processing", "shipped", "cancelled"];

// ────────────────────────────────
// helper: seller banned ya suspended hai to true
// ────────────────────────────────
const isSellerBlocked = (seller) => {
  const mod = seller?.moderation;
  return !!(
    mod?.isBanned ||
    (mod?.suspendedUntil && mod.suspendedUntil > new Date())
  );
};

// ────────────────────────────────
// helper: shared validation for shippingAddress
// ────────────────────────────────
const validateShippingAddress = (shippingAddress) => {
  if (!shippingAddress) return "Shipping address is required";
  const { fullName, phoneNumber, country, city, addressLine } = shippingAddress;
  if (!fullName || !phoneNumber || !country || !city || !addressLine) {
    return "Please fill all required shipping address fields";
  }
  return null;
};

// ────────────────────────────────
// helper: stock kam karo (COD order confirm hote hi, ya stripe payment webhook confirm hone k baad)
// ────────────────────────────────
const reduceStockForOrder = async (order) => {
  for (const item of order.items) {
    const product = await productModel.findById(item.product);
    if (product) {
      product.stock -= item.quantity;
      if (product.stock <= 0) {
        product.stock = 0;
        product.status = "soldout";
      }
      await product.save();
    }
  }
};

// ────────────────────────────────
// helper: stripe checkout session banao ek order k liye
// order.totalPrice PKR me hai, Stripe ko USD chahiye - is liye convert karte hain
// ────────────────────────────────
const createStripeSession = async (order, userEmail) => {
  const pkrToUsdRate = await getPkrToUsdRate();

  const line_items = order.items.map((item) => {
    const priceInUsd = item.price / pkrToUsdRate;

    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: item.title,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(priceInUsd * 100),
      },
      quantity: item.quantity,
    };
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: userEmail,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minute (Stripe ka minimum)
    line_items,
    ...buildCheckoutUrls("order", { orderId: order._id.toString() }),
    metadata: {
      flow: "order",
      userId: order.user.toString(),
      orderId: order._id.toString(),
      pkrToUsdRate: pkrToUsdRate.toString(),
    },
    // payment_failed webhook ke liye zaroori
    payment_intent_data: {
      metadata: { flow: "order", userId: order.user.toString(), orderId: order._id.toString() },
    },
  });

  order.stripeSessionId = session.id;
  await order.save();

  return session;
};

// Stripe session banane me error aaye to order bina session ke pending na reh jaye
const createStripeSessionOrCancel = async (order, userEmail) => {
  try {
    return await createStripeSession(order, userEmail);
  } catch (error) {
    order.orderStatus = "cancelled";
    order.paymentStatus = "failed";
    order.cancelReason = "Could not start payment";
    order.cancelledAt = new Date();
    await order.save();
    throw error;
  }
};

// Unpaid order cancel hone par khula checkout session band karo, taake baad me koi pay na kar sake.
// Session pehle hi complete/expire ho chuka ho to Stripe error deta hai, wo ignore kar dete hain.
const expireStripeSession = async (order) => {
  if (!order.stripeSessionId) return;
  try {
    await stripe.checkout.sessions.expire(order.stripeSessionId);
  } catch (error) {
    // already completed ya expired
  }
};

const isUnpaidStripeOrder = (order) =>
  order.paymentMethod === "stripe" && ["pending", "failed"].includes(order.paymentStatus);

// Sirf "real" orders dikhao: COD, ya Stripe jis ki payment ho chuki ho (ya refund ho chuka ho).
// Unpaid/abandoned Stripe orders dashboard par nahi aayenge.
const VISIBLE_ORDER_FILTER = {
  $or: [
    { paymentMethod: "cod" },
    { paymentMethod: "stripe", paymentStatus: { $in: ["paid", "refunded"] } },
  ],
};

// ══════════════════════════════════════════════════════════
// BUYER APIs
// ══════════════════════════════════════════════════════════

// BUYER: single product buy karo (Buy Now)
// body: { productId, quantity, shippingAddress, paymentMethod }
const buyNow = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const { productId, quantity, shippingAddress, paymentMethod } = req.body;

    const addressError = validateShippingAddress(shippingAddress);
    if (addressError) return next(new AppError(addressError, 400));

    if (!productId) {
      return next(new AppError("Product id is required", 400));
    }

    if (
      quantity !== undefined &&
      (!Number.isInteger(Number(quantity)) || Number(quantity) < 1)
    ) {
      return next(new AppError("Quantity must be a whole number of at least 1", 400));
    }

    const product = await productModel.findById(productId);
    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    // seller apna khud ka product buy nahi kar sakta
    if (product.seller.toString() === userId) {
      return next(new AppError("You cannot buy your own product", 400));
    }

    if (
      product.status !== "active" ||
      product.isBannedProduct ||
      product.moderationHidden
    ) {
      return next(
        new AppError("This product is not available for purchase", 400),
      );
    }

    // seller banned ya suspended ho to purchase nahi hoga
    const seller = await userModel.findById(product.seller).select("moderation");
    if (!seller || isSellerBlocked(seller)) {
      return next(
        new AppError("This product is not available for purchase", 400),
      );
    }

    const qty = quantity === undefined ? 1 : Number(quantity);

    if (product.stock < qty) {
      return next(
        new AppError(`Only ${product.stock} item(s) left in stock`, 400),
      );
    }

    const method = paymentMethod === "stripe" ? "stripe" : "cod";

    const order = new orderModel({
      user: userId,
      items: [
        {
          product: product._id,
          seller: product.seller,
          title: product.title,
          image: product.productImages?.[0]?.url || "",
          quantity: qty,
          price: product.price,
        },
      ],
      shippingAddress,
      paymentMethod: method,
      placedFrom: "buyNow",
    });

    order.calculateTotal();
    await order.save();

    if (method === "cod") {
      await reduceStockForOrder(order);

      await transactionHelper.createTransaction({
        user: userId,
        type: "order_payment",
        amount: order.totalPrice,
        paymentMethod: "cod",
        relatedRef: order._id,
        relatedModel: "Order",
        status: "pending", // delivered hone tak pending
        description: `COD order payment for order #${order._id}`,
      });

      await sendNotification({
        userId,
        type: "payment",
        title: "Order Placed",
        message: `Your order for "${product.title}" has been placed successfully (Cash on Delivery).`,
        actionUrl: `/orders/${order._id}`,
        metadata: { orderId: order._id, status: "success" },
      });

      return res.status(201).json({
        status: "success",
        message: "Order placed successfully",
        data: order,
      });
    }

    const session = await createStripeSessionOrCancel(order, userEmail);

    await transactionHelper.createTransaction({
      user: userId,
      type: "order_payment",
      amount: order.totalPrice,
      paymentMethod: "stripe",
      relatedRef: order._id,
      relatedModel: "Order",
      status: "pending", // webhook confirm karega
      stripeSessionId: session.id,
      description: `Stripe order payment for order #${order._id}`,
    });

    res.status(201).json({
      status: "success",
      message: "Redirecting to payment",
      data: order,
      checkoutUrl: session.url,
    });
  } catch (error) {
    next(error);
  }
};

// BUYER: cart k saare items se ek order banao (Checkout)
// Sirf wo items order me jate hain jo abhi kharide ja sakte hain
// (banned/suspended seller, hidden, sold, stock kam wale items skip hote hain).
// body: { shippingAddress, paymentMethod }
const checkoutFromCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const { shippingAddress, paymentMethod } = req.body;

    const addressError = validateShippingAddress(shippingAddress);
    if (addressError) return next(new AppError(addressError, 400));

    const cart = await cartModel
      .findOne({ user: userId })
      .populate("items.product");

    if (!cart || cart.items.length === 0) {
      return next(new AppError("Your cart is empty", 400));
    }

    // ek hi query me saare sellers ka moderation status
    const sellerIds = [
      ...new Set(
        cart.items
          .filter((i) => i.product)
          .map((i) => i.product.seller.toString())
      ),
    ];
    const sellers = await userModel
      .find({ _id: { $in: sellerIds } })
      .select("moderation");
    const sellerMap = new Map(sellers.map((s) => [s._id.toString(), s]));

    // sirf wo items jo abhi kharide ja sakte hain (cart UI ke "available" jaisa)
    const purchasable = cart.items.filter((item) => {
      const p = item.product;
      if (!p) return false; // product delete ho chuka hai
      if (p.seller.toString() === userId) return false; // apna product
      if (p.status !== "active" || p.isBannedProduct || p.moderationHidden) return false;
      if (p.stock < 1 || p.stock < item.quantity) return false;
      const seller = sellerMap.get(p.seller.toString());
      if (!seller || isSellerBlocked(seller)) return false;
      return true;
    });

    if (purchasable.length === 0) {
      return next(
        new AppError("None of the items in your cart are available for purchase", 400)
      );
    }

    const method = paymentMethod === "stripe" ? "stripe" : "cod";

    const orderItems = purchasable.map((item) => ({
      product: item.product._id,
      seller: item.product.seller,
      title: item.product.title,
      image: item.product.productImages?.[0]?.url || "",
      quantity: item.quantity,
      price: item.product.price,
    }));

    const order = new orderModel({
      user: userId,
      items: orderItems,
      shippingAddress,
      paymentMethod: method,
      placedFrom: "cart",
    });

    order.calculateTotal();
    await order.save();

    if (method === "cod") {
      await reduceStockForOrder(order);

      await transactionHelper.createTransaction({
        user: userId,
        type: "order_payment",
        amount: order.totalPrice,
        paymentMethod: "cod",
        relatedRef: order._id,
        relatedModel: "Order",
        status: "pending", // delivery confirm hone tak pending, confirmReceipt isay complete karega
        description: `COD order payment for order #${order._id} (cart checkout)`,
      });

      // cart se sirf kharide gaye items hatao, unavailable items cart me rahenge
      const orderedIds = new Set(
        purchasable.map((i) => i.product._id.toString())
      );
      cart.items = cart.items.filter(
        (i) => i.product && !orderedIds.has(i.product._id.toString())
      );
      cart.calculateTotal();
      await cart.save();

      await sendNotification({
        userId,
        type: "payment",
        title: "Order Placed",
        message: `Your order of ${order.items.length} item(s) has been placed successfully (Cash on Delivery).`,
        actionUrl: `/orders/${order._id}`,
        metadata: { orderId: order._id, status: "success" },
      });

      return res.status(201).json({
        status: "success",
        message: "Order placed successfully",
        data: order,
      });
    }

    const session = await createStripeSessionOrCancel(order, userEmail);

    // webhook isay "completed" karega jab payment success ho jaye
    await transactionHelper.createTransaction({
      user: userId,
      type: "order_payment",
      amount: order.totalPrice,
      paymentMethod: "stripe",
      relatedRef: order._id,
      relatedModel: "Order",
      status: "pending",
      stripeSessionId: session.id,
      description: `Stripe order payment for order #${order._id} (cart checkout)`,
    });

    // cart clear nahi karenge yahan - payment fail ho to item wapas dikhne chahiye
    // cart sirf webhook me payment success hone k baad clear hoga
    // (webhook me bhi sirf order.items ke products hatao, poora cart nahi)

    res.status(201).json({
      status: "success",
      message: "Redirecting to payment",
      data: order,
      checkoutUrl: session.url,
    });
  } catch (error) {
    next(error);
  }
};

// BUYER: apne saare orders dekho
const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const orders = await orderModel
      .find({ user: userId, deletedByUser: { $ne: true }, ...VISIBLE_ORDER_FILTER })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// BUYER: single order dekho (apna hi)
const getOrderById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await orderModel.findOne({
      _id: orderId,
      user: userId,
      deletedByUser: { $ne: true },
      ...VISIBLE_ORDER_FILTER,
    });

    if (!order) {
      return next(new AppError("Order not found", 404));
    }

    res.status(200).json({ status: "success", data: order });
  } catch (error) {
    next(error);
  }
};

// BUYER: order ki receipt (payment result page ke liye, COD aur stripe dono)
// GET /order/buyer/:orderId/receipt
const getOrderReceipt = async (req, res, next) => {
  try {
    const order = await orderModel
      .findOne({
        _id: req.params.orderId,
        user: req.user.id,
        deletedByUser: { $ne: true },
      })
      .lean();

    if (!order) return next(new AppError("Order not found", 404));

    const isCod = order.paymentMethod === "cod";

    let statusLabel = null;
    if (order.orderStatus === "cancelled") statusLabel = "Cancelled";
    else if (isCod && order.paymentStatus !== "paid") statusLabel = "Pay on delivery";

    res.status(200).json({
      success: true,
      flow: "order",
      paymentStatus: order.paymentStatus,
      details: {
        title: order.items.length === 1 ? order.items[0].title : `${order.items.length} items`,
        tags: isCod ? ["Order", "Cash on Delivery"] : ["Order"],
        items: order.items.map((i) => ({
          title: i.title,
          quantity: i.quantity,
          price: i.price,
          image: i.image || null,
        })),
        amountPkr: order.totalPrice,
        amountUsd: null,
        paymentMethod: null,
        paymentMethodLabel: isCod ? "Cash on Delivery" : "Card",
        statusLabel,
        paidAt: order.createdAt,
        reference: String(order._id),
        email: req.user.email || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// BUYER: apna order cancel karo
// params: orderId | body: { cancelReason }
const cancelOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    const { cancelReason } = req.body;

    const order = await orderModel.findOne({ _id: orderId, user: userId });

    if (!order) {
      return next(new AppError("Order not found", 404));
    }

    if (!["pending", "processing"].includes(order.orderStatus)) {
      return next(
        new AppError(
          `Order cannot be cancelled once it is ${order.orderStatus}`,
          400
        )
      );
    }

    const wasStockReduced =
      order.paymentMethod === "cod" || order.paymentStatus === "paid";
    const unpaidStripe = isUnpaidStripeOrder(order);

    order.orderStatus = "cancelled";
    order.cancelReason = cancelReason || "Cancelled by user";
    order.cancelledAt = new Date();

    if (
      order.paymentMethod === "stripe" &&
      order.paymentStatus === "paid" &&
      order.stripePaymentIntentId
    ) {
      await stripe.refunds.create({
        payment_intent: order.stripePaymentIntentId,
      });
      order.paymentStatus = "refunded";

      await transactionHelper.createTransaction({
        user: userId,
        type: "order_refund",
        amount: order.totalPrice,
        paymentMethod: "stripe",
        relatedRef: order._id,
        relatedModel: "Order",
        status: "completed",
        description: `Refund for cancelled order #${order._id}`,
      });
    }

    // COD order cancel hone par uski original "pending" order_payment transaction "failed" ho
    if (order.paymentMethod === "cod") {
      await transactionModel.findOneAndUpdate(
        { relatedRef: order._id, relatedModel: "Order", status: "pending" },
        { status: "failed" }
      );
    }

    // Stripe order jis ki payment hui hi nahi: payment failed mark karo,
    // pending transaction band karo (checkout session neeche save ke baad expire hoga)
    if (unpaidStripe) {
      order.paymentStatus = "failed";
      await transactionModel.findOneAndUpdate(
        { relatedRef: order._id, relatedModel: "Order", status: "pending" },
        { status: "failed" }
      );
    }

    await order.save();

    if (unpaidStripe) await expireStripeSession(order);

    if (wasStockReduced) {
      for (const item of order.items) {
        const product = await productModel.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          if (product.status === "soldout" && product.stock > 0) {
            product.status = "active";
          }
          await product.save();
        }
      }
    }

    await sendNotification({
      userId,
      type: "payment",
      title: "Order Cancelled",
      message: `Your order has been cancelled successfully.`,
      actionUrl: `/orders/${order._id}`,
      metadata: { orderId: order._id, status: "cancelled" },
    });

    res.status(200).json({
      status: "success",
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// BUYER: Stripe checkout se wapas aane (cancel/back) par unpaid order band karo.
// Sirf unpaid Stripe order par chalta hai, paid order ko kabhi nahi chhuta.
const abandonUnpaidOrder = async (req, res, next) => {
  try {
    const order = await orderModel.findOneAndUpdate(
      {
        _id: req.params.orderId,
        user: req.user.id,
        paymentMethod: "stripe",
        paymentStatus: { $in: ["pending", "failed"] },
        orderStatus: "pending",
      },
      {
        orderStatus: "cancelled",
        paymentStatus: "failed",
        cancelReason: "Payment cancelled by user",
        cancelledAt: new Date(),
      },
      { new: true }
    );

    // paid ya pehle se cancelled order: kuch nahi karna, error bhi nahi
    if (!order) {
      return res.status(200).json({ status: "success", message: "Nothing to cancel" });
    }

    await transactionModel.findOneAndUpdate(
      {
        relatedRef: order._id,
        relatedModel: "Order",
        status: { $in: ["pending", "failed"] },
      },
      { status: "failed" }
    );

    // checkout session band karo taake purani tab se baad mein payment na ho
    await expireStripeSession(order);

    res.status(200).json({ status: "success", message: "Order cancelled" });
  } catch (error) {
    next(error);
  }
};

// ════════════════════════════════════════════════════════
// BUYER: confirm receipt (escrow release step)
// Yahi par: order -> "delivered", COD/stripe payment transaction -> "completed",
// ════════════════════════════════════════════════════════
const confirmReceipt = async (req, res, next) => {
  try {
    const buyerId = req.user.id;
    const { orderId } = req.params;

    const existing = await orderModel.findOne({ _id: orderId, user: buyerId });
    if (!existing) return next(new AppError("Order not found", 404));

    if (existing.orderStatus === "delivered") {
      return next(new AppError("Order is already marked as delivered", 400));
    }
    if (existing.orderStatus === "cancelled") {
      return next(new AppError("Cannot confirm a cancelled order", 400));
    }
    if (existing.orderStatus !== "shipped") {
      return next(
        new AppError(
          `Cannot confirm receipt while order is "${existing.orderStatus}"`,
          400
        )
      );
    }

    // Atomic claim: do requests ek saath aayein to sirf ek jeetegi,
    // taake seller ka wallet do baar credit na ho
    const order = await orderModel.findOneAndUpdate(
      { _id: orderId, user: buyerId, orderStatus: "shipped" },
      { orderStatus: "delivered", deliveredAt: new Date() },
      { new: true }
    );
    if (!order) {
      return next(new AppError("Order is already marked as delivered", 400));
    }

    if (order.paymentMethod === "cod") {
      order.paymentStatus = "paid";
      await order.save();
    }

    await transactionModel.findOneAndUpdate(
      { relatedRef: order._id, relatedModel: "Order", status: "pending" },
      { status: "completed" }
    );

    const sellerAmounts = {};
    for (const item of order.items) {
      const key = item.seller.toString();
      sellerAmounts[key] = (sellerAmounts[key] || 0) + item.price * item.quantity;
    }

    for (const [sellerId, amount] of Object.entries(sellerAmounts)) {
      await creditWallet(sellerId, amount);

      await transactionHelper.createTransaction({
        user: sellerId,
        type: "wallet_credit",
        amount,
        paymentMethod: order.paymentMethod,
        relatedRef: order._id,
        relatedModel: "Order",
        status: "completed",
        description: `Payment released for order #${order._id} (buyer confirmed receipt)`,
      });

      await sendNotification({
        userId: sellerId,
        type: "payment",
        title: "Payment Received",
        message: `Buyer confirmed receipt. Rs ${amount} has been credited to your wallet.`,
        actionUrl: `/orders/${order._id}`,
        metadata: { orderId: order._id, amount, status: "success" },
      });
    }

    await sendNotification({
      userId: buyerId,
      type: "order",
      title: "Order Delivered",
      message: `You confirmed receipt of your order.`,
      actionUrl: `/orders/${order._id}`,
      metadata: { orderId: order._id, status: "delivered" },
    });

    res.status(200).json({
      status: "success",
      message: "Delivery confirmed, payment released to seller(s)",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// BUYER: single order apni list se delete karo (soft delete - seller ka view untouched)
const deleteMyOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await orderModel.findOneAndUpdate(
      { _id: orderId, user: userId },
      { deletedByUser: true },
      { new: true },
    );

    if (!order) return next(new AppError("Order not found", 404));

    res
      .status(200)
      .json({ status: "success", message: "Order removed from your list" });
  } catch (error) {
    next(error);
  }
};

// BUYER: apne saare orders list se delete karo (soft delete)
const deleteAllMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await orderModel.updateMany({ user: userId }, { deletedByUser: true });

    res.status(200).json({
      status: "success",
      message: "All orders removed from your list",
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════════════════
// SELLER APIs
// ══════════════════════════════════════════════════════════

// SELLER: apne saare orders dekho (jin me seller ka item ho)
const getSellerOrders = async (req, res, next) => {
  try {
    const sellerId = req.user.id;

    const orders = await orderModel
      .find({
        "items.seller": sellerId,
        deletedBySeller: { $ne: true },
        ...VISIBLE_ORDER_FILTER,
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// SELLER: single order dekho (jis me uska item ho)
const getSellerOrderById = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { orderId } = req.params;

    const order = await orderModel.findOne({
      _id: orderId,
      "items.seller": sellerId,
      deletedBySeller: { $ne: true },
      ...VISIBLE_ORDER_FILTER,
    });

    if (!order) return next(new AppError("Order not found", 404));

    res.status(200).json({ status: "success", data: order });
  } catch (error) {
    next(error);
  }
};

// SELLER: order ka status update karo (pending -> processing -> shipped -> delivered)
// params: orderId | body: { orderStatus }
const updateOrderStatus = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    if (!orderStatus) return next(new AppError("orderStatus is required", 400));

    if (orderStatus === "delivered") {
      return next(
        new AppError("Only the buyer can mark an order as delivered", 403)
      );
    }
    if (!SELLER_ALLOWED_STATUSES.includes(orderStatus)) {
      return next(new AppError(`Invalid status for seller: ${orderStatus}`, 400));
    }

    const order = await orderModel.findOne({
      _id: orderId,
      "items.seller": sellerId,
    });
    if (!order) return next(new AppError("Order not found", 404));

    // stripe order abhi tak paid nahi hui to seller usay "processing"/"shipped"
    // nahi kar sakta - warna bina payment ke wallet credit ka loophole ban jata hai.
    // "cancelled" allow rehne dete hain taake seller unpaid/abandoned order clear kar sakay.
    if (
      order.paymentMethod === "stripe" &&
      order.paymentStatus !== "paid" &&
      orderStatus !== "cancelled"
    ) {
      return next(
        new AppError(
          "Cannot update this order until payment is completed",
          400
        )
      );
    }

    const allowedNext = ORDER_STATUS_FLOW[order.orderStatus] || [];
    if (!allowedNext.includes(orderStatus)) {
      return next(
        new AppError(
          `Cannot change status from ${order.orderStatus} to ${orderStatus}`,
          400
        )
      );
    }

    order.orderStatus = orderStatus;
    let unpaidStripeCancel = false;

    if (orderStatus === "cancelled") {
      order.cancelReason = "Cancelled by seller";
      order.cancelledAt = new Date();

      unpaidStripeCancel = isUnpaidStripeOrder(order);

      const wasStockReduced =
        order.paymentMethod === "cod" || order.paymentStatus === "paid";
      if (wasStockReduced) {
        for (const item of order.items) {
          const product = await productModel.findById(item.product);
          if (product) {
            product.stock += item.quantity;
            if (product.status === "soldout" && product.stock > 0)
              product.status = "active";
            await product.save();
          }
        }
      }

      if (
        order.paymentMethod === "stripe" &&
        order.paymentStatus === "paid" &&
        order.stripePaymentIntentId
      ) {
        await stripe.refunds.create({
          payment_intent: order.stripePaymentIntentId,
        });
        order.paymentStatus = "refunded";

        await transactionHelper.createTransaction({
          user: order.user,
          type: "order_refund",
          amount: order.totalPrice,
          paymentMethod: "stripe",
          relatedRef: order._id,
          relatedModel: "Order",
          status: "completed",
          description: `Refund for order #${order._id} (cancelled by seller)`,
        });
      }

      if (order.paymentMethod === "cod") {
        await transactionModel.findOneAndUpdate(
          { relatedRef: order._id, relatedModel: "Order", status: "pending" },
          { status: "failed" }
        );
      }

      if (unpaidStripeCancel) {
        order.paymentStatus = "failed";
        await transactionModel.findOneAndUpdate(
          { relatedRef: order._id, relatedModel: "Order", status: "pending" },
          { status: "failed" }
        );
      }
    }

    await order.save();

    if (unpaidStripeCancel) await expireStripeSession(order);

    await sendNotification({
      userId: order.user,
      type: "order",
      title: "Order Status Updated",
      message: `Your order status has been updated to "${orderStatus}".`,
      actionUrl: `/orders/${order._id}`,
      metadata: { orderId: order._id, status: orderStatus },
    });

    res.status(200).json({
      status: "success",
      message: "Order status updated",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// SELLER: single order apni list se delete karo (soft delete - buyer ka view untouched)
const deleteSellerOrder = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { orderId } = req.params;

    const order = await orderModel.findOneAndUpdate(
      { _id: orderId, "items.seller": sellerId },
      { deletedBySeller: true },
      { new: true },
    );

    if (!order) return next(new AppError("Order not found", 404));

    res
      .status(200)
      .json({ status: "success", message: "Order removed from your list" });
  } catch (error) {
    next(error);
  }
};

// SELLER: apne saare orders list se delete karo (soft delete)
const deleteAllSellerOrders = async (req, res, next) => {
  try {
    const sellerId = req.user.id;

    await orderModel.updateMany(
      { "items.seller": sellerId },
      { deletedBySeller: true },
    );

    res.status(200).json({
      status: "success",
      message: "All orders removed from your list",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // buyer
  buyNow,
  checkoutFromCart,
  getMyOrders,
  getOrderById,
  getOrderReceipt,
  cancelOrder,
  abandonUnpaidOrder,
  confirmReceipt,
  deleteMyOrder,
  deleteAllMyOrders,
  // seller
  getSellerOrders,
  getSellerOrderById,
  updateOrderStatus,
  deleteSellerOrder,
  deleteAllSellerOrders,
};