const cron = require("node-cron");
const userModel = require("../models/userModel");
const { DesignSession } = require("../models/designModel");
const imageService = require("../services/imageGenerate/designImageService");
const quota = require("../services/imageGenerate/designQuotaService");
const { sendNotification } = require("../socket/notificationSocket");
const { emitDesignUpdate } = require("../socket/designSocket");
const logger = require("../utils/logger");
const { STATUS, IMAGE, RETENTION, SUBSCRIPTION } = require("../configs/designConfig");

const TIMEZONE = { timezone: "Asia/Karachi" };
const DAY_MS = 24 * 60 * 60 * 1000;
const BATCH = 200;
const CLEANUP_BATCH = 50;
const CLEANUP_MAX_PER_RUN = 500;
const PAID_PLANS = ["monthly", "yearly"];
const PRICING_URL = "/design/pricing";

const STUCK_MESSAGE = "The design took too long and was stopped. Please try again.";

// Ek job ek waqt mein ek hi baar chale (pichli abhi khatam na hui ho to naya round chhor do)
const running = new Set();
const guarded = (name, fn) => async () => {
  if (running.has(name)) return;
  running.add(name);
  try {
    await fn();
  } catch (err) {
    logger.error(`Design cron "${name}" failed: ${err.message}`);
  } finally {
    running.delete(name);
  }
};

/* ------------------------------------------------------------------ */
/* 1. PLAN KHATAM HONE SE 3 DIN PEHLE REMINDER                         */
/* ------------------------------------------------------------------ */
const remindExpiringPlans = async () => {
  const now = new Date();
  const soon = new Date(now.getTime() + SUBSCRIPTION.REMINDER_DAYS_BEFORE_EXPIRY * DAY_MS);
  let sent = 0;

  for (;;) {
    const users = await userModel
      .find({
        "designSubscription.plan": { $in: PAID_PLANS },
        "designSubscription.status": "active",
        "designSubscription.expiryDate": { $gt: now, $lte: soon },
        "designSubscription.expiryReminderSent": { $ne: true },
      })
      .select("_id designSubscription")
      .limit(BATCH)
      .lean();
    if (!users.length) break;

    for (const u of users) {
      // Flag atomic tareeqe se lagta hai, isliye do server hon tab bhi reminder ek hi baar jata hai
      const claimed = await userModel.findOneAndUpdate(
        { _id: u._id, "designSubscription.expiryReminderSent": { $ne: true } },
        { $set: { "designSubscription.expiryReminderSent": true } }
      );
      if (!claimed) continue;

      const daysLeft = Math.max(1, Math.ceil((new Date(u.designSubscription.expiryDate) - now) / DAY_MS));
      await sendNotification({
        userId: u._id,
        type: "payment",
        title: "Design Studio plan expiring soon",
        message: `Your ${u.designSubscription.plan} Design Studio plan expires in ${daysLeft} day${daysLeft > 1 ? "s" : ""}. Renew it after it ends to keep creating designs without watermark.`,
        actionUrl: PRICING_URL,
        metadata: { plan: u.designSubscription.plan, status: "expiring", expiryDate: u.designSubscription.expiryDate },
      });
      sent++;
    }

    if (users.length < BATCH) break;
  }

  if (sent) logger.info(`Design cron: ${sent} expiry reminder(s) sent`);
  return sent;
};

/* ------------------------------------------------------------------ */
/* 2. EXPIRE HO CHUKE PLAN FREE PAR                                    */
/*    (quota service expiry khud dekhti hai; ye DB saaf karta hai      */
/*     aur user ko batata hai)                                         */
/* ------------------------------------------------------------------ */
const expirePlans = async () => {
  const now = new Date();
  let expired = 0;

  for (;;) {
    const users = await userModel
      .find({
        "designSubscription.plan": { $in: PAID_PLANS },
        "designSubscription.status": "active",
        "designSubscription.expiryDate": { $lte: now },
      })
      .select("_id designSubscription")
      .limit(BATCH)
      .lean();
    if (!users.length) break;

    for (const u of users) {
      const before = await userModel.findOneAndUpdate(
        {
          _id: u._id,
          "designSubscription.plan": { $in: PAID_PLANS },
          "designSubscription.status": "active",
          "designSubscription.expiryDate": { $lte: now },
        },
        {
          $set: {
            "designSubscription.plan": "free",
            "designSubscription.status": "expired",
            "designSubscription.startDate": null,
            "designSubscription.expiryDate": null,
            "designSubscription.expiryReminderSent": false,
          },
        },
        { returnDocument: "before" }
      );
      if (!before) continue;

      await sendNotification({
        userId: u._id,
        type: "payment",
        title: "Design Studio plan expired",
        message: `Your ${before.designSubscription.plan} Design Studio plan has expired. You are on the free plan now. Renew to remove watermarks and get more designs.`,
        actionUrl: PRICING_URL,
        metadata: { plan: before.designSubscription.plan, status: "expired" },
      });
      expired++;
    }

    if (users.length < BATCH) break;
  }

  if (expired) logger.info(`Design cron: ${expired} plan(s) expired`);
  return expired;
};

