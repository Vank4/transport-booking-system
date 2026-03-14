const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  booking_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  method: {
    type: String,
    enum: ["VNPAY", "MOMO", "PAYPAL", "MOCK"],
    required: true,
  },
  transaction_id: {
    type: String,
    unique: true,
    sparse: true // Cho phép null tạm thời khi VNPay chưa trả về mã giao dịch
  },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["PENDING", "SUCCESS", "FAILED"],
    default: "PENDING",
  },
  gateway_response: {
    type: Object, // KAN-224: Lưu vết toàn bộ dữ liệu VNPay/MoMo trả về để rà soát
  },
  paid_at: { type: Date, required: false },
}, { timestamps: true });

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;
