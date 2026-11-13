const advertisementModel = require("../models/advertisementModel");
const categoryModel = require("../models/categoryModel");
const { uploadFile } = require("../configs/cloudinary");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");
const { generateUniqueCode } = require("../utils/generateCode");
const { assertMinPrice } = require("../utils/currency");
const { checkListingLimit, checkReactivationLimit, checkImageLimit, autoFeatureIfYearly } = require("../utils/subscriptionUsage");
const { getPagination, getSort, buildPriceFilter } = require("../utils/paginationHelper");
const moderationService = require("../services/moderationService");

// ── Allowed fields for update (whitelist — security) ──
const ALLOWED_UPDATE_FIELDS = [ "title", "description", "category", "subCategory", "condition", "price", "phoneNumber", "phoneNumberStatus", "country", "city", "address" ];

//* ════════════════════════════════════════════════
//* ── PUBLIC / USER CONTROLLERS ──
//* ════════════════════════════════════════════════

const readAllAds = async (req, res, next) => {
  try {
    const { country, city, minPrice, maxPrice, sort, page, limit } = req.query;

    const filter = {
      status: "active",
      isBannedAdvertisement: false,
      moderationHidden: { $ne: true },
    };
    if (country) filter.country = country;
    if (city) filter.city = city;
    buildPriceFilter(filter, minPrice, maxPrice);

    const query = advertisementModel
      .find(filter)
      .sort(getSort(sort, "isFeatured"))
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .populate("seller", "username")
      .lean();

    // page/limit nahi aaye to purana behaviour (ads frontend complete hone ke baad ye hata dena)
    if (!page && !limit) {
      const ads = await query;
      return res.json({ success: true, data: ads });
    }

    const { page: pageNum, limit: pageSize, skip } = getPagination(req.query);

    const [total, ads] = await Promise.all([
      advertisementModel.countDocuments(filter),
      query.skip(skip).limit(pageSize),
    ]);

    res.json({
      success: true,
      count: ads.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / pageSize),
      hasMore: pageNum * pageSize < total,
      data: ads,
    });
  } catch (error) {
    next(error);
  }
};

const readAdsWithCategory = async (req, res, next) => {
  try {
    const { categorySlug } = req.params;
    const { subCategory, country, city, minPrice, maxPrice, sort } = req.query;

    const parentCategory = await categoryModel.findOne({
      slug: categorySlug,
      parent: null,
      isActive: true,
    });
    if (!parentCategory) return next(new AppError("Category not found", 404));

    const filter = {
      category: parentCategory._id,
      status: "active",
      isBannedAdvertisement: false,
      moderationHidden: { $ne: true },
    };

    if (subCategory) {
      const sub = await categoryModel.findOne({
        slug: subCategory,
        parent: parentCategory._id,
      });
      if (!sub) {
        return res.status(200).json({
          success: true, count: 0, total: 0, page: 1, pages: 0,
          hasMore: false, data: [],
        });
      }
      filter.subCategory = sub._id;
    }

    buildPriceFilter(filter, minPrice, maxPrice);
    if (country) filter.country = country;
    if (city) filter.city = city;

    const { page: pageNum, limit: pageSize, skip } = getPagination(req.query);

    const [total, ads] = await Promise.all([
      advertisementModel.countDocuments(filter),
      advertisementModel
        .find(filter)
        .sort(getSort(sort, "isFeatured"))
        .skip(skip)
        .limit(pageSize)
        .populate("category", "name slug")
        .populate("subCategory", "name slug")
        .populate("seller", "username")
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      count: ads.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / pageSize),
      hasMore: pageNum * pageSize < total,
      data: ads,
    });
  } catch (error) {
    next(error);
  }
};

const readSingleAds = async (req, res, next) => {
  try {
    const { id } = req.params;

    const advertisement = await advertisementModel
      .findById(id)
      .populate("seller", "username userImage createdAt")
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .populate("country", "name")
      .populate("city", "name");

    if (!advertisement) {
      return next(new AppError('Advertisement not found', 404));
    }

    if (advertisement.status !== "active") {
      return next(new AppError('This advertisement is not available', 403));
    }

    if (advertisement.isBannedAdvertisement || advertisement.moderationHidden) {
      return next(new AppError('This advertisement is not available', 403));
    }

    advertisement.views += 1;
    await advertisement.save();

    const activeAdsCount = await advertisementModel.countDocuments({
      seller: advertisement.seller._id,
      status: "active",
      isBannedAdvertisement: false,
      moderationHidden: false,
    });

    res.status(200).json({ advertisement, activeAdsCount });
  } catch (error) {
    next(error);
  }
};

