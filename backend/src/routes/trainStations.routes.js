const express = require("express");
const router = express.Router();
const trainStationController = require("../controllers/trainStations.controller");
const { validate } = require("../middleware/validate.middleware");
const { createTrainStationSchema, updateTrainStationSchema, getTrainStationsSchema } = require("../validators/trainStation.validator");

// Tạm thời comment middleware auth để dễ test
router.post("/", validate(createTrainStationSchema, "body"), trainStationController.createTrainStation);
router.get("/", validate(getTrainStationsSchema, "query"), trainStationController.getTrainStations);
router.get("/:id", trainStationController.getTrainStationById);
router.put("/:id", validate(updateTrainStationSchema, "body"), trainStationController.updateTrainStation);
router.delete("/:id", trainStationController.deleteTrainStation);

module.exports = router;