/* ------------------------------------------------------------------ */
/* 3. ATKE HUE "GENERATING" SESSIONS (server restart / crash)          */
/* ------------------------------------------------------------------ */
// Generation aur edit dono "generating" status se guzarte hain. Farq invariants se pata chalta hai:
// mukammal edits = versions - generationCount. Agar editsUsed us se zyada hai to ek edit chal raha tha.
const isStuckEdit = (s) => (s.editsUsed || 0) > (s.versions?.length || 0) - (s.generationCount || 0);

const recoverStuckSessions = async () => {
  const cutoff = new Date(Date.now() - IMAGE.STUCK_GENERATING_MINUTES * 60 * 1000);
  const stuck = await DesignSession.find({
    status: STATUS.GENERATING,
    generationStartedAt: { $lt: cutoff },
  })
    .limit(50)
    .lean();

  let recovered = 0;

  for (const s of stuck) {
    const filter = { _id: s._id, status: STATUS.GENERATING, generationStartedAt: { $lt: cutoff } };

    if (isStuckEdit(s)) {
      // Edit wapas milti hai, purana design salamat rehta hai
      const r = await DesignSession.findOneAndUpdate(filter, {
        $set: { status: STATUS.COMPLETED, error: STUCK_MESSAGE },
        $inc: { editsUsed: -1 },
      });
      if (!r) continue;

      emitDesignUpdate(s.user, { sessionId: String(s._id), status: STATUS.COMPLETED, stage: "failed", error: STUCK_MESSAGE });
    } else {
      const r = await DesignSession.findOneAndUpdate(filter, { $set: { status: STATUS.FAILED, error: STUCK_MESSAGE } });
      if (!r) continue;

      // Quota sirf ek baar wapas hota hai
      const claimed = await DesignSession.findOneAndUpdate(
        { _id: s._id, "reservation.consumed": true, "reservation.refunded": false },
        { $set: { "reservation.refunded": true } }
      );
      if (claimed) await quota.refund(s.user, s.reservation);

      emitDesignUpdate(s.user, { sessionId: String(s._id), status: STATUS.FAILED, stage: "failed", error: STUCK_MESSAGE });
      await sendNotification({
        userId: s.user,
        type: "system",
        title: "Design could not be created",
        message: `${STUCK_MESSAGE} Your design credit was not used.`,
        actionUrl: `/design/${s._id}`,
        metadata: { sessionId: String(s._id), status: "failed" },
      });
    }
    recovered++;
  }

  if (recovered) logger.warn(`Design cron: recovered ${recovered} stuck session(s)`);
  return recovered;
};

/* ------------------------------------------------------------------ */
/* 4. 30 DIN PURANE DESIGNS AUR UNKI CLOUDINARY IMAGES DELETE          */
/* ------------------------------------------------------------------ */
const cleanupOldSessions = async () => {
  const cutoff = new Date(Date.now() - RETENTION.SESSION_DAYS * DAY_MS);
  let removed = 0;
  let orphaned = 0;

  while (removed < CLEANUP_MAX_PER_RUN) {
    const old = await DesignSession.find({ createdAt: { $lt: cutoff }, status: { $ne: STATUS.GENERATING } })
      .limit(CLEANUP_BATCH)
      .lean();
    if (!old.length) break;

    for (const s of old) {
      const result = await imageService.deleteSessionAssets(s);
      if (result.failed) orphaned += result.failed;
      await DesignSession.deleteOne({ _id: s._id });
      removed++;
    }
  }

  if (removed) logger.info(`Design cron: ${removed} old session(s) deleted${orphaned ? `, ${orphaned} image(s) could not be removed` : ""}`);
  return removed;
};

/* ------------------------------------------------------------------ */
/* START                                                               */
/* ------------------------------------------------------------------ */
const startDesignSubscriptionCron = () => {
  cron.schedule("*/5 * * * *", guarded("recoverStuckSessions", recoverStuckSessions), TIMEZONE); // har 5 minute
  cron.schedule("5 0 * * *", guarded("expirePlans", expirePlans), TIMEZONE); // roz raat 12:05 (Pakistan time)
  cron.schedule("0 10 * * *", guarded("remindExpiringPlans", remindExpiringPlans), TIMEZONE); // roz subah 10:00
  cron.schedule("30 3 * * *", guarded("cleanupOldSessions", cleanupOldSessions), TIMEZONE); // roz raat 3:30
};

module.exports = startDesignSubscriptionCron;
module.exports.jobs = { remindExpiringPlans, expirePlans, recoverStuckSessions, cleanupOldSessions };