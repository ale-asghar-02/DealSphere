const crypto = require("crypto");
const mongoose = require("mongoose");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");
const { hashToken, cookieOptions } = require("../utils/generateToken");
const { generateOtp, sendEmail, deleteAccountOtpTemplate, accountDeletedTemplate } = require("../utils/mailor");

const userModel = require("../models/userModel");
const orderModel = require("../models/orderModel");
const productModel = require("../models/productModel");
const advertisementModel = require("../models/advertisementModel");
const cartModel = require("../models/cartModel");
const walletModel = require("../models/walletModel");
const sessionModel = require("../models/sessionModel");
const withdrawModel = require("../models/withdrawalModel");
const wishlistModel = require("../models/wishlistModel");

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const safeEqual = (a, b) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

// Delete rokne wali wajah ho to message return karta hai, warna null
const getDeleteBlocker = async (userID, session = null) => {
  const withSession = (q) => (session ? q.session(session) : q);

  const activeOrders = await withSession(
    orderModel.countDocuments({
      $or: [{ user: userID }, { "items.seller": userID }],
      orderStatus: { $in: ["pending", "processing", "shipped"] },
      // abandoned stripe checkout ignore
      $nor: [{ paymentMethod: "stripe", paymentStatus: { $ne: "paid" } }],
    }),
  );
  if (activeOrders > 0) {
    return "You have active orders. Complete or cancel them before deleting your account";
  }

  const wallet = await withSession(
    walletModel.findOne({ seller: userID }).select("balance"),
  );
  if (wallet && wallet.balance > 0) {
    return "Please withdraw your wallet balance before deleting your account";
  }

  const pendingWithdrawals = await withSession(
    withdrawModel.countDocuments({ seller: userID, status: "pending" }), // <- field/status match karein
  );
  if (pendingWithdrawals > 0) {
    return "You have a pending withdrawal request. Wait until it is processed";
  }

  return null;
};

// ── Step 1: OTP bhejo ─────────────────────────────────────────────
const sendDeleteOtp = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user || user.deletion?.isDeleted) {
      return next(new AppError("User not found", 404));
    }

    const blocker = await getDeleteBlocker(user._id);
    if (blocker) return next(new AppError(blocker, 400));

    const expireAt = user.deletion?.otpExpireAt;
    if (expireAt) {
      const elapsed = Date.now() - (expireAt - OTP_EXPIRY_MS);
      if (elapsed < OTP_RESEND_COOLDOWN_MS) {
        const waitSeconds = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
        return next(
          new AppError(`Please wait ${waitSeconds}s before requesting another OTP`, 429),
        );
      }
    }

    const otp = generateOtp();
    await userModel.updateOne(
      { _id: user._id },
      {
        $set: {
          "deletion.otp": hashToken(otp),
          "deletion.otpExpireAt": Date.now() + OTP_EXPIRY_MS,
          "deletion.otpAttempts": 0,
        },
      },
    );

    await sendEmail(user.email, deleteAccountOtpTemplate(user.username, otp));

    return res
      .status(200)
      .json({ success: true, message: "Confirmation OTP sent to your email" });
  } catch (error) {
    next(error);
  }
};

// ── Step 2: OTP verify karke account delete ─────────────────────────────────────────────
const confirmAccountDelete = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const userID = req.user.id;
    const { otp } = req.body;
    if (!otp) return next(new AppError("OTP is required", 400));

    // Attempts pehle atomically barhao, taake parallel requests se limit bypass na ho
    const user = await userModel.findOneAndUpdate(
      {
        _id: userID,
        "deletion.isDeleted": { $ne: true },
        $or: [
          { "deletion.otpAttempts": { $lt: MAX_OTP_ATTEMPTS } },
          { "deletion.otpAttempts": { $exists: false } },
        ],
      },
      { $inc: { "deletion.otpAttempts": 1 } },
      { new: true },
    );
    if (!user) {
      return next(
        new AppError("Too many attempts or invalid request. Please request a new OTP", 429),
      );
    }

    if (!user.deletion?.otp || user.deletion.otpExpireAt < Date.now()) {
      return next(new AppError("OTP has expired, please request a new one", 400));
    }
    if (!safeEqual(user.deletion.otp, hashToken(String(otp)))) {
      return next(new AppError("Invalid OTP", 400));
    }

    const { email, username } = user; // mail bhejne ke liye original name copy

    await session.withTransaction(async () => {
      // Dobara check: OTP bhejne ke baad koi naya order aa sakta hai
      const blocker = await getDeleteBlocker(userID, session);
      if (blocker) throw new AppError(blocker, 400);

      await productModel.updateMany(
        { seller: userID, status: { $ne: "deleted" } },
        { $set: { status: "deleted", deletedBy: "seller" } },
        { session },
      );
      await advertisementModel.updateMany(
        { seller: userID, status: { $ne: "deleted" } },
        { $set: { status: "deleted", deletedBy: "seller" } },
        { session },
      );
      await cartModel.deleteOne({ user: userID }, { session });
      await wishlistModel.deleteMany({ user: userID }, { session }); // <- field match karein
      await sessionModel.deleteMany({ user: userID }, { session });

      await userModel.updateOne(
        { _id: userID },
        {
          $set: {
            username: "Anonymous",
            verifyOtp: "",
            verifyOtpExpireAt: 0,
            resetOtp: "",
            resetOtpExpireAt: 0,
            "aiAssistant.enabled": false,
            deletion: {
              isDeleted: true,
              deletedAt: new Date(),
              otp: "",
              otpExpireAt: 0,
              otpAttempts: 0,
            },
          },
          $unset: {
            password: 1,
            googleId: 1,
            userImage: 1,
            aboutMe: 1,
            gender: 1,
            phoneNumber: 1,
            country: 1,
            city: 1,
            address: 1,
          },
        },
        { session },
      );
    });

    res.clearCookie("refreshToken", cookieOptions());

    try {
      await sendEmail(email, accountDeletedTemplate(username));
    } catch (mailError) {
      logger.error(
        `[email:account-deleted] FAILED to send to ${email}: ${mailError.message}`,
      );
    }

    return res
      .status(200)
      .json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
};

module.exports = { sendDeleteOtp, confirmAccountDelete };