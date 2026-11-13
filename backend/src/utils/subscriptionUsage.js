const mongoose = require("mongoose");
const userModel = require("../models/userModel");
const SubscriptionPlanModel = require("../models/subscriptionPlanModel");
const advertisementModel = require("../models/advertisementModel");
const productModel = require("../models/productModel");
const AppError = require("./AppError");

const DAY_MS = 24 * 60 * 60 * 1000;

// Statuses that occupy a listing slot
const COUNTED = ["active", "pending"];

// -1 on a plan field means "unlimited"
const isUnlimited = (limit) => limit === -1;

// Whole days left until a date (rounded up). 0 if already passed, null if no date.
const getDaysLeft = (expiryDate) => {
  if (!expiryDate) return null;
  const ms = new Date(expiryDate).getTime() - Date.now();
  return ms <= 0 ? 0 : Math.ceil(ms / DAY_MS);
};

// ─────────────────────────────────────────────
// Effective plan of a seller (expired paid plan => free, even before the cron runs)
// ─────────────────────────────────────────────
const getSellerPlan = async (sellerId) => {
  const user = await userModel.findById(sellerId).select("subscription");
  if (!user) throw new AppError("User not found", 404);

  let planName = user.subscription?.plan || "free";
  const expiry = user.subscription?.expiryDate;

  const isExpired =
    planName !== "free" &&
    (user.subscription?.status === "expired" || (expiry && new Date(expiry) < new Date()));

  if (isExpired) planName = "free";

  const plan = await SubscriptionPlanModel.findOne({ name: planName });
  if (!plan) throw new AppError("Subscription plan not found", 404);

  return { user, plan, planName, isExpired: !!isExpired };
};

// ─────────────────────────────────────────────
// Usage counters
// ─────────────────────────────────────────────

// Ads and products are counted separately
const countListings = (sellerId, type) => {
  const Model = type === "ad" ? advertisementModel : productModel;
  return Model.countDocuments({ seller: sellerId, status: { $in: COUNTED } });
};

// Full record for one listing type: all-time total + count per status
const countByStatus = async (sellerId, type) => {
  const Model = type === "ad" ? advertisementModel : productModel;
  const rows = await Model.aggregate([
    { $match: { seller: new mongoose.Types.ObjectId(String(sellerId)) } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const byStatus = {};
  let total = 0;
  for (const row of rows) {
    byStatus[row._id] = row.count;
    total += row.count;
  }
  return { total, byStatus };
};

// Featured slots are shared between ads and products (combined total)
const countFeaturedBreakdown = async (sellerId) => {
  const now = new Date();
  const [ads, products] = await Promise.all([
    advertisementModel.countDocuments({
      seller: sellerId,
      status: { $in: COUNTED },
      isFeatured: true,
      featuredPlan: "subscription",
      featuredUntil: { $gt: now },
    }),
    productModel.countDocuments({
      seller: sellerId,
      status: { $in: COUNTED },
      "featured.isFeatured": true,
      "featured.plan": "subscription",
      "featured.until": { $gt: now },
    }),
  ]);
  return { ads, products, total: ads + products };
};

const countFeatured = async (sellerId) => (await countFeaturedBreakdown(sellerId)).total;

// ─────────────────────────────────────────────
// Limit checks (throw AppError when a limit is hit)
// ─────────────────────────────────────────────

// Before creating a new ad/product
const checkListingLimit = async (sellerId, type) => {
  const { plan, planName } = await getSellerPlan(sellerId);
  const limit = type === "ad" ? plan.maxAds : plan.maxProducts;
  if (isUnlimited(limit)) return;

  const used = await countListings(sellerId, type);
  if (used >= limit) {
    const label = type === "ad" ? "ads" : "products";
    throw new AppError(
      `Your ${planName} plan allows ${limit} ${label}. You currently have ${used}. Delete or mark some as sold, or upgrade your plan to add more.`,
      403
    );
  }
};

// When a sold/expired/rejected/soldout item goes back into a slot
const checkReactivationLimit = async (sellerId, type, previousStatus) => {
  if (COUNTED.includes(previousStatus)) return; // already occupying a slot
  await checkListingLimit(sellerId, type);
};

// Max images per ad/product (pass the FINAL image count)
const checkImageLimit = async (sellerId, type, filesCount) => {
  const { plan, planName } = await getSellerPlan(sellerId);
  const maxImages = type === "ad" ? plan.maxAdImages : plan.maxProductImages;
  if (isUnlimited(maxImages)) return;

  if (filesCount > maxImages) {
    const label = type === "ad" ? "ad" : "product";
    throw new AppError(
      `Your ${planName} plan allows a maximum of ${maxImages} images per ${label}.`,
      403
    );
  }
};

// ─────────────────────────────────────────────
// Featured helpers
// ─────────────────────────────────────────────

// Featured duration can never go beyond the seller's subscription expiry
const capFeaturedDays = (featuredDurationDays, planName, expiryDate) => {
  if (planName === "free" || !expiryDate) return featuredDurationDays;
  const remaining = Math.max(getDaysLeft(expiryDate), 1);
  if (!featuredDurationDays || featuredDurationDays <= 0) return remaining;
  return Math.min(featuredDurationDays, remaining);
};

// Manual "feature with subscription". Returns the number of featured days allowed.
const checkFeaturedLimit = async (sellerId, type) => {
  const { user, plan, planName } = await getSellerPlan(sellerId);
  const days = capFeaturedDays(plan.featuredDurationDays, planName, user.subscription?.expiryDate);

  if (isUnlimited(plan.featuredSlots)) return days;

  if (plan.featuredSlots === 0) {
    throw new AppError(
      `Your ${planName} plan does not include featured listings. Upgrade to feature this ${type}.`,
      403
    );
  }

  const used = await countFeatured(sellerId);
  if (used >= plan.featuredSlots) {
    throw new AppError(
      `You have used all ${plan.featuredSlots} featured slots on your ${planName} plan.`,
      403
    );
  }

  return days;
};

// Yearly plan: every new ad/product is auto-featured (never beyond subscription expiry)
const autoFeatureIfYearly = async (sellerId) => {
  const { user, plan, planName } = await getSellerPlan(sellerId);
  if (planName !== "yearly") return null;

  const days = capFeaturedDays(plan.featuredDurationDays, planName, user.subscription?.expiryDate);
  const until = new Date(Date.now() + days * DAY_MS);

  return { isFeatured: true, plan: "subscription", until };
};

module.exports = {
  COUNTED,
  DAY_MS,
  isUnlimited,
  getDaysLeft,
  getSellerPlan,
  countListings,
  countByStatus,
  countFeatured,
  countFeaturedBreakdown,
  checkListingLimit,
  checkReactivationLimit,
  checkImageLimit,
  checkFeaturedLimit,
  autoFeatureIfYearly,
};