const config = require("../../configs/config");
const { ai, withRetry } = require("../../configs/aiClient");
const logger = require("../../utils/logger");
const { getToolsForUser } = require("./chatbotTools");
const { executeFunction } = require("./chatbotFunctions");

const MAX_FUNCTION_CALL_LOOPS = 5; // infinite loop se bachne ke liye safety limit

/**
 * System instruction dynamically banti hai based on user logged-in hai ya guest.
 */
function getSystemPrompt(isLoggedIn) {
  return `
You are the official AI assistant for this marketplace website (like OLX - users buy/sell products and advertisements).

RULES:
1. Only answer questions related to this website: products, advertisements, categories, pricing/plans, and (for logged-in users) their account data like balance, transactions, withdrawals, orders, contacts, reports, cart, wishlist, notifications.
2. Always respond in the SAME language the user used in their message (English, Urdu, Roman Urdu, or any other language). Do not switch language on your own.
3. Never invent or guess data. Always use the provided functions/tools to fetch real data before answering. If a function returns no data or an error, tell the user honestly.
4. Never reveal internal IDs, database structure, or technical implementation details to the user.
5. Keep responses concise, friendly, and helpful - like a knowledgeable store assistant, not overly formal.
6. When showing listings, mention key details (title, price, category) and offer to share a link if the user wants.
${
  isLoggedIn
    ? `7. This user IS logged in. You may use private account functions (balance, transactions, withdrawals, orders, contacts, reports, cart, wishlist, notifications) for them.`
    : `7. This user is a GUEST (not logged in). Do NOT attempt to access or discuss personal account data (balance, transactions, withdrawals, orders, contacts, reports, cart, wishlist, notifications). If they ask for such information, politely tell them to log in first.`
}
8. Never ask the user for their user ID or account ID - identity is already known from their session.
9. If a question is completely unrelated to this website (general knowledge, other topics), politely say you can only help with things related to this marketplace.
10. The website also has these pages: Deals, Services, Help Center, DealSphere for Businesses, Design Studio (AI design tool, login required, pricing page is public), Privacy Policy and Terms of Use. You do NOT have their content. If the user asks about them, share the link using the link tools and do not make up details about what they contain.
`.trim();
}

/**
 * DB ki messages[] ko Gemini ke history format mein convert karta hai.
 * DB format: { role: "user"|"model", text, timestamp }
 * Gemini format: { role: "user"|"model", parts: [{ text }] }
 */
function toGeminiHistory(messages = []) {
  return messages.map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));
}

/**
 * Gemini/Google API se aane wale error ko user-friendly, chota message mein convert karta hai.
 * Kabhi bhi raw error.message (jisme JSON, links, quota details waghera hote hain) frontend ko nahi bhejte.
 */
function getFriendlyErrorReply(error) {
  const status = error?.status || error?.code;

  if (status === 429 || status === "RESOURCE_EXHAUSTED") {
    return "I'm getting a lot of requests right now. Please try again in a moment.";
  }

  if (status === 503 || status === "UNAVAILABLE") {
    return "The assistant is temporarily unavailable. Please try again shortly.";
  }

  return "Something went wrong. Please try again.";
}

/**
 * @param {string} userMessage - user ka naya message
 * @param {Array} previousMessages - DB se aayi purani messages (is session ki)
 * @param {string|null} userId - logged-in hai to id, warna null
 * @returns {Promise<{ replyText: string, functionCallsUsed: Array, isError?: boolean }>}
 */
async function getChatbotReply(userMessage, previousMessages, userId) {
  const isLoggedIn = Boolean(userId);
  const tools = getToolsForUser(isLoggedIn);
  const systemInstruction = getSystemPrompt(isLoggedIn);

  const chat = ai.chats.create({
    model: config.GEMINI_MODEL,
    history: toGeminiHistory(previousMessages),
    config: {
      systemInstruction,
      tools,
    },
  });

  const functionCallsUsed = [];

  try {
    let response = await withRetry(() => chat.sendMessage({ message: userMessage }));

    let loopCount = 0;
    while (response.functionCalls && response.functionCalls.length > 0 && loopCount < MAX_FUNCTION_CALL_LOOPS) {
      // Gemini ek saath kai function calls bhej sakta hai - sab ka jawab ek saath wapas bhejna zaroori hai
      const responseParts = [];

      for (const call of response.functionCalls) {
        const functionResult = await executeFunction(call.name, call.args, userId);
        functionCallsUsed.push({ name: call.name, args: call.args });

        responseParts.push({
          functionResponse: {
            name: call.name,
            response: functionResult,
          },
        });
      }

      response = await withRetry(() => chat.sendMessage({ message: responseParts }));

      loopCount++;
    }

    return {
      replyText: response.text || "Sorry, I couldn't process that. Please try again.",
      functionCallsUsed,
    };
  } catch (error) {
    // Raw Gemini/Google API error (quota, network, etc.) kabhi frontend tak nahi jana chahiye.
    logger.error(`Gemini API error in getChatbotReply: ${error?.message || error}`);
    return {
      replyText: getFriendlyErrorReply(error),
      functionCallsUsed,
      isError: true,
    };
  }
}

module.exports = { getChatbotReply };