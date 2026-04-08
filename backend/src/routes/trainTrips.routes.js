const express = require("express");
const router = express.Router();
const trainTripController = require("../controllers/trainTrips.controller");
const { validate } = require("../middleware/validate.middleware");
const { createTrainTripSchema, updateTrainTripSchema, getTrainTripsSchema } = require("../validators/trainTrip.validator");

const authMiddleware = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/role.middleware");

// Tạm thời comment middleware auth để dễ test
router.post("/", authMiddleware, authorizeRoles("ADMIN"), validate(createTrainTripSchema, "body"), trainTripController.createTrainTrip);
router.get("/", validate(getTrainTripsSchema, "query"), trainTripController.getTrainTrips);
router.get("/:id", trainTripController.getTrainTripById);
router.put("/:id", authMiddleware, authorizeRoles("ADMIN"), validate(updateTrainTripSchema, "body"), trainTripController.updateTrainTrip);
router.delete("/:id", authMiddleware, authorizeRoles("ADMIN"), trainTripController.deleteTrainTrip);

module.exports = router;
