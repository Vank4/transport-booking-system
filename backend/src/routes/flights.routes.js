const express = require("express");
const router = express.Router();
const flightController = require("../controllers/flights.controller");
const { validate } = require("../middleware/validate.middleware");
const { createFlightSchema, updateFlightSchema, getFlightsSchema } = require("../validators/flight.validator");

const authMiddleware = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/role.middleware");

// Tạm thời comment middleware auth để dễ test
router.post("/", authMiddleware, authorizeRoles("ADMIN"), validate(createFlightSchema, "body"), flightController.createFlight);
router.get("/", validate(getFlightsSchema, "query"), flightController.getFlights);
router.get("/:id", flightController.getFlightById);
router.put("/:id", authMiddleware, authorizeRoles("ADMIN"), validate(updateFlightSchema, "body"), flightController.updateFlight);
router.delete("/:id", authMiddleware, authorizeRoles("ADMIN"), flightController.deleteFlight);

module.exports = router;
