const AppError = require("../utils/AppError");
const articleModel = require("../models/articleModel");
const { buildSearchFilter } = require("../utils/searchFilter");

const CATEGORY_SLUGS = articleModel.schema.path("category").enumValues;

const getArticles = async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = {};
 
    if (category) {
      if (!CATEGORY_SLUGS.includes(category)) {
        return next(new AppError("Invalid category", 400));
      }
      filter.category = category;
    }
 
    const articles = await articleModel.find(filter).sort({ views: -1 });
 
    res.status(200).json({ data: articles });
  } catch (error) {
    next(error);
  }
};
 
const searchArticles = async (req, res, next) => {
  try {
    const { q } = req.query;
 
    if (!q || q.trim().length < 2) {
      return next(new AppError("Search query must be at least 2 characters", 400));
    }
 
    const articles = await articleModel.find(buildSearchFilter(q));
 
    res.status(200).json({ data: articles });
  } catch (error) {
    next(error);
  }
};
 
const getArticleBySlug = async (req, res, next) => {
  try {
    const article = await articleModel.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { views: 1 } }, // count a view every time it's opened
      { new: true }
    );
 
    if (!article) {
      return next(new AppError("Article not found", 404));
    }
 
    res.status(200).json({ data: article });
  } catch (error) {
    next(error);
  }
};
 
const voteHelpful = async (req, res, next) => {
  try {
    const { vote } = req.body;
 
    if (!["yes", "no"].includes(vote)) {
      return next(new AppError("vote must be either 'yes' or 'no'", 400));
    }
 
    const field = vote === "yes" ? "helpful.yes" : "helpful.no";
 
    const article = await articleModel.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { [field]: 1 } },
      { new: true }
    );
 
    if (!article) {
      return next(new AppError("Article not found", 404));
    }
 
    res.status(200).json({ data: article });
  } catch (error) {
    next(error);
  }
};

module.exports = { getArticles, searchArticles, getArticleBySlug, voteHelpful };