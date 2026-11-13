const userModel = require("../models/userModel");
const subscriptionPlanModel = require("../models/subscriptionPlanModel");
const AppError = require("../utils/AppError");
const { getSellerPlan, countFeatured, isUnlimited } = require("./subscriptionUsage");


// Call this when a seller manually marks an ad/product as featured
// (uses up one of the seller's plan-based featuredSlots — separate from the
// existing paid per-listing featuring flow which uses normal/basic/premium)

const checkFeaturedLimit = async (userId, type) => {
  const { plan, planName } = await getSellerPlan(userId);

  if (isUnlimited(plan.featuredSlots)) return plan.featuredDurationDays;

  if (plan.featuredSlots === 0) {
    throw new AppError(
      `Your ${planName} plan does not include featured listings. Upgrade to feature this ${type}.`,
      403
    );
  }

  const used = await countFeatured(userId);
  if (used >= plan.featuredSlots) {
    throw new AppError(
      `You've used all ${plan.featuredSlots} featured slots on your ${planName} plan.`,
      403
    );
  }

  return plan.featuredDurationDays;
};

// Call this right after creating a new ad/product, to auto-feature it
// if the seller is on the yearly plan ("all ads and product featured for 1 year")
//
// NOTE: this uses featuredPlan/plan = "subscription" — a NEW enum value that must
// be added to both schemas alongside "normal" | "basic" | "premium", since those
// three are reserved for your existing paid per-listing featuring flow.
//   Advertisement:  featuredPlan: { type: String, enum: ['normal','basic','premium','subscription'], default: null }
//   Product:        featured.plan: { type: String, enum: ['normal','basic','premium','subscription'], default: null }
const autoFeatureIfYearly = async (userId) => {
  const user = await userModel.findById(userId).select("subscription");
  if (!user || user.subscription.plan !== "yearly") return null;

  const plan = await subscriptionPlanModel.findOne({ name: "yearly" });
  const until = new Date();
  until.setDate(until.getDate() + plan.featuredDurationDays);

  return { isFeatured: true, plan: "subscription", until };
};

// module.exports = { checkFeaturedLimit, autoFeatureIfYearly };