const mongoose = require("mongoose");
const env = require("./env");

async function connectDB() {
  try {
    mongoose.set("strictQuery", true);

    await mongoose.connect(env.mongoUri);

    console.log("[DB] MongoDB connected");
  } catch (error) {
    console.error("[DB] MongoDB connection error:", error);
    process.exit(1);
  }
}

module.exports = { connectDB };
