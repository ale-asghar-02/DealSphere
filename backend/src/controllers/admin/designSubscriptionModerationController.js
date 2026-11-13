const { DesignPlan } = require("../../models/designModel");
const userModel = require("../../models/userModel");
const AppError = require("../../utils/AppError");

//* ── Design Plan CRUD ──

const adminReadDesignPlans = async (req, res, next) => {
  try {
    const plans = await DesignPlan.find();
    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

const adminReadDesignPlanById = async (req, res, next) => {
  try {
    const plan = await DesignPlan.findById(req.params.id);
    if (!plan) return next(new AppError("Design plan not found", 404));
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

// Sirf ye fields admin update kar sakta hai (name aur discount fields nahi)
const ALLOWED_FIELDS = [
  "price",
  "durationInDays",
  "dailyLimit",
  "monthlyLimit",
  "editsPerDesign",
  "watermark",
];

const adminUpdateDesignPlan = async (req, res, next) => {
  try {
    const updates = {};
    for (const key of ALLOWED_FIELDS) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const plan = await DesignPlan.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!plan) return next(new AppError("Design plan not found", 404));

    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

const adminToggleDesignPlanActive = async (req, res, next) => {
  try {
    const plan = await DesignPlan.findById(req.params.id);
    if (!plan) return next(new AppError("Design plan not found", 404));

    plan.isActive = !plan.isActive;
    await plan.save();

    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

//* ── Discount management ──

// body: { discountPercentage, durationInHours }
const adminApplyDesignDiscount = async (req, res, next) => {
  try {
    const percentage = Number(req.body.discountPercentage);
    const hours = Number(req.body.durationInHours);

    if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) {
      return next(new AppError("Discount percentage must be between 1 and 100", 400));
    }
    if (!Number.isFinite(hours) || hours <= 0) {
      return next(new AppError("Duration in hours is required and must be greater than 0", 400));
    }

    const plan = await DesignPlan.findById(req.params.id);
    if (!plan) return next(new AppError("Design plan not found", 404));

    if (plan.name === "free") {
      return next(new AppError("Discount cannot be applied on the free plan", 400));
    }

    plan.discountPercentage = percentage;
    plan.discountValidUntil = new Date(Date.now() + hours * 60 * 60 * 1000);
    await plan.save();

    res.status(200).json({
      success: true,
      message: `${percentage}% discount applied until ${plan.discountValidUntil.toISOString()}`,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

// Discount ko manually jaldi khatam karna
const adminRemoveDesignDiscount = async (req, res, next) => {
  try {
    const plan = await DesignPlan.findById(req.params.id);
    if (!plan) return next(new AppError("Design plan not found", 404));

    plan.discountPercentage = 0;
    plan.discountValidUntil = null;
    await plan.save();

    res.status(200).json({ success: true, message: "Discount removed", data: plan });
  } catch (error) {
    next(error);
  }
};

//* ── Design subscribers overview ──

const adminReadDesignSubscribers = async (req, res, next) => {
  try {
    const { plan, status } = req.query;

    const filter = {};
    if (plan) filter["designSubscription.plan"] = plan;
    if (status) filter["designSubscription.status"] = status;

    const users = await userModel
      .find(filter)
      .select("username email designSubscription");

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  adminReadDesignPlans,
  adminReadDesignPlanById,
  adminUpdateDesignPlan,
  adminToggleDesignPlanActive,
  adminApplyDesignDiscount,
  adminRemoveDesignDiscount,
  adminReadDesignSubscribers,
};