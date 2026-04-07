const express = require("express");
const router = express.Router();
const adminBookingsController = require("../controllers/adminBookings.controller");
const authMiddleware = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/role.middleware");

router.use(authMiddleware, authorizeRoles("ADMIN"));
// Temporary un-protected routes for rapid development
router.get("/", adminBookingsController.getAllBookings);
router.get("/:id", adminBookingsController.getBookingById);
router.put("/:id/status", adminBookingsController.updateBookingStatus);
router.delete("/:id", adminBookingsController.deleteBooking);

module.exports = router;
