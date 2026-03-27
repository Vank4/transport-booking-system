const express = require("express");
const router = express.Router();
const flightController = require("../controllers/flights.controller");
const { validate } = require("../middleware/validate.middleware");
const { createFlightSchema, updateFlightSchema, getFlightsSchema } = require("../validators/flight.validator");

// Tạm thời comment middleware auth để dễ test
router.post("/", validate(createFlightSchema, "body"), flightController.createFlight);
router.get("/", validate(getFlightsSchema, "query"), flightController.getFlights);
router.get("/:id", flightController.getFlightById);
router.put("/:id", validate(updateFlightSchema, "body"), flightController.updateFlight);
router.delete("/:id", flightController.deleteFlight);

module.exports = router;
