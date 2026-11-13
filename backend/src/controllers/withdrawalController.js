const withdrawalModel = require("../models/withdrawalModel");
const walletHelper = require("../utils/walletHelper");
const transactionHelper = require("../utils/transactionHelper");
const AppError = require("../utils/AppError");
const { WITHDRAWAL_COMMISSION_PERCENT } = require("../configs/constants");

const requestWithdrawal = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { amount, payoutMethod, payoutDetails } = req.body;

    if (!amount || amount <= 0) {
      return next(new AppError("Valid amount is required", 400));
    }
    if (!payoutMethod || !payoutDetails?.accountTitle || !payoutDetails?.accountNumber) {
      return next(new AppError("Payout details are required", 400));
    }

    const wallet = await walletHelper.getOrCreateWallet(sellerId);
    if (wallet.balance < amount) {
      return next(new AppError("Insufficient wallet balance", 400));
    }

    const commissionAmount = (amount * WITHDRAWAL_COMMISSION_PERCENT) / 100;
    const netAmount = amount - commissionAmount;

    // balance turant debit karo — taake seller dobara same paisa withdraw na kar sake
    await walletHelper.debitWallet(sellerId, amount);

    const withdrawal = await withdrawalModel.create({
      seller: sellerId,
      amount,
      commissionAmount,
      netAmount,
      payoutMethod,
      payoutDetails,
      status: "pending",
    });

    await transactionHelper.createTransaction({
      user: sellerId,
      type: "withdrawal",
      amount,
      paymentMethod: "wallet",
      relatedRef: withdrawal._id,
      relatedModel: "Withdrawal",
      status: "pending",
      description: `Withdrawal request of ${amount} (net: ${netAmount})`,
    });

    res.status(201).json({
      status: "success",
      message: "Withdrawal request submitted",
      data: withdrawal,
    });
  } catch (error) {
    next(error);
  }
};

const getMyWithdrawals = async (req, res, next) => {
  try {
    const withdrawals = await withdrawalModel
      .find({ seller: req.user.id })
      .sort({ createdAt: -1 });
    res.status(200).json({ status: "success", data: withdrawals });
  } catch (error) {
    next(error);
  }
};

module.exports = { requestWithdrawal, getMyWithdrawals };