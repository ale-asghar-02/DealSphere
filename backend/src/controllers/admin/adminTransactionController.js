const transactionModel = require("../../models/transactionModel");

exports.getAllTransactions = async (req, res, next) => {
  try {
    const { type, status, user } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (user) filter.user = user;

    const transactions = await transactionModel
      .find(filter)
      .populate("user", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json({ status: "success", data: transactions });
  } catch (error) {
    next(error);
  }
};