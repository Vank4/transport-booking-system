require("dotenv").config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",

  port: Number(process.env.PORT || 3000),

  mongoUri:
    process.env.MONGO_URI || "mongodb://localhost:27017/transport_booking",

  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",

  jwtSecret: process.env.JWT_SECRET || "dev_secret_change_me",

  seatHoldTtlMinutes: Number(process.env.SEAT_HOLD_TTL_MINUTES || 15),
};

module.exports = env;
