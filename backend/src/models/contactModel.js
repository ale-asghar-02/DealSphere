const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },

    image: {
      url: { type: String, default: null },
      public_id: { type: String, default: null },
    },

    user: { type: mongoose.Schema.Types.ObjectId, ref: "users", default: null },

    status: { type: String, enum: ["pending", "resolved"], default: "pending" },
    isDeleted: { type: Boolean, default: false },

    adminReply: { type: String, default: null },
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "users", default: null },
    repliedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
contactSchema.index({ name: 1 });
contactSchema.index({ email: 1 });
contactSchema.index({ subject: 1 });
contactSchema.index({ status: 1, createdAt: -1 });

const contacts = mongoose.model("contacts", contactSchema);
module.exports = contacts;