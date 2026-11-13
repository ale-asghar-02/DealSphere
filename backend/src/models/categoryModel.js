const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "category",
    default: null,
  },
  icon: String,
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

const category = mongoose.model("category", categorySchema);
module.exports = category;