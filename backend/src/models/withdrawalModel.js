const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    commissionAmount: {
      type: Number,
      required: true, // deducted fee
    },
    netAmount: {
      type: Number,
      required: true, // amount - commissionAmount, seller ko actual milne wala
    },
    payoutMethod: {
      type: String,
      enum: ["bank", "jazzcash", "easypaisa"],
      required: true,
    },
    payoutDetails: {
      accountTitle: { type: String, required: true },
      accountNumber: { type: String, required: true }, // bank IBAN or mobile wallet number
      bankName: { type: String }, // only for "bank"
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users", // admin jisne process kiya
    },
    processedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

withdrawalSchema.index({ "payoutDetails.accountNumber": 1 });
withdrawalSchema.index({ seller: 1 });

const withdrawal = mongoose.model("withdrawal", withdrawalSchema);
module.exports = withdrawal;