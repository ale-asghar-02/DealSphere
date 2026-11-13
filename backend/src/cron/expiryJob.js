const cron = require("node-cron");
const advertisementModel = require("../models/advertisementModel");
const productModel = require("../models/productModel");
const logger = require("../utils/logger");
const { expiredFilter } = require("../utils/expiryHelper");

const expireListings = async () => {
  const now = new Date();

  // updateMany use ho raha hai, to plugin nahi chalta.
  // expiresAt jaan bujh kar rakhi hai taake pata rahe kab expire hua.
  const [ads, products] = await Promise.all([
    advertisementModel.updateMany(expiredFilter(now), { $set: { status: "expired" } }),
    productModel.updateMany(expiredFilter(now), { $set: { status: "expired" } }),
  ]);

  if (ads.modifiedCount || products.modifiedCount) {
    logger.info(
      `Expiry job: ${ads.modifiedCount} ads, ${products.modifiedCount} products expired`
    );
  }
};

const startExpiryJob = () => {
  // har minute chalta hai
  cron.schedule("* * * * *", () => {
    expireListings().catch((err) =>
      logger.error(`Expiry job failed: ${err.message}`)
    );
  });
  logger.info("Expiry job started");
};

module.exports = { startExpiryJob, expireListings };