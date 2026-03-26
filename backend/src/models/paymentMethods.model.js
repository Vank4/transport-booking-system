const mongoose = require("mongoose");

const paymentMethodSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  card_type: {
    type: String,
    enum: ["Visa", "Mastercard", "JCB"],
    required: true,
  },
  bank_name: { type: String, required: true },
  card_holder: { type: String, required: true },
  last4: { type: String, required: true },
  expiry: { type: String, required: true },
  is_default: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

paymentMethodSchema.index({ user_id: 1, created_at: -1 });

const PaymentMethod = mongoose.model("PaymentMethod", paymentMethodSchema);
module.exports = PaymentMethod;
