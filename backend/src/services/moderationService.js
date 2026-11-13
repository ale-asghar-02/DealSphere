const axios = require("axios");
const mongoose = require("mongoose");
const config = require("../configs/config");
const { generate } = require("../configs/aiClient");
const Advertisement = require("../models/advertisementModel");
const Product = require("../models/productModel");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");
const { getIO, getReceiverSocketId } = require("../socket/chatSocket");
const { getExpiryDate } = require("../utils/expiryHelper");

const MAX_IMAGES_TO_CHECK = 12;

// Score thresholds (0-100) — yahan se strictness control karo
const ACTIVE_MIN_SCORE = 70; // is se upar -> active
const REVIEW_MIN_SCORE = 40; // 40-69 -> admin review, 40 se neeche -> reject

// Agar new/low-trust seller ko bhi seedha active karna ho to false kar do
const REVIEW_NEW_SELLERS = true;

const SERVICE_KEYWORDS = [
  "service", "website", "web development", "software", "design",
  "freelance", "course", "job", "digital", "marketing", "app development",
];

const isServiceListing = (categoryName = "", subCategoryName = "") => {
  const text = `${categoryName} ${subCategoryName}`.toLowerCase();
  return SERVICE_KEYWORDS.some((k) => text.includes(k));
};

/* ------------------------------------------------------------------ */
/* 1. SELLER HISTORY CHECK                                            */
/* ------------------------------------------------------------------ */
const getSellerHistory = async (sellerId, excludeItemId) => {
  const match = { seller: new mongoose.Types.ObjectId(sellerId) };
  // Current item ko count mat karo, warna "new" seller kabhi "new" nahi hota
  if (excludeItemId) {
    match._id = { $ne: new mongoose.Types.ObjectId(excludeItemId) };
  }

  const [adStats, productStats] = await Promise.all([
    Advertisement.aggregate([
      { $match: match },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Product.aggregate([
      { $match: match },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const counts = {};
  [...adStats, ...productStats].forEach(({ _id, count }) => {
    counts[_id] = (counts[_id] || 0) + count;
  });

  const totalPosts = Object.values(counts).reduce((sum, c) => sum + c, 0);
  const approvedCount =
    (counts.active || 0) + (counts.sold || 0) + (counts.soldout || 0);
  const rejectedCount = counts.rejected || 0;
  const deletedCount = counts.deleted || 0;
  const pendingCount = counts.pending || 0;

  const rejectionRate = totalPosts > 0 ? rejectedCount / totalPosts : 0;

  let trustLevel = "new";
  if (totalPosts === 0) {
    trustLevel = "new";
  } else if (rejectionRate > 0.5) {
    trustLevel = "low";
  } else if (rejectionRate < 0.2 && totalPosts > 5) {
    trustLevel = "trusted";
  } else {
    trustLevel = "medium";
  }

  return {
    totalPosts,
    approvedCount,
    rejectedCount,
    deletedCount,
    pendingCount,
    rejectionRate: +rejectionRate.toFixed(2),
    trustLevel, // "new" | "low" | "medium" | "trusted"
  };
};

/* ------------------------------------------------------------------ */
/* 2. CLOUDINARY IMAGE -> BASE64                                      */
/* ------------------------------------------------------------------ */
const imageUrlToBase64 = async (url) => {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  const base64 = Buffer.from(response.data).toString("base64");
  const mimeType = response.headers["content-type"] || "image/jpeg";
  return { base64, mimeType };
};

// Ek image fail ho to baaki chalti rahein
const loadImages = async (urls) => {
  const results = await Promise.allSettled(urls.map(imageUrlToBase64));
  const images = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") images.push(r.value);
    else logger.error(`Image download failed (${urls[i]}): ${r.reason?.message}`);
  });
  return images;
};

/* ------------------------------------------------------------------ */
/* 3. PROMPT                                                          */
/* ------------------------------------------------------------------ */
const buildModerationPrompt = ({
  title,
  description,
  categoryName,
  subCategoryName,
  price,
  condition,
  sellerHistory,
}) => {
  const isService = isServiceListing(categoryName, subCategoryName);

  return `
You are a content moderation AI for an online marketplace (like OLX).
Analyze the listing (text + attached images) and score it.

SELLER TRUST CONTEXT:
- Trust level: ${sellerHistory.trustLevel}
- Total posts so far: ${sellerHistory.totalPosts}
- Rejected before: ${sellerHistory.rejectedCount}
- Deleted before: ${sellerHistory.deletedCount}

LISTING DETAILS:
- Title: ${title}
- Description: ${description}
- Category: ${categoryName}${subCategoryName ? " > " + subCategoryName : ""}
- Price: ${price}
- Condition: ${condition || (isService ? "Not applicable (service/digital)" : "N/A")}

${
  isService
    ? `IMPORTANT: THIS IS A SERVICE / DIGITAL LISTING.
- Images are NOT product photos. Posters, banners, logos, portfolio screenshots,
  mockups, graphic designs and illustrative/stock images are fully acceptable.
- Do NOT give a low imageMatchScore just because the image is a designed poster.
- Lower the score only if the image is clearly unrelated or misleading
  (e.g. a car photo for a web development service).
`
    : ""
}
SCORING:
- textMatchScore (0-100): how well title, description and category agree with each other.
- imageMatchScore (0-100): how well the images fit the title/description/category.
  Some relevant clue in the image means a medium score (40-69), not zero.

SEVERITY (content safety):
- "none": nothing wrong.
- "minor": small doubts (slightly misleading, low quality, unclear).
- "major": clearly policy-violating (obvious misleading/fake listing, spam, prohibited-but-not-extreme items).
- "critical": nudity/sexual content, obscene content, illegal items (weapons, drugs), or an obvious scam.

Respond with ONLY valid JSON (no markdown, no code fences, no commentary), in EXACTLY this shape:
{
  "severity": "none" | "minor" | "major" | "critical",
  "textMatchScore": number,
  "imageMatchScore": number,
  "flaggedIssues": string[],
  "suggestions": string[]
}
`.trim();
};

/* ------------------------------------------------------------------ */
/* 4. GEMINI CALL                                                     */
/* ------------------------------------------------------------------ */
const callGeminiModeration = async (prompt, images) => {
  const imageParts = images.map((img) => ({
    inlineData: { mimeType: img.mimeType, data: img.base64 },
  }));

  const response = await generate({
    model: config.GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }, ...imageParts],
      },
    ],
  });

  let text = (response.text || "").trim();
  text = text.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new AppError("AI moderation returned an invalid response", 500);
  }
};

