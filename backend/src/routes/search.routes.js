const express = require('express');
const searchController = require('../controllers/search.controller');

const router = express.Router();

// 1. Các Route Tìm kiếm 
router.get('/flights/search', searchController.searchFlights);
router.get('/train-trips/search', searchController.searchTrainTrips);

// 2. Các Route Xem chi tiết chuyến đi (
router.get('/flights/:id', searchController.getFlightById);
router.get('/train-trips/:id', searchController.getTrainTripById);

// 3.Khách gọi vào đây để xem chuyến bay/tàu này CÒN GHẾ hay HẾT GHẾ
router.get('/flights/:id/availability', searchController.checkFlightSeats);
router.get('/train-trips/:id/availability', searchController.checkTrainSeats);
module.exports = router;