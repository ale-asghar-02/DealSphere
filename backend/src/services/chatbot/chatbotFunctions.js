const mongoose = require("mongoose");
const config = require("../../configs/config");
const logger = require("../../utils/logger");

const productModel = require("../../models/productModel");
const advertisementModel = require("../../models/advertisementModel");
const categoryModel = require("../../models/categoryModel");
const subscriptionPlanModel = require("../../models/subscriptionPlanModel");
const featurePlanModel = require("../../models/featurePlanModel");
const announcementModel = require("../../models/announcementModel");

const walletModel = require("../../models/walletModel");
const transactionModel = require("../../models/transactionModel");
const withdrawalModel = require("../../models/withdrawalModel");
const orderModel = require("../../models/orderModel");
const featureOrderModel = require("../../models/featureOrderModel");
const contactModel = require("../../models/contactModel");
const reportModel = require("../../models/reportModel");
const cartModel = require("../../models/cartModel");
const wishlistModel = require("../../models/wishlistModel");
const notificationModel = require("../../models/notificationModel");

/* -------------------- Helpers -------------------- */

// User/AI ka diya hua text regex mein daalne se pehle escape karna zaroori hai
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toLimit = (value, def = 10, max = 20) =>
  Math.min(Math.max(parseInt(value, 10) || def, 1), max);

// Ye fields AI ko kabhi nahi jaani chahiye (payment/internal). Sirf top-level par lagta hai.
const INTERNAL_KEYS = [
  "__v",
  "stripePriceId",
  "stripeProductId",
  "stripeSessionId",
  "stripePaymentIntentId",
  "paymentIntentId",
];
const omitKeys = (doc, keys) => {
  if (!doc || typeof doc !== "object") return doc;
  const copy = { ...doc };
  keys.forEach((k) => delete copy[k]);
  return copy;
};
const omitInternal = (doc) => omitKeys(doc, INTERNAL_KEYS);
const cleanList = (docs) => docs.map(omitInternal);

// Listing details mein seller ka id/phone aur moderation notes AI ko nahi dete
const LISTING_HIDDEN_KEYS = [
  ...INTERNAL_KEYS,
  "seller",
  "phoneNumber",
  "moderationReason",
  "moderationSuggestions",
];

/* -------------------- Helper: safe query builders -------------------- */
function buildPriceFilter(args) {
  const filter = {};
  const min = Number(args.minPrice);
  const max = Number(args.maxPrice);
  const hasMin = Number.isFinite(min) && min > 0;
  const hasMax = Number.isFinite(max) && max > 0;

  if (hasMin || hasMax) {
    filter.price = {};
    if (hasMin) filter.price.$gte = min;
    if (hasMax) filter.price.$lte = max;
  }
  return filter;
}

/**
 * Category ObjectId hai (name nahi), lekin AI "bike"/"mobile" jaisa text bhejta hai.
 * Yahan name/slug se category dhoondh kar uski aur uski subcategories ki ids return hoti hain.
 */
async function resolveCategoryIds(input) {
  const value = String(input).trim().slice(0, 100);
  if (!value) return [];

  if (mongoose.isValidObjectId(value)) {
    const children = await categoryModel.find({ parent: value }).select("_id").lean();
    return [value, ...children.map((c) => c._id)];
  }

  const rx = new RegExp(escapeRegex(value), "i");
  const matched = await categoryModel
    .find({ $or: [{ name: rx }, { slug: rx }] })
    .select("_id")
    .lean();
  if (!matched.length) return [];

  const ids = matched.map((c) => c._id);
  const children = await categoryModel.find({ parent: { $in: ids } }).select("_id").lean();
  return [...ids, ...children.map((c) => c._id)];
}

// null return = category match hi nahi hui (result khali hona chahiye)
async function buildListingFilter(args) {
  const filter = { ...buildPriceFilter(args), status: "active" };

  if (args.featured) filter.isFeatured = true;

  if (args.keyword) {
    filter.title = {
      $regex: escapeRegex(String(args.keyword).slice(0, 100)),
      $options: "i",
    };
  }

  if (args.category) {
    const ids = await resolveCategoryIds(args.category);
    if (!ids.length) return null;
    filter.$or = [{ category: { $in: ids } }, { subCategory: { $in: ids } }];
  }

  return filter;
}

