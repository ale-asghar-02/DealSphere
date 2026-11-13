const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    image: { type: String },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    items: [orderItemSchema],

    shippingAddress: {
      fullName: { type: String, required: true },
      phoneNumber: { type: String, required: true },
      country: { type: String, required: true },
      city: { type: String, required: true },
      addressLine: { type: String, required: true },
      postalCode: { type: String },
    },

    paymentMethod: {
      type: String,
      enum: ["cod", "stripe"],
      default: "cod",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    // stripe checkout session tracking k liye
    stripeSessionId: {
      type: String,
      default: null,
    },

    stripePaymentIntentId: {
      type: String,
      default: null,
    },

    orderStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },

    itemsPrice: {
      type: Number,
      required: true,
    },

    shippingPrice: {
      type: Number,
      default: 0,
    },

    totalPrice: {
      type: Number,
      required: true,
    },

    placedFrom: {
      type: String,
      enum: ["cart", "buyNow"],
      default: "cart",
    },

    cancelReason: { type: String },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    
    deletedByUser: {
      type: Boolean,
      default: false,
    },
    deletedBySeller: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// helper method - total calculate karne k liye
orderSchema.methods.calculateTotal = function () {
  this.itemsPrice = this.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  this.totalPrice = this.itemsPrice + (this.shippingPrice || 0);
};

const order = mongoose.model("order", orderSchema);
module.exports = order;
