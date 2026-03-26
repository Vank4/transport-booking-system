const searchService = require("../services/search.service");

const listAirports = async (req, res, next) => {
  try {
    const items = await searchService.listAirports(req.query);
    res.status(200).json({
      success: true,
      data: { items },
      message: "Airports found",
      errors: null,
    });
  } catch (err) {
    next(err);
  }
};

const listTrainStations = async (req, res, next) => {
  try {
    const items = await searchService.listTrainStations(req.query);
    res.status(200).json({
      success: true,
      data: { items },
      message: "Train stations found",
      errors: null,
    });
  } catch (err) {
    next(err);
  }
};

const searchFlights = async (req, res, next) => {
  try {
    const {
      origin,
      destination,
      departure_date,
      passengers,
      sort,
      page,
      limit,
      ...filters
    } = req.query;
    const result = await searchService.findFlights({
      origin,
      destination,
      departureDate: departure_date,
      passengers,
      sort,
      page,
      limit,
      filters,
    });

    if (!result.trips || result.trips.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "No flights found matching your search criteria.",
        errors: { code: "NO_TRIPS_FOUND" },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        items: result.trips,
        pagination: {
          page: result.page,
          limit: result.limit,
          totalItems: result.total,

          totalPages: Math.ceil(result.total / result.limit) || 1,
        },
        filter_counts: result.filter_counts || {},
      },
      message: "Flights found",
      errors: null,
    });
  } catch (err) {
    next(err);
  }
};

const searchTrainTrips = async (req, res, next) => {
  try {
    const {
      origin,
      destination,
      departure_date,
      passengers,
      sort,
      page,
      limit,
      ...filters
    } = req.query;
    const result = await searchService.findTrainTrips({
      origin,
      destination,
      departureDate: departure_date,
      passengers,
      sort,
      page,
      limit,
      filters,
    });

    if (!result.trips || result.trips.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Khong tim thay chuyen tau nao phu hop.",
        errors: { code: "NO_TRIPS_FOUND" },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        items: result.trips,
        pagination: {
          page: result.page,
          limit: result.limit,
          totalItems: result.total,

          totalPages: Math.ceil(result.total / result.limit) || 1,
        },
        filter_counts: result.filter_counts || {},
      },
      message: "Train trips found",
      errors: null,
    });
  } catch (err) {
    next(err);
  }
};

const getFlightById = async (req, res, next) => {
  try {
    const flight = await searchService.getFlightDetails(req.params.id);
    res.status(200).json({
      success: true,
      data: flight,
      message: "Flight detail",
      errors: null,
    });
  } catch (err) {
    next(err);
  }
};

const getTrainTripById = async (req, res, next) => {
  try {
    const trainTrip = await searchService.getTrainTripDetails(req.params.id);
    res.status(200).json({
      success: true,
      data: trainTrip,
      message: "Train trip detail",
      errors: null,
    });
  } catch (err) {
    next(err);
  }
};

const checkFlightSeats = async (req, res, next) => {
  try {
    const { seat_class } = req.query;
    const availability = await searchService.checkFlightAvailability(
      req.params.id,
      seat_class,
    );
    res.status(200).json({
      success: true,
      data: availability,
      message: "Flight seat availability status",
      errors: null,
    });
  } catch (err) {
    next(err);
  }
};

const checkTrainSeats = async (req, res, next) => {
  try {
    const { seat_class } = req.query;
    const availability = await searchService.checkTrainAvailability(
      req.params.id,
      seat_class,
    );
    res.status(200).json({
      success: true,
      data: availability,
      message: "Train seat availability status",
      errors: null,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listAirports,
  listTrainStations,
  searchFlights,
  searchTrainTrips,
  getFlightById,
  getTrainTripById,
  checkFlightSeats,
  checkTrainSeats,
};
