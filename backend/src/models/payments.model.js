const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  booking_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  method: { type: String, required: true },
  transaction_id: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
    default: "PENDING",
  },
  paid_at: { type: Date, required: false },
});

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;
