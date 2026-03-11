const express = require('express');
const searchController = require('../controllers/search.controller');

const router = express.Router();

// Route: GET /api/flights/search
router.get('/flights/search', searchController.searchFlights);

module.exports = router;