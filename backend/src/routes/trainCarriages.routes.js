const express = require("express");
const router = express.Router();
const trainCarriageController = require("../controllers/trainCarriages.controller");
const { validate } = require("../middleware/validate.middleware");
const { createTrainCarriageSchema, updateTrainCarriageSchema, getTrainCarriagesSchema } = require("../validators/trainCarriage.validator");

const authMiddleware = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/role.middleware");

// Tạm thời comment middleware auth để dễ test
router.post("/", authMiddleware, authorizeRoles("ADMIN"), validate(createTrainCarriageSchema, "body"), trainCarriageController.createTrainCarriage);
router.get("/", validate(getTrainCarriagesSchema, "query"), trainCarriageController.getTrainCarriages);
router.get("/:id", trainCarriageController.getTrainCarriageById);
router.put("/:id", authMiddleware, authorizeRoles("ADMIN"), validate(updateTrainCarriageSchema, "body"), trainCarriageController.updateTrainCarriage);
router.delete("/:id", authMiddleware, authorizeRoles("ADMIN"), trainCarriageController.deleteTrainCarriage);

module.exports = router;