// Category/subCategory ObjectId se slug nikalta hai (frontend link banane ke liye)
async function getCategorySlug(categoryId) {
  if (!categoryId || !mongoose.isValidObjectId(categoryId)) return null;
  const cat = await categoryModel.findById(categoryId).select("slug").lean();
  return cat?.slug || null;
}

/* -------------------- Link maps --------------------
 * Ye paths frontend ke App.jsx routes ke mutabiq hain.
 * Jaan bujh kar include nahi kiye: /admin/dashboard, /payment/*, /verify-otp,
 * aur dynamic routes (/design/:id, /chat/:itemId, /checkout/:productId, seller profile).
 */
const SITE_PAGE_PATHS = {
  home: "/",
  deals: "/deals",
  services: "/services",
  contact: "/contact/submit",
  "help-center": "/help-center",
  "for-businesses": "/dealsphere-for-businesses",
  "privacy-policy": "/privacy-policy",
  "terms-of-use": "/terms-of-use",
  advertisement: "/advertisement",
  product: "/products",
  "upgrade-plan": "/upgrade-plan",
  "design-pricing": "/design/pricing",
  login: "/login",
  register: "/register",
  "reset-password": "/reset-password",
};

const ACCOUNT_PAGE_PATHS = {
  dashboard: "/user/dashboard",
  "create-ads": "/user/dashboard/create/ads",
  "create-product": "/user/dashboard/create/product",
  "design-studio": "/design",
  chat: "/chat",
  cart: "/cart",
  checkout: "/checkout",
  wishlist: "/wishlist",
};

/* -------------------- PUBLIC FUNCTIONS -------------------- */

async function search_products(args = {}) {
  const filter = await buildListingFilter(args);
  if (!filter) return { count: 0, products: [] };

  const results = await productModel
    .find(filter)
    .limit(toLimit(args.limit))
    .select("title price category subCategory isFeatured productImages slug createdAt")
    .lean();

  return { count: results.length, products: results };
}

async function search_advertisements(args = {}) {
  const filter = await buildListingFilter(args);
  if (!filter) return { count: 0, advertisements: [] };

  const results = await advertisementModel
    .find(filter)
    .limit(toLimit(args.limit))
    .select("title price category subCategory isFeatured adsImages slug createdAt")
    .lean();

  return { count: results.length, advertisements: results };
}

async function get_listing_details(args = {}) {
  const { listingId, listingType } = args;
  if (!listingId || !listingType) return { error: "listingId and listingType are required" };
  if (!["product", "advertisement"].includes(listingType)) return { error: "Invalid listingType" };
  if (!mongoose.isValidObjectId(listingId)) return { error: "Invalid listingId" };

  const model = listingType === "product" ? productModel : advertisementModel;

  // Sirf active listing dikhni chahiye (pending/rejected/deleted nahi)
  const item = await model.findOne({ _id: listingId, status: "active" }).lean();

  if (!item) return { error: "Listing not found" };

  // Frontend routes:
  //   /product/:categorySlug/:subSlug?/:productSlug?
  //   /advertisement/:categorySlug/:subSlug?/:adSlug?
  const [catSlug, subSlug] = await Promise.all([
    getCategorySlug(item.category),
    getCategorySlug(item.subCategory),
  ]);

  const parts = [listingType, catSlug, subSlug, item.slug].filter(Boolean);
  const link = `${config.CLIENT_URL || ""}/${parts.join("/")}`;

  return { ...omitKeys(item, LISTING_HIDDEN_KEYS), link };
}

async function get_categories() {
  const categories = await categoryModel.find().select("name slug").lean();
  return { count: categories.length, categories };
}

async function get_subscription_plans() {
  const plans = await subscriptionPlanModel.find().lean();
  return { count: plans.length, plans: cleanList(plans) };
}

async function get_feature_plans() {
  const plans = await featurePlanModel.find().lean();
  return { count: plans.length, plans: cleanList(plans) };
}

async function get_announcements() {
  const announcements = await announcementModel
    .find()
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();
  return { announcements: cleanList(announcements) };
}

