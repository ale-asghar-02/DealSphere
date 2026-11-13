const express = require("express");
const router = express.Router();
const { displayCategory, displaySubcategory } = require("../controllers/categoryController");

//* ==================================== PUBLIC ROUTES (CATEGORY & SUB-CATEGORY) ====================================

router.get("/", displayCategory);
router.get("/sub/:parentId", displaySubcategory);

//* =================================================================================================================

module.exports = router;