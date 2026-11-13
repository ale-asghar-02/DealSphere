const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const optionalAuth = require('../middlewares/optionalAuth');
const { looseLimiter, chatbotLimiter, chatbotGlobalLimiter, aiUserLimiter } = require('../middlewares/rateLimiter');
const autofillController = require('../controllers/aiControllers/autofillController');
const moderationController = require('../controllers/aiControllers/moderationController');
const aiChatController = require('../controllers/aiControllers/aiChatController');
const chatbotController = require('../controllers/aiControllers/chatbotController');


//* ================================== AI ASSISTANT ROUTES (Chatbot Functionality) ==================================

router.post("/autofill/ad", authMiddleware, authMiddleware.isSeller, aiUserLimiter, autofillController.autofillAd);
router.post("/autofill/product", authMiddleware, authMiddleware.isSeller, aiUserLimiter, autofillController.autofillProduct);

//* =================================================================================================================


//* ================================ AI ITEM MODERATION ROUTES (Ad & Product Manage) ================================

router.post("/:type/:id/recheck", authMiddleware, authMiddleware.isAdmin, aiUserLimiter, moderationController.recheckModeration);

//* =================================================================================================================


//* ================================ AI ASSISTANT ROUTES (Chat System Auto Response) ================================

router.get("/ai-assistant/settings", authMiddleware, authMiddleware.isSeller, aiChatController.getAIAssistantSettings);
router.post("/ai-assistant/settings", authMiddleware, authMiddleware.isSeller, aiChatController.updateAIAssistant);
router.post("/ai-assistant/test", authMiddleware, authMiddleware.isSeller, aiUserLimiter, aiChatController.testAIAssistant);
router.get("/ai-assistant/stats", authMiddleware, authMiddleware.isSeller, aiChatController.getAIStats);

router.post("/:chatId/ai-resume", authMiddleware, aiChatController.resumeAIForChat);
router.post("/:chatId/ai-toggle", authMiddleware, aiChatController.toggleAIForChat);

router.post("/messages/:messageId/ai-edit", authMiddleware, aiChatController.editAIMessage);
router.post("/messages/:messageId/ai-delete", authMiddleware, aiChatController.deleteAIMessage);

//* =================================================================================================================


//* ======================================== AI AUTOFILL ROUTE (Ad & Product) =======================================

router.post("/chatbot/session", optionalAuth, looseLimiter, chatbotController.startSession);
router.post("/chatbot/message", optionalAuth, chatbotLimiter, chatbotGlobalLimiter, chatbotController.sendMessage);

//* =================================================================================================================


module.exports = router;