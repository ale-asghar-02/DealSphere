const categoryModel = require("../../models/categoryModel");
const advertisementModel = require("../../models/advertisementModel");
const productModel = require("../../models/productModel");
const AppError = require("../../utils/AppError");

const generateSlug = (name) =>
  name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

const getAllCategories = async (req, res, next) => {
  try {
    const { parent } = req.query;
    const filter = parent ? { parent } : { parent: null };
    const categories = await categoryModel
      .find(filter)
      .populate("parent", "name slug")
    res.status(200).json({ success: true, total: categories.length, categories });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, parent, icon } = req.body;
    if (!name) return next(new AppError("Name is required", 400));

    const existing = await categoryModel.findOne({ name });
    if (existing) return next(new AppError("Category already exists", 400));

    const category = await categoryModel.create({
      name, slug: generateSlug(name),
      parent: parent || null,
      icon: icon || "",
    });
    res.status(201).json({ success: true, message: "Category created", category });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { name, parent, icon } = req.body;
    const updateData = {};
    if (name) { updateData.name = name; updateData.slug = generateSlug(name); }
    if (parent !== undefined) updateData.parent = parent || null;
    if (icon !== undefined) updateData.icon = icon;

    const category = await categoryModel.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!category) return next(new AppError("Category not found", 404));

    res.status(200).json({ success: true, message: "Category updated", category });
  } catch (error) {
    next(error);
  }
};

const toggleCategory = async (req, res, next) => {
  try {
    const category = await categoryModel.findById(req.params.id);
    if (!category) return next(new AppError("Category not found", 404));

    category.isActive = !category.isActive;
    await category.save();
    res.status(200).json({ success: true, message: `Category ${category.isActive ? "activated" : "deactivated"}`, isActive: category.isActive });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const hasChildren = await categoryModel.findOne({ parent: req.params.id });
    if (hasChildren) return next(new AppError("Cannot delete — subcategories exist. Delete them first.", 400));

    const hasAds = await advertisementModel.findOne({ category: req.params.id });
    if (hasAds) return next(new AppError("Cannot delete — ads exist in this category", 400));

    const hasProducts = await productModel.findOne({ category: req.params.id });
    if (hasProducts) return next(new AppError("Cannot delete — products exist in this category", 400));

    const category = await categoryModel.findByIdAndDelete(req.params.id);
    if (!category) return next(new AppError("Category not found", 404));

    res.status(200).json({ success: true, message: "Category deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllCategories, createCategory, updateCategory, toggleCategory, deleteCategory };
