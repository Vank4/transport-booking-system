const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  booking_code: { type: String, required: true, unique: true },
  booking_type: { type: String, enum: ["FLIGHT", "TRAIN"], required: true },
  total_amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["PENDING", "CONFIRMED", "CANCELLED", "EXPIRED"],
    default: "PENDING",
  },
  created_at: { type: Date, default: Date.now },
});

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
