const mongoose = require("mongoose");

// Seller subscription (ads / products)
const subscriptionSchema = new mongoose.Schema(
  {
    plan: {
      type: String,
      enum: ["free", "monthly", "yearly"],
      default: "free",
    },
    status: {
      type: String,
      enum: ["active", "expired"],
      default: "active",
    },
    startDate: { type: Date, default: null },
    expiryDate: { type: Date, default: null },
 
    // Last expiry reminder stage sent (7, 3 or 1 days left). null = none sent yet.
    // Reset to null on every new purchase so reminders start again.
    lastReminderDays: { type: Number, default: null },
  },
  { _id: false }
);

// Design Studio subscription - seller wali subscription se bilkul alag
const designSubscriptionSchema = new mongoose.Schema(
  {
    plan: {
      type: String,
      enum: ["free", "monthly", "yearly"],
      default: "free",
    },
    status: {
      type: String,
      enum: ["active", "expired"],
      default: "active",
    },
    startDate: {
      type: Date,
      default: null,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    // 3 din pehle wala reminder dobara na jaye; nayi purchase par false kar dena hai
    expiryReminderSent: {
      type: Boolean,
      default: false,
    },
    // Jis Stripe checkout se ye plan activate hua (webhook retry par double refund/activation rokta hai)
    lastCheckoutSessionId: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

// Admin moderation (ban / suspend)
const moderationSchema = new mongoose.Schema(
  {
    isBanned: { type: Boolean, default: false },
    reason: { type: String, default: null },
    bannedAt: { type: Date, default: null },
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
    suspendedUntil: { type: Date, default: null },
    suspendedDuration: {
      type: String,
      enum: ["1m", "3m", "6m", "1y", null],
      default: null,
    },
  },
  { _id: false }
);

// Seller ka AI chat assistant
const aiAssistantSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    instructions: { type: String, default: "", maxlength: 500, trim: true },

    // cost control
    dailyLimit: { type: Number, default: 100 }, // max AI replies/day, 0 = unlimited
    dailyCount: { type: Number, default: 0 },
    dailyResetAt: { type: Date, default: Date.now },

    // per-chat rate limit
    cooldownSeconds: { type: Number, default: 5 },
  },
  { _id: false }
);

// Account deletion (OTP confirm + soft delete / anonymize)
const deletionSchema = new mongoose.Schema(
  {
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    otp: { type: String, default: "" },
    otpExpireAt: { type: Number, default: 0 },
    otpAttempts: { type: Number, default: 0 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      minlength: 8,
    },
    password: {
      type: String,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    accountType: {
      type: String,
      enum: ["buyer", "seller"],
      default: "buyer",
    },
    userImage: {
      type: String,
    },
    aboutMe: {
      type: String,
      minlength: 30,
      maxlength: 200,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "prefer not to say"],
      default: undefined,
    },
    phoneNumber: {
      type: Number,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    verifyOtp: {
      type: String,
      default: "",
    },
    verifyOtpExpireAt: {
      type: Number,
      default: 0,
    },
    isAccountVerified: {
      type: Boolean,
      default: false,
    },
    resetOtp: {
      type: String,
      default: "",
    },
    resetOtpExpireAt: {
      type: Number,
      default: 0,
    },
    // Subscription (sellers only — buyers stay on default "free" but never purchase)
    subscription: {
      type: subscriptionSchema,
      default: () => ({}),
    },
    // Design Studio subscription (buyer, seller aur admin sab ke liye)
    designSubscription: {
      type: designSubscriptionSchema,
      default: () => ({}),
    },
    moderation: {
      type: moderationSchema,
      default: () => ({}),
    },
    aiAssistant: {
      type: aiAssistantSchema,
      default: () => ({}),
    },
    deletion: {
      type: deletionSchema,
      default: () => ({}),
    },
  },
  { timestamps: true },
);

userSchema.index({ username: 1 });

const user = mongoose.model("users", userSchema);
module.exports = user;