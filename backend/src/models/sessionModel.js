const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: [true, "User reference is required"],
    },
    refreshTokenHash: {
      type: String,
      required: [true, "Refresh token hash is required"],
    },
    ip: {
      type: String,
      required: [true, "ip is required"],
    },
    userAgent: {
      type: String,
      required: [true, "User agent is required"],
    },
    revoked: {
      type: Boolean,
      default: false,
    },
    expiresAt: { type: Date, default: () => Date.now() + 7*24*60*60*1000, expires: 0 }
  }, { timestamps : true } );

const sessionModel = mongoose.model("sessions", sessionSchema);
module.exports = sessionModel;