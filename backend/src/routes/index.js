const express = require("express");
const bodyParser = require("body-parser");
const authRoutes = require("./auth.routes");
const bookingRoutes = require("./booking.routes");
const seatRoutes = require("./seat.routes");
const healthRoutes = require("./health.routes");
const searchRoutes = require("./search.routes");

const app = express();

app.use(bodyParser.json()); // Để parse JSON trong request body

// Các routes
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/search", searchRoutes);

// Lắng nghe yêu cầu trên cổng 3000
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
