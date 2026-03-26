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

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: "5mb" }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

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

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Not Found",
    errors: { code: "NOT_FOUND" },
  });
});

app.use(errorHandler);

module.exports = app;
