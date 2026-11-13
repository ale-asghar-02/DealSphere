const mongoose = require('mongoose');

const featureOrderSchema = new mongoose.Schema(
  {
    itemType: { type: String, enum: ['advertisement', 'product'], required: true },
    item: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'itemType' },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    plan: { type: String, enum: ['normal', 'basic', 'premium'], required: true },
    duration: { type: Number, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'pkr' },
    stripeSessionId: { type: String },
    stripePaymentIntentId: { type: String },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'cancelled'],
      default: 'pending',
    },
    featuredFrom: { type: Date },
    featuredUntil: { type: Date },
  },
  { timestamps: true }
);

const featureOrder = mongoose.model('featureOrder', featureOrderSchema);
module.exports = featureOrder;