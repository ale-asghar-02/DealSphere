const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const advertisementController = require("../controllers/advertisementController");
const advertisementValidator = require("../validators/advertisementValidator");
const upload = require("../configs/multer");


//* ============================================== PUBLIC / USER ROUTES =============================================

router.get("/read", advertisementController.readAllAds);
router.get("/read/category/:categorySlug", advertisementController.readAdsWithCategory);
router.get("/read/id/:id", advertisementController.readSingleAds);
router.get("/related/:categoryId/:currentId", advertisementController.relativeAds);

//* =================================================================================================================


//* ================================================= SELLER ROUTES =================================================

router.post( "/seller/create", authMiddleware, authMiddleware.isSeller, upload.array("adsImages", 12), advertisementValidator.validateCreateAds, advertisementController.sellerCreateAd );
router.get("/seller/read", authMiddleware, authMiddleware.isSeller, advertisementController.sellerReadAds);
router.post( "/seller/update/:adId", authMiddleware, authMiddleware.isSeller, upload.array("adsImages", 12), advertisementValidator.validateUpdateAds, advertisementController.sellerUpdateAd );
router.post("/seller/delete/:adId", authMiddleware, authMiddleware.isSeller, advertisementController.sellerDeleteAd);
router.post("/seller/sold/:adId", authMiddleware, authMiddleware.isSeller, advertisementController.sellerMarkAsSold);
router.post("/seller/renew/:adId", authMiddleware, authMiddleware.isSeller, advertisementController.sellerRenewAd);

//* =================================================================================================================

module.exports = router;