const slugify = require("../../utils/slugify");
const AppError = require("../../utils/AppError");
const articleModel = require("../../models/articleModel");

const CATEGORY_SLUGS = articleModel.schema.path("category").enumValues;

const createArticle = async (req, res, next) => {
  try {
    const { title, content, category, tags } = req.body;
 
    if (!title || !content || !category) {
      return next(new AppError("title, content and category are required", 400));
    }
 
    if (!CATEGORY_SLUGS.includes(category)) {
      return next(new AppError(`category must be one of: ${CATEGORY_SLUGS.join(", ")}`, 400));
    }
 
    const slug = slugify(title);
 
    const existing = await articleModel.findOne({ slug });
    if (existing) {
      return next(new AppError("An article with a similar title already exists", 400));
    }
 
    const article = await articleModel.create({
      title,
      slug,
      content,
      category,
      tags: tags || [],
    });
 
    res.status(201).json({ data: article });
  } catch (error) {
    next(error);
  }
};
 
const updateArticle = async (req, res, next) => {
  try {
    const { title, content, category, tags } = req.body;
    const updates = {};
 
    if (category) {
      if (!CATEGORY_SLUGS.includes(category)) {
        return next(new AppError(`category must be one of: ${CATEGORY_SLUGS.join(", ")}`, 400));
      }
      updates.category = category;
    }
 
    if (title) {
      updates.title = title;
      updates.slug = slugify(title);
    }
    if (content) updates.content = content;
    if (tags) updates.tags = tags;
 
    const article = await articleModel.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
 
    if (!article) {
      return next(new AppError("Article not found", 404));
    }
 
    res.status(200).json({ data: article });
  } catch (error) {
    next(error);
  }
};
 
const deleteArticle = async (req, res, next) => {
  try {
    const article = await articleModel.findByIdAndDelete(req.params.id);
 
    if (!article) {
      return next(new AppError("Article not found", 404));
    }
 
    res.status(204).json({ data: null });
  } catch (error) {
    next(error);
  }
};

module.exports = { createArticle, updateArticle, deleteArticle }