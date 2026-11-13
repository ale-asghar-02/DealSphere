const mongoose = require("mongoose");
const { expiryPlugin } = require("../utils/expiryHelper");

const advertisementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 30,
      maxlength: 5000,
    },
    adsImages: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
        _id: false,
      },
    ],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      required: true,
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      required: true,
    },
    // Optional: services, jobs, animals, birds, websites wagaira par condition lagti hi nahi.
    // "" ya null => condition not applicable.
    condition: {
      type: String,
      enum: ["New", "Used", "Open Box", "", null],
      default: "",
    },
    price: {
      type: Number,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    phoneNumberStatus: {
      type: String,
      enum: ["show", "hide"],
      default: "show",
    },
    country: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "pending", "sold", "rejected", "expired", "deleted"],
      default: "pending",
    },
    deletedBy: {
      type: String,
      enum: ["admin", "seller", null],
      default: null,
    },
    adCode: {
      type: String,
      unique: true,
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isFeatured: { type: Boolean, default: false },
    featuredPlan: {
      type: String,
      enum: ["normal", "basic", "premium", "subscription", null],
      default: null,
    },
    featuredUntil: { type: Date, default: null },
    isBannedAdvertisement: { type: Boolean, default: false },
    moderationHidden: { type: Boolean, default: false },
    moderationReason: { type: String, default: null },
    moderationSuggestions: { type: [String], default: [] },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

advertisementSchema.index({ title: 1 });
advertisementSchema.index({ status: 1, isFeatured: -1, createdAt: -1, _id: -1 });  
advertisementSchema.index({ status: 1, category: 1, isFeatured: -1, createdAt: -1, _id: -1 });

// Expiry cron ke liye (sirf active + date wale docs scan hon)
advertisementSchema.index(
  { expiresAt: 1 },
  { partialFilterExpression: { status: "active", expiresAt: { $type: "date" } } }
);

advertisementSchema.plugin(expiryPlugin);

const advertisement = mongoose.model("advertisement", advertisementSchema);
module.exports = advertisement;