/* ------------------------------------------------------------------ */
/* 5. FINAL DECISION (score + severity based)                         */
/* ------------------------------------------------------------------ */
const clampScore = (n) => {
  const num = Number(n);
  if (Number.isNaN(num)) return 50; // samajh na aye to admin ke liye
  return Math.max(0, Math.min(100, num));
};

const decideFinalStatus = (sellerHistory, aiResult) => {
  const severity = aiResult.severity || "minor";
  const textScore = clampScore(aiResult.textMatchScore);
  const imageScore = clampScore(aiResult.imageMatchScore);
  const score = Math.min(textScore, imageScore);
  const issues = aiResult.flaggedIssues || [];
  const suggestions = aiResult.suggestions || [];
  const issuesText = issues.length ? issues.join(", ") : "";

  // 1) Bilkul kharab -> delete
  if (severity === "critical") {
    return {
      status: "deleted",
      reason: issuesText || "Content severely violates marketplace policy",
      suggestions: [],
    };
  }

  // 2) Zyada kharab -> reject
  if (severity === "major" || score < REVIEW_MIN_SCORE) {
    return {
      status: "rejected",
      reason: issuesText || "Listing does not meet marketplace standards",
      suggestions,
    };
  }

  // 3) Thora bohat clue / doubt -> admin review
  if (severity === "minor" || score < ACTIVE_MIN_SCORE) {
    return {
      status: "pending",
      reason: issuesText || "Needs manual admin review",
      suggestions,
    };
  }

  // 4) Sab theek, lekin new/low-trust seller -> admin review
  if (
    REVIEW_NEW_SELLERS &&
    (sellerHistory.trustLevel === "new" || sellerHistory.trustLevel === "low")
  ) {
    return {
      status: "pending",
      reason: "Passed AI check — awaiting admin review (new/low-trust seller)",
      suggestions,
    };
  }

  // 5) Ziada sahi -> active
  return {
    status: "active",
    reason: "Auto-approved by AI moderation",
    suggestions: [],
  };
};

