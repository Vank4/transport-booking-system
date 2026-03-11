const searchService = require('../services/search.service');

const searchFlights = async (req, res, next) => {
  try {
    const { origin, destination, departure_date, passengers, sort, page, limit } = req.query;

    const result = await searchService.findFlights({
      origin,
      destination,
      departureDate: departure_date,
      passengers,
      sort,
      page,
      limit
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

module.exports = { searchFlights };