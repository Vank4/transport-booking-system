const mongoose = require("mongoose");

const trainTripSchema = new mongoose.Schema({
  train_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Train",
    required: true,
  },
  departure_station_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TrainStation",
    required: true,
  },
  arrival_station_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TrainStation",
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

const TrainTrip = mongoose.model("TrainTrip", trainTripSchema);
module.exports = TrainTrip;
