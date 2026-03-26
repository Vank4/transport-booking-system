const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking.controller"); // Import controller
const authMiddleware = require("../middleware/authMiddleware");

const { validateBookingData } = require('../middleware/bookingValidator');

// Inject cái middleware check JWT mà hông bắt buộc trả 401 khi lỗi (Tự pass nếu có hoặc hông có JWT)
const optionalAuth = (req, res, next) => {
    // Có thể cần viết lại nếu authMiddleware cũ của hệ thống dùng bắt buộc
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
        try {
            const jwt = require('jsonwebtoken');
            const env = require('../config/env');
            const decoded = jwt.verify(token, env.jwtSecret);
            req.user = decoded;
        } catch (error) {
            // Không làm gì, để req.user = undefined (Khách vãng lai)
        }
    }
    next();
};

// Tạo đặt vé mới
router.post("/create", optionalAuth, validateBookingData, bookingController.createBooking);

// Xử lý thanh toán đã chuyển sang payment.routes.js

// Lấy danh sách các đặt vé
router.get("/list", authMiddleware, bookingController.getAllBookings);

// Tạo API Đường hầm Gửi Mã Giảm Giá (Cho phép Vãng lai xài luôn nhờ optionalAuth)
router.post("/apply-voucher", optionalAuth, bookingController.applyVoucher);

// Xem chi tiết giỏ hàng Checkout
router.get("/:bookingId/details", optionalAuth, bookingController.getBookingById);

module.exports = router;
