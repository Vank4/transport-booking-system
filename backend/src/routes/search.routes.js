const express = require('express');
const searchController = require('../controllers/search.controller');

const router = express.Router();

// 1. Các Route Tìm kiếm 
router.get('/flights/search', searchController.searchFlights);
router.get('/train-trips/search', searchController.searchTrainTrips);

// 2. Các Route Xem chi tiết chuyến đi (
router.get('/flights/:id', searchController.getFlightById);
router.get('/train-trips/:id', searchController.getTrainTripById);

module.exports = router;