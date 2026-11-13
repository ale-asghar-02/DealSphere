const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const notificationController = require("../controllers/notificationController");
const { looseLimiter } = require("../middlewares/rateLimiter");

//* ====================================== NOTIFICATIONS (Get / Read / Delete) ======================================

router.get("/get/all", authMiddleware, notificationController.getAllNotifications);
router.get("/unread-count", authMiddleware, notificationController.getUnreadCount);

router.post("/read/all", authMiddleware, notificationController.markAllAsRead);
router.post("/read/:id", authMiddleware, looseLimiter, notificationController.markAsRead);

router.post("/delete/all", authMiddleware, looseLimiter, notificationController.deleteAllNotifications);
router.post("/delete/selected", authMiddleware, looseLimiter, notificationController.deleteSelectedNotifications);
router.post("/delete/:id", authMiddleware, looseLimiter, notificationController.deleteNotification);

//* =================================================================================================================

module.exports = router;