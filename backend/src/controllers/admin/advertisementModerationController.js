const advertisementModel = require("../../models/advertisementModel");
const AppError = require("../../utils/AppError");

const adminReadAds = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status; // active | pending | sold | rejected | expired | deleted

    const pageNum = Number(page);
    const pageSize = Number(limit);
    const skip = (pageNum - 1) * pageSize;

    const [ads, total] = await Promise.all([
      advertisementModel
        .find(filter)
        .populate("seller", "username email")
        .populate("category", "name slug")
        .populate("subCategory", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      advertisementModel.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: ads.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / pageSize),
      ads,
    });
  } catch (error) {
    next(error);
  }
};

const adminReadAdById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ad = await advertisementModel
      .findById(id)
      .populate("seller", "username email")
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .populate("country", "name")
      .populate("city", "name");

    if (!ad) {
      return next(new AppError("Ad not found", 404));
    }

    res.status(200).json({ success: true, ad });
  } catch (error) {
    next(error);
  }
};

const adminApproveAd = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ad = await advertisementModel.findById(id);
    if (!ad) {
      return next(new AppError("Ad not found", 404));
    }

    if (ad.status === "active") {
      return next(new AppError("Ad is already active", 400));
    }

    if (ad.status === "deleted") {
      return next(new AppError("Cannot approve a deleted ad", 400));
    }

    ad.status = "active";
    await ad.save();

    res.status(200).json({
      success: true,
      message: "Ad approved successfully",
      ad,
    });
  } catch (error) {
    next(error);
  }
};

const adminRejectAd = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ad = await advertisementModel.findById(id);
    if (!ad) {
      return next(new AppError("Ad not found", 404));
    }

    if (ad.status === "deleted") {
      return next(new AppError("Cannot reject a deleted ad", 400));
    }

    ad.status = "rejected";
    await ad.save();

    res.status(200).json({
      success: true,
      message: "Ad rejected successfully",
      ad,
    });
  } catch (error) {
    next(error);
  }
};

const adminDeleteAd = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ad = await advertisementModel.findById(id);
    if (!ad) {
      return next(new AppError("Ad not found", 404));
    }

    if (ad.status === "deleted") {
      return next(new AppError("Ad is already deleted", 400));
    }

    ad.status = "deleted";
    ad.deletedBy = "admin";
    await ad.save();

    res.status(200).json({
      success: true,
      message: "Ad deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const adminBanAd = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ad = await advertisementModel.findById(id);
    if (!ad) {
      return next(new AppError("Ad not found", 404));
    }

    if (ad.isBannedAdvertisement) {
      return next(new AppError("Ad is already banned", 400));
    }

    ad.isBannedAdvertisement = true;
    ad.status = "deleted";
    ad.deletedBy = "admin";
    await ad.save();

    res.status(200).json({
      success: true,
      message: "Ad banned successfully",
      ad,
    });
  } catch (error) {
    next(error);
  }
};
 
const adminUnbanAd = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ad = await advertisementModel.findById(id);
    if (!ad) {
      return next(new AppError("Ad not found", 404));
    }

    if (!ad.isBannedAdvertisement) {
      return next(new AppError("Ad is not banned", 400));
    }

    ad.isBannedAdvertisement = false;
    ad.status = "pending";
    ad.deletedBy = null;
    await ad.save();

    res.status(200).json({
      success: true,
      message: "Ad unbanned successfully",
      ad,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { adminReadAds, adminReadAdById, adminApproveAd, adminRejectAd, adminDeleteAd, adminBanAd, adminUnbanAd };