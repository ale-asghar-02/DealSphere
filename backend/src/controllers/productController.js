const productModel = require("../models/productModel");
const categoryModel = require("../models/categoryModel");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");
const { uploadFile, deleteFile } = require("../configs/cloudinary");
const { generateUniqueCode } = require("../utils/generateCode");
const { assertMinPrice } = require("../utils/currency"); 
const { checkListingLimit, checkReactivationLimit, checkImageLimit, autoFeatureIfYearly } = require("../utils/subscriptionUsage");
const { getPagination, getSort, buildPriceFilter } = require("../utils/paginationHelper");

const moderationService = require("../services/moderationService");

const ALLOWED_UPDATE_FIELDS = [
  "title",
  "description",
  "category",
  "subCategory",
  "price",
  "isPriceNegotiable",
  "country",
  "city",
  "stock",
  "contactInfo",
  "attributes",
];

//* ════════════════════════════════════════════════
//* ── PUBLIC / USER CONTROLLERS ──
//* ════════════════════════════════════════════════

const readAllProducts = async (req, res, next) => {
  try {
    const { country, city, minPrice, maxPrice, sort, page, limit } = req.query;

    const filter = {
      status: "active",
      isBannedProduct: false,
      moderationHidden: { $ne: true },
    };
    if (country) filter.country = country;
    if (city) filter.city = city;
    buildPriceFilter(filter, minPrice, maxPrice);

    const query = productModel
      .find(filter)
      .sort(getSort(sort))
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .populate("seller", "username")
      .lean();

    // page/limit nahi aaye to purana behaviour (frontend complete hone ke baad ye hata dena)
    if (!page && !limit) {
      const products = await query;
      return res.status(200).json({
        success: true,
        message: "Products fetched successfully",
        data: products,
      });
    }

    const { page: pageNum, limit: pageSize, skip } = getPagination(req.query);

    const [total, products] = await Promise.all([
      productModel.countDocuments(filter),
      query.skip(skip).limit(pageSize),
    ]);

    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / pageSize),
      hasMore: pageNum * pageSize < total,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

const readProductsWithCategory = async (req, res, next) => {
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
      isBannedProduct: false,
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

    const [total, products] = await Promise.all([
      productModel.countDocuments(filter),
      productModel
        .find(filter)
        .sort(getSort(sort))
        .skip(skip)
        .limit(pageSize)
        .populate("category", "name slug")
        .populate("subCategory", "name slug")
        .populate("seller", "username")
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / pageSize),
      hasMore: pageNum * pageSize < total,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

const readSingleProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await productModel
      .findById(id)
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .populate("seller", "username email userImage createdAt");

    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    if (product.status !== "active") {
      return next(new AppError("This product is not available", 403));
    }

    if (product.isBannedProduct || product.moderationHidden) {
      return next(new AppError("This product is not available", 403));
    }

    product.views += 1;
    await product.save();

    res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

const relatedProducts = async (req, res, next) => {
  try {
    const { categoryId, currentId } = req.params;

    const products = await productModel
      .find({
        category: categoryId,
        _id: { $ne: currentId },
        status: "active",
        isBannedProduct: false,
        moderationHidden: { $ne: true }
      })
      .populate("country", "name")
      .populate("city", "name")
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .populate("seller", "_id username")
      .limit(10)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Related products fetched successfully",
      data: products,
    });
  } catch (error) {
    next(error);
  }
};


//* ════════════════════════════════════════════════
//* ── SELLER CONTROLLERS ──
//* ════════════════════════════════════════════════

const sellerCreateProduct = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      subCategory,
      price,
      isPriceNegotiable,
      country,
      city,
      stock,
      contactInfo,
      attributes,
    } = req.body;
 
    if (!req.files || req.files.length === 0) {
      return next(new AppError("At least one image is required", 400));
    }
 
    await assertMinPrice(price); 

    // SUBSCRIPTION: upload se pehle limits check
    await checkListingLimit(req.user.id, "product");
    await checkImageLimit(req.user.id, "product", req.files.length);
 
    let uploadImages = [];
    for (const file of req.files) {
      const uploaded = await uploadFile(file.buffer, "productImages");
      uploadImages.push(uploaded);
    }
 
    const productCode = await generateUniqueCode({
      prefix: "PRD",
      model: productModel,
      field: "productCode",
    });
 
    // yearly plan: har naya product auto-featured
    const featureFields = await autoFeatureIfYearly(req.user.id);
 
    const newProduct = await productModel.create({
      productCode,
      title,
      description,
      productImages: uploadImages,
      category,
      subCategory,
      price,
      isPriceNegotiable,
      country,
      city,
      contactInfo,
      attributes,
      stock,
      status: "pending",
      seller: req.user.id,
      ...(featureFields ? { featured: featureFields } : {}),
    });
 
    moderationService.moderateContent("product", newProduct._id).catch((err) => {
      logger.error(
        new AppError(
          `Product moderation failed for productId: ${newProduct._id} — ${err.message}`,
          500
        )
      );
    });
 
    res.status(201).json({
      success: true,
      message: "Product posted successfully! It will be visible after admin approval.",
      data: newProduct,
    });
  } catch (error) {
    next(error);
  }
};
 
const sellerReadProducts = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
 
    // seller apne sab products dekh sake, deleted bhi (status field se pata chal jayega)
    const products = await productModel
      .find({ seller: sellerId })
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .sort({ createdAt: -1 });
 
    res.status(200).json({
      success: true,
      message: "Your products fetched successfully",
      data: products,
    });
  } catch (error) {
    next(error);
  }
};
 
