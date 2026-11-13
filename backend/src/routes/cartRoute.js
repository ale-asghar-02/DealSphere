const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const cartController = require("../controllers/cartController");

//* ========================== CART CRUD (ADD / GET / UPDATE ( QUANTITY ) / REMOVE / CLEAR) =========================

router.post("/add", authMiddleware, cartController.addToCart);
router.get("/get-cart", authMiddleware, cartController.getCart);
router.post("/update/:productId", authMiddleware, cartController.updateCartItem);
router.post("/remove/:productId", authMiddleware, cartController.removeFromCart);
router.post("/clear", authMiddleware, cartController.clearCart);

//* =================================================================================================================

module.exports = router;