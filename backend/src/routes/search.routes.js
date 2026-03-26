const express = require("express");
const searchController = require("../controllers/search.controller");

const router = express.Router();

router.get("/flights/locations", searchController.listAirports);
router.get("/train-trips/locations", searchController.listTrainStations);

router.get("/flights/search", searchController.searchFlights);
router.get("/train-trips/search", searchController.searchTrainTrips);

router.get("/flights/:id/availability", searchController.checkFlightSeats);
router.get("/train-trips/:id/availability", searchController.checkTrainSeats);

router.get("/flights/:id", searchController.getFlightById);
router.get("/train-trips/:id", searchController.getTrainTripById);

module.exports = router;
