const notificationModel = require("../models/notificationModel");
const AppError = require("../utils/AppError");
const { getIO } = require("../socket/chatSocket");

getAllNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await notificationModel
      .find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await notificationModel.countDocuments({ user: req.user.id });

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      notifications: notifications,
    });
  } catch (error) {
    next(error);
  }
};

getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationModel.countDocuments({
      user: req.user.id,
      isRead: false,
    });

    res.status(200).json({ success: true, unreadCount: count });
  } catch (error) {
    next(error);
  }
};

markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await notificationModel.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) return next(new AppError("Notification not found", 404));

    // ✅ real-time emit — pehle missing tha
    const io = getIO();
    io.to(`user_${req.user.id}`).emit("notificationRead", { id: notification._id });

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

markAllAsRead = async (req, res, next) => {
  try {
    await notificationModel.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true }
    );

    // ✅ real-time emit — pehle missing tha
    const io = getIO();
    io.to(`user_${req.user.id}`).emit("allNotificationsRead");

    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
};

deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await notificationModel.findOneAndDelete({
      _id: id,
      user: req.user.id,
    });

    if (!notification) return next(new AppError("Notification not found", 404));

    // ✅ real-time emit — pehle missing tha
    const io = getIO();
    io.to(`user_${req.user.id}`).emit("notificationDeleted", { id });

    res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (error) {
    next(error);
  }
};

deleteSelectedNotifications = async (req, res, next) => {
  try {
    const { ids } = req.body; // array of notification ids expected

    if (!Array.isArray(ids) || ids.length === 0) {
      return next(new AppError("No notification ids provided", 400));
    }

    const result = await notificationModel.deleteMany({
      _id: { $in: ids },
      user: req.user.id,
    });

    const io = getIO();
    io.to(`user_${req.user.id}`).emit("notificationsBulkDeleted", { ids });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} notification(s) deleted`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};

deleteAllNotifications = async (req, res, next) => {
  try {
    await notificationModel.deleteMany({ user: req.user.id });

    // ✅ real-time emit — pehle missing tha
    const io = getIO();
    io.to(`user_${req.user.id}`).emit("allNotificationsDeleted");

    res.status(200).json({ success: true, message: "All notifications deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteSelectedNotifications,
  deleteAllNotifications,
};