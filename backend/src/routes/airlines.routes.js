const express = require("express");
const router = express.Router();
const airlineController = require("../controllers/airlines.controller");
const { validate } = require("../middleware/validate.middleware");
const { createAirlineSchema, updateAirlineSchema, getAirlinesSchema } = require("../validators/airline.validator");
// const { authenticate } = require("../middleware/auth.middleware");
// const { authorizeRoles } = require("../middleware/role.middleware");

const upload = require("../middleware/upload.middleware");

// Tạm thời comment middleware auth để dễ test
router.post("/upload", upload.single("logo"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }
  const fileUrl = `/public/uploads/${req.file.filename}`;
  res.status(200).json({ success: true, url: fileUrl });
});

router.post("/", validate(createAirlineSchema, "body"), airlineController.createAirline);
router.get("/", validate(getAirlinesSchema, "query"), airlineController.getAirlines);
router.get("/:id", airlineController.getAirlineById);
router.put("/:id", validate(updateAirlineSchema, "body"), airlineController.updateAirline);
router.delete("/:id", airlineController.deleteAirline);

module.exports = router;
