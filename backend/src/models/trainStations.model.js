const mongoose = require("mongoose");

const stationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
});

const TrainStation = mongoose.model("TrainStation", stationSchema);
module.exports = TrainStation;
