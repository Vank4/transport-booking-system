const express = require("express");
const router = express.Router();
const trainController = require("../controllers/trains.controller");
const { validate } = require("../middleware/validate.middleware");
const { createTrainSchema, updateTrainSchema, getTrainsSchema } = require("../validators/train.validator");

// Tạm thời comment middleware auth để dễ test
router.post("/", validate(createTrainSchema, "body"), trainController.createTrain);
router.get("/", validate(getTrainsSchema, "query"), trainController.getTrains);
router.get("/:id", trainController.getTrainById);
router.put("/:id", validate(updateTrainSchema, "body"), trainController.updateTrain);
router.delete("/:id", trainController.deleteTrain);

module.exports = router;
