const express = require("express");
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const wishlistController = require('../controllers/wishlistController.js');

//* ==================================== WISHLIST (Like / Unlike / Read / Clear) ====================================

router.post("/like/:adId", authMiddleware, wishlistController.likeAd);
router.post("/unlike/:adId", authMiddleware, wishlistController.unlikeAd);
router.get("/read", authMiddleware, wishlistController.getWishlist);
router.post("/clear", authMiddleware, wishlistController.clearWishlist);

//* =================================================================================================================

module.exports = router;