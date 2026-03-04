const mongoose = require("mongoose");

const trainSchema = new mongoose.Schema({
  train_number: { type: String, required: true, unique: true },
  name: { type: String, required: true },
});

const Train = mongoose.model("Train", trainSchema);
module.exports = Train;
