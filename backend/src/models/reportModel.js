const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    reportType: {
      type: String,
      enum: ["ad", "product", "seller", "chat"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "targetModel",
    },
    targetModel: {
      type: String,
      enum: ["advertisement", "product", "users"],
      required: true,
    },
    relatedChat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "chats",
      default: null,
    },
    reason: {
      type: String,
      enum: [
        "fake_listing",
        "scam",
        "abusive",
        "spam",
        "inappropriate",
        "other",
      ],
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "resolved", "dismissed"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    actionTaken: {
      type: String,
      enum: ["none", "warn", "remove", "suspend", "ban"],
      default: "none",
    },
    adminReason: {
      type: String,
      trim: true,
      default: null,
    },
    suspensionDuration: {
      type: String,
      default: null,
    },
    reviewedAt: Date,
  },
  { timestamps: true },
);

reportSchema.index(
  { reportedBy: 1, targetId: 1, status: 1 },
  { unique: false },
);

reportSchema.index({ description: 1 });

const report = mongoose.model("reports", reportSchema);
module.exports = report;