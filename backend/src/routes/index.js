const express = require("express");
const bodyParser = require("body-parser");

const authRoutes = require("./auth.routes");
const bookingRoutes = require("./booking.routes");
const seatRoutes = require("./seat.routes");
const healthRoutes = require("./health.routes");
const searchRoutes = require("./search.routes");

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/search", searchRoutes);

// Route test
app.get("/", (req, res) => {
  res.json({
    message: "Transport Booking API is running",
  });
});

// Export app để server.js sử dụng
module.exports = app;
