const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { messageLimiter } = require("../middlewares/rateLimiter");
const chatController = require("../controllers/chatController");
const upload = require("../configs/multer");

//* ================================================== CHAT ROUTES ==================================================

router.post("/start", authMiddleware, chatController.startOrGetChat); // buyer-seller (adId body me)
router.post("/start/support", authMiddleware, chatController.startSupportChat); // user/seller → admin
router.get("/read", authMiddleware, chatController.getMyChats);
router.get("/:chatId/messages", authMiddleware, chatController.getChatMessages);

//* =================================================================================================================


//* ================================================= MESSAGE ROUTES ================================================

router.post("/:chatId/message/send", authMiddleware, messageLimiter, upload.single("image"), chatController.sendMessage);
router.post("/:chatId/message/:messageId/edit", authMiddleware, chatController.editMessage);
router.post("/:chatId/message/:messageId/delete", authMiddleware, chatController.deleteMessage);
router.post("/:chatId/messages/clear", authMiddleware, chatController.clearChatMessages);
router.post("/:chatId/delete", authMiddleware, chatController.deleteChat);
router.post("/:chatId/mark", authMiddleware, chatController.markAsRead);

//* =================================================================================================================


//* ====================================== BLOCK ROUTES (User / Seller / Admin) =====================================

router.get("/block/list", authMiddleware, chatController.getBlockedUsers);
router.post("/block/:userId", authMiddleware, chatController.blockUser);
router.post("/unblock/:userId", authMiddleware, chatController.unblockUser);

//* =================================================================================================================


//* ================================================ IMPORTANT ROUTES ===============================================

router.post("/important/:sellerId", authMiddleware, chatController.toggleImportantSeller);

//* =================================================================================================================

module.exports = router;