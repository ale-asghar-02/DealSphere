const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "order_payment",
        "order_refund",
        "featured_purchase",
        "subscription_purchase",
        "design_purchase",
        "wallet_credit",
        "withdrawal",
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "stripe", "wallet"],
      required: true,
    },
    relatedRef: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "relatedModel",
    },
    relatedModel: {
      type: String,
      enum: ["Order", "FeatureOrder", "Subscription", "DesignSubscription", "Withdrawal"],
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    stripeSessionId: {
      type: String,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

transactionSchema.index({ stripeSessionId: 1 });
transactionSchema.index({ user: 1 });

const transaction = mongoose.model("transactions", transactionSchema);
module.exports = transaction;