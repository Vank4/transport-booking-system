const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discount_value: { type: Number, required: true },
  is_active: { type: Boolean, default: true },
});

const Voucher = mongoose.model("Voucher", voucherSchema);
module.exports = Voucher;
