const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ["free", "monthly", "yearly"],
      required: true,
      unique: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    durationInDays: {
      type: Number,
      default: null,
    },

    // Ads limits
    maxAds: { type: Number, required: true },
    maxAdImages: { type: Number, required: true },

    // Product limits
    maxProducts: { type: Number, required: true },
    maxProductImages: { type: Number, required: true },

    // Featured limits
    featuredSlots: { type: Number, required: true, default: 0 },
    featuredDurationDays: { type: Number, required: true, default: 0 },

    // ── Discount (admin controlled, time-limited) ──
    discountPercentage: {
      type: Number,
      default: 0, // 0 => no discount
      min: 0,
      max: 100,
    },
    discountValidUntil: {
      type: Date,
      default: null, // null => no active discount
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Virtual: effective price after discount (only if discount is currently valid)
subscriptionPlanSchema.methods.getEffectivePrice = function () {
  const hasActiveDiscount =
    this.discountPercentage > 0 &&
    this.discountValidUntil &&
    this.discountValidUntil > new Date();

  if (!hasActiveDiscount) return this.price;

  const discountedPrice = this.price - (this.price * this.discountPercentage) / 100;
  return Math.round(discountedPrice);
};

const SubscriptionPlan = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
module.exports = SubscriptionPlan;