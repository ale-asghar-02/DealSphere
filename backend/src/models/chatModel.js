const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
      validate: (val) => val.length === 2,
      required: true,
    },

    // participant1/participant2 = same 2 ids as "participants", always sorted.
    // Sirf isliye rakhe hain taake unique index reliable ho — array field pe
    // unique index MULTIKEY ban jata hai aur galat tareeqe se duplicates block/allow karta hai.
    participant1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    participant2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    type: {
      type: String,
      enum: ["buyer-seller", "support"],
      default: "buyer-seller",
    },

    // "advertisement" ya "product" — support chat ke liye null
    itemType: {
      type: String,
      enum: ["advertisement", "product", null],
      default: null,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "itemType",
      default: null,
    },

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "messages",
      default: null,
    },
    lastMessageAt: { type: Date, default: Date.now },

    importantBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
    unreadCount: { type: Map, of: Number, default: {} },
    clearedAt: { type: Map, of: Date, default: {} },
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],

    aiPaused: { type: Boolean, default: false },
    aiDisabledByUser: { type: Boolean, default: false },
    aiProcessing: { type: Boolean, default: false },
    aiPending: { type: Boolean, default: false },
    lastAIReplyAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Reliable compound unique index — item null hone par bhi (support chats) sahi kaam karega,
// kyunki ab ye scalar fields pe hai, array pe nahi.
chatSchema.index(
  { participant1: 1, participant2: 1, item: 1 },
  { unique: true },
);

const chat = mongoose.model("chats", chatSchema);
module.exports = chat;