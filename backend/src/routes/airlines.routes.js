const express = require("express");
const router = express.Router();
const airlineController = require("../controllers/airlines.controller");
const { validate } = require("../middleware/validate.middleware");
const { createAirlineSchema, updateAirlineSchema, getAirlinesSchema } = require("../validators/airline.validator");
const authMiddleware = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/role.middleware");

const upload = require("../middleware/upload.middleware");

// Tạm thời comment middleware auth để dễ test
router.post("/upload", authMiddleware, authorizeRoles("ADMIN"), upload.single("logo"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }
  const fileUrl = `/public/uploads/${req.file.filename}`;
  res.status(200).json({ success: true, url: fileUrl });
});

router.post("/", authMiddleware, authorizeRoles("ADMIN"), validate(createAirlineSchema, "body"), airlineController.createAirline);
router.get("/", validate(getAirlinesSchema, "query"), airlineController.getAirlines);
router.get("/:id", airlineController.getAirlineById);
router.put("/:id", authMiddleware, authorizeRoles("ADMIN"), validate(updateAirlineSchema, "body"), airlineController.updateAirline);
router.delete("/:id", authMiddleware, authorizeRoles("ADMIN"), airlineController.deleteAirline);

module.exports = router;
