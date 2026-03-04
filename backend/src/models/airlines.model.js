const mongoose = require("mongoose");

const airlineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  iata_code: { type: String, unique: true },
  logo_url: { type: String },
});

const Airline = mongoose.model("Airline", airlineSchema);
module.exports = Airline;
