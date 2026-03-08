const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller"); // Import controller

// Đăng ký người dùng mới
router.post("/register", authController.registerUser);

// Đăng nhập người dùng
router.post("/login", authController.loginUser);

// Quên mật khẩu: sinh OTP và gửi qua email
router.post("/forgot-password", authController.forgotPassword);

// Đặt lại mật khẩu: xác minh OTP và cập nhật mật khẩu mới
router.post("/reset-password", authController.resetPassword);

module.exports = router;
