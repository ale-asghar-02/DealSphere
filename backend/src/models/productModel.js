const mongoose = require("mongoose");
const { expiryPlugin } = require("../utils/expiryHelper");

const productSchema = new mongoose.Schema(
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
      minlength: 30,
      maxlength: 5000,
    },

    productImages: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
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

    price: {
      type: Number,
      required: true,
    },

    isPriceNegotiable: {
      type: Boolean,
      default: false,
    },

    country: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    contactInfo: {
      phoneNumber: { type: String, required: true },
      showPhone: { type: Boolean, default: true },
      chatOnly: { type: Boolean, default: false },
    },

    attributes: [
      {
        key: { type: String },
        value: { type: String },
      },
    ],

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    status: {
      type: String,
      enum: [
        "active",
        "pending",
        "sold",
        "soldout",
        "rejected",
        "expired",
        "deleted",
      ],
      default: "pending",
    },
    deletedBy: {
      type: String,
      enum: ["admin", "seller", null],
      default: null,
    },

    stock: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
    },

    featured: {
      isFeatured: { type: Boolean, default: false },
      plan: {
        type: String,
        enum: ["normal", "basic", "premium", "subscription"],
        default: null,
      },
      until: { type: Date, default: null },
    },

    productCode: {
      type: String,
      required: true,
      unique: true,
    },

    expiresAt: { type: Date, default: null },
    isBannedProduct: { type: Boolean, default: false },

    moderationHidden: { type: Boolean, default: false },
    moderationReason: { type: String, default: null },
    moderationSuggestions: { type: [String], default: [] },
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

productSchema.index({ title: 1 });
productSchema.index({ status: 1, "featured.isFeatured": -1, createdAt: -1, _id: -1 });
productSchema.index({ status: 1, category: 1, "featured.isFeatured": -1, createdAt: -1, _id: -1 });

// Expiry cron ke liye (sirf active + date wale docs scan hon)
productSchema.index(
  { expiresAt: 1 },
  { partialFilterExpression: { status: "active", expiresAt: { $type: "date" } } }
);

productSchema.plugin(expiryPlugin);

const product = mongoose.model("product", productSchema);
module.exports = product;