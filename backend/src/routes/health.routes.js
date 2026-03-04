const express = require("express");
const router = express.Router();

// Health check endpoint
router.get("/status", (req, res) => {
  res.status(200).json({ message: "Server is healthy!" });
});

module.exports = router;