async function get_site_link(args = {}) {
  const { page } = args;
  const path = SITE_PAGE_PATHS[page];

  if (!path) return { error: `Unknown page: ${page}` };

  return { page, link: `${config.CLIENT_URL || ""}${path}` };
}

/* -------------------- PRIVATE FUNCTIONS -------------------- */
/* IMPORTANT: userId hamesha function ke parameter se (session se) aata hai, AI se kabhi nahi */

async function get_user_balance(args, userId) {
  const wallet = await walletModel.findOne({ user: userId }).lean();
  return { balance: wallet?.balance ?? 0, currency: wallet?.currency || "PKR" };
}

async function get_user_transactions(args = {}, userId) {
  const transactions = await transactionModel
    .find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(toLimit(args.limit))
    .lean();
  return { count: transactions.length, transactions: cleanList(transactions) };
}

async function get_withdrawals(args, userId) {
  const withdrawals = await withdrawalModel
    .find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  return { count: withdrawals.length, withdrawals: cleanList(withdrawals) };
}

async function get_user_orders(args = {}, userId) {
  const orders = await orderModel
    .find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(toLimit(args.limit))
    .lean();
  return { count: orders.length, orders: cleanList(orders) };
}

async function get_feature_orders(args = {}, userId) {
  const orders = await featureOrderModel
    .find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(toLimit(args.limit))
    .lean();
  return { count: orders.length, featureOrders: cleanList(orders) };
}

async function get_contact_requests(args = {}, userId) {
  const filter = { adOwner: userId };
  if (args.adId) {
    if (!mongoose.isValidObjectId(args.adId)) return { error: "Invalid adId" };
    filter.ad = args.adId;
  }
  const contacts = await contactModel.find(filter).limit(50).lean();
  return { count: contacts.length, contacts: cleanList(contacts) };
}

async function get_reports(args, userId) {
  const reports = await reportModel
    .find({ $or: [{ against: userId }, { by: userId }] })
    .limit(20)
    .lean();
  return { count: reports.length, reports: cleanList(reports) };
}

async function get_cart(args, userId) {
  const cart = await cartModel.findOne({ user: userId }).lean();
  return { cart: cart ? omitInternal(cart) : { items: [] } };
}

async function get_wishlist(args, userId) {
  const wishlist = await wishlistModel.findOne({ user: userId }).lean();
  return { wishlist: wishlist ? omitInternal(wishlist) : { items: [] } };
}

async function get_notifications(args = {}, userId) {
  const notifications = await notificationModel
    .find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(toLimit(args.limit))
    .lean();
  return { count: notifications.length, notifications: cleanList(notifications) };
}

async function get_account_link(args = {}, userId) {
  const { page } = args;
  const path = ACCOUNT_PAGE_PATHS[page];

  if (!path) return { error: `Unknown page: ${page}` };

  return { page, link: `${config.CLIENT_URL || ""}${path}` };
}

/* -------------------- Function Registry -------------------- */

const publicFunctions = {
  search_products,
  search_advertisements,
  get_listing_details,
  get_categories,
  get_subscription_plans,
  get_feature_plans,
  get_announcements,
  get_site_link,
};

const privateFunctions = {
  get_user_balance,
  get_user_transactions,
  get_withdrawals,
  get_user_orders,
  get_feature_orders,
  get_contact_requests,
  get_reports,
  get_cart,
  get_wishlist,
  get_notifications,
  get_account_link,
};

/**
 * Central dispatcher - Gemini se jo bhi function-call aaye, yahan se route hota hai.
 * userId - req.user?.id se aata hai (undefined agar guest hai)
 */
async function executeFunction(name, args, userId) {
  try {
    if (publicFunctions[name]) {
      return await publicFunctions[name](args || {}, userId);
    }

    if (privateFunctions[name]) {
      if (!userId) {
        return { error: "This action requires login. Please log in first." };
      }
      return await privateFunctions[name](args || {}, userId);
    }

    return { error: `Unknown function: ${name}` };
  } catch (err) {
    logger.error(`Error executing function "${name}": ${err?.message || err}`);
    return { error: "Something went wrong while fetching this data." };
  }
}

module.exports = { executeFunction };