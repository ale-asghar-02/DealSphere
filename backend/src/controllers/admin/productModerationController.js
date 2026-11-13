const productModel = require("../../models/productModel");
const AppError = require("../../utils/AppError");

const adminReadProducts = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status; // active | pending | sold | soldout | rejected | expired | deleted

    const pageNum = Number(page);
    const pageSize = Number(limit);
    const skip = (pageNum - 1) * pageSize;

    const [products, total] = await Promise.all([
      productModel
        .find(filter)
        .populate("seller", "username email")
        .populate("category", "name slug")
        .populate("subCategory", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      productModel.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / pageSize),
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

const adminReadProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await productModel
      .findById(id)
      .populate("seller", "username email")
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .populate("country", "name")
      .populate("city", "name");

    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

const adminApproveProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await productModel.findById(id);
    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    if (product.status === "active") {
      return next(new AppError("Product is already active", 400));
    }

    if (product.status === "deleted") {
      return next(new AppError("Cannot approve a deleted product", 400));
    }

    product.status = "active";
    await product.save();

    res.status(200).json({
      success: true,
      message: "Product approved successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

const adminRejectProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await productModel.findById(id);
    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    if (product.status === "deleted") {
      return next(new AppError("Cannot reject a deleted product", 400));
    }

    product.status = "rejected";
    await product.save();

    res.status(200).json({
      success: true,
      message: "Product rejected successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

const adminDeleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await productModel.findById(id);
    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    if (product.status === "deleted") {
      return next(new AppError("Product is already deleted", 400));
    }

    product.status = "deleted";
    product.deletedBy = "admin";
    await product.save();

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const adminBanProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await productModel.findById(id);
    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    if (product.isBannedProduct) {
      return next(new AppError("Product is already banned", 400));
    }

    product.isBannedProduct = true;
    product.status = "deleted";
    product.deletedBy = "admin";
    await product.save();

    res.status(200).json({
      success: true,
      message: "Product banned successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};
 
const adminUnbanProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await productModel.findById(id);
    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    if (!product.isBannedProduct) {
      return next(new AppError("Product is not banned", 400));
    }

    product.isBannedProduct = false;
    product.status = "pending"; // dobara review ke liye bhej dena behtar hai
    product.deletedBy = null;
    await product.save();

    res.status(200).json({
      success: true,
      message: "Product unbanned successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  adminReadProducts, adminReadProductById, adminApproveProduct, adminRejectProduct, adminDeleteProduct, adminBanProduct, adminUnbanProduct
};