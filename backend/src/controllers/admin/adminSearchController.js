const mongoose = require("mongoose");
const AppError = require("../../utils/AppError");

const userModel = require("../../models/userModel");
const advertisementModel = require("../../models/advertisementModel");
const productModel = require("../../models/productModel");
const transactionModel = require("../../models/transactionModel");
const withdrawalRequestModel = require("../../models/withdrawalModel");
const reportModel = require("../../models/reportModel");
const contactSupportModel = require("../../models/contactModel");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
 
// Regex mein special characters (., *, +, ?, etc.) ko escape karna zaroori hai,
// warna user agar aise characters type kare to crash ya unexpected match ho sakta hai.
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
 
/**
 * Har category ka apna config:
 * - model: konsa mongoose model query hoga
 * - fields: model k apne direct fields jo regex se match honge
 * - lookup (optional): agar user-related field (username/email) doosre collection mein hai,
 *   to $lookup + $unwind karke us field ko bhi match kiya jayega
 *
 * NOTE: field names apne actual schema k mutabiq adjust kar lein.
 */
const searchConfig = {
  users: {
    model: userModel,
    fields: ["username", "email"],
  },
  ads: {
    model: advertisementModel,
    fields: ["title", "adCode"],
  },
  products: {
    model: productModel,
    fields: ["title", "productCode"],
  },
  transactions: {
    model: transactionModel,
    fields: ["stripeSessionId"],
    lookup: {
      from: "users",
      localField: "user",
      foreignField: "_id",
      as: "user",
      fields: ["user.username", "user.email"],
    },
  },
  withdrawals: {
    model: withdrawalRequestModel,
    fields: ["payoutDetails.accountNumber", "payoutDetails.accountTitle"],
    lookup: {
      from: "users",
      localField: "seller", // withdrawal schema mein field ka naam "seller" hai
      foreignField: "_id",
      as: "seller",
      fields: ["seller.username", "seller.email"],
    },
  },
  reports: {
    model: reportModel,
    fields: ["description"], // "reason" ek fixed enum hai, free-text regex k liye sahi nahi
    lookup: {
      from: "users",
      localField: "reportedBy",
      foreignField: "_id",
      as: "reporter",
      fields: ["reporter.username", "reporter.email"],
    },
  },
  support: {
    model: contactSupportModel,
    fields: ["name", "email", "subject"], // apne actual field names lagayein
  },
};
 
// GET /admin/search?type=users&q=ali
const adminSearch = async (req, res, next) => {
  try {
    const { type, q } = req.query;
 
    if (!type || !searchConfig[type]) {
      return next(
        new AppError(
          `Invalid search type. Must be one of: ${Object.keys(searchConfig).join(", ")}`,
          400
        )
      );
    }
 
    if (!q || !q.trim()) {
      return res.status(200).json({ success: true, data: [], total: 0 });
    }
 
    const config = searchConfig[type];
    const query = q.trim();
    const regex = new RegExp(escapeRegex(query), "i"); // case-insensitive
 
    const orConditions = config.fields.map((field) => ({ [field]: regex }));
 
    // Agar query ek valid MongoDB ObjectId hai, to _id se bhi exact match try karo
    if (isValidObjectId(query)) {
      orConditions.push({ _id: new mongoose.Types.ObjectId(query) });
    }
 
    const pipeline = [];
 
    if (config.lookup) {
      pipeline.push({
        $lookup: {
          from: config.lookup.from,
          localField: config.lookup.localField,
          foreignField: config.lookup.foreignField,
          as: config.lookup.as,
        },
      });
      pipeline.push({
        $unwind: { path: `$${config.lookup.as}`, preserveNullAndEmptyArrays: true },
      });
 
      const lookupOrConditions = config.lookup.fields.map((field) => ({ [field]: regex }));
      orConditions.push(...lookupOrConditions);
    }
 
    pipeline.push({ $match: { $or: orConditions } });
    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $limit: 50 }); // safety cap — bohot zyada results ek sath na aayein
 
    const results = await config.model.aggregate(pipeline);
 
    res.status(200).json({
      success: true,
      data: results,
      total: results.length,
    });
  } catch (error) {
    next(error);
  }
};
 
module.exports = { adminSearch };