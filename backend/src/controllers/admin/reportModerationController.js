const reportModel = require("../../models/reportModel");
const warningModel = require("../../models/warningModel");
const userModel = require("../../models/userModel");
const advertisementModel = require("../../models/advertisementModel");
const productModel = require("../../models/productModel");
const chatModel = require("../../models/chatModel");
const messageModel = require("../../models/messagesModel");
const AppError = require("../../utils/AppError");
const { sendNotification } = require("../../socket/notificationSocket");
const { banTemplate, suspendTemplate, sendEmail } = require('../../utils/mailor');
const { calculateSuspendUntil, hideSellerListings } = require('../../utils/moderationHelper');

const modelMap = {
  ad: { model: advertisementModel, targetModel: "Advertisement" },
  product: { model: productModel, targetModel: "Product" },
  seller: { model: userModel, targetModel: "User" },
};

// "seller" aur "chat" dono ka final target hamesha ek "User" hota hai
const USER_TARGET_TYPES = ["seller", "chat"];

// Report se asli reported user ki ID nikalta hai.
// - seller report : targetId hi user ki ID hai
// - chat report   : targetId product ki ID ho sakti hai, is liye chat ke
//                   dono participants mein se wo user jo reporter nahi hai
// - ad/product    : listing ka seller
const resolveReportedUserId = async (report) => {
  if (report.reportType === "seller") return report.targetId;

  if (report.reportType === "chat") {
    if (report.targetModel === "users") return report.targetId;
    if (!report.relatedChat) return null;

    const chat = await chatModel
      .findById(report.relatedChat)
      .select("participant1 participant2");
    if (!chat) return null;

    const reporterId = String(report.reportedBy);
    return String(chat.participant1) === reporterId
      ? chat.participant2
      : chat.participant1;
  }

  const { model } = modelMap[report.reportType];
  const doc = await model.findById(report.targetId).select("seller");
  return doc ? doc.seller : null;
};

const getTargetDetails = async (report, userId) => {
  if (USER_TARGET_TYPES.includes(report.reportType)) {
    const user = await userModel
      .findById(userId)
      .select("username email userImage");
    return user
      ? { username: user.username, email: user.email, userImage: user.userImage }
      : { username: "Unknown user" };
  }

  const { model } = modelMap[report.reportType];
  const doc = await model
    .findById(report.targetId)
    .select("title price adsImages productImages");

  if (!doc) return { title: "Unknown listing" };

  const image =
    (doc.adsImages && doc.adsImages[0]?.url) ||
    (doc.productImages && doc.productImages[0]?.url) ||
    null;

  return { title: doc.title, price: doc.price, image };
};

const applyModerationAction = async ({ userId, action, reason, duration, adminId }) => {
  const user = await userModel.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  if (user.role === "admin") {
    throw new AppError(`Admins cannot be ${action === "ban" ? "banned" : "suspended"}`, 400);
  }

  const suspendedUntil = action === "suspend" ? calculateSuspendUntil(duration) : null;

  user.moderation.isBanned = action === "ban";
  user.moderation.reason = reason;
  user.moderation.bannedAt = action === "ban" ? new Date() : null;
  user.moderation.bannedBy = adminId;
  user.moderation.suspendedUntil = suspendedUntil;
  user.moderation.suspendedDuration = action === "suspend" ? duration : null;
  await user.save();

  if (user.accountType === "seller") {
    await hideSellerListings(user._id);
  }

  await sendEmail(
    user.email,
    action === "ban"
      ? banTemplate(user.username, reason)
      : suspendTemplate(user.username, reason, suspendedUntil)
  );

  return { user, suspendedUntil };
};

const getAllReports = async (req, res, next) => {
  try {
    const reports = await reportModel
      .find()
      .populate("reportedBy", "username email userImage")
      .populate("reviewedBy", "username email userImage")
      .sort({ createdAt: -1 });

    const total = await reportModel.countDocuments();
    res.status(200).json({ success: true, data: reports, total });
  } catch (error) {
    next(error);
  }
};

