const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "model"],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    // Agar is message ke through koi function call hua tha, uska record (optional, debugging/analytics ke liye)
    functionCall: {
      name: { type: String },
      args: { type: mongoose.Schema.Types.Mixed },
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const chatbotConversationSchema = new mongoose.Schema({
  // Guest aur logged-in user dono ke liye unique session identifier.
  // Frontend generate karke bhejega (jaisay uuid), backend sirf store/track karega.
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  // Agar logged-in user hai to link hoga, guest ke liye null rahega.
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    default: null,
  },

  messages: {
    type: [messageSchema],
    default: [],
  },

  // Har naye message pe update hogi. TTL index isi field pe lagega.
  lastActivityAt: {
    type: Date,
    default: Date.now,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// TTL Index: lastActivityAt ke 2 ghante (7200 seconds) baad document auto-delete ho jayega.
// MongoDB background process har ~60s mein expired documents check/delete karta hai.
chatbotConversationSchema.index({ lastActivityAt: 1 }, { expireAfterSeconds: 7200 });

const chatbotConversation = mongoose.model("chatbotConversation", chatbotConversationSchema);
module.exports = chatbotConversation;