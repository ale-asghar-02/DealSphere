const walletHelper = require("../utils/walletHelper");
const transactionModel = require("../models/transactionModel");

const getMyWallet = async (req, res, next) => {
  try {
    const wallet = await walletHelper.getOrCreateWallet(req.user.id);
    res.status(200).json({ status: "success", data: wallet });
  } catch (error) {
    next(error);
  }
};

const getMyTransactions = async (req, res, next) => {
  try {
    const { type, status } = req.query;
    const filter = { user: req.user.id };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const transactions = await transactionModel.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ status: "success", data: transactions });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyWallet, getMyTransactions };