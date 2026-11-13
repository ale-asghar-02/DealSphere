const chatModel = require("../models/chatModel");
const messageModel = require("../models/messagesModel");
const blockModel = require("../models/blockModel");
const advertisementModel = require("../models/advertisementModel");
const productModel = require("../models/productModel");
const userModel = require("../models/userModel");
const AppError = require("../utils/AppError");
const aiChatService = require("../services/aiChatService");
const logger = require("../utils/logger");
const { uploadFile, deleteFile } = require("../configs/cloudinary");
const { getIO, getReceiverSocketId } = require("../socket/chatSocket");

// helper — get the other participant's id from a chat
const getOtherParticipant = (chat, userId) => {
  const other = chat.participants.find((id) => id.toString() !== userId);
  if (!other) throw new AppError("Chat participants data is invalid", 400);
  return other.toString();
};

// helper: user banned hai ya abhi suspended hai?
const isUserUnavailable = (user) => {
  const m = user?.moderation;
  if (!m) return false;
  if (m.isBanned) return true;
  return !!(m.suspendedUntil && new Date(m.suspendedUntil) > new Date());
};

// helper — sorted pair for participant1/participant2 fields
const sortPair = (a, b) => [a, b].sort();

// ── Start or get buyer-seller chat ──────────────────────────
const startOrGetChat = async (req, res, next) => {
  try {
    const { itemId, itemType } = req.body; // itemType: "advertisement" | "product"
    const buyerId = req.user.id;

    if (!["advertisement", "product"].includes(itemType)) {
      throw new AppError("Invalid item type", 400);
    }

    const Model = itemType === "advertisement" ? advertisementModel : productModel;
    const item = await Model.findById(itemId);
    if (!item) throw new AppError(`${itemType} not found`, 404);
    if (item.status !== "active")
      throw new AppError(`This ${itemType} is not available`, 400);

    const sellerId = item.seller.toString();

    const seller = await userModel.findById(sellerId).select("moderation");
    if (!seller || isUserUnavailable(seller)) {
      throw new AppError("This seller is unavailable", 403);
    }

    const isBlocked = await blockModel.findOne({
      $or: [
        { blocker: buyerId, blocked: sellerId },
        { blocker: sellerId, blocked: buyerId },
      ],
    });
    if (isBlocked) throw new AppError("You cannot chat with this user", 403);

    const [participant1, participant2] = sortPair(buyerId, sellerId);

    let chat = await chatModel.findOne({
      participant1,
      participant2,
      item: itemId,
      itemType,
    });

    if (!chat) {
      try {
        chat = await chatModel.create({
          participants: [participant1, participant2],
          participant1,
          participant2,
          type: "buyer-seller",
          item: itemId,
          itemType,
        });
      } catch (err) {
        // race condition — dusri request ne isi waqt chat bana diya, dobara fetch karo
        if (err.code === 11000) {
          chat = await chatModel.findOne({
            participant1,
            participant2,
            item: itemId,
            itemType,
          });
          if (!chat) throw err;
        } else {
          throw err;
        }
      }
    } else if (chat.deletedFor.includes(buyerId)) {
      chat.deletedFor = chat.deletedFor.filter(
        (id) => id.toString() !== buyerId,
      );
      await chat.save();
    }

    const populatedChat = await chatModel
      .findById(chat._id)
      .populate("item", "title price adsImages images status seller")
      .populate("participants", "username userImage role");

    res.status(200).json({ success: true, chat: populatedChat });
  } catch (error) {
    next(error);
  }
};

