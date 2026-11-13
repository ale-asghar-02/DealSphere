const DAY_MS = 24 * 60 * 60 * 1000;
const LISTING_DURATION_DAYS = 30;

// from se 30 din baad ki date
const getExpiryDate = (from = new Date()) =>
  new Date(from.getTime() + LISTING_DURATION_DAYS * DAY_MS);

// Cron / query ke liye: kaun se docs expire hone chahiye
// (sirf active, aur date null na ho)
const expiredFilter = (now = new Date()) => ({
  status: "active",
  expiresAt: { $ne: null, $lte: now },
});

/**
 * Mongoose plugin (sirf .save() par chalta hai):
 * - naya doc active nahi hai -> expiresAt null
 * - status active hua aur expiresAt khali/purani hai -> naya 30 din
 * - status active/soldout ke ilawa kuch bhi hua -> expiresAt null
 * - soldout par date ko chhedna nahi (stock wapas aane par wohi chalegi)
 *
 * Note: Mongoose 8/9 mein sync hook ko next() nahi milta, is liye
 * function sirf return karta hai.
 */
const expiryPlugin = (schema) => {
  schema.pre("save", function () {
    if (this.isNew && this.status !== "active") {
      this.expiresAt = null;
      return;
    }

    if (!this.isModified("status")) return;

    if (this.status === "active") {
      const now = new Date();
      if (!this.expiresAt || this.expiresAt <= now) {
        this.expiresAt = getExpiryDate(now);
      }
    } else if (this.status !== "soldout") {
      this.expiresAt = null;
    }
  });
};

module.exports = {
  LISTING_DURATION_DAYS,
  getExpiryDate,
  expiredFilter,
  expiryPlugin,
};