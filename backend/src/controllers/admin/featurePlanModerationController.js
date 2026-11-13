const FeaturePlanModel = require("../../models/featurePlanModel");
const AppError = require("../../utils/AppError");

const adminReadFeaturePlans = async (req, res, next) => {
  try {
    const plans = await FeaturePlanModel.find();
    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

const adminReadFeaturePlanById = async (req, res, next) => {
  try {
    const plan = await FeaturePlanModel.findById(req.params.id);
    if (!plan) return next(new AppError("Plan not found", 404));
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

const adminUpdateFeaturePlan = async (req, res, next) => {
  try {
    const plan = await FeaturePlanModel.findByIdAndUpdate(req.params.id, req.body, {
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
    const plan = await FeaturePlanModel.findById(req.params.id);
    if (!plan) return next(new AppError("Plan not found", 404));

    plan.isActive = !plan.isActive;
    await plan.save();

    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

// POST /admin/feature-plan/discount/:id/apply
const adminApplyDiscount = async (req, res, next) => {
  try {
    const { discountPercentage, durationInHours } = req.body;

    if (!discountPercentage || discountPercentage <= 0 || discountPercentage > 100) {
      return next(new AppError("Discount percentage must be between 1 and 100", 400));
    }

    if (!durationInHours || durationInHours <= 0) {
      return next(new AppError("Duration in hours is required and must be greater than 0", 400));
    }

    const plan = await FeaturePlanModel.findById(req.params.id);
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

// POST /admin/feature-plan/discount/:id/remove
const adminRemoveDiscount = async (req, res, next) => {
  try {
    const plan = await FeaturePlanModel.findById(req.params.id);
    if (!plan) return next(new AppError("Plan not found", 404));

    plan.discountPercentage = 0;
    plan.discountValidUntil = null;
    await plan.save();

    res.status(200).json({ success: true, message: "Discount removed", data: plan });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  adminReadFeaturePlans,
  adminReadFeaturePlanById,
  adminUpdateFeaturePlan,
  adminTogglePlanActive,
  adminApplyDiscount,
  adminRemoveDiscount,
};