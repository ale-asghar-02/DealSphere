const { getIO } = require("./chatSocket");
const logger = require("../utils/logger");

/**
 * Design Studio ke live events. Alag Socket.io server nahi banta, wahi maujooda server use hota hai
 * (chatSocket se getIO), aur event user ke personal room "user_<userId>" mein jata hai
 * (jahan aap ki newNotification bhi jati hai).
 *
 * Event: "designUpdate"
 * payload: { sessionId, status, step?, stage?, message?, version?, error? }
 *   stage: "creating" | "saving" | "editing" | "completed" | "failed"
 */
const emitDesignUpdate = (userId, payload) => {
  try {
    getIO().to(`user_${userId}`).emit("designUpdate", payload);
  } catch (err) {
    // Socket na chale to bhi design ka kaam nahi rukna chahiye
    logger.warn(`designUpdate emit failed for user ${userId}: ${err.message}`);
  }
};

module.exports = { emitDesignUpdate };