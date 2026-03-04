const express = require("express");
const router = express.Router();
const seatController = require("../controllers/seat.controller"); // Import controller

// Kiểm tra trạng thái ghế
router.get("/status/:seatId", seatController.checkSeatStatus);

// Giữ ghế
router.post("/hold/:seatId", seatController.holdSeat);

// Thả ghế
router.post("/release/:seatId", seatController.releaseSeat);

module.exports = router;
