const userModel = require("../../models/userModel");
const { DesignPlan, DesignUsage } = require("../../models/designModel");
const {
  PKT_OFFSET_MS,
  RETENTION,
  DEFAULT_PLANS,
} = require("../../configs/designConfig");
const AppError = require("../../utils/AppError");
const logger = require("../../utils/logger");

const DAY_MS = 24 * 60 * 60 * 1000;

/* ------------------------------------------------------------------ */
/* 1. PAKISTAN TIME KE HISAAB SE DIN / MAHINE KI KEYS                 */
/* ------------------------------------------------------------------ */
const getPeriodKeys = (now = new Date()) => {
  const pkt = new Date(now.getTime() + PKT_OFFSET_MS);
  const y = pkt.getUTCFullYear();
  const m = pkt.getUTCMonth();
  const d = pkt.getUTCDate();

  const dayKey = pkt.toISOString().slice(0, 10); // "2026-10-04"
  const monthKey = dayKey.slice(0, 7); // "2026-10"

  // Agla reset (UTC mein, kyunke Pakistan midnight = UTC se 5 ghante pehle)
  const dayResetsAt = new Date(Date.UTC(y, m, d + 1) - PKT_OFFSET_MS);
  const monthResetsAt = new Date(Date.UTC(y, m + 1, 1) - PKT_OFFSET_MS);

  return {
    dayKey,
    monthKey,
    dayResetsAt,
    monthResetsAt,
    dayDocExpiresAt: new Date(dayResetsAt.getTime() + RETENTION.USAGE_DAY_DOCS_TTL_DAYS * DAY_MS),
    monthDocExpiresAt: new Date(monthResetsAt.getTime() + RETENTION.USAGE_MONTH_DOCS_TTL_DAYS * DAY_MS),
  };
};

/* ------------------------------------------------------------------ */
/* 2. USER KA ASAL PLAN (expiry bhi yahin dekhi jati hai)             */
/* ------------------------------------------------------------------ */
const loadPlan = async (name) => {
  // Sirf naam se dhoondte hain (isActive nahi), taake admin plan band kare tab bhi
  // jo user pehle kharid chuka hai uska plan na toote.
  const doc = await DesignPlan.findOne({ name }).lean();
  const base = doc || DEFAULT_PLANS[name] || DEFAULT_PLANS.free;

  return {
    name: base.name,
    dailyLimit: base.dailyLimit ?? null,
    monthlyLimit: base.monthlyLimit ?? null,
    editsPerDesign: base.editsPerDesign ?? 0,
    watermark: base.watermark !== false,
  };
};

const getUserPlan = async (userId) => {
  const user = await userModel.findById(userId).select("designSubscription").lean();
  const sub = user?.designSubscription;

  const isPaidAndActive =
    sub &&
    ["monthly", "yearly"].includes(sub.plan) &&
    sub.status === "active" &&
    sub.expiryDate &&
    new Date(sub.expiryDate) > new Date();

  // Expire ho chuka plan khud free ban jata hai (cron ka intezar nahi)
  const plan = await loadPlan(isPaidAndActive ? sub.plan : "free");
  return { ...plan, expiryDate: isPaidAndActive ? sub.expiryDate : null };
};

/* ------------------------------------------------------------------ */
/* 3. ATOMIC COUNTER                                                  */
/* ------------------------------------------------------------------ */
// Ek hi operation mein "limit se kam hai to +1". Do tab khol kar bypass nahi ho sakta.
// Return: true = ginti barh gayi, false = limit poori ho chuki.
const incrementWithCap = async (userId, scope, key, limit, expiresAt) => {
  const filter = { user: userId, scope, key };
  if (limit != null) filter.count = { $lt: limit };

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const doc = await DesignUsage.findOneAndUpdate(
        filter,
        { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
        { upsert: true, returnDocument: "after" }
      );
      return !!doc;
    } catch (err) {
      if (err?.code !== 11000) throw err;
      // E11000 do surat mein aata hai:
      //  (a) limit poori hai (filter match nahi hua, insert unique index se takraya)
      //  (b) do requests ne ek saath pehla doc banane ki koshish ki
      // Dobara koshish karne par (b) theek ho jata hai, (a) phir false milta hai.
    }
  }
  return false;
};

const decrement = async (userId, scope, key) => {
  await DesignUsage.findOneAndUpdate(
    { user: userId, scope, key, count: { $gt: 0 } },
    { $inc: { count: -1 } }
  );
};

