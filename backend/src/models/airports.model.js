const mongoose = require("mongoose");

const airportSchema = new mongoose.Schema({
  iata_code: { type: String, unique: true },
  name: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
});

const Airport = mongoose.model("Airport", airportSchema);
module.exports = Airport;