const sellerUpdateProduct = async (req, res, next) => {
  try {
    const { adId } = req.params;
    const product = await productModel.findOne({ _id: adId, seller: req.user.id });
 
    if (!product) return next(new AppError("Product not found", 404));

    if (product.isBannedProduct) {
      return next(new AppError("This product has been banned and cannot be updated", 403));
    }
 
    if (product.status === "deleted") {
      return next(new AppError("Cannot update a deleted product", 400));
    }

    if (req.body.price !== undefined) {
      await assertMinPrice(req.body.price);
    }
 
    // SUBSCRIPTION: update ke baad status "pending" ho jata hai. Agar product pehle
    // sold/soldout/expired/rejected tha to wo dobara slot gherta hai, is liye limit check
    await checkReactivationLimit(req.user.id, "product", product.status);
 
    // ── Images jo remove karni hain (frontend JSON array of public_id bhejega) ──
    let removeImages = [];
    if (req.body.removeImages !== undefined) {
      try {
        removeImages = JSON.parse(req.body.removeImages);
      } catch {
        return next(new AppError("Invalid removeImages format", 400));
      }
    }
 
    const currentImages = product.productImages || [];
    const imagesToDelete = currentImages.filter((img) => removeImages.includes(img.public_id));
    const remainingImages = currentImages.filter((img) => !removeImages.includes(img.public_id));
 
    // SUBSCRIPTION: final image count check, Cloudinary ko chhune se pehle
    const incomingCount = req.files ? req.files.length : 0;
    await checkImageLimit(req.user.id, "product", remainingImages.length + incomingCount);
 
    for (const img of imagesToDelete) {
      try {
        await deleteFile(img.public_id);
      } catch (err) {
        console.error("Cloudinary delete failed:", img.public_id, err.message);
      }
    }
 
    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await uploadFile(file.buffer, "productImages");
        uploadedImages.push(uploaded);
      }
    }
 
    const finalImages = [...remainingImages, ...uploadedImages];
 
    if (finalImages.length === 0) {
      return next(new AppError("At least one image is required", 400));
    }
 
    // Whitelist: sirf allowed fields update honge
    const updateData = {};
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }
 
    updateData.productImages = finalImages;
    updateData.status = "pending"; // update ke baad wapis admin approval ke liye
 
    const updatedProduct = await productModel.findByIdAndUpdate(adId, updateData, {
      new: true,
      runValidators: true,
    });
 
    moderationService.moderateContent("product", updatedProduct._id).catch((err) => {
      logger.error(
        new AppError(
          `Product re-moderation failed for productId: ${updatedProduct._id} — ${err.message}`,
          500
        )
      );
    });
 
    res.status(200).json({
      success: true,
      message: "Product updated successfully. Pending admin re-approval.",
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};
 
const sellerDeleteProduct = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { adId } = req.params;
 
    const product = await productModel.findOne({ _id: adId, seller: sellerId });
    if (!product) {
      return next(new AppError("Product not found", 404));
    }
 
    if (product.status === "deleted") {
      return next(new AppError("Product is already deleted", 400));
    }
 
    product.status = "deleted";
    product.deletedBy = "seller";
    await product.save();
 
    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
 
const sellerMarkAsSold = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { adId } = req.params;
 
    const product = await productModel.findOne({ _id: adId, seller: sellerId });
    if (!product) {
      return next(new AppError("Product not found", 404));
    }
 
    if (product.status === "deleted") {
      return next(new AppError("Cannot update a deleted product", 400));
    }
 
    // sold hone par slot khali ho jata hai (COUNTED mein sold shamil nahi)
    product.status = "sold";
    await product.save();
 
    res.status(200).json({
      success: true,
      message: "Product marked as sold",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};
 
const sellerUpdateStock = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { adId } = req.params;
    const { action, quantity } = req.body;
 
    const product = await productModel.findOne({ _id: adId, seller: sellerId });
    if (!product) {
      return next(new AppError("Product not found", 404));
    }
 
    if (product.status === "deleted") {
      return next(new AppError("Cannot update a deleted product", 400));
    }
 
    if (action === "increase") {
      product.stock += Number(quantity);
    } else if (action === "decrease") {
      if (product.stock - Number(quantity) < 0) {
        return next(new AppError("Stock cannot go below 0", 400));
      }
      product.stock -= Number(quantity);
    } else if (action === "set") {
      product.stock = Number(quantity);
    }
 
    // auto sync status with stock level (sirf active/soldout products par)
    if (product.status === "active" || product.status === "soldout") {
      if (product.stock === 0) {
        product.status = "soldout";
      } else if (product.status === "soldout") {
        // SUBSCRIPTION: soldout se wapas active, slot dobara lagega
        await checkReactivationLimit(sellerId, "product", "soldout");
        product.status = "active";
      }
    }
 
    await product.save();
 
    res.status(200).json({
      success: true,
      message: "Stock updated successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};
 
const sellerRenewProduct = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { adId } = req.params;

    const product = await productModel.findOne({ _id: adId, seller: sellerId });
    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    if (product.status !== "expired") {
      return next(new AppError("Only expired products can be renewed", 400));
    }

    // SUBSCRIPTION: expired product wapas pending (slot mein) ja raha hai
    await checkReactivationLimit(sellerId, "product", product.status);

    product.status = "pending";
    product.expiresAt = null;
    await product.save();

    res.status(200).json({
      success: true,
      message: "Product renewed successfully. Pending admin re-approval.",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  readAllProducts, readProductsWithCategory, readSingleProduct, relatedProducts,
  sellerCreateProduct, sellerReadProducts, sellerUpdateProduct, sellerDeleteProduct, sellerMarkAsSold, sellerUpdateStock, sellerRenewProduct,
};