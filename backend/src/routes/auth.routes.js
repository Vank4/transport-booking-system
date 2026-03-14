const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller"); // Import controller
const authMiddleware = require("../middleware/authMiddleware");

// Đăng ký người dùng mới
router.post("/register", authController.registerUser);

// Đăng nhập người dùng
router.post("/login", authController.loginUser);

// Refresh access token
router.post("/refresh-token", authController.refreshToken);

// Xem hồ sơ cá nhân
router.get("/profile", authMiddleware, authController.getProfile);

// Cập nhật hồ sơ cá nhân
router.put("/update-profile", authMiddleware, authController.updateProfile);

// Xem danh sách booking của tôi
router.get("/my-bookings", authMiddleware, authController.myBookings);

// Thay đổi mật khẩu
router.put("/change-password", authMiddleware, authController.changePassword);

// Quên mật khẩu: sinh OTP và gửi qua email
router.post("/forgot-password", authController.forgotPassword);

// Đặt lại mật khẩu: xác minh OTP và cập nhật mật khẩu mới
router.post("/reset-password", authController.resetPassword);

module.exports = router;
