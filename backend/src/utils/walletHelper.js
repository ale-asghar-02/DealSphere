const walletModel = require("../models/walletModel");
const AppError = require("../utils/AppError");

const getOrCreateWallet = async (sellerId) => {
  let wallet = await walletModel.findOne({ seller: sellerId });
  if (!wallet) {
    wallet = await walletModel.create({ seller: sellerId });
  }
  return wallet;
};

const creditWallet = async (sellerId, amount) => {
  // upsert + $inc atomic hai, agar wallet exist nahi karti to bana bhi deta hai
  const wallet = await walletModel.findOneAndUpdate(
    { seller: sellerId },
    { $inc: { balance: amount, totalEarned: amount } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return wallet;
};

const debitWallet = async (sellerId, amount) => {
  const wallet = await walletModel.findOneAndUpdate(
    { seller: sellerId, balance: { $gte: amount } },
    { $inc: { balance: -amount, totalWithdrawn: amount } },
    { new: true }
  );

  if (!wallet) {
    // ya to wallet exist nahi karti ya balance kam hai - dono cases isi error se cover
    throw new AppError("Insufficient wallet balance", 400);
  }

  return wallet;
};

module.exports = { getOrCreateWallet, creditWallet, debitWallet };