const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const env = require("./config/env");
const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const bookingRoutes = require("./routes/booking.routes");
const seatRoutes = require("./routes/seat.routes");
const searchRoutes = require("./routes/search.routes");
const paymentRoutes = require("./routes/payment.routes");
const paymentMethodRoutes = require("./routes/paymentMethod.routes");
const passengerRoutes = require("./routes/passenger.routes");
const errorHandler = require("./middleware/errorHandler");
const userRoutes = require("./routes/user.routes");
// Aviation Routes
const airlineRoutes = require("./routes/airlines.routes");
const airportRoutes = require("./routes/airports.routes");
const flightRoutes = require("./routes/flights.routes");
const flightFareRoutes = require("./routes/flightFares.routes");

// Railway Routes
const trainRoutes = require("./routes/trains.routes");
const trainStationRoutes = require("./routes/trainStations.routes");
const trainCarriageRoutes = require("./routes/trainCarriages.routes");
const trainTripRoutes = require("./routes/trainTrips.routes");

// Admin Routes Phase 3
const adminBookingsRoutes = require("./routes/adminBookings.routes");
const ticketRoutes = require("./routes/tickets.routes");
const voucherRoutes = require("./routes/vouchers.routes");
const path = require("path");
const adminDashboardRoutes = require("./routes/adminDashboard.routes");

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: "5mb" }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

// Serve static files from public directory
app.use("/public", express.static(path.join(__dirname, "../public")));

// Public routes
app.use("/api/auth", authRoutes);
app.use("/api/health", healthRoutes);
app.use("/api", searchRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/passengers", passengerRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);

// Booking routes keep their own authorization logic.
app.use("/api/bookings", bookingRoutes);

app.use("/api/users", userRoutes);
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

// Admin / Bookings & Finance
app.use("/api/admin/bookings", adminBookingsRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/vouchers", voucherRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Not Found",
    errors: { code: "NOT_FOUND" },
  });
});

app.use(errorHandler);

module.exports = app;
