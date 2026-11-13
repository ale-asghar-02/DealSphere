const mongoose = require("mongoose");

const warningSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    warnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    relatedReport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "reports",
      default: null,
    },
  },
  { timestamps: true }
);

const warning = mongoose.model("warnings", warningSchema);
module.exports = warning