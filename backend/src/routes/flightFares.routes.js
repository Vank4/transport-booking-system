const express = require("express");
const router = express.Router();
const flightFareController = require("../controllers/flightFares.controller");
const { validate } = require("../middleware/validate.middleware");
const { createFlightFareSchema, updateFlightFareSchema, getFlightFaresSchema } = require("../validators/flightFare.validator");

// Tạm thời comment middleware auth để dễ test
router.post("/", validate(createFlightFareSchema, "body"), flightFareController.createFlightFare);
router.get("/", validate(getFlightFaresSchema, "query"), flightFareController.getFlightFares);
router.get("/:id", flightFareController.getFlightFareById);
router.put("/:id", validate(updateFlightFareSchema, "body"), flightFareController.updateFlightFare);
router.delete("/:id", flightFareController.deleteFlightFare);

module.exports = router;
