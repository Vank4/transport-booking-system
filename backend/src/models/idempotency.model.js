const mongoose = require("mongoose");

const idempotencySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    method: { type: String, required: true },
    path: { type: String, required: true },
    requestHash: { type: String, required: true },
    statusCode: { type: Number, required: true },
    responseBody: { type: mongoose.Schema.Types.Mixed, required: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("IdempotencyKey", idempotencySchema);
