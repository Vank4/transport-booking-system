const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  booking_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  seat_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Seat",
    required: true,
  },
  passenger_name: { type: String, required: true },
  passenger_id_card: { type: String, required: true },
  final_price: { type: Number, required: true },
});

const Ticket = mongoose.model("Ticket", ticketSchema);
module.exports = Ticket;
