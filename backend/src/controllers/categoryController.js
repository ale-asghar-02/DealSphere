const categoryModel = require("../models/categoryModel");

const displayCategory = async (req, res, next) => {
  try {
    const parents = await categoryModel.find({ parent: null, isActive: true });
    res.status(200).json({ success: true, parents });
  } catch (error) {
    next(error);
  }
};

const displaySubcategory = async (req, res, next) => {
  try {
    const subcategories = await categoryModel.find({ parent: req.params.parentId, isActive: true });
    res.status(200).json({ success: true, subcategories });
  } catch (error) {
    next(error);
  }
};

module.exports = { displayCategory, displaySubcategory };