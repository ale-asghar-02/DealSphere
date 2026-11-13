const mongoose = require("mongoose");

const featurePlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ["normal", "basic", "premium"],
      required: true,
      unique: true,
    },
    price: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },

    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    discountValidUntil: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

featurePlanSchema.methods.getEffectivePrice = function () {
  const hasActiveDiscount =
    this.discountPercentage > 0 &&
    this.discountValidUntil &&
    this.discountValidUntil > new Date();

  if (!hasActiveDiscount) return this.price;

  return Math.round(this.price - (this.price * this.discountPercentage) / 100);
};

const FeaturePlan = mongoose.model("FeaturePlan", featurePlanSchema);
module.exports = FeaturePlan;