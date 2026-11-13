const userModel = require("../../models/userModel");
const advertisementModel = require("../../models/advertisementModel");
const productModel = require("../../models/productModel");
const orderModel = require("../../models/orderModel");
const transactionModel = require("../../models/transactionModel");
const withdrawalModel = require("../../models/withdrawalModel");
const reportModel = require("../../models/reportModel");
const contactModel = require("../../models/contactModel");
const featureOrderModel = require("../../models/featureOrderModel");
const { DesignSession } = require("../../models/designModel");
const AppError = require("../../utils/AppError");

// design plan kharidne par transactionModel mein jo "type" save hota hai wo yahan likho
const DESIGN_TX_TYPE = "design_purchase";

// ---------- helper: convert range query (7d/30d/1y) into a Date ----------
const getStartDate = (range) => {
  const now = new Date();
  switch (range) {
    case "7d":
      return new Date(now.setDate(now.getDate() - 7));
    case "30d":
      return new Date(now.setDate(now.getDate() - 30));
    case "1y":
      return new Date(now.setFullYear(now.getFullYear() - 1));
    default:
      return new Date(now.setDate(now.getDate() - 30));
  }
};

// ---------- helper: ISO week (matches Mongo's $isoWeek/$isoWeekYear) ----------
const getISOWeek = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const isoWeek = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return { isoWeekYear: d.getUTCFullYear(), isoWeek };
};

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ---------- 1. GET /admin/stats/overview ----------
const getOverview = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalSellers,
      totalAds,
      totalProducts,
      totalOrders,
      revenueAgg,
      activeSubscriptions,
      pendingWithdrawals,
      pendingReports,
      activeDesignSubscriptions,
      designRevenueAgg,
    ] = await Promise.all([
      userModel.countDocuments(),
      userModel.countDocuments({ accountType: "seller" }),
      advertisementModel.countDocuments(),
      productModel.countDocuments(),
      orderModel.countDocuments(),
      transactionModel.aggregate([
        { $match: { type: "order_payment", status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      // seller subscription (ads / products)
      userModel.countDocuments({
        "subscription.status": "active",
        "subscription.plan": { $ne: "free" },
      }),
      withdrawalModel.countDocuments({ status: "pending" }),
      reportModel.countDocuments({ status: "pending" }),
      // design studio subscription
      userModel.countDocuments({
        "designSubscription.status": "active",
        "designSubscription.plan": { $ne: "free" },
      }),
      transactionModel.aggregate([
        { $match: { type: DESIGN_TX_TYPE, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalSellers,
        totalAds,
        totalProducts,
        totalOrders,
        totalRevenue: revenueAgg[0]?.total || 0,
        activeSubscriptions,
        pendingWithdrawals,
        pendingReports,
        activeDesignSubscriptions,
        designRevenue: designRevenueAgg[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------- 2. GET /admin/stats/users-growth?range=7d|30d|1y ----------
const getUsersGrowth = async (req, res, next) => {
  try {
    const startDate = getStartDate(req.query.range);
    const data = await userModel.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// ---------- 3. GET /admin/stats/orders-revenue?range=7d|30d|1y ----------
const getOrdersRevenue = async (req, res, next) => {
  try {
    const startDate = getStartDate(req.query.range);
    const data = await orderModel.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          orders: { $sum: 1 },
          revenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// ---------- 4. GET /admin/stats/listings-growth?range=7d|30d|1y ----------
const getListingsGrowth = async (req, res, next) => {
  try {
    const startDate = getStartDate(req.query.range);
    const dailyCount = (model) =>
      model.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

    const [ads, products] = await Promise.all([
      dailyCount(advertisementModel),
      dailyCount(productModel),
    ]);
    res.status(200).json({ success: true, data: { ads, products } });
  } catch (error) {
    next(error);
  }
};

// ---------- 5. GET /admin/stats/category-distribution ----------
const getCategoryDistribution = async (req, res, next) => {
  try {
    const byCategory = (model) =>
      model.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "_id",
            as: "categoryInfo",
          },
        },
        { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, categoryId: "$_id", categoryName: "$categoryInfo.name", count: 1 } },
      ]);

    const [ads, products] = await Promise.all([
      byCategory(advertisementModel),
      byCategory(productModel),
    ]);
    res.status(200).json({ success: true, data: { ads, products } });
  } catch (error) {
    next(error);
  }
};

// ---------- 6. GET /admin/stats/subscription-distribution ----------
// seller subscription (ads / products)
const getSubscriptionDistribution = async (req, res, next) => {
  try {
    const data = await userModel.aggregate([
      { $match: { "subscription.status": "active", accountType: "seller" } },
      { $group: { _id: "$subscription.plan", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// ---------- 7. GET /admin/stats/design-overview ----------
// design studio ka poora summary: subscribers, plan breakdown, revenue, AI usage
const getDesignOverview = async (req, res, next) => {
  try {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const paidActive = {
      "designSubscription.status": "active",
      "designSubscription.plan": { $ne: "free" },
    };

    const [
      planDistribution,
      paidSubscribers,
      expiringSoon,
      revenueAgg,
      revenueLast30dAgg,
      sessionsByStatus,
      usageAgg,
    ] = await Promise.all([
      // active design subscribers plan-wise (pie chart)
      userModel.aggregate([
        { $match: { "designSubscription.status": "active" } },
        { $group: { _id: "$designSubscription.plan", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      userModel.countDocuments(paidActive),
      // agle 7 din mein expire hone wale paid plans
      userModel.countDocuments({
        ...paidActive,
        "designSubscription.expiryDate": { $gte: now, $lte: in7Days },
      }),
      transactionModel.aggregate([
        { $match: { type: DESIGN_TX_TYPE, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      transactionModel.aggregate([
        { $match: { type: DESIGN_TX_TYPE, status: "completed", createdAt: { $gte: last30Days } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      DesignSession.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      DesignSession.aggregate([
        {
          $group: {
            _id: null,
            generations: { $sum: "$generationCount" },
            edits: { $sum: "$editsUsed" },
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        planDistribution, // [{ _id: "free", count }, { _id: "monthly", count }, ...]
        paidSubscribers,
        expiringSoon,
        totalRevenue: revenueAgg[0]?.total || 0,
        revenueLast30d: revenueLast30dAgg[0]?.total || 0,
        sessionsByStatus, // [{ _id: "draft", count }, ...]
        totalGenerations: usageAgg[0]?.generations || 0,
        totalEdits: usageAgg[0]?.edits || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------- 8. GET /admin/stats/revenue-chart?period=monthly|weekly|daily ----------
// tracks everything actually SOLD on the platform (orders + subscriptions + feature/ads boosts + design plans)
// plus commission (platform's cut, from withdrawalModel.commissionAmount) as its own line
const getRevenueChart = async (req, res, next) => {
  try {
    const { period = "monthly" } = req.query;
    const now = new Date();

    let startDate, dateKey;
    if (period === "daily") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      dateKey = { year: { $year: "$createdAt" }, month: { $month: "$createdAt" }, day: { $dayOfMonth: "$createdAt" } };
    } else if (period === "weekly") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 55);
      dateKey = { year: { $isoWeekYear: "$createdAt" }, week: { $isoWeek: "$createdAt" } };
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      dateKey = { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } };
    }

    const [ordersRaw, txRevenueRaw, commissionRaw] = await Promise.all([
      // order counts + pending/cancelled values (orderStatus isn't tracked on transactionModel, so this stays on orderModel)
      orderModel.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: dateKey,
            pendingValue: { $sum: { $cond: [{ $eq: ["$orderStatus", "pending"] }, "$totalPrice", 0] } },
            cancelledValue: { $sum: { $cond: [{ $eq: ["$orderStatus", "cancelled"] }, "$totalPrice", 0] } },
            pendingCount: { $sum: { $cond: [{ $eq: ["$orderStatus", "pending"] }, 1, 0] } },
            cancelledCount: { $sum: { $cond: [{ $eq: ["$orderStatus", "cancelled"] }, 1, 0] } },
            total: { $sum: 1 },
          },
        },
      ]),
      // everything actually sold & paid for — orders, featured ads, subscriptions, design plans
      transactionModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: "completed",
            type: { $in: ["order_payment", "featured_purchase", "subscription_purchase", DESIGN_TX_TYPE] },
          },
        },
        {
          $group: {
            _id: { ...dateKey, type: "$type" },
            revenue: { $sum: "$amount" },
          },
        },
      ]),
      // platform commission (from seller withdrawals) — commissionAmount is the platform's cut
      withdrawalModel.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: "completed" } },
        { $group: { _id: dateKey, revenue: { $sum: "$commissionAmount" } } },
      ]),
    ]);

    // build continuous buckets so the chart has no gaps
    const buckets = [];
    if (period === "daily") {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        buckets.push({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), label: `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}` });
      }
    } else if (period === "weekly") {
      for (let i = 7; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i * 7);
        const { isoWeekYear, isoWeek } = getISOWeek(d);
        buckets.push({ year: isoWeekYear, week: isoWeek, label: `W${isoWeek}` });
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        buckets.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: MONTH_NAMES[d.getMonth()] });
      }
    }

    const matchBucket = (row, b) =>
      period === "daily"
        ? row._id.year === b.year && row._id.month === b.month && row._id.day === b.day
        : period === "weekly"
        ? row._id.year === b.year && row._id.week === b.week
        : row._id.year === b.year && row._id.month === b.month;

    // matches a transactionModel row (which also has a "type" field) against a bucket + specific type
    const matchTxBucket = (row, b, type) => row._id.type === type && matchBucket(row, b);

    const data = buckets.map((b) => {
      const o = ordersRaw.find((r) => matchBucket(r, b));
      const orderTx = txRevenueRaw.find((r) => matchTxBucket(r, b, "order_payment"));
      const featureTx = txRevenueRaw.find((r) => matchTxBucket(r, b, "featured_purchase"));
      const subTx = txRevenueRaw.find((r) => matchTxBucket(r, b, "subscription_purchase"));
      const designTx = txRevenueRaw.find((r) => matchTxBucket(r, b, DESIGN_TX_TYPE));
      const c = commissionRaw.find((r) => matchBucket(r, b));

      const orderRevenue = orderTx?.revenue || 0;
      const subscriptionRevenue = subTx?.revenue || 0;
      const featureRevenue = featureTx?.revenue || 0;
      const designRevenue = designTx?.revenue || 0;
      const commissionRevenue = c?.revenue || 0;

      // "sold" total = everything a customer actually paid for on the platform
      const soldTotal = orderRevenue + subscriptionRevenue + featureRevenue + designRevenue;

      return {
        label: b.label,
        orderRevenue,
        subscriptionRevenue,
        featureRevenue,
        designRevenue,
        commissionRevenue,
        soldTotal,
        totalRevenue: soldTotal + commissionRevenue,
        pendingOrdersValue: o?.pendingValue || 0,
        cancelledOrdersValue: o?.cancelledValue || 0,
        pendingOrders: o?.pendingCount || 0,
        cancelledOrders: o?.cancelledCount || 0,
        totalOrders: o?.total || 0,
      };
    });

    res.status(200).json({ success: true, period, data });
  } catch (error) {
    next(error);
  }
};

// ---------- helper: build a short readable id like ORD-A1B2C ----------
const shortId = (prefix, id) => `${prefix}-${id.toString().slice(-5).toUpperCase()}`;

// ---------- 9. GET /admin/stats/recent-activity?type=all|orders|users|... ----------
// every branch returns rows in the SAME shape so the frontend table never has to change columns:
// { type, id, _id, desc, user, amount, status, createdAt }
const getRecentActivity = async (req, res, next) => {
  try {
    const { type = "all" } = req.query;
    const perTypeLimit = type === "all" ? 6 : 15;

    const fetchers = {
      orders: async () =>
        (await orderModel.find().sort({ createdAt: -1 }).limit(perTypeLimit)
          .populate("user", "username email").select("user totalPrice orderStatus createdAt"))
          .map((o) => ({
            type: "orders", id: shortId("ORD", o._id), _id: o._id,
            desc: `Order ${o.orderStatus}`, user: o.user?.username || "Unknown",
            amount: o.totalPrice, status: o.orderStatus, createdAt: o.createdAt,
          })),

      users: async () =>
        (await userModel.find().sort({ createdAt: -1 }).limit(perTypeLimit)
          .select("username email accountType createdAt"))
          .map((u) => ({
            type: "users", id: shortId("USR", u._id), _id: u._id,
            desc: `New ${u.accountType} registered`, user: u.username,
            amount: null, status: u.accountType, createdAt: u.createdAt,
          })),

      ads: async () =>
        (await advertisementModel.find().sort({ createdAt: -1 }).limit(perTypeLimit)
          .populate("seller", "username email").select("title seller status price createdAt"))
          .map((a) => ({
            type: "ads", id: shortId("ADS", a._id), _id: a._id,
            desc: a.title || "New ad", user: a.seller?.username || "Unknown",
            amount: a.price, status: a.status, createdAt: a.createdAt,
          })),

      products: async () =>
        (await productModel.find().sort({ createdAt: -1 }).limit(perTypeLimit)
          .populate("seller", "username email").select("title seller status price createdAt"))
          .map((p) => ({
            type: "products", id: shortId("PRD", p._id), _id: p._id,
            desc: p.title || "New product", user: p.seller?.username || "Unknown",
            amount: p.price, status: p.status, createdAt: p.createdAt,
          })),

      withdrawals: async () =>
        (await withdrawalModel.find().sort({ createdAt: -1 }).limit(perTypeLimit)
          .populate("seller", "username email").select("seller amount netAmount status createdAt"))
          .map((w) => ({
            type: "withdrawals", id: shortId("WDR", w._id), _id: w._id,
            desc: "Withdrawal request", user: w.seller?.username || "Unknown",
            amount: w.netAmount ?? w.amount, status: w.status, createdAt: w.createdAt,
          })),

      reports: async () =>
        // targetId is polymorphic (refPath: targetModel -> advertisement | product | users)
        (await reportModel.find().sort({ createdAt: -1 }).limit(perTypeLimit)
          .populate("reportedBy", "username email")
          .populate("targetId")
          .select("reportType reason status reportedBy targetId targetModel createdAt"))
          .map((r) => {
            const targetLabel =
              r.targetModel === "users" ? r.targetId?.username : r.targetId?.title;
            return {
              type: "reports", id: shortId("RPT", r._id), _id: r._id,
              desc: `${r.reportType || "Report"} (${r.reason}) — ${targetLabel || "Unknown target"}`,
              user: r.reportedBy?.username || "Unknown",
              amount: null, status: r.status, createdAt: r.createdAt,
            };
          }),

      contacts: async () =>
        (await contactModel.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).limit(perTypeLimit)
          .select("name email subject status createdAt"))
          .map((c) => ({
            type: "contacts", id: shortId("CNT", c._id), _id: c._id,
            desc: c.subject || "New message", user: c.name,
            amount: null, status: c.status, createdAt: c.createdAt,
          })),

      transactions: async () =>
        (await transactionModel.find().sort({ createdAt: -1 }).limit(perTypeLimit)
          .populate("user", "username email").select("user type amount status createdAt"))
          .map((t) => ({
            type: "transactions", id: shortId("TRX", t._id), _id: t._id,
            desc: `${t.type?.replace(/_/g, " ") || "Transaction"}`, user: t.user?.username || "Unknown",
            amount: t.amount, status: t.status, createdAt: t.createdAt,
          })),

      featured: async () =>
        (await featureOrderModel.find().sort({ createdAt: -1 }).limit(perTypeLimit)
          .populate("seller", "username email").select("seller plan amount status createdAt"))
          .map((f) => ({
            type: "featured", id: shortId("FTR", f._id), _id: f._id,
            desc: `${f.plan || "Featured"} order`, user: f.seller?.username || "Unknown",
            amount: f.amount, status: f.status, createdAt: f.createdAt,
          })),

      // seller + design subscriptions transactions se aate hain, taake amount bhi dikhe
      subscriptions: async () =>
        (await transactionModel.find({ type: "subscription_purchase" })
          .sort({ createdAt: -1 }).limit(perTypeLimit)
          .populate("user", "username").select("user amount status createdAt"))
          .map((t) => ({
            type: "subscriptions", id: shortId("SUB", t._id), _id: t._id,
            desc: "Seller plan purchased", user: t.user?.username || "Unknown",
            amount: t.amount, status: t.status, createdAt: t.createdAt,
          })),

      designSubscriptions: async () =>
        (await transactionModel.find({ type: DESIGN_TX_TYPE })
          .sort({ createdAt: -1 }).limit(perTypeLimit)
          .populate("user", "username").select("user amount status createdAt"))
          .map((t) => ({
            type: "designSubscriptions", id: shortId("DSN", t._id), _id: t._id,
            desc: t.status === "refunded" ? "Design plan auto-refunded" : "Design plan purchased",
            user: t.user?.username || "Unknown",
            amount: t.amount, status: t.status, createdAt: t.createdAt,
          })),
    };

    if (type !== "all" && !fetchers[type]) {
      return next(
        new AppError(
          `Invalid activity type. Use all or one of: ${Object.keys(fetchers).join(", ")}.`,
          400
        )
      );
    }

    let data;
    if (type === "all") {
      const results = await Promise.all(Object.values(fetchers).map((fn) => fn()));
      data = results.flat()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 15);
    } else {
      data = await fetchers[type]();
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getUsersGrowth,
  getOrdersRevenue,
  getListingsGrowth,
  getCategoryDistribution,
  getSubscriptionDistribution,
  getDesignOverview,
  getRevenueChart,
  getRecentActivity,
};