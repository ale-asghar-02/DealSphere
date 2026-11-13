const mongoose = require("mongoose");

const CATEGORY_SLUGS = ["buying", "selling", "account", "safety", "orders", "payments"];

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      enum: {
        values: CATEGORY_SLUGS,
        message: "category must be one of: " + CATEGORY_SLUGS.join(", "),
      },
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
    helpful: {
      yes: { type: Number, default: 0 },
      no: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const articleModel = mongoose.model("article", articleSchema);
module.exports = articleModel;