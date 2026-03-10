const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false, default: null }, // Mở cho khách vãng lai
  booking_code: { type: String, required: true, unique: true },
  booking_type: { type: String, enum: ["FLIGHT", "TRAIN"], required: true },
  trip_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  total_amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["PENDING", "WAITING_PAYMENT", "CONFIRMED", "CANCELLED", "EXPIRED"],
    default: "PENDING",
  },
  expires_at: { type: Date },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Booking", bookingSchema);
