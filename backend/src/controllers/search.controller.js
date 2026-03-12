const searchService = require('../services/search.service');

const searchFlights = async (req, res, next) => {
  try {
    const { origin, destination, departure_date, passengers, sort, page, limit, ...filters } = req.query;

    const result = await searchService.findFlights({
      origin,
      destination,
      departureDate: departure_date,
      passengers,
      sort,
      page,
      limit,
      filters // <--- PHẢI TRUYỀN BIẾN NÀY XUỐNG SERVICE
    });

    if (!result.trips || result.trips.length === 0) {
      return res.status(404).json({
        status: 'error',
        code: 'NO_TRIPS_FOUND',
        message: 'No flights found matching your search criteria.'
      });
    }

    res.status(200).json({
      status: 'success',
      data: result.trips,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit
      }
    });
  } catch (err) {
    next(err);
  }
};

const searchTrainTrips = async (req, res, next) => {
  try {
    const { origin, destination, departure_date, passengers, sort, page, limit, ...filters } = req.query;

    const result = await searchService.findTrainTrips({
      origin,
      destination,
      departureDate: departure_date,
      passengers,
      sort,
      page,
      limit,
      filters
    });

    if (!result.trips || result.trips.length === 0) {
      return res.status(404).json({
        status: 'error',
        code: 'NO_TRIPS_FOUND',
        message: 'Không tìm thấy chuyến tàu nào phù hợp.'
      });
    }

    res.status(200).json({
      status: 'success',
      data: result.trips,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { searchFlights, searchTrainTrips };