// ── Start or get support chat (user/seller → admin) ─────────
const startSupportChat = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { adminId } = req.body; // optional — frontend can request a specific admin

    let admin;
    if (adminId) {
      admin = await userModel.findOne({ _id: adminId, role: "admin" });
      if (!admin) throw new AppError("Admin not found", 404);
    } else {
      admin = await userModel.findOne({ role: "admin" }); // fallback to first available admin
      if (!admin) throw new AppError("No admin is available right now", 503);
    }

    const adminIdStr = admin._id.toString();
    if (adminIdStr === userId)
      throw new AppError(
        "You are the admin, you cannot start a support chat with yourself",
        400,
      );

    const [participant1, participant2] = sortPair(userId, adminIdStr);

    let chat = await chatModel.findOne({
      participant1,
      participant2,
      type: "support",
      item: null,
    });

    if (!chat) {
      try {
        chat = await chatModel.create({
          participants: [participant1, participant2],
          participant1,
          participant2,
          type: "support",
          item: null,
          itemType: null,
        });
      } catch (err) {
        if (err.code === 11000) {
          chat = await chatModel.findOne({
            participant1,
            participant2,
            type: "support",
            item: null,
          });
          if (!chat) throw err;
        } else {
          throw err;
        }
      }
    } else if (chat.deletedFor.includes(userId)) {
      chat.deletedFor = chat.deletedFor.filter(
        (id) => id.toString() !== userId,
      );
      await chat.save();
    }

    const populatedChat = await chatModel
      .findById(chat._id)
      .populate("participants", "username userImage role");

    res.status(200).json({ success: true, chat: populatedChat });
  } catch (error) {
    next(error);
  }
};

// ── Get all chats of logged-in user ─────────────────────────
const getMyChats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const chats = await chatModel
      .find({ participants: userId, deletedFor: { $ne: userId } })
      .populate("item", "title price adsImages productImages images status seller")
      .populate("participants", "username userImage role moderation")
      .populate("lastMessage", "text image createdAt sender")
      .sort({ lastMessageAt: -1 });

    const result = chats.map((chat) => {
      const obj = chat.toObject();
      const other = obj.participants.find((p) => p._id.toString() !== userId);

      obj.otherUserUnavailable =
        chat.type === "buyer-seller" && isUserUnavailable(other);

      // moderation data (reason waghera) frontend ko leak na ho
      obj.participants = obj.participants.map(({ moderation, ...rest }) => rest);
      return obj;
    });

    res.status(200).json({ success: true, chats: result });
  } catch (error) {
    next(error);
  }
};

// ── Get messages of a chat (paginated) ──────────────────────
const getChatMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;

    const chat = await chatModel.findById(chatId);
    if (!chat) throw new AppError("Chat not found", 404);
    if (!chat.participants.some((id) => id.toString() === userId)) {
      throw new AppError("You do not have access to this chat", 403);
    }

    const clearedAt = chat.clearedAt.get(userId);
    const filter = {
      chat: chatId,
      deletedFor: { $ne: userId },
      ...(clearedAt && { createdAt: { $gt: clearedAt } }),
    };

    const messages = await messageModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({ success: true, messages: messages.reverse(), page });
  } catch (error) {
    next(error);
  }
};