const relativeAds = async (req, res, next) => {
  try {
    const { categoryId, currentId } = req.params;

    const advertisements = await advertisementModel.find({
      category: categoryId,
      _id: { $ne: currentId },
      status: "active",
      isBannedAdvertisement: false,
      moderationHidden: { $ne: true }
    })
    .populate("country", "name")
    .populate("city", "name")
    .populate("category", "name slug")
    .populate("subCategory", "name slug")
    .populate("seller", "_id username")
    .limit(8)

    res.status(200).json({ advertisements });

  } catch (error) {
    next(error)
  }
};


//* ════════════════════════════════════════════════
//* ── SELLER CONTROLLERS ──
//* ════════════════════════════════════════════════

const sellerCreateAd = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      subCategory,
      condition,
      price,
      phoneNumber,
      phoneNumberStatus,
      country,
      city,
      address,
    } = req.body;
 
    if (!req.files || req.files.length === 0) {
      return next(new AppError("At least one image is required", 400));
    }
 
    await assertMinPrice(price);
 
    // SUBSCRIPTION: upload se pehle limits check
    await checkListingLimit(req.user.id, "ad");
    await checkImageLimit(req.user.id, "ad", req.files.length);
 
    // Upload + create ek block mein: kuch bhi fail ho to jo images upload hui
    // wo Cloudinary se wapis hata di jayein (orphan files na rahein)
    const uploadImages = [];
    let newAd;
    try {
      for (const file of req.files) {
        const uploaded = await uploadFile(file.buffer, "adsImages");
        uploadImages.push(uploaded);
      }
 
      const adCode = await generateUniqueCode({
        prefix: "AD",
        model: advertisementModel,
        field: "adCode",
      });
 
      // yearly plan: har naya ad auto-featured
      const featureFields = await autoFeatureIfYearly(req.user.id);
 
      newAd = await advertisementModel.create({
        title,
        description,
        adsImages: uploadImages,
        category,
        subCategory,
        // condition optional hai: khali ho to "" (not applicable) save hoga
        condition: condition || "",
        price,
        phoneNumber,
        phoneNumberStatus,
        country,
        city,
        address,
        status: "pending",
        seller: req.user.id,
        adCode,
        ...(featureFields
          ? {
              isFeatured: featureFields.isFeatured,
              featuredPlan: featureFields.plan, // "subscription"
              featuredUntil: featureFields.until,
            }
          : {}),
      });
    } catch (err) {
      await Promise.allSettled(uploadImages.map((img) => deleteFile(img.public_id)));
      throw err;
    }
 
    moderationService.moderateContent("ad", newAd._id).catch((err) => {
      logger.error(
        new AppError(`Ad moderation failed for adId: ${newAd._id} — ${err.message}`, 500)
      );
    });
 
    res.status(201).json({
      success: true,
      message: "Ad posted successfully! It will be visible after admin approval.",
      ad: newAd,
    });
  } catch (error) {
    next(error);
  }
};
 
const sellerReadAds = async (req, res, next) => {
  try {
    const ads = await advertisementModel
      .find({ seller: req.user.id })
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .sort({ createdAt: -1 });
 
    res.status(200).json({ success: true, data: ads });
  } catch (error) {
    next(error);
  }
};
 
