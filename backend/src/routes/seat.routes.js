const express = require("express");
const router = express.Router();
const seatController = require("../controllers/seat.controller");
const authMiddleware = require("../middleware/authMiddleware");

// GET /api/seats/status/:seatId — check a single seat's status (public)
router.get("/status/:seatId", seatController.checkSeatStatus);

// GET /api/seats/map/:tripId — full seat map for a flight or train trip (public)
router.get("/map/:tripId", seatController.getSeatMap);

// POST /api/seats/hold — hold 1–9 seats (auth required)
// Body: { seatIds: string[], tripType: "flight"|"train", tripId: string }
router.post("/hold", authMiddleware, seatController.holdSeats);

// POST /api/seats/release — release held seats (auth required, ownership enforced)
// Body: { seatIds: string[], tripId: string }
router.post("/release", authMiddleware, seatController.releaseSeats);

// POST /api/seats/select — validate & hold available seats for a trip (auth required)
// Body: { tripId: string, seatIds: string[] }
router.post("/select", authMiddleware, seatController.selectSeats);

module.exports = router;
