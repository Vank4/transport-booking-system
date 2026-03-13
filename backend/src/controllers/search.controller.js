const searchService = require('../services/search.service');

// ==========================================
// 1. TÌM KIẾM CHUYẾN ĐI 
// ==========================================
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
      filters 
    });

    if (!result.trips || result.trips.length === 0) {
      // Chuẩn hóa lỗi theo api-conventions.md
      return res.status(404).json({
        success: false,
        data: null,
        message: 'No flights found matching your search criteria.',
        errors: { code: 'NO_TRIPS_FOUND' }
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
          totalPages: Math.ceil(result.total / result.limit) || 1
        }
      },
      message: 'Flights found',
      errors: null
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
        success: false,
        data: null,
        message: 'Không tìm thấy chuyến tàu nào phù hợp.',
        errors: { code: 'NO_TRIPS_FOUND' }
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
          totalPages: Math.ceil(result.total / result.limit) || 1
        }
      },
      message: 'Train trips found',
      errors: null
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 2. XEM CHI TIẾT CHUYẾN ĐI
// ==========================================
const getFlightById = async (req, res, next) => {
  try {
    const flight = await searchService.getFlightDetails(req.params.id);
    
    res.status(200).json({
      success: true,
      data: flight,
      message: "Flight detail",
      errors: null
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
      errors: null
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 3. KIỂM TRA TRẠNG THÁI GHẾ (KAN-92)
// ==========================================
const checkFlightSeats = async (req, res, next) => {
  try {
    const { seat_class } = req.query; // Có thể truyền thêm hạng ghế trên URL (?seat_class=economy)
    const availability = await searchService.checkFlightAvailability(req.params.id, seat_class);
    
    res.status(200).json({
      success: true,
      data: availability,
      message: "Flight seat availability status",
      errors: null
    });
  } catch (err) {
    next(err);
  }
};

const checkTrainSeats = async (req, res, next) => {
  try {
    const { seat_class } = req.query;
    const availability = await searchService.checkTrainAvailability(req.params.id, seat_class);
    
    res.status(200).json({
      success: true,
      data: availability,
      message: "Train seat availability status",
      errors: null
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { 
  searchFlights, 
  searchTrainTrips, 
  getFlightById, 
  getTrainTripById,
  checkFlightSeats,
  checkTrainSeats 
};