/* ------------------------------------------------------------------ */
/* 6. SELLER NOTIFY (socket)                                          */
/* ------------------------------------------------------------------ */
const notifySellerViaSocket = (sellerId, payload) => {
  try {
    const io = getIO();
    const socketIds = getReceiverSocketId(sellerId.toString());

    if (socketIds.length === 0) return;

    socketIds.forEach((socketId) => {
      io.to(socketId).emit("moderationUpdate", payload);
    });
  } catch (err) {
    logger.error(`Socket notify failed for seller ${sellerId}: ${err.message}`);
  }
};

/* ------------------------------------------------------------------ */
/* 7. MAIN ORCHESTRATOR                                               */
/* ------------------------------------------------------------------ */
const moderateContent = async (type, itemId) => {
  if (!["ad", "product"].includes(type)) {
    throw new AppError("Invalid moderation type, must be 'ad' or 'product'", 400);
  }

  const Model = type === "ad" ? Advertisement : Product;
  const imagesField = type === "ad" ? "adsImages" : "productImages";

  const item = await Model.findById(itemId).populate("category subCategory");
  if (!item) throw new AppError("Item not found for moderation", 404);

  const sellerHistory = await getSellerHistory(item.seller, item._id);

  const prompt = buildModerationPrompt({
    title: item.title,
    description: item.description,
    categoryName: item.category?.name || "N/A",
    subCategoryName: item.subCategory?.name || "",
    price: item.price,
    condition: item.condition,
    sellerHistory,
  });

  const imageUrls = (item[imagesField] || [])
    .slice(0, MAX_IMAGES_TO_CHECK)
    .map((img) => img.url);

  const images = await loadImages(imageUrls);

  let decision;
  let aiResult = null;

  if (images.length === 0) {
    // Koi image load nahi hui -> AI check nahi ho sakta, admin dekhe
    decision = {
      status: "pending",
      reason: "Images could not be analyzed — awaiting admin review",
      suggestions: [],
    };
  } else {
    aiResult = await callGeminiModeration(prompt, images);
    decision = decideFinalStatus(sellerHistory, aiResult);
  }

  item.status = decision.status;
  item.moderationReason = decision.reason;
  item.moderationSuggestions = decision.suggestions;
  
  if (decision.status === "active") {
    // purani date baqi hai to wohi rahegi (edit par reset nahi), warna naya month
    if (!item.expiresAt || item.expiresAt <= new Date()) {
      item.expiresAt = getExpiryDate();
    }
  } else if (decision.status !== "pending") {
    // rejected / deleted par timer khatam. pending par chhedna nahi
    item.expiresAt = null;
  }

  item.deletedBy = decision.status === "deleted" ? "admin" : null;
  await item.save();

  notifySellerViaSocket(item.seller, {
    type,
    itemId: item._id,
    status: decision.status,
    reason: decision.reason,
    suggestions: decision.suggestions,
  });

  return { item, sellerHistory, aiResult, decision };
};

module.exports = { moderateContent, getSellerHistory, notifySellerViaSocket };