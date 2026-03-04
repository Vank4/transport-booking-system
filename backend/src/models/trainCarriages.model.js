const mongoose = require("mongoose");

const trainCarriageSchema = new mongoose.Schema({
  train_trip_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TrainTrip",
    required: true,
  },
  carriage_number: { type: String, required: true },
  type: { type: String, enum: ["ECONOMY", "BUSINESS"], required: true },
  base_price: { type: Number, required: true },
});

const TrainCarriage = mongoose.model("TrainCarriage", trainCarriageSchema);
module.exports = TrainCarriage;
