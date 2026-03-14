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
  // User who is currently holding this seat (before booking is created)
  held_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  // Booking that owns this seat (after booking is confirmed)
  held_by_booking_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: false,
  },
  // Stored as Date object (not Unix ms) — bug fix per docs
  hold_expired_at: { type: Date, required: false },
  price_modifier: { type: Number, default: 0 },
});

const Seat = mongoose.model("Seat", seatSchema);
module.exports = Seat;
