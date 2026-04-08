const express = require("express");
const router = express.Router();
const airportController = require("../controllers/airports.controller");
const { validate } = require("../middleware/validate.middleware");
const { createAirportSchema, updateAirportSchema, getAirportsSchema } = require("../validators/airport.validator");

const authMiddleware = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/role.middleware");

// Tạm thời comment middleware auth để dễ test
router.post("/", authMiddleware, authorizeRoles("ADMIN"), validate(createAirportSchema, "body"), airportController.createAirport);
router.get("/", validate(getAirportsSchema, "query"), airportController.getAirports);
router.get("/:id", airportController.getAirportById);
router.put("/:id", authMiddleware, authorizeRoles("ADMIN"), validate(updateAirportSchema, "body"), airportController.updateAirport);
router.delete("/:id", authMiddleware, authorizeRoles("ADMIN"), airportController.deleteAirport);

module.exports = router;
