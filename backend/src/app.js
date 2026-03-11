const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// Import config và các route
const env = require("./config/env");
const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const bookingRoutes = require("./routes/booking.routes");
const seatRoutes = require("./routes/seat.routes");
const searchRoutes = require("./routes/search.routes");

// Import các middleware
const authMiddleware = require("./middleware/authMiddleware");
const errorHandler = require("./middleware/errorHandler");

// Tạo ứng dụng Express
const app = express();

// Middleware cấu hình ứng dụng
app.use(helmet()); // Bảo mật cho ứng dụng
app.use(cors({ origin: env.corsOrigin, credentials: true })); // CORS
app.use(express.json({ limit: "1mb" })); // Giới hạn kích thước payload của body
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev")); // Logging

// Routes: Public và Protected
app.use("/api/auth", authRoutes); // Đăng ký, đăng nhập (public routes)
app.use("/api/health", healthRoutes); // Kiểm tra tình trạng server
app.use("/api", searchRoutes);

// Các route yêu cầu xác thực người dùng (Protected Routes)
app.use("/api/bookings", authMiddleware, bookingRoutes); // Đặt vé, thanh toán
app.use("/api/seats", authMiddleware, seatRoutes); // Quản lý ghế

// Xử lý route không tìm thấy (404)
app.use((req, res) => {
	res.status(404).json({
		success: false,
		message: "Not Found",
		errors: { code: "NOT_FOUND" },
	});
});

// Xử lý lỗi chung cho toàn ứng dụng
app.use(errorHandler); // Middleware xử lý lỗi (errorHandler)

module.exports = app;
