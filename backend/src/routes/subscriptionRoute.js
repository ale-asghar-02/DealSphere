const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const subscriptionController = require("../controllers/subscriptionController");

//* ================================================= PUBLIC ROUTES =================================================

router.get("/read", subscriptionController.readAllPlans);

//* =================================================================================================================


//* ================================================= SELLER ROUTES =================================================

router.get("/seller/read", authMiddleware, authMiddleware.isSeller, subscriptionController.sellerReadSubscription);
router.post("/seller/purchase", authMiddleware, subscriptionController.sellerPurchaseSubscription);

//* =================================================================================================================

module.exports = router;