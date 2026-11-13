const cron = require("node-cron");
const userModel = require("../models/userModel");
const SubscriptionPlanModel = require("../models/subscriptionPlanModel");
const advertisementModel = require("../models/advertisementModel");
const productModel = require("../models/productModel");

const { sendNotification } = require("../socket/notificationSocket");

const DAY_MS = 24 * 60 * 60 * 1000;
const REMINDER_DAYS = 7; // first reminder window; stages are 7, 3 and 1 days
const TIMEZONE = "Asia/Karachi";

const planLabel = (plan) => (plan === "yearly" ? "Yearly" : "Monthly");

// ─────────────────────────────────────────────
// 1) Downgrade expired subscriptions (daily, midnight)
// ─────────────────────────────────────────────
const expireSubscriptions = async () => {
  const now = new Date();

  const filter = {
    "subscription.status": "active",
    "subscription.plan": { $in: ["monthly", "yearly"] },
    "subscription.expiryDate": { $lt: now },
  };

  const expiredUsers = await userModel.find(filter).select("_id subscription.plan");
  if (expiredUsers.length === 0) return;

  const ids = expiredUsers.map((u) => u._id);

  // Subscription-granted featuring must end together with the subscription
  const [adsResult, productsResult] = await Promise.all([
    advertisementModel.updateMany(
      { seller: { $in: ids }, featuredPlan: "subscription" },
      { $set: { isFeatured: false, featuredPlan: null, featuredUntil: null } }
    ),
    productModel.updateMany(
      { seller: { $in: ids }, "featured.plan": "subscription" },
      {
        $set: {
          "featured.isFeatured": false,
          "featured.plan": null,
          "featured.until": null,
        },
      }
    ),
  ]);

  const result = await userModel.updateMany(
    { ...filter, _id: { $in: ids } },
    {
      $set: {
        "subscription.plan": "free",
        "subscription.status": "expired",
        "subscription.startDate": null,
        "subscription.expiryDate": null,
        "subscription.lastReminderDays": null,
      },
    }
  );

  console.log(
    `Subscription cron: downgraded ${result.modifiedCount} seller(s), un-featured ${adsResult.modifiedCount} ad(s) and ${productsResult.modifiedCount} product(s)`
  );

  const freePlan = await SubscriptionPlanModel.findOne({ name: "free" });

  for (const user of expiredUsers) {
    try {
      const limitsText = freePlan
        ? ` Free plan limits now apply (${freePlan.maxAds} ads and ${freePlan.maxProducts} products). Your existing listings stay as they are, but you cannot add new ones while you are over the limit.`
        : " Free plan limits now apply.";

      await sendNotification({
        userId: user._id,
        type: "payment",
        title: "Subscription Expired",
        message: `Your ${planLabel(user.subscription.plan)} subscription has expired and your account has been moved to the Free plan.${limitsText} Renew anytime to get your benefits back.`,
        actionUrl: "/dashboard/subscription",
        metadata: { plan: user.subscription.plan, status: "expired" },
      });
    } catch (err) {
      console.error(`Expiry notification failed for user ${user._id}:`, err.message);
    }
  }
};

// ─────────────────────────────────────────────
// 2) Expiry reminders at 7, 3 and 1 day(s) left (daily, 10:00)
// ─────────────────────────────────────────────
const sendExpiryReminders = async () => {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMINDER_DAYS * DAY_MS);

  const users = await userModel
    .find({
      "subscription.status": "active",
      "subscription.plan": { $in: ["monthly", "yearly"] },
      "subscription.expiryDate": { $gt: now, $lte: windowEnd },
    })
    .select("subscription");

  let sent = 0;

  for (const user of users) {
    const sub = user.subscription;
    const daysLeft = Math.ceil((new Date(sub.expiryDate).getTime() - now.getTime()) / DAY_MS);
    const stage = daysLeft <= 1 ? 1 : daysLeft <= 3 ? 3 : 7;

    // Already sent this stage (or a more urgent one)
    if (sub.lastReminderDays != null && sub.lastReminderDays <= stage) continue;

    // Atomically claim this stage so a reminder is never sent twice
    const claim = await userModel.updateOne(
      {
        _id: user._id,
        "subscription.expiryDate": sub.expiryDate,
        $or: [
          { "subscription.lastReminderDays": null },
          { "subscription.lastReminderDays": { $gt: stage } },
        ],
      },
      { $set: { "subscription.lastReminderDays": stage } }
    );
    if (claim.modifiedCount !== 1) continue;

    const when =
      stage === 1
        ? "in less than 24 hours"
        : `in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`;

    try {
      await sendNotification({
        userId: user._id,
        type: "payment",
        title: stage === 1 ? "Subscription Expires Tomorrow" : "Subscription Expiring Soon",
        message: `Your ${planLabel(sub.plan)} subscription expires ${when} (${new Date(sub.expiryDate).toDateString()}). Renew now to keep your listing limits and featured listings. Renewing adds the new period on top of your remaining days.`,
        actionUrl: "/dashboard/subscription",
        metadata: {
          plan: sub.plan,
          status: "expiring",
          daysLeft,
          expiryDate: sub.expiryDate,
        },
      });
      sent += 1;
    } catch (err) {
      console.error(`Reminder notification failed for user ${user._id}:`, err.message);
    }
  }

  if (sent > 0) console.log(`Reminder cron: sent ${sent} expiry reminder(s)`);
};

// ─────────────────────────────────────────────
// 3) Clear expired discounts (every minute)
// ─────────────────────────────────────────────
const clearExpiredDiscounts = async () => {
  const result = await SubscriptionPlanModel.updateMany(
    { discountPercentage: { $gt: 0 }, discountValidUntil: { $lte: new Date() } },
    { $set: { discountPercentage: 0, discountValidUntil: null } }
  );

  if (result.modifiedCount > 0) {
    console.log(`Discount cron: cleared ${result.modifiedCount} expired discount(s)`);
  }
};

const startSubscriptionExpiryCron = () => {
  cron.schedule(
    "0 0 * * *",
    async () => {
      try {
        await expireSubscriptions();
      } catch (error) {
        console.error("Subscription expiry cron failed:", error.message);
      }
    },
    { timezone: TIMEZONE }
  );

  cron.schedule(
    "0 10 * * *",
    async () => {
      try {
        await sendExpiryReminders();
      } catch (error) {
        console.error("Subscription reminder cron failed:", error.message);
      }
    },
    { timezone: TIMEZONE }
  );

  cron.schedule("* * * * *", async () => {
    try {
      await clearExpiredDiscounts();
    } catch (error) {
      console.error("Discount expiry cron failed:", error.message);
    }
  });
};

module.exports = startSubscriptionExpiryCron;