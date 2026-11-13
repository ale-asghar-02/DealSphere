const advertisementModel = require('../models/advertisementModel');
const productModel = require('../models/productModel');

const DURATION_MONTHS = { '1m': 1, '3m': 3, '6m': 6, '1y': 12 };

const calculateSuspendUntil = (duration) => {
  const months = DURATION_MONTHS[duration];
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date;
};

const hideSellerListings = async (sellerId) => {
  await advertisementModel.updateMany(
    { seller: sellerId, moderationHidden: { $ne: true } },
    { $set: { moderationHidden: true } }
  );
  await productModel.updateMany(
    { seller: sellerId, moderationHidden: { $ne: true } },
    { $set: { moderationHidden: true } }
  );
};

const restoreSellerListings = async (sellerId) => {
  await advertisementModel.updateMany(
    { seller: sellerId, moderationHidden: true },
    { $set: { moderationHidden: false } }
  );
  await productModel.updateMany(
    { seller: sellerId, moderationHidden: true },
    { $set: { moderationHidden: false } }
  );
};

module.exports = { calculateSuspendUntil, hideSellerListings, restoreSellerListings, DURATION_MONTHS };