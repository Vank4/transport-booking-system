const express = require('express');
const searchController = require('../controllers/search.controller');

const router = express.Router();

// Route: GET /api/flights/search
router.get('/flights/search', searchController.searchFlights);
router.get('/train-trips/search', searchController.searchTrainTrips);
module.exports = router;