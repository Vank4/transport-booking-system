const express = require("express");
const router = express.Router();
const searchController = require("../controllers/search.controller"); // Import controller

// Tìm kiếm chuyến bay
router.get("/flights", searchController.searchFlights);

// Tìm kiếm vé
router.get("/tickets", searchController.searchTickets);

module.exports = router;
