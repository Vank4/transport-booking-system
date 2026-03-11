const Flight = require('../models/flights.model');
const Airport = require('../models/airports.model');
const Airline = require('../models/airlines.model');
const Seat = require('../models/seats.model'); // Import Seat để đếm số ghế trống

const findFlights = async ({ origin, destination, departureDate, passengers = 1, sort, page = 1, limit = 20 }) => {
  // 1. Kiểm tra đầu vào hợp lệ
  if (!origin || !destination || !departureDate) {
    const error = new Error('Missing required search parameters');
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  // 2. BẮT LỖI: Điểm đi và điểm đến trùng nhau
  if (origin.toUpperCase() === destination.toUpperCase()) {
    const error = new Error('Origin and destination cannot be the same');
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const passengerCount = parseInt(passengers, 10);
  if (isNaN(passengerCount) || passengerCount < 1) {
    const error = new Error('Passengers must be a valid number greater than 0');
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  // 3. Tìm Sân bay
  const [originAirport, destAirport] = await Promise.all([
    Airport.findOne({ iata_code: origin.toUpperCase() }),
    Airport.findOne({ iata_code: destination.toUpperCase() })
  ]);

  if (!originAirport || !destAirport) {
    return { trips: [], total: 0, page, limit };
  }

  // 4. Khoảng thời gian trong ngày
  const startOfDay = new Date(departureDate);
  startOfDay.setUTCHours(0, 0, 0, 0);
  
  const endOfDay = new Date(departureDate);
  endOfDay.setUTCHours(23, 59, 59, 999);

  // 5. Cấu hình Sắp xếp (Sorting)
  let sortCriteria = { departure_time: 1 }; // Mặc định: Giờ khởi hành sớm nhất
  if (sort === 'price:asc') {
    sortCriteria = { 'prices.economy': 1 }; // Giá vé thấp nhất
  } else if (sort === 'price:desc') {
    sortCriteria = { 'prices.economy': -1 }; // Giá vé cao nhất
  }

  // 6. Truy vấn danh sách chuyến bay
  const flights = await Flight.find({
    departure_airport_id: originAirport._id,
    arrival_airport_id: destAirport._id,
    departure_time: { $gte: startOfDay, $lte: endOfDay },
    status: 'SCHEDULED' 
  })
  .populate('airline_id', 'name iata_code logo_url')
  .populate('departure_airport_id', 'name iata_code city country') 
  .populate('arrival_airport_id', 'name iata_code city country')   
  .sort(sortCriteria) 
  .lean(); 
  
  // 7. LỌC SỐ HÀNH KHÁCH: Chỉ giữ lại chuyến có đủ ghế trống
  const validFlights = [];
  for (const flight of flights) {
    const availableSeats = await Seat.countDocuments({
      flight_id: flight._id,
      status: 'AVAILABLE'
    });

    if (availableSeats >= passengerCount) {
      validFlights.push({
        ...flight,
        available_seats_count: availableSeats // Kèm theo số ghế trống để UI dùng
      });
    }
  }

  // 8. Cấu hình Phân trang (Pagination)
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;
  const paginatedFlights = validFlights.slice(skip, skip + limitNum);

  return {
    trips: paginatedFlights,
    total: validFlights.length,
    page: pageNum,
    limit: limitNum
  };
};

module.exports = { findFlights };