const getReportDetails = async (req, res, next) => {
  try {
    const report = await reportModel
      .findById(req.params.id)
      .populate("reportedBy", "username email userImage")
      .populate("reviewedBy", "username email userImage");

    if (!report) return next(new AppError("Report not found", 404));

    let target = null;
    let chatEvidence = null;

    if (USER_TARGET_TYPES.includes(report.reportType)) {
      const reportedUserId = await resolveReportedUserId(report);
      if (reportedUserId) {
        target = await userModel
          .findById(reportedUserId)
          .select("username email userImage");
      }
    } else {
      const { model } = modelMap[report.reportType];
      target = await model.findById(report.targetId);
    }

    // Chat report hai to admin ko last 50 messages evidence ke tor par bhejo
    if (report.reportType === "chat" && report.relatedChat) {
      const chat = await chatModel
        .findById(report.relatedChat)
        .populate("participant1", "username userImage")
        .populate("participant2", "username userImage");

      const messages = await messageModel
        .find({ chat: report.relatedChat })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("sender", "username userImage");

      chatEvidence = { chat, messages: messages.reverse() };
    }

    res.status(200).json({ success: true, data: { report, target, chatEvidence } });
  } catch (error) {
    next(error);
  }
};

const reviewReport = async (req, res, next) => {
  try {
    const { action, reason, duration } = req.body;
    const report = await reportModel.findById(req.params.id);
    if (!report) return next(new AppError("Report not found", 404));
    if (report.status !== "pending") {
      return next(new AppError("This report is already reviewed", 400));
    }

    if (!["dismiss", "warn", "remove", "suspend", "ban"].includes(action)) {
      return next(new AppError("Invalid action", 400));
    }

    if (action === "dismiss") {
      report.status = "dismissed";
      report.actionTaken = "none";
    } else {
      // Asli reported user nikalo (seller / chat / ad / product sab ke liye)
      const sellerId = await resolveReportedUserId(report);
      if (!sellerId) {
        return next(new AppError("Reported user or listing no longer exists", 404));
      }

      const targetDetails = await getTargetDetails(report, sellerId);

      switch (action) {
        case "warn": {
          await warningModel.create({
            user: sellerId,
            reason,
            warnedBy: req.user.id,
            relatedReport: report._id,
          });
          await userModel.findByIdAndUpdate(sellerId, { $inc: { warningCount: 1 } });

          await sendNotification({
            userId: sellerId,
            type: "warning",
            title: "You received a warning",
            message: reason,
            metadata: { action: "warn", reportId: report._id, reportType: report.reportType, targetId: report.targetId, ...targetDetails },
          });

          report.status = "resolved";
          report.actionTaken = "warn";
          break;
        }

        case "remove": {
          if (USER_TARGET_TYPES.includes(report.reportType)) {
            return next(new AppError("Cannot 'remove' a user, use warn/suspend/ban", 400));
          }
          const { model } = modelMap[report.reportType];
          await model.findByIdAndUpdate(report.targetId, { status: "deleted", deletedBy: "admin" });

          await sendNotification({
            userId: sellerId,
            type: "report",
            title: "Your listing was removed",
            message: reason,
            metadata: { action: "remove", reportId: report._id, reportType: report.reportType, targetId: report.targetId, ...targetDetails },
          });

          report.status = "resolved";
          report.actionTaken = "remove";
          break;
        }

        case "suspend":
        case "ban": {
          if (action === "suspend" && !duration) {
            return next(new AppError("Duration is required for suspend", 400));
          }

          await applyModerationAction({ userId: sellerId, action, reason, duration, adminId: req.user.id });

          // Notification sirf yahan bheji jati hai (helper ke andar se hata di gayi hai)
          await sendNotification({
            userId: sellerId,
            type: "report",
            title: action === "ban" ? "Account Banned" : "Account Suspended",
            message: reason,
            metadata: { action, reportId: report._id, reportType: report.reportType, targetId: report.targetId, ...targetDetails },
          });

          report.status = "resolved";
          report.actionTaken = action;
          break;
        }
      }
    }

    report.adminReason = reason;
    report.suspensionDuration = action === "suspend" ? duration : null;

    report.reviewedBy = req.user.id;
    report.reviewedAt = new Date();
    await report.save();

    res.status(200).json({ success: true, message: "Report reviewed", data: report });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllReports, getReportDetails, reviewReport };