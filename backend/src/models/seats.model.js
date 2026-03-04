const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema({
  flight_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Flight",
    required: false,
  },
  carriage_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TrainCarriage",
    required: false,
  },
  seat_number: { type: String, required: true },
  class: { type: String, enum: ["ECONOMY", "BUSINESS"], required: true },
  status: {
    type: String,
    enum: ["AVAILABLE", "HELD", "BOOKED"],
    default: "AVAILABLE",
  },
  held_by_booking_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: false,
  },
  hold_expired_at: { type: Date, required: false },
  price_modifier: { type: Number, default: 0 },
});

const Seat = mongoose.model("Seat", seatSchema);
module.exports = Seat;
