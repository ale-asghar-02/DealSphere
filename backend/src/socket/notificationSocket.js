const { getIO } = require("./chatSocket");
const notificationModel = require("../models/notificationModel");

/**
 * Creates a notification in DB and emits it in real-time
 * to the target user's personal room (user_<userId>),
 * which is auto-joined inside chatSocket.js on connection.
 */
const sendNotification = async ({ userId, type, title, message, actionUrl = null, metadata = {} }) => {
  try {
    const notification = await notificationModel.create({
      user: userId,
      type,
      title,
      message,
      actionUrl,
      metadata,
    });

    const io = getIO();
    io.to(`user_${userId}`).emit("newNotification", notification);

    return notification;
  } catch (error) {
    console.error("sendNotification error:", error.message);
  }
};

module.exports = { sendNotification };