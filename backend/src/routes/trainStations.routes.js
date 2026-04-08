const express = require("express");
const router = express.Router();
const trainStationController = require("../controllers/trainStations.controller");
const { validate } = require("../middleware/validate.middleware");
const { createTrainStationSchema, updateTrainStationSchema, getTrainStationsSchema } = require("../validators/trainStation.validator");

const authMiddleware = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/role.middleware");

// Tạm thời comment middleware auth để dễ test
router.post("/", authMiddleware, authorizeRoles("ADMIN"), validate(createTrainStationSchema, "body"), trainStationController.createTrainStation);
router.get("/", validate(getTrainStationsSchema, "query"), trainStationController.getTrainStations);
router.get("/:id", trainStationController.getTrainStationById);
router.put("/:id", authMiddleware, authorizeRoles("ADMIN"), validate(updateTrainStationSchema, "body"), trainStationController.updateTrainStation);
router.delete("/:id", authMiddleware, authorizeRoles("ADMIN"), trainStationController.deleteTrainStation);

module.exports = router;