const sellerUpdateAd = async (req, res, next) => {
  try {
    const adId = req.params.adId;
    const ad = await advertisementModel.findOne({ _id: adId, seller: req.user.id });
 
    if (!ad) return next(new AppError("Ad not found", 404));
 
    if (ad.status === "deleted") {
      return next(new AppError("Cannot update a deleted ad", 400));
    }
 
    // Banned ad update karke dobara moderation se active na ho jaye
    if (ad.isBannedAdvertisement) {
      return next(new AppError("This ad has been banned and cannot be updated", 403));
    }
 
    if (req.body.price !== undefined) {
      await assertMinPrice(req.body.price);
    }
 
    // SUBSCRIPTION: update ke baad status "pending" ho jata hai. Agar ad pehle
    // sold/expired/rejected thi to wo dobara slot gherti hai, is liye limit check
    await checkReactivationLimit(req.user.id, "ad", ad.status);
 
    // ── Images jo remove karni hain (frontend JSON array of public_id bhejega) ──
    let removeImages = [];
    if (req.body.removeImages !== undefined && req.body.removeImages !== "") {
      try {
        removeImages = JSON.parse(req.body.removeImages);
      } catch {
        return next(new AppError("Invalid removeImages format", 400));
      }
      if (!Array.isArray(removeImages)) {
        return next(new AppError("removeImages must be an array", 400));
      }
    }
 
    const currentImages = ad.adsImages || [];
    const imagesToDelete = currentImages.filter((img) => removeImages.includes(img.public_id));
    const remainingImages = currentImages.filter((img) => !removeImages.includes(img.public_id));
    const incomingCount = req.files ? req.files.length : 0;
    const finalCount = remainingImages.length + incomingCount;
 
    // 1) Sab checks Cloudinary ko chhune se pehle
    if (finalCount === 0) {
      return next(new AppError("At least one image is required", 400));
    }
    // SUBSCRIPTION: final image count check
    await checkImageLimit(req.user.id, "ad", finalCount);
 
    // 2) Nayi images upload + 3) DB update.
    // Fail ho to sirf nayi upload hui images wapis hatati hain, purani images safe rehti hain
    const uploadedImages = [];
    let updatedAd;
    try {
      for (const file of req.files || []) {
        const uploaded = await uploadFile(file.buffer, "adsImages");
        uploadedImages.push(uploaded);
      }
 
      // Whitelist: sirf allowed fields update honge
      const updateData = {};
      for (const field of ALLOWED_UPDATE_FIELDS) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }
 
      updateData.adsImages = [...remainingImages, ...uploadedImages];
      updateData.status = "pending"; // update ke baad wapis admin approval ke liye
 
      updatedAd = await advertisementModel.findByIdAndUpdate(adId, updateData, {
        new: true,
        runValidators: true,
      });
    } catch (err) {
      await Promise.allSettled(uploadedImages.map((img) => deleteFile(img.public_id)));
      throw err;
    }
 
    // 4) DB update kamyab hone ke BAAD purani images delete
    const deleteResults = await Promise.allSettled(
      imagesToDelete.map((img) => deleteFile(img.public_id))
    );
    deleteResults.forEach((r, i) => {
      if (r.status === "rejected") {
        logger.error(
          `Cloudinary delete failed: ${imagesToDelete[i].public_id} — ${r.reason?.message}`
        );
      }
    });
 
    moderationService.moderateContent("ad", updatedAd._id).catch((err) => {
      logger.error(
        new AppError(`Ad re-moderation failed for adId: ${updatedAd._id} — ${err.message}`, 500)
      );
    });
 
    res.status(200).json({
      success: true,
      message: "Ad updated successfully. Pending admin re-approval.",
      data: updatedAd,
    });
  } catch (error) {
    next(error);
  }
};
 
const sellerDeleteAd = async (req, res, next) => {
  try {
    const adId = req.params.adId;
    const ad = await advertisementModel.findOne({ _id: adId, seller: req.user.id });
 
    if (!ad) return next(new AppError("Ad not found", 404));
 
    if (ad.status === "deleted") {
      return next(new AppError("Ad is already deleted", 400));
    }
 
    ad.status = "deleted";
    ad.deletedBy = "seller";
    await ad.save();
 
    res.status(200).json({ success: true, message: "Ad deleted successfully" });
  } catch (error) {
    next(error);
  }
};
 
const sellerMarkAsSold = async (req, res, next) => {
  try {
    const adId = req.params.adId;
    const ad = await advertisementModel.findOne({ _id: adId, seller: req.user.id });
 
    if (!ad) return next(new AppError("Ad not found", 404));
 
    if (ad.status === "deleted") {
      return next(new AppError("Cannot update a deleted ad", 400));
    }
 
    if (ad.status === "sold") {
      return next(new AppError("Ad is already sold", 400));
    }
 
    // sold hone par slot khali ho jata hai (COUNTED mein sold shamil nahi)
    const updated = await advertisementModel.findByIdAndUpdate(
      adId,
      { status: "sold", expiresAt: null },
      { new: true }
    );
 
    const io = req.app.get("io");
    if (io) io.emit("ad_sold", { adId: adId.toString() });
 
    res.status(200).json({ success: true, message: "Ad marked as sold", ad: updated });
  } catch (error) {
    next(error);
  }
};
 
const sellerRenewAd = async (req, res, next) => {
  try {
    const adId = req.params.adId;
    const ad = await advertisementModel.findOne({ _id: adId, seller: req.user.id });
 
    if (!ad) return next(new AppError("Ad not found", 404));
 
    if (ad.status !== "expired") {
      return next(new AppError("Only expired ads can be renewed", 400));
    }
 
    // SUBSCRIPTION: expired ad wapas pending (slot mein) ja rahi hai
    await checkReactivationLimit(req.user.id, "ad", ad.status);
 
    const updated = await advertisementModel.findByIdAndUpdate(
      adId,
      { status: "pending", expiresAt: null }, // admin approve karega tab date set hogi
      { new: true }
    );
 
    res.status(200).json({
      success: true,
      message: "Ad renewed successfully. Pending admin re-approval.",
      ad: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  readAllAds, readAdsWithCategory, readSingleAds, relativeAds,
  sellerCreateAd, sellerReadAds, sellerUpdateAd, sellerDeleteAd, sellerMarkAsSold, sellerRenewAd,
};