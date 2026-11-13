const transactionModel = require("../models/transactionModel");

const createTransaction = async ({
  user,
  type,
  amount,
  paymentMethod,
  relatedRef,
  relatedModel,
  status = "pending",
  stripeSessionId,
  description,
}) => {
  const transaction = await transactionModel.create({
    user,
    type,
    amount,
    paymentMethod,
    relatedRef,
    relatedModel,
    status,
    stripeSessionId,
    description,
  });
  return transaction;
};

module.exports = { createTransaction }