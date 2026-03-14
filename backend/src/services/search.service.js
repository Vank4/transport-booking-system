const Flight = require('../models/flights.model');
const Airport = require('../models/airports.model');
const Airline = require('../models/airlines.model');
const Seat = require('../models/seats.model');
const TrainTrip = require('../models/trainTrips.model');
const TrainStation = require('../models/trainStations.model');
const Train = require('../models/trains.model');
const TrainCarriage = require('../models/trainCarriages.model'); // QUAN TRỌNG: Cần import để lọc giá tàu

/**
 * TÌM KIẾM CHUYẾN BAY
 */
const findFlights = async ({ origin, destination, departureDate, passengers = 1, sort, page = 1, limit = 20, filters = {} }) => {
  // 1. Kiểm tra đầu vào
  if (!origin || !destination || !departureDate) {
    const error = new Error('Missing required search parameters');
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  if (origin.toUpperCase() === destination.toUpperCase()) {
    const error = new Error('Điểm đi và điểm đến không được trùng nhau');
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const passengerCount = parseInt(passengers, 10) || 1;

  // 2. Tìm Sân bay
  const [originAirport, destAirport] = await Promise.all([
    Airport.findOne({ iata_code: origin.toUpperCase() }),
    Airport.findOne({ iata_code: destination.toUpperCase() })
  ]);

  if (!originAirport || !destAirport) return { trips: [], total: 0, page, limit };

  // 3. Xây dựng Query cho Mongoose
  const query = {
    departure_airport_id: originAirport._id,
    arrival_airport_id: destAirport._id,
    status: 'SCHEDULED'
  };

  // --- LỌC THEO NGÀY VÀ GIỜ (time_from, time_to) ---
  const startOfDay = new Date(departureDate);
  const endOfDay = new Date(departureDate);
  
  if (filters.time_from) {
    const [h, m] = filters.time_from.split(':');
    startOfDay.setUTCHours(parseInt(h), parseInt(m), 0, 0);
  } else {
    startOfDay.setUTCHours(0, 0, 0, 0);
  }

  if (filters.time_to) {
    const [h, m] = filters.time_to.split(':');
    endOfDay.setUTCHours(parseInt(h), parseInt(m), 59, 999);
  } else {
    endOfDay.setUTCHours(23, 59, 59, 999);
  }
  query.departure_time = { $gte: startOfDay, $lte: endOfDay };

  // --- LỌC THEO GIÁ (Fix lỗi bạn gặp phải) ---
  const seatClass = filters.seat_class ? filters.seat_class.toLowerCase() : 'economy';
  const priceField = `prices.${seatClass}`;

  if (filters.min_price || filters.max_price) {
    query[priceField] = {};
    if (filters.min_price) query[priceField].$gte = Number(filters.min_price);
    if (filters.max_price) query[priceField].$lte = Number(filters.max_price);
  }

  // --- LỌC THEO HÃNG BAY ---
  if (filters.airlines) {
    const airlineCodes = filters.airlines.split(',');
    const matchingAirlines = await Airline.find({ iata_code: { $in: airlineCodes } });
    query.airline_id = { $in: matchingAirlines.map(a => a._id) };
  }

  // 4. Sắp xếp
  let sortCriteria = { departure_time: 1 };
  if (sort === 'price:asc') sortCriteria = { [priceField]: 1 };
  if (sort === 'price:desc') sortCriteria = { [priceField]: -1 };

  // 5. Thực thi Query
  const flights = await Flight.find(query)
    .populate('airline_id', 'name iata_code logo_url')
    .populate('departure_airport_id', 'name iata_code city country')
    .populate('arrival_airport_id', 'name iata_code city country')
    .sort(sortCriteria)
    .lean();

  // 6. Lọc số hành khách (JS-side) và gắn thêm dữ liệu hiển thị
  const validFlights = [];
  for (const flight of flights) {
    const availableSeats = await Seat.countDocuments({
      flight_id: flight._id,
      status: 'AVAILABLE',
      class: seatClass.toUpperCase()
    });

    if (availableSeats >= passengerCount) {
      validFlights.push({
        ...flight,
        available_seats_count: availableSeats,
        current_price: flight.prices[seatClass] // Trả về giá của hạng ghế đang tìm để dễ kiểm tra
      });
    }
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  return {
    trips: validFlights.slice((pageNum - 1) * limitNum, pageNum * limitNum),
    total: validFlights.length,
    page: pageNum,
    limit: limitNum
  };
};

/**
 * TÌM KIẾM CHUYẾN TÀU
 */
const findTrainTrips = async ({ origin, destination, departureDate, passengers = 1, sort, page = 1, limit = 20, filters = {} }) => {
  if (!origin || !destination || !departureDate) {
    const error = new Error('Missing parameters');
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const [originStation, destStation] = await Promise.all([
    TrainStation.findOne({ name: origin }),
    TrainStation.findOne({ name: destination })
  ]);

  if (!originStation || !destStation) return { trips: [], total: 0, page, limit };

  // 1. LỌC GIÁ QUA BẢNG CARRIAGE TRƯỚC (Vì giá nằm ở đây)
  let validTripIds = null;
  const carriageQuery = {};
  
  if (filters.seat_class) carriageQuery.type = filters.seat_class.toUpperCase();
  if (filters.min_price || filters.max_price) {
    carriageQuery.base_price = {};
    if (filters.min_price) carriageQuery.base_price.$gte = Number(filters.min_price);
    if (filters.max_price) carriageQuery.base_price.$lte = Number(filters.max_price);
  }

  if (Object.keys(carriageQuery).length > 0) {
    const carriages = await TrainCarriage.find(carriageQuery).select('train_trip_id');
    validTripIds = carriages.map(c => c.train_trip_id);
    if (validTripIds.length === 0) return { trips: [], total: 0, page, limit };
  }

  // 2. XÂY DỰNG QUERY CHUYẾN TÀU
  const query = {
    departure_station_id: originStation._id,
    arrival_station_id: destStation._id,
    status: 'SCHEDULED'
  };
  if (validTripIds) query._id = { $in: validTripIds };

  const searchDate = new Date(departureDate);
  const start = new Date(searchDate).setUTCHours(0,0,0,0);
  const end = new Date(searchDate).setUTCHours(23,59,59,999);
  query.departure_time = { $gte: start, $lte: end };

  // 3. Thực thi
  const trips = await TrainTrip.find(query)
    .populate('train_id', 'train_number name')
    .populate('departure_station_id', 'name city')
    .populate('arrival_station_id', 'name city')
    .lean();

  // Gắn giá thấp nhất theo ĐÚNG HẠNG GHẾ để Frontend hiển thị và Sort
  for (const t of trips) {
    const carriageCondition = { train_trip_id: t._id };
    
    // NẾU CÓ LỌC HẠNG GHẾ, CHỈ TÌM TOA CỦA HẠNG ĐÓ
    if (filters.seat_class) {
      carriageCondition.type = filters.seat_class.toUpperCase();
    }

    const carriages = await TrainCarriage.find(carriageCondition);
    
    // Nếu mảng carriages có data, lấy giá min. Nếu không, gán bằng 0
    t.starting_price = carriages.length > 0 
      ? Math.min(...carriages.map(c => c.base_price)) 
      : 0;
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  return { 
    trips: trips.slice((pageNum - 1) * limitNum, pageNum * limitNum), 
    total: trips.length, 
    page: pageNum, 
    limit: limitNum 
  };
};

// ==========================================
// TÍNH NĂNG: XEM CHI TIẾT CHUYẾN ĐI
// ==========================================

const getFlightDetails = async (flightId) => {
  const flight = await Flight.findById(flightId)
    .populate('airline_id', 'name iata_code logo_url')
    .populate('departure_airport_id', 'name city country iata_code')
    .populate('arrival_airport_id', 'name city country iata_code')
    .lean();

  if (!flight) {
    const error = new Error('Không tìm thấy chuyến bay');
    error.status = 404;
    error.code = 'TRIP_NOT_FOUND';
    throw error;
  }
  if (flight.status === 'CANCELLED') {
    const error = new Error('Chuyến bay này đã bị hủy');
    error.status = 400;
    error.code = 'TRIP_CANCELLED';
    throw error;
  }

  // Đếm số ghế trống cho từng hạng để giao diện hiển thị
  const availableEconomy = await Seat.countDocuments({ flight_id: flightId, class: 'ECONOMY', status: 'AVAILABLE' });
  const availableBusiness = await Seat.countDocuments({ flight_id: flightId, class: 'BUSINESS', status: 'AVAILABLE' });

  return { 
    ...flight, 
    available_seats: { economy: availableEconomy, business: availableBusiness } 
  };
};

const getTrainTripDetails = async (tripId) => {
  const trip = await TrainTrip.findById(tripId)
    .populate('train_id', 'train_number name')
    .populate('departure_station_id', 'name city')
    .populate('arrival_station_id', 'name city')
    .lean();

  if (!trip) {
    const error = new Error('Không tìm thấy chuyến tàu');
    error.status = 404;
    error.code = 'TRIP_NOT_FOUND';
    throw error;
  }
  if (trip.status === 'CANCELLED') {
    const error = new Error('Chuyến tàu này đã bị hủy');
    error.status = 400;
    error.code = 'TRIP_CANCELLED';
    throw error;
  }

  // Lấy thông tin toa tàu để biết giá của từng hạng ghế
  const carriages = await TrainCarriage.find({ train_trip_id: tripId }).lean();
  return { ...trip, carriages_info: carriages };
};

// ==========================================
// KIỂM TRA TRẠNG THÁI GHẾ TRỐNG 
// ==========================================

const checkFlightAvailability = async (flightId, seatClass) => {
  const query = { flight_id: flightId, status: 'AVAILABLE' };
  if (seatClass) query.class = seatClass.toUpperCase();

  const availableCount = await Seat.countDocuments(query);

  let status = 'PLENTY'; // Còn ghế
  if (availableCount === 0) status = 'SOLD_OUT'; // Hết ghế
  else if (availableCount <= 5) status = 'FEW_LEFT'; // Sắp hết ghế (Quy ước <= 5 ghế)

  return { available_count: availableCount, status };
};

const checkTrainAvailability = async (tripId, seatClass) => {
  // Với tàu hỏa, phải tìm các toa tàu (carriage) của chuyến đó trước
  const carriageQuery = { train_trip_id: tripId };
  if (seatClass) carriageQuery.type = seatClass.toUpperCase();

  const carriages = await TrainCarriage.find(carriageQuery).select('_id');
  const carriageIds = carriages.map(c => c._id);

  // Đếm các ghế trống thuộc các toa vừa tìm được
  const availableCount = await Seat.countDocuments({
    carriage_id: { $in: carriageIds },
    status: 'AVAILABLE'
  });

  let status = 'PLENTY';
  if (availableCount === 0) status = 'SOLD_OUT';
  else if (availableCount <= 5) status = 'FEW_LEFT';

  return { available_count: availableCount, status };
};


module.exports = { 
  findFlights, 
  findTrainTrips, 
  getFlightDetails, 
  getTrainTripDetails,
  checkFlightAvailability,
  checkTrainAvailability
};