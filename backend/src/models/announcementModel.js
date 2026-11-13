const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["info", "success", "warning", "danger"],
      default: "info",
    },
    targetAudience: {
      type: String,
      enum: ["all", "buyer", "seller"],
      default: "all",
    },
    isActive: { type: Boolean, default: true },
    link: { type: String, default: null },
    expiresAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  },
  { timestamps: true }
);

const announcement = mongoose.model("announcement", announcementSchema);
module.exports = announcement;