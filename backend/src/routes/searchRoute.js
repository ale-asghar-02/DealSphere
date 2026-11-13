const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");

//* ============================================= PUBLIC ROUTES (SEARCH) ============================================

router.get("/", searchController.search);
router.get("/suggestions", searchController.suggestions);

//* =================================================================================================================

module.exports = router;