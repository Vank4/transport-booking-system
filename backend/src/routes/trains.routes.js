const express = require("express");
const router = express.Router();
const trainController = require("../controllers/trains.controller");
const { validate } = require("../middleware/validate.middleware");
const { createTrainSchema, updateTrainSchema, getTrainsSchema } = require("../validators/train.validator");

const authMiddleware = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/role.middleware");

// Tạm thời comment middleware auth để dễ test
router.post("/", authMiddleware, authorizeRoles("ADMIN"), validate(createTrainSchema, "body"), trainController.createTrain);
router.get("/", validate(getTrainsSchema, "query"), trainController.getTrains);
router.get("/:id", trainController.getTrainById);
router.put("/:id", authMiddleware, authorizeRoles("ADMIN"), validate(updateTrainSchema, "body"), trainController.updateTrain);
router.delete("/:id", authMiddleware, authorizeRoles("ADMIN"), trainController.deleteTrain);

module.exports = router;
