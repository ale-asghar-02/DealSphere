const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true,
    },
    ads: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "advertisement",
      },
    ],
  },
  { timestamps: true }
);

const wishlist = mongoose.model("wishlists", wishlistSchema);
module.exports = wishlist;