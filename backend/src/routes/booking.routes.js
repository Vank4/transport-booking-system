const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking.controller"); // Import controller

// Tạo đặt vé mới
router.post("/create", bookingController.createBooking);

// Xử lý thanh toán
router.post("/payment", bookingController.processPayment);

// Lấy danh sách các đặt vé
router.get("/list", bookingController.getAllBookings);

module.exports = router;
