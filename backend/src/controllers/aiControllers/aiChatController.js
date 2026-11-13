const userModel = require("../../models/userModel");
const chatModel = require("../../models/chatModel");
const messageModel = require("../../models/messagesModel");
const advertisementModel = require("../../models/advertisementModel");
const productModel = require("../../models/productModel");
const AppError = require("../../utils/AppError");
const aiChatService = require("../../services/aiChatService");

// ── Limits (apne frontend ke options ke hisaab se yahan adjust kar sakte hain) ──
const MAX_INSTRUCTIONS_LENGTH = 500;
const DAILY_LIMIT_MIN = 1;
const DAILY_LIMIT_MAX = 200;
const COOLDOWN_MIN_SECONDS = 3;
const COOLDOWN_MAX_SECONDS = 300;
const MAX_TEST_MESSAGE_LENGTH = 500;
const MAX_EDIT_TEXT_LENGTH = 2000;

// ── Seller ke AI Assistant settings (get) ──────────────────────
const getAIAssistantSettings = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user.id).select("aiAssistant");
    if (!user) throw new AppError("User not found", 404);

    res.status(200).json({ success: true, data: user.aiAssistant });
  } catch (error) {
    next(error);
  }
};

// ── Seller ke AI Assistant settings (update — on/off + instructions + limits) ──
const updateAIAssistant = async (req, res, next) => {
  try {
    const { enabled, instructions, dailyLimit, cooldownSeconds } = req.body;
    const userId = req.user.id;

    if (enabled !== undefined && typeof enabled !== "boolean") {
      throw new AppError("enabled must be true or false", 400);
    }
    if (instructions !== undefined) {
      if (typeof instructions !== "string") {
        throw new AppError("Instructions must be text", 400);
      }
      if (instructions.length > MAX_INSTRUCTIONS_LENGTH) {
        throw new AppError(`Instructions must be ${MAX_INSTRUCTIONS_LENGTH} characters or fewer`, 400);
      }
    }
    if (
      dailyLimit !== undefined &&
      (!Number.isInteger(dailyLimit) || dailyLimit < DAILY_LIMIT_MIN || dailyLimit > DAILY_LIMIT_MAX)
    ) {
      throw new AppError(`dailyLimit must be a whole number between ${DAILY_LIMIT_MIN} and ${DAILY_LIMIT_MAX}`, 400);
    }
    if (
      cooldownSeconds !== undefined &&
      (typeof cooldownSeconds !== "number" ||
        !Number.isFinite(cooldownSeconds) ||
        cooldownSeconds < COOLDOWN_MIN_SECONDS ||
        cooldownSeconds > COOLDOWN_MAX_SECONDS)
    ) {
      throw new AppError(
        `cooldownSeconds must be between ${COOLDOWN_MIN_SECONDS} and ${COOLDOWN_MAX_SECONDS}`,
        400,
      );
    }

    const updateData = {};
    if (enabled !== undefined) updateData["aiAssistant.enabled"] = enabled;
    if (instructions !== undefined) updateData["aiAssistant.instructions"] = instructions;
    if (dailyLimit !== undefined) updateData["aiAssistant.dailyLimit"] = dailyLimit;
    if (cooldownSeconds !== undefined) updateData["aiAssistant.cooldownSeconds"] = cooldownSeconds;

    const user = await userModel
      .findByIdAndUpdate(userId, updateData, { new: true, runValidators: true })
      .select("aiAssistant");

    if (!user) throw new AppError("User not found", 404);

    res.status(200).json({
      success: true,
      message: "AI Assistant settings updated",
      data: user.aiAssistant,
    });
  } catch (error) {
    next(error);
  }
};

// ── Helper: load chat + verify requester is the item's seller ──
const getChatAndVerifySeller = async (chatId, userId) => {
  const chat = await chatModel.findById(chatId);
  if (!chat) throw new AppError("Chat not found", 404);

  if (chat.type !== "buyer-seller") {
    throw new AppError("AI assistant only applies to buyer-seller chats", 400);
  }
  if (!chat.participants.some((id) => id.toString() === userId)) {
    throw new AppError("You are not a participant of this chat", 403);
  }

  const Model = chat.itemType === "advertisement" ? advertisementModel : productModel;
  const item = await Model.findById(chat.item).select("seller title price description status");

  // Item deleted/missing ho to sirf actual seller hi resume/toggle kar sake — buyer nahi
  if (!item) throw new AppError("This item no longer exists, AI cannot be managed", 404);
  if (item.seller.toString() !== userId) {
    throw new AppError("Only the seller of this item can manage AI for this chat", 403);
  }

  return { chat, item };
};

