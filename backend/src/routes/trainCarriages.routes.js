const express = require("express");
const router = express.Router();
const trainCarriageController = require("../controllers/trainCarriages.controller");
const { validate } = require("../middleware/validate.middleware");
const { createTrainCarriageSchema, updateTrainCarriageSchema, getTrainCarriagesSchema } = require("../validators/trainCarriage.validator");

// Tạm thời comment middleware auth để dễ test
router.post("/", validate(createTrainCarriageSchema, "body"), trainCarriageController.createTrainCarriage);
router.get("/", validate(getTrainCarriagesSchema, "query"), trainCarriageController.getTrainCarriages);
router.get("/:id", trainCarriageController.getTrainCarriageById);
router.put("/:id", validate(updateTrainCarriageSchema, "body"), trainCarriageController.updateTrainCarriage);
router.delete("/:id", trainCarriageController.deleteTrainCarriage);

module.exports = router;
