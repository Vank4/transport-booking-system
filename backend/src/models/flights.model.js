const mongoose = require("mongoose");

const flightSchema = new mongoose.Schema({
  airline_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Airline",
    required: true,
  },
  flight_number: { type: String, required: true },
  departure_airport_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Airport",
    required: true,
  },
  arrival_airport_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Airport",
    required: true,
  },
  departure_time: { type: Date, required: true },
  arrival_time: { type: Date, required: true },
  status: {
    type: String,
    enum: ["SCHEDULED", "DELAYED", "CANCELLED", "COMPLETED"],
    default: "SCHEDULED",
  },
});

const Flight = mongoose.model("Flight", flightSchema);
module.exports = Flight;
