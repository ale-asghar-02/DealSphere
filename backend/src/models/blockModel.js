const mongoose = require("mongoose");

const blockSchema = new mongoose.Schema(
  {
    blocker: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    blocked: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  },
  { timestamps: true }
);

blockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

const block = mongoose.model("blocks", blockSchema);
module.exports = block;