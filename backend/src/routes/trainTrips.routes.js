const express = require("express");
const router = express.Router();
const trainTripController = require("../controllers/trainTrips.controller");
const { validate } = require("../middleware/validate.middleware");
const { createTrainTripSchema, updateTrainTripSchema, getTrainTripsSchema } = require("../validators/trainTrip.validator");

// Tạm thời comment middleware auth để dễ test
router.post("/", validate(createTrainTripSchema, "body"), trainTripController.createTrainTrip);
router.get("/", validate(getTrainTripsSchema, "query"), trainTripController.getTrainTrips);
router.get("/:id", trainTripController.getTrainTripById);
router.put("/:id", validate(updateTrainTripSchema, "body"), trainTripController.updateTrainTrip);
router.delete("/:id", trainTripController.deleteTrainTrip);

module.exports = router;
