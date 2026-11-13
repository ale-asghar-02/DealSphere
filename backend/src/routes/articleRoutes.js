const express = require("express");
const router = express.Router();

const articleController = require("../controllers/articleController");

//* ============================================= PUBLIC / HELP ARTICLES ============================================

router.get("/help/articles", articleController.getArticles);
router.get("/help/search", articleController.searchArticles);
router.get("/help/articles/:slug", articleController.getArticleBySlug);
router.post("/help/articles/:slug/helpful", articleController.voteHelpful);

//* =================================================================================================================

module.exports = router;