const userModel = require("../models/userModel");
const advertisementModel = require("../models/advertisementModel");
const announcementModel = require("../models/announcementModel");
const productModel = require("../models/productModel");
const orderModel = require("../models/orderModel");
const cartModel = require("../models/cartModel");
const chatModel = require("../models/chatModel");
const reportModel = require("../models/reportModel");
const contactModel = require('../models/contactModel');
const AppError = require("../utils/AppError");
const { uploadFile, deleteFile } = require("../configs/cloudinary");
const { accountDeletedTemplate, sendEmail } = require('../utils/mailor');

const modelMap = {
  ad: { model: advertisementModel, targetModel: "advertisement" },
  product: { model: productModel, targetModel: "product" },
  seller: { model: userModel, targetModel: "users" },
};

const getActiveAnnouncements = async (req, res, next) => {
  try {
    const userRole = req.user?.accountType || "buyer"; // guest fallback

    const announcements = await announcementModel.find({
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }],
      targetAudience: { $in: ["all", userRole] },
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, announcements });
  } catch (error) {
    next(error);
  }
};

// ── Public - Guest Controllers ─────────────────────────────────────────────
const getSellerProfile = async (req, res, next) => {
  try {
     const { usernameSlug } = req.params;
     const id = usernameSlug.split('-').pop(); 

    const user = await userModel
      .findById(id)
      .select("username userImage address country city address aboutMe accountType phoneNumber gender isAccountVerified createdAt")

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const ads = await advertisementModel
      .find({ seller: user._id, status: "active" })
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .sort({ createdAt: -1 });

    const products = await productModel
      .find({ seller: user._id, status: "active" })
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, user, ads, products });
  } catch (error) {
    next(error);
  }
};


// ── Private - Users Controllers ─────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const userID = req.user.id;
    const user = await userModel.findById(userID).select("-password");

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    res.status(200).json({
      message: "User data fetched successfully",
      user: user,
    });
  } catch (error) {
    next(error);
  }
};

const accountUpdate = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { username, aboutMe, gender, phoneNumber, country, city, address } = req.body;

    const user = await userModel.findById(userId);

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    let userImageUrl, userImageId;
    if (req.file) {
      if (user.userImageId) {
        await deleteFile(user.userImageId);
      }

      const result = await uploadFile(req.file.buffer, "userImages");
      userImageUrl = result.url;
      userImageId = result.public_id;
    }

    const updateData = {
      ...(username && { username }),
      ...(aboutMe && { aboutMe }),
      ...(gender && { gender }),
      ...(phoneNumber && { phoneNumber }),
      ...(country && { country }),
      ...(city && { city }),
      ...(address && { address }),
      ...(userImageUrl && { userImage: userImageUrl, userImageId }),
    };

    const userUpdate = await userModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true },
    );

    res.status(200).json({
      message: "Profile updated successfully",
      user: userUpdate,
    });
  } catch (error) {
    next(error);
  }
};

const accountDelete = async (req, res, next) => {
  try {
    const userID = req.user.id;

    // chal rahe orders (buyer ya seller dono taraf se) hon to delete nahi hoga.
    // Wo stripe orders ignore hote hain jin ki payment hui hi nahi (abandoned checkout).
    const activeOrders = await orderModel.countDocuments({
      $or: [{ user: userID }, { "items.seller": userID }],
      orderStatus: { $in: ["pending", "processing", "shipped"] },
      $nor: [{ paymentMethod: "stripe", paymentStatus: { $ne: "paid" } }],
    });

    if (activeOrders > 0) {
      return next(
        new AppError(
          "You have active orders. Complete or cancel them before deleting your account",
          400
        )
      );
    }

    // user ke saare products aur ads deleted mark karo
    // ($ne deleted: jo pehle se deleted hain, unka deletedBy (jaise "admin") overwrite na ho)
    await Promise.all([
      productModel.updateMany(
        { seller: userID, status: { $ne: "deleted" } },
        { $set: { status: "deleted", deletedBy: "seller" } }
      ),
      advertisementModel.updateMany(
        { seller: userID, status: { $ne: "deleted" } },
        { $set: { status: "deleted", deletedBy: "seller" } }
      ),
      cartModel.deleteOne({ user: userID }),
    ]);

    const user = await userModel.findByIdAndDelete(userID);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // account delete ho chuka hai, email fail ho to bhi success dena chahiye
    try {
      const template = accountDeletedTemplate(user.username);
      await sendEmail(user.email, template);
    } catch (mailError) {
      console.error("Account deleted email failed:", mailError.message);
    }

    res.status(200).json({ success: true, message: "User account deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const createReport = async (req, res, next) => {
  try {
    const { reportType, reason, description } = req.body;

    // ✅ Chat report ka alag flow — ad/product ko target karta hai (chat se hi derive, frontend se nahi — security)
    if (reportType === "chat") {
      const { chatId } = req.body;
      if (!chatId) {
        return next(new AppError("chatId is required to report a chat", 400));
      }

      const chat = await chatModel.findById(chatId);
      if (!chat) {
        return next(new AppError("Chat not found", 404));
      }

      // Verify reporter is actually a participant of this chat
      const isParticipant =
        chat.participant1.toString() === req.user.id ||
        chat.participant2.toString() === req.user.id;
      if (!isParticipant) {
        return next(new AppError("You are not part of this chat", 403));
      }

      // ✅ Sahi field: chat.item + chat.itemType
      // itemType already refPath ke liye correct lowercase model name hai ("advertisement" / "product")
      if (!chat.item || !chat.itemType) {
        return next(new AppError("This chat has no linked ad or product", 400));
      }

      const targetId = chat.item;
      const targetModel = chat.itemType; // "advertisement" ya "product" — lowercase, refPath se match

      const existing = await reportModel.findOne({
        reportedBy: req.user.id,
        targetId,
        reportType: "chat",
        status: "pending",
      });
      if (existing) {
        return next(new AppError("You already reported this. It's under review.", 400));
      }

      const report = await reportModel.create({
        reportedBy: req.user.id,
        reportType: "chat",
        targetId,
        targetModel,
        relatedChat: chatId,
        reason,
        description,
      });

      return res.status(201).json({ success: true, message: "Report submitted", data: report });
    }

    // Existing flow — ad / product / seller
    if (!modelMap[reportType]) {
      return next(new AppError("Invalid report type", 400));
    }

    const { targetId } = req.body;
    const { model, targetModel } = modelMap[reportType];
    const target = await model.findById(targetId);
    if (!target) {
      return next(new AppError("Reported item not found", 404));
    }

    const existing = await reportModel.findOne({
      reportedBy: req.user.id,
      targetId,
      reportType,
      status: "pending",
    });
    if (existing) {
      return next(new AppError("You already reported this. It's under review.", 400));
    }

    const report = await reportModel.create({
      reportedBy: req.user.id,
      reportType,
      targetId,
      targetModel,
      reason,
      description,
    });

    res.status(201).json({ success: true, message: "Report submitted", data: report });
  } catch (error) {
    next(error);
  }
};

const submitContact = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    let image = { url: null, public_id: null };

    if (req.file) {
      const uploaded = await uploadFile(req.file.buffer, "contacts");
      image = { url: uploaded.url, public_id: uploaded.public_id };
    }

    const contact = await contactModel.create({
      name,
      email,
      subject,
      message,
      image,
      user: req.user?.id || null,
    });

    res.status(201).json({
      success: true,
      message: "Your message has been received. We'll get back to you soon.",
      data: contact,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getActiveAnnouncements, getSellerProfile, getMe, accountUpdate, accountDelete, createReport, submitContact };