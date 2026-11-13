const SubscriptionPlanModel = require("../../models/subscriptionPlanModel");
const userModel = require("../../models/userModel");
const AppError = require("../../utils/AppError");

//* ── Plan CRUD ──

const adminReadPlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlanModel.find();
    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

const adminReadPlanById = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlanModel.findById(req.params.id);
    if (!plan) return next(new AppError("Plan not found", 404));
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

const adminUpdatePlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlanModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!plan) return next(new AppError("Plan not found", 404));
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

const adminTogglePlanActive = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlanModel.findById(req.params.id);
    if (!plan) return next(new AppError("Plan not found", 404));

    plan.isActive = !plan.isActive;
    await plan.save();

    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

//* ── Discount management ──

// POST /admin/discount/:id/apply
// body: { discountPercentage, durationInHours }
// durationInHours: fully custom - admin can send 12 (12hr), 24 (1 day), 168 (7 days), 720 (~1 month), or any number
const adminApplyDiscount = async (req, res, next) => {
  try {
    const { discountPercentage, durationInHours } = req.body;

    if (!discountPercentage || discountPercentage <= 0 || discountPercentage > 100) {
      return next(new AppError("Discount percentage must be between 1 and 100", 400));
    }

    if (!durationInHours || durationInHours <= 0) {
      return next(new AppError("Duration in hours is required and must be greater than 0", 400));
    }

    const plan = await SubscriptionPlanModel.findById(req.params.id);
    if (!plan) return next(new AppError("Plan not found", 404));

    const discountValidUntil = new Date();
    discountValidUntil.setHours(discountValidUntil.getHours() + Number(durationInHours));

    plan.discountPercentage = discountPercentage;
    plan.discountValidUntil = discountValidUntil;
    await plan.save();

    res.status(200).json({
      success: true,
      message: `${discountPercentage}% discount applied until ${discountValidUntil.toLocaleString()}`,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

// POST /admin/discount/:id/remove - manually end a discount early
const adminRemoveDiscount = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlanModel.findById(req.params.id);
    if (!plan) return next(new AppError("Plan not found", 404));

    plan.discountPercentage = 0;
    plan.discountValidUntil = null;
    await plan.save();

    res.status(200).json({ success: true, message: "Discount removed", data: plan });
  } catch (error) {
    next(error);
  }
};

//* ── Sellers' subscription overview ──

const adminReadSellerSubscriptions = async (req, res, next) => {
  try {
    const { plan, status } = req.query;

    const filter = { accountType: "seller" };
    if (plan) filter["subscription.plan"] = plan;
    if (status) filter["subscription.status"] = status;

    const sellers = await userModel.find(filter).select("username email subscription");

    res.status(200).json({ success: true, data: sellers });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  adminReadPlans,
  adminReadPlanById,
  adminUpdatePlan,
  adminTogglePlanActive,
  adminApplyDiscount,
  adminRemoveDiscount,
  adminReadSellerSubscriptions,
};