// ── Kisi specific chat ke liye AI ko dobara resume karna (manual takeover ke baad) ──
const resumeAIForChat = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { chat } = await getChatAndVerifySeller(chatId, req.user.id);

    if (!chat.aiPaused) {
      return res.status(200).json({
        success: true,
        message: "AI assistant is already active for this chat",
      });
    }

    chat.aiPaused = false;
    await chat.save();

    res.status(200).json({ success: true, message: "AI assistant resumed for this chat" });
  } catch (error) {
    next(error);
  }
};

// ── Explicitly enable/disable AI for ONE chat only (independent of the global toggle) ──
const toggleAIForChat = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { disabled } = req.body;
    if (typeof disabled !== "boolean") throw new AppError("`disabled` must be true or false", 400);

    const { chat } = await getChatAndVerifySeller(chatId, req.user.id);

    chat.aiDisabledByUser = disabled;
    await chat.save();

    res.status(200).json({
      success: true,
      message: `AI assistant ${disabled ? "disabled" : "enabled"} for this chat`,
    });
  } catch (error) {
    next(error);
  }
};

// ── Preview: seller apna AI test kar sake bina real chat use kiye ──
const testAIAssistant = async (req, res, next) => {
  try {
    const { itemId, itemType, testMessage } = req.body;
    if (!itemId || !itemType || !testMessage) {
      throw new AppError("itemId, itemType and testMessage are required", 400);
    }
    if (typeof itemId !== "string" || typeof testMessage !== "string") {
      throw new AppError("itemId and testMessage must be text", 400);
    }
    if (testMessage.length > MAX_TEST_MESSAGE_LENGTH) {
      throw new AppError(`testMessage must be ${MAX_TEST_MESSAGE_LENGTH} characters or fewer`, 400);
    }
    if (!["advertisement", "product"].includes(itemType)) {
      throw new AppError("itemType must be 'advertisement' or 'product'", 400);
    }

    const Model = itemType === "advertisement" ? advertisementModel : productModel;
    const item = await Model.findById(itemId);
    if (!item) throw new AppError("Item not found", 404);
    if (item.seller.toString() !== req.user.id) {
      throw new AppError("Only the seller of this item can test AI for it", 403);
    }

    const seller = await userModel.findById(req.user.id).select("aiAssistant");

    const replyText = await aiChatService.buildAndGenerateReply({
      item,
      itemType,
      seller,
      history: [],
      buyerMessage: testMessage,
    });

    // Not saved to DB — this is a dry-run preview only.
    res.status(200).json({ success: true, data: { reply: replyText } });
  } catch (error) {
    next(error);
  }
};

// ── Seller ke AI assistant ki usage stats ────────────────────────
const getAIStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await userModel.findById(userId).select("aiAssistant");
    if (!user) throw new AppError("User not found", 404);

    const totalReplies = await messageModel.countDocuments({
      sender: userId,
      isAIReply: true,
      isDeleted: false,
    });

    const flaggedReplies = await messageModel.countDocuments({
      sender: userId,
      isAIReply: true,
      needsSellerAttention: true,
      isDeleted: false,
    });

    res.status(200).json({
      success: true,
      data: {
        totalAIReplies: totalReplies,
        flaggedForAttention: flaggedReplies,
        dailyCount: user.aiAssistant?.dailyCount ?? 0,
        dailyLimit: user.aiAssistant?.dailyLimit ?? 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Ek AI-generated message ko edit karna (galat info gayi ho to) ──
const editAIMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    if (typeof text !== "string" || !text.trim()) throw new AppError("text is required", 400);
    if (text.length > MAX_EDIT_TEXT_LENGTH) {
      throw new AppError(`text must be ${MAX_EDIT_TEXT_LENGTH} characters or fewer`, 400);
    }

    const message = await messageModel.findById(messageId);
    if (!message) throw new AppError("Message not found", 404);
    if (!message.isAIReply) throw new AppError("Only AI-generated messages can be edited this way", 400);
    if (message.sender.toString() !== req.user.id) {
      throw new AppError("You can only edit your own AI replies", 403);
    }

    message.text = text.trim();
    message.needsSellerAttention = false;
    await message.save();

    res.status(200).json({ success: true, message: "AI message updated", data: message });
  } catch (error) {
    next(error);
  }
};

// ── Ek AI-generated message ko soft-delete karna ──────────────────
const deleteAIMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await messageModel.findById(messageId);
    if (!message) throw new AppError("Message not found", 404);
    if (!message.isAIReply) throw new AppError("Only AI-generated messages can be deleted this way", 400);
    if (message.sender.toString() !== req.user.id) {
      throw new AppError("You can only delete your own AI replies", 403);
    }

    message.isDeleted = true;
    await message.save();

    res.status(200).json({ success: true, message: "AI message deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAIAssistantSettings,
  updateAIAssistant,
  resumeAIForChat,
  toggleAIForChat,
  testAIAssistant,
  getAIStats,
  editAIMessage,
  deleteAIMessage,
};