const express = require("express");
const router = express.Router();
const airportController = require("../controllers/airports.controller");
const { validate } = require("../middleware/validate.middleware");
const { createAirportSchema, updateAirportSchema, getAirportsSchema } = require("../validators/airport.validator");

// Tạm thời comment middleware auth để dễ test
router.post("/", validate(createAirportSchema, "body"), airportController.createAirport);
router.get("/", validate(getAirportsSchema, "query"), airportController.getAirports);
router.get("/:id", airportController.getAirportById);
router.put("/:id", validate(updateAirportSchema, "body"), airportController.updateAirport);
router.delete("/:id", airportController.deleteAirport);

module.exports = router;
