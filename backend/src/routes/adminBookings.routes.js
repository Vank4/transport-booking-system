const express = require("express");
const router = express.Router();
const adminBookingsController = require("../controllers/adminBookings.controller");
// const authMiddleware = require("../middleware/authMiddleware");
// const roleMiddleware = require("../middleware/roleMiddleware");

// Temporary un-protected routes for rapid development
router.get("/", adminBookingsController.getAllBookings);
router.get("/:id", adminBookingsController.getBookingById);
router.put("/:id/status", adminBookingsController.updateBookingStatus);
router.delete("/:id", adminBookingsController.deleteBooking);

module.exports = router;