// ── Send message ─────────────────────────────────────────────
const sendMessage = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    let { text } = req.body;
    const senderId = req.user.id;

    text = typeof text === "string" ? text.trim() : text;

    if (!text && !req.file) throw new AppError("Message cannot be empty", 400);

    const chat = await chatModel.findById(chatId).populate("item", "status seller");
    if (!chat) throw new AppError("Chat not found", 404);

    if (!chat.participants.some((id) => id.toString() === senderId)) {
      throw new AppError("You cannot send messages in this chat", 403);
    }

    const receiverId = getOtherParticipant(chat, senderId);

    // sirf buyer-seller chat par check, support chat par nahi
    if (chat.type === "buyer-seller") {
      const receiver = await userModel.findById(receiverId).select("moderation");
      if (!receiver || isUserUnavailable(receiver)) {
        throw new AppError(
          "This user is unavailable, you cannot send messages",
          403,
        );
      }
    }

    if (
      chat.type === "buyer-seller" &&
      (!chat.item || chat.item.status !== "active")
    ) {
      throw new AppError(
        "This item is no longer available, you cannot send messages",
        400,
      );
    }

    const isBlocked = await blockModel.findOne({
      $or: [
        { blocker: senderId, blocked: receiverId },
        { blocker: receiverId, blocked: senderId },
      ],
    });
    if (isBlocked)
      throw new AppError(
        "This user is blocked, you cannot send a message",
        403,
      );

    let image = null;
    if (req.file) {
      const uploadResult = await uploadFile(req.file.buffer, "chat_images");
      image = { url: uploadResult.url, public_id: uploadResult.public_id };
    }

    const message = await messageModel.create({
      chat: chatId,
      sender: senderId,
      text,
      image,
    });

    chat.lastMessage = message._id;
    chat.lastMessageAt = message.createdAt;
    chat.unreadCount.set(
      receiverId,
      (chat.unreadCount.get(receiverId) || 0) + 1,
    );
    if (chat.deletedFor.length) chat.deletedFor = [];

    // Agar sender hi seller hai (item ka owner), to iss chat ke liye AI pause kar do
    const isSenderTheSeller =
      chat.item && chat.item.seller && chat.item.seller.toString() === senderId;

    if (isSenderTheSeller && !chat.aiPaused) {
      chat.aiPaused = true;
    }

    await chat.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId.length) {
      getIO().to(receiverSocketId).emit("newMessage", { chatId, message });
    }

    // Agar sender BUYER hai (seller nahi), AI on hai, aur seller ne is chat ke
    // liye AI explicitly disable nahi kar rakha — to AI reply trigger karo (non-blocking).
    // Ab text YA image dono trigger karte hain (pehle sirf text karta tha) —
    // image-only messages ab Gemini Vision ko bhej kar analyze hoti hain.
    // handleAIReply sirf chatId leta hai: concurrency-safe retry loop ke liye ye
    // khud latest buyer message (text + image dono) DB se fetch karta hai.
    if (
      !isSenderTheSeller &&
      chat.type === "buyer-seller" &&
      (text || image) &&
      !chat.aiPaused &&
      !chat.aiDisabledByUser
    ) {
      aiChatService.handleAIReply(chatId).catch((err) => {
        logger.error(`AI auto-reply failed for chat ${chatId}: ${err.message}`);
      });
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

// ── Edit message ──────────────────────────────────────────────
const editMessage = async (req, res, next) => {
  try {
    const { chatId, messageId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text || !text.trim()) throw new AppError("Message text is required", 400);

    const message = await messageModel.findById(messageId);
    if (!message || message.isDeleted)
      throw new AppError("Message not found", 404);
    if (message.chat.toString() !== chatId)
      throw new AppError("Message does not belong to this chat", 400);
    if (message.sender.toString() !== userId)
      throw new AppError("You can only edit your own message", 403);

    message.text = text.trim();
    message.isEdited = true;
    await message.save();

    const chat = await chatModel.findById(chatId);
    const receiverId = getOtherParticipant(chat, userId);
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId.length) {
      getIO().to(receiverSocketId).emit("messageEdited", { chatId, message });
    }

    res.status(200).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

// ── Delete message (for me / for everyone) ──────────────────
const deleteMessage = async (req, res, next) => {
  try {
    const { chatId, messageId } = req.params;
    const { forEveryone } = req.body;
    const userId = req.user.id;

    const message = await messageModel.findById(messageId);
    if (!message) throw new AppError("Message not found", 404);
    if (message.chat.toString() !== chatId)
      throw new AppError("Message does not belong to this chat", 400);

    if (forEveryone) {
      if (message.sender.toString() !== userId)
        throw new AppError("You cannot delete this message for everyone", 403);

      if (message.image?.public_id) {
        await deleteFile(message.image.public_id);
      }

      message.isDeleted = true;
      message.text = "";
      message.image = null;
      await message.save();

      const chat = await chatModel.findById(chatId);
      const receiverId = getOtherParticipant(chat, userId);
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId.length) {
        getIO()
          .to(receiverSocketId)
          .emit("messageDeleted", { chatId, messageId });
      }
    } else if (!message.deletedFor.includes(userId)) {
      message.deletedFor.push(userId); // "delete for me" — image Cloudinary pe rehti hai, sirf visibility hide hoti hai
      await message.save();
    }

    res.status(200).json({ success: true, message: "Message deleted" });
  } catch (error) {
    next(error);
  }
};

// ── Clear all messages of a chat (for me only) ───────────────
const clearChatMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await chatModel.findById(chatId);
    if (!chat) throw new AppError("Chat not found", 404);
    if (!chat.participants.some((id) => id.toString() === userId)) {
      throw new AppError("You cannot clear this chat", 403);
    }

    chat.clearedAt.set(userId, new Date());
    await chat.save();

    res.status(200).json({ success: true, message: "Chat cleared" });
  } catch (error) {
    next(error);
  }
};

