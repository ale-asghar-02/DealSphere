const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "chats",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    text: { type: String, trim: true },
    image: {
      url: { type: String, default: null },
      public_id: { type: String, default: null },
    },

    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
    isAIReply: { type: Boolean, default: false },
    needsSellerAttention: { type: Boolean, default: false },
  },
  { timestamps: true },
);

messageSchema.index({ chat: 1, createdAt: -1 });

const messages = mongoose.model("messages", messageSchema);
module.exports = messages;