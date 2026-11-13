const withdrawalModel = require("../../models/withdrawalModel");
const transactionModel = require("../../models/transactionModel");
const walletHelper = require("../../utils/walletHelper");

const getAllWithdrawals = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const withdrawals = await withdrawalModel
      .find(filter)
      .populate("seller", "username email")
      .sort({ createdAt: -1 });
    res.status(200).json({ status: "success", data: withdrawals });
  } catch (error) {
    next(error);
  }
};

// admin ne manually bank/jazzcash/easypaisa se paisa bhej diya
const completeWithdrawal = async (req, res, next) => {
  try {
    const { withdrawalId } = req.params;
    const adminId = req.user.id;

    const withdrawal = await withdrawalModel.findById(withdrawalId);
    if (!withdrawal) return next(new AppError("Withdrawal not found", 404));
    if (withdrawal.status !== "pending") {
      return next(new AppError(`Cannot complete a ${withdrawal.status} withdrawal`, 400));
    }

    withdrawal.status = "completed";
    withdrawal.processedBy = adminId;
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    await transactionModel.findOneAndUpdate(
      { relatedRef: withdrawal._id, relatedModel: "Withdrawal" },
      { status: "completed" }
    );

    res.status(200).json({ status: "success", message: "Withdrawal marked completed", data: withdrawal });
  } catch (error) {
    next(error);
  }
};

const rejectWithdrawal = async (req, res, next) => {
  try {
    const { withdrawalId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    if (!reason) return next(new AppError("Rejection reason is required", 400));

    const withdrawal = await withdrawalModel.findById(withdrawalId);
    if (!withdrawal) return next(new AppError("Withdrawal not found", 404));
    if (withdrawal.status !== "pending") {
      return next(new AppError(`Cannot reject a ${withdrawal.status} withdrawal`, 400));
    }

    withdrawal.status = "rejected";
    withdrawal.rejectionReason = reason;
    withdrawal.processedBy = adminId;
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    // paisa wapas wallet me daal do — reject hua to seller ka haq wapas
    await walletHelper.creditWallet(withdrawal.seller, withdrawal.amount);

    await transactionModel.findOneAndUpdate(
      { relatedRef: withdrawal._id, relatedModel: "Withdrawal" },
      { status: "failed" }
    );

    res.status(200).json({ status: "success", message: "Withdrawal rejected", data: withdrawal });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllWithdrawals, completeWithdrawal, rejectWithdrawal };