/* ------------------------------------------------------------------ */
/* 4. CONSUME / REFUND                                                */
/* ------------------------------------------------------------------ */
const buildLimitError = (scope, plan, resetsAt) => {
  const limit = scope === "daily" ? plan.dailyLimit : plan.monthlyLimit;
  const message =
    `You have reached your ${scope} limit of ${limit} designs.` +
    (plan.name === "free"
      ? " Upgrade your plan to create more designs."
      : " Please try again after it resets.");

  const err = new AppError(message, 429);
  err.details = {
    code: "DESIGN_LIMIT_REACHED",
    scope,
    limit,
    plan: plan.name,
    resetsAt,
    upgradeRequired: plan.name === "free",
  };
  return err;
};

/**
 * Generation SHURU karne se pehle quota "reserve" karta hai.
 * Fail hone par refund() zaroor chalana hai.
 * Return: reservation object jo session mein save hota hai.
 */
const consume = async (userId) => {
  const plan = await getUserPlan(userId);
  const keys = getPeriodKeys();

  const dailyOk = await incrementWithCap(userId, "day", keys.dayKey, plan.dailyLimit, keys.dayDocExpiresAt);
  if (!dailyOk) throw buildLimitError("daily", plan, keys.dayResetsAt);

  const monthlyOk = await incrementWithCap(userId, "month", keys.monthKey, plan.monthlyLimit, keys.monthDocExpiresAt);
  if (!monthlyOk) {
    await decrement(userId, "day", keys.dayKey); // daily wali ginti wapas
    throw buildLimitError("monthly", plan, keys.monthResetsAt);
  }

  return {
    consumed: true,
    refunded: false,
    plan: plan.name,
    dayKey: keys.dayKey,
    monthKey: keys.monthKey,
  };
};

/** Usi din/mahine ke counter se ginti wapas karta hai jahan consume hui thi. */
const refund = async (userId, reservation) => {
  if (!reservation?.consumed || reservation.refunded) return false;

  try {
    await Promise.all([
      decrement(userId, "day", reservation.dayKey),
      decrement(userId, "month", reservation.monthKey),
    ]);
    return true;
  } catch (err) {
    logger.error(`Design quota refund failed for user ${userId}: ${err.message}`);
    return false;
  }
};

/* ------------------------------------------------------------------ */
/* 5. USAGE SUMMARY (frontend ke badge ke liye)                       */
/* ------------------------------------------------------------------ */
const getUsageSummary = async (userId) => {
  const plan = await getUserPlan(userId);
  const keys = getPeriodKeys();

  const [dayDoc, monthDoc] = await Promise.all([
    DesignUsage.findOne({ user: userId, scope: "day", key: keys.dayKey }).lean(),
    DesignUsage.findOne({ user: userId, scope: "month", key: keys.monthKey }).lean(),
  ]);

  const build = (doc, limit, resetsAt) => {
    const used = doc?.count || 0;
    return {
      used,
      limit, // null = limit nahi
      remaining: limit == null ? null : Math.max(limit - used, 0),
      resetsAt,
    };
  };

  const daily = build(dayDoc, plan.dailyLimit, keys.dayResetsAt);
  const monthly = build(monthDoc, plan.monthlyLimit, keys.monthResetsAt);

  return {
    plan: {
      name: plan.name,
      watermark: plan.watermark,
      editsPerDesign: plan.editsPerDesign,
      expiryDate: plan.expiryDate,
    },
    daily,
    monthly,
    canGenerate: daily.remaining !== 0 && monthly.remaining !== 0,
  };
};

/* ------------------------------------------------------------------ */
/* 6. EDIT LIMIT (har design par, daily/monthly quota se alag)        */
/* ------------------------------------------------------------------ */
const assertEditAllowed = (plan, editsUsed) => {
  if (editsUsed >= plan.editsPerDesign) {
    const err = new AppError(
      `Edit limit reached for this design (${plan.editsPerDesign}).` +
        (plan.name === "free" ? " Upgrade your plan to get more edits." : ""),
      403
    );
    err.details = {
      code: "DESIGN_EDIT_LIMIT_REACHED",
      limit: plan.editsPerDesign,
      plan: plan.name,
      upgradeRequired: plan.name === "free",
    };
    throw err;
  }
};

module.exports = {
  getPeriodKeys,
  getUserPlan,
  consume,
  refund,
  getUsageSummary,
  assertEditAllowed,
};