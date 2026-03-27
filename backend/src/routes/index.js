const express = require("express");
const bodyParser = require("body-parser");

const authRoutes = require("./auth.routes");
const bookingRoutes = require("./booking.routes");
const seatRoutes = require("./seat.routes");
const healthRoutes = require("./health.routes");
const searchRoutes = require("./search.routes");

// Aviation Routes
const airlineRoutes = require("./airlines.routes");
const airportRoutes = require("./airports.routes");
const flightRoutes = require("./flights.routes");
const flightFareRoutes = require("./flightFares.routes");

// Railway Routes
const trainRoutes = require("./trains.routes");
const trainStationRoutes = require("./trainStations.routes");
const trainCarriageRoutes = require("./trainCarriages.routes");
const trainTripRoutes = require("./trainTrips.routes");

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

// Aviation
app.use("/api/airlines", airlineRoutes);
app.use("/api/airports", airportRoutes);
app.use("/api/flights", flightRoutes);
app.use("/api/flight-fares", flightFareRoutes);

// Railways
app.use("/api/trains", trainRoutes);
app.use("/api/train-stations", trainStationRoutes);
app.use("/api/train-carriages", trainCarriageRoutes);
app.use("/api/train-trips", trainTripRoutes);

// Route test
app.get("/", (req, res) => {
  res.json({
    message: "Transport Booking API is running",
  });
});

// Export app để server.js sử dụng
module.exports = app;
