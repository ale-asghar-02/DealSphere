const wishlistModel = require("../models/wishlistModel");
const AppError = require("../utils/AppError");

const likeAd = async (req, res, next) => {
  try {
    const { adId } = req.params;
    const userId = req.user.id;

    let wishlist = await wishlistModel.findOne({ user: userId });

    if (!wishlist) {
      wishlist = await wishlistModel.create({ user: userId, ads: [adId] });
      return res.status(201).json({ message: "Ad added to wishlist", wishlist });
    }

    if (wishlist.ads.includes(adId)) {
      return next(new AppError("Ad already in wishlist", 400));
    }

    wishlist.ads.push(adId);
    await wishlist.save();

    res.status(200).json({ message: "Ad added to wishlist", wishlist });
  } catch (error) {
    next(error);
  }
};

const unlikeAd = async (req, res, next) => {
  try {
    const { adId } = req.params;
    const userId = req.user.id;

    const wishlist = await wishlistModel.findOne({ user: userId });

    if (!wishlist) {
      return next(new AppError("Wishlist not found", 404));
    }

    wishlist.ads = wishlist.ads.filter((id) => id.toString() !== adId);
    await wishlist.save();

    res.status(200).json({ message: "Ad removed from wishlist", wishlist });
  } catch (error) {
    next(error);
  }
};

const getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const wishlist = await wishlistModel.findOne({ user: userId }).populate({
      path: "ads",
      select: "title price adsImages status category subCategory country city createdAt",
      populate: [
        {
          path: "category",
          select: "name",
        },
        {
          path: "subCategory",
          select: "name",
        },
        { path: "seller", select: "username" }
      ],
    });

    if (!wishlist) {
      return res.status(200).json({ ads: [] });
    }

    res.status(200).json({ ads: wishlist.ads });
  } catch (error) {
    next(error);
  }
};

const clearWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const wishlist = await wishlistModel.findOne({ user: userId });

    if (!wishlist) {
      return next(new AppError("Wishlist not found", 404));
    }

    wishlist.ads = [];
    await wishlist.save();

    res.status(200).json({ message: "Wishlist cleared", wishlist });
  } catch (error) {
    next(error);
  }
};

module.exports = { likeAd, unlikeAd, getWishlist, clearWishlist };