const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const orderController = require("../controllers/orderController");

//* ================================================== BUYER ROUTES =================================================

router.post("/buyer/buy-now", authMiddleware, orderController.buyNow);
router.post("/buyer/checkout", authMiddleware, orderController.checkoutFromCart);
router.get("/buyer/my-orders", authMiddleware, orderController.getMyOrders);
router.get("/buyer/:orderId", authMiddleware, orderController.getOrderById);
router.post("/buyer/:orderId/cancel", authMiddleware, orderController.cancelOrder);
router.post("/buyer/:orderId/abandon", authMiddleware, orderController.abandonUnpaidOrder);
router.get("/buyer/:orderId/receipt", authMiddleware, orderController.getOrderReceipt);
router.post("/buyer/:orderId/confirm-receipt", authMiddleware, orderController.confirmReceipt);
router.post("/buyer/:orderId/delete", authMiddleware, orderController.deleteMyOrder);
router.post("/buyer/delete/all", authMiddleware, orderController.deleteAllMyOrders);

//* =================================================================================================================


//* ================================================= SELLER ROUTES =================================================

router.get("/seller/my-orders", authMiddleware, orderController.getSellerOrders);
router.get("/seller/:orderId", authMiddleware, orderController.getSellerOrderById);
router.post("/seller/:orderId/status", authMiddleware, orderController.updateOrderStatus);
router.post("/seller/:orderId/delete", authMiddleware, orderController.deleteSellerOrder);
router.post("/seller/delete/all", authMiddleware, orderController.deleteAllSellerOrders);

//* =================================================================================================================

module.exports = router;