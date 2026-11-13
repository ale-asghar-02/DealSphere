const crypto = require("crypto");
const ChatbotConversation = require("../../models/chatbotConversationModel");
const { getChatbotReply } = require("../../services/chatbot/chatbotService");
const AppError = require("../../utils/AppError");

const WELCOME_TEXT = "Hello! I am your AI assistant. How can I help you?";
const MAX_MESSAGE_LENGTH = 500;
const HISTORY_FOR_AI = 20; // Gemini ko sirf aakhri 20 messages
const MAX_STORED_MESSAGES = 100; // DB mein array bara na ho
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const welcomeMessage = () => ({ role: "model", text: WELCOME_TEXT, timestamp: new Date() });

/**
 * Sirf wahi conversation return hoti hai jo is requester ki ho.
 * - sessionId string + UUID format hona chahiye (NoSQL injection band)
 * - user-owned conversation guest ya kisi aur user ko nahi milti
 * - guest conversation login ke baad user se link ho jati hai
 */
const findOwnedConversation = async (sessionId, userId) => {
  if (typeof sessionId !== "string" || !UUID_RE.test(sessionId)) return null;

  const conversation = await ChatbotConversation.findOne({ sessionId });
  if (!conversation) return null;

  if (conversation.userId) {
    if (!userId || conversation.userId.toString() !== userId.toString()) return null;
  } else if (userId) {
    await ChatbotConversation.updateOne(
      { _id: conversation._id, userId: null },
      { $set: { userId } },
    );
  }
  return conversation;
};

// sessionId hamesha server generate karta hai, client ka diya hua kabhi nahi
const createConversation = (userId) =>
  ChatbotConversation.create({
    sessionId: crypto.randomUUID(),
    userId: userId || null,
    messages: [welcomeMessage()],
    lastActivityAt: new Date(),
  });

/**
 * POST /ai/chatbot/session
 * body: { sessionId? }
 * Chat widget open hote hi frontend ye call karega.
 * - Valid + apni sessionId ho to purani messages wapas
 * - Warna naya session, welcome message ke sath
 */
async function startSession(req, res, next) {
  try {
    const userId = req.user?.id || null;

    const existing = await findOwnedConversation(req.body?.sessionId, userId);
    if (existing) {
      return res.json({
        sessionId: existing.sessionId,
        messages: existing.messages,
        isNew: false,
      });
    }

    const conversation = await createConversation(userId);
    return res.json({
      sessionId: conversation.sessionId,
      messages: conversation.messages,
      isNew: true,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /ai/chatbot/message
 * body: { sessionId, message }
 */
async function sendMessage(req, res, next) {
  try {
    const { sessionId, message } = req.body || {};
    const userId = req.user?.id || null;

    if (typeof message !== "string" || !message.trim()) {
      return next(new AppError("Message is required.", 400));
    }
    const cleanMessage = message.trim();
    if (cleanMessage.length > MAX_MESSAGE_LENGTH) {
      return next(new AppError(`Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`, 400));
    }

    let conversation = await findOwnedConversation(sessionId, userId);
    if (!conversation) conversation = await createConversation(userId);

    const previousMessages = conversation.messages.slice(-HISTORY_FOR_AI);

    const { replyText, isError } = await getChatbotReply(cleanMessage, previousMessages, userId);

    // Error wala reply DB history mein save nahi hota (warna aglay requests mein bhi jata rahega)
    if (isError) {
      return res.status(503).json({
        success: false,
        sessionId: conversation.sessionId,
        message: replyText,
      });
    }

    const now = new Date();
    // Atomic push: do requests ek saath aayein to bhi VersionError / lost message nahi
    await ChatbotConversation.updateOne(
      { _id: conversation._id },
      {
        $push: {
          messages: {
            $each: [
              { role: "user", text: cleanMessage, timestamp: now },
              { role: "model", text: replyText, timestamp: new Date() },
            ],
            $slice: -MAX_STORED_MESSAGES,
          },
        },
        $set: { lastActivityAt: now }, // TTL yahin se refresh hoti hai
      },
    );

    return res.json({
      sessionId: conversation.sessionId,
      reply: replyText,
      timestamp: new Date(),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { startSession, sendMessage };