// ── Delete entire chat (for me) ───────────────────────────────
const deleteChat = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await chatModel.findById(chatId);
    if (!chat) throw new AppError("Chat not found", 404);
    if (!chat.participants.some((id) => id.toString() === userId)) {
      throw new AppError("You cannot delete this chat", 403);
    }

    if (!chat.deletedFor.includes(userId)) chat.deletedFor.push(userId);

    if (chat.deletedFor.length === 2) {
      // Note: agar is chat ke against koi report exist karta hai, consider karo
      // ke messages ko hard-delete karne se pehle report record mein context snapshot rakh lo.
      await messageModel.deleteMany({ chat: chatId });
      await chatModel.findByIdAndDelete(chatId);
    } else {
      await chat.save();
    }

    res.status(200).json({ success: true, message: "Chat deleted" });
  } catch (error) {
    next(error);
  }
};

// ── Mark chat as read ───────────────────────────────────────
const markAsRead = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await chatModel.findById(chatId);
    if (!chat) throw new AppError("Chat not found", 404);

    chat.unreadCount.set(userId, 0);
    await chat.save();

    await messageModel.updateMany(
      { chat: chatId, sender: { $ne: userId }, status: { $ne: "read" } },
      { status: "read" },
    );

    const otherUserId = getOtherParticipant(chat, userId);
    const otherSocketId = getReceiverSocketId(otherUserId);
    if (otherSocketId.length) {
      getIO()
        .to(otherSocketId)
        .emit("messagesRead", { chatId, readBy: userId });
    }

    res.status(200).json({ success: true, message: "Chat marked as read" });
  } catch (error) {
    next(error);
  }
};

// ── Get blocked users list ────────────────────────────────────
const getBlockedUsers = async (req, res, next) => {
  try {
    const blocks = await blockModel
      .find({ blocker: req.user.id })
      .populate("blocked", "username userImage role");
    res
      .status(200)
      .json({ success: true, blockedUsers: blocks.map((b) => b.blocked) });
  } catch (error) {
    next(error);
  }
};

// ── Block user (user/seller — can do this) ───
const blockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const blockerId = req.user.id;

    if (userId === blockerId)
      throw new AppError("You cannot block yourself", 400);

    const targetUser = await userModel.findById(userId);
    if (!targetUser) throw new AppError("User not found", 404);
    if (targetUser.role === "admin")
      throw new AppError("You cannot block an admin", 400);

    const existing = await blockModel.findOne({
      blocker: blockerId,
      blocked: userId,
    });
    if (existing) throw new AppError("This user is already blocked", 400);

    await blockModel.create({ blocker: blockerId, blocked: userId });

    res.status(200).json({ success: true, message: "User blocked" });
  } catch (error) {
    next(error);
  }
};

// ── Unblock user ───────────────────────────────────────────
const unblockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const blockerId = req.user.id;

    const block = await blockModel.findOneAndDelete({
      blocker: blockerId,
      blocked: userId,
    });
    if (!block) throw new AppError("This user is not blocked", 404);

    res.status(200).json({ success: true, message: "User unblocked" });
  } catch (error) {
    next(error);
  }
};

// ── Toogle Important Seller user ───────────────────────────────────────────
const toggleImportantSeller = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { sellerId } = req.params;

    const chats = await chatModel.find({
      participants: { $all: [userId, sellerId] },
    });

    if (chats.length === 0) {
      return next(new AppError("No chats found with this seller", 404));
    }

    const alreadyImportant = chats[0].importantBy?.some(
      (id) => id.toString() === userId.toString(),
    );

    const chatIds = chats.map((c) => c._id);

    if (alreadyImportant) {
      await chatModel.updateMany(
        { _id: { $in: chatIds } },
        { $pull: { importantBy: userId } },
      );
    } else {
      await chatModel.updateMany(
        { _id: { $in: chatIds } },
        { $addToSet: { importantBy: userId } },
      );
    }

    return res.status(200).json({ important: !alreadyImportant, sellerId });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startOrGetChat,
  startSupportChat,
  getMyChats,
  getChatMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  clearChatMessages,
  deleteChat,
  markAsRead,
  getBlockedUsers,
  blockUser,
  unblockUser,
  toggleImportantSeller,
};