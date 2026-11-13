const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const productController = require("../controllers/productController");
const productValidator = require("../validators/productValidator");
const upload = require("../configs/multer");

//* ============================================= PUBLIC / GUEST ROUTES =============================================

router.get("/read", productController.readAllProducts);
router.get("/read/category/:categorySlug", productController.readProductsWithCategory);
router.get("/read/id/:id", productController.readSingleProduct);
router.get("/related/:categoryId/:currentId", productController.relatedProducts);

//* =================================================================================================================


//* ================================================= SELLER ROUTES =================================================

router.post("/seller/create", authMiddleware, authMiddleware.isSeller, upload.array("productImages", 12), productValidator.parseJsonFields(["contactInfo", "attributes"]), productValidator.validateCreateProduct, productController.sellerCreateProduct);
router.get("/seller/read", authMiddleware, authMiddleware.isSeller, productController.sellerReadProducts);
router.post("/seller/update/:adId", authMiddleware, authMiddleware.isSeller, upload.array("productImages", 12), productValidator.parseJsonFields(["contactInfo", "attributes"]), productValidator.validateUpdateProduct, productController.sellerUpdateProduct);
router.post("/seller/delete/:adId", authMiddleware, authMiddleware.isSeller, productController.sellerDeleteProduct);
router.post("/seller/sold/:adId", authMiddleware, authMiddleware.isSeller, productController.sellerMarkAsSold);
router.post("/seller/stock/:adId", authMiddleware, authMiddleware.isSeller, productValidator.validateUpdateStock, productController.sellerUpdateStock);
router.post("/seller/renew/:adId", authMiddleware, authMiddleware.isSeller, productController.sellerRenewProduct);

//* =================================================================================================================

module.exports = router;