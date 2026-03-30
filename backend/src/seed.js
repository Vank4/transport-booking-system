/**
 * Seed Script — Tạo dữ liệu mẫu cho toàn bộ hệ thống Transport Booking
 * 
 * Chạy: node src/seed.js
 * 
 * ⚠️  Script sẽ XÓA TOÀN BỘ dữ liệu cũ trước khi seed.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// ─── MODELS ──────────────────────────────────────────────────────────
const User = require("./models/users.model");
const Airline = require("./models/airlines.model");
const Airport = require("./models/airports.model");
const Flight = require("./models/flights.model");
const FlightFare = require("./models/flightFares.model");
const Train = require("./models/trains.model");
const TrainStation = require("./models/trainStations.model");
const TrainTrip = require("./models/trainTrips.model");
const TrainCarriage = require("./models/trainCarriages.model");
const Seat = require("./models/seats.model");
const Booking = require("./models/bookings.model");
const Ticket = require("./models/tickets.model");
const Payment = require("./models/payments.model");
const Voucher = require("./models/vouchers.model");

// ─── HELPERS ─────────────────────────────────────────────────────────
const futureDate = (daysFromNow, hours = 8, minutes = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

const randomCode = (prefix, len = 6) =>
  prefix + Math.random().toString(36).substring(2, 2 + len).toUpperCase();

// ─── SEED DATA ───────────────────────────────────────────────────────
async function seed() {
  const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/transport_booking";
  console.log(`🔌 Connecting to ${MONGO_URI}...`);
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected!\n");

  // ===== CLEAN =====
  console.log("🗑️  Cleaning old data...");
  await Promise.all([
    User.deleteMany({}),
    Airline.deleteMany({}),
    Airport.deleteMany({}),
    Flight.deleteMany({}),
    FlightFare.deleteMany({}),
    Train.deleteMany({}),
    TrainStation.deleteMany({}),
    TrainTrip.deleteMany({}),
    TrainCarriage.deleteMany({}),
    Seat.deleteMany({}),
    Booking.deleteMany({}),
    Ticket.deleteMany({}),
    Payment.deleteMany({}),
    Voucher.deleteMany({}),
  ]);
  console.log("   Done.\n");

  // ===== 1. USERS =====
  console.log("👤 Seeding Users...");
  const hashedPw = await bcrypt.hash("123456", 10);
  const users = await User.insertMany([
    { full_name: "Admin Hệ Thống", email: "admin@traveladmin.vn", phone: "0900000001", password_hash: hashedPw, role: "ADMIN", status: "ACTIVE", gender: "Nam" },
    { full_name: "Nguyễn Văn An", email: "nguyenvanan@gmail.com", phone: "0901234567", password_hash: hashedPw, role: "USER", status: "ACTIVE", gender: "Nam", id_card: "012345678901" },
    { full_name: "Trần Thị Bích", email: "tranthibich@gmail.com", phone: "0912345678", password_hash: hashedPw, role: "USER", status: "ACTIVE", gender: "Nữ", id_card: "098765432100" },
    { full_name: "Lê Hoàng Cường", email: "lehoangcuong@gmail.com", phone: "0923456789", password_hash: hashedPw, role: "USER", status: "ACTIVE", gender: "Nam", id_card: "034567891234" },
    { full_name: "Phạm Minh Đức", email: "phamminhduc@gmail.com", phone: "0934567890", password_hash: hashedPw, role: "USER", status: "BLOCKED", gender: "Nam", id_card: "045678901234" },
  ]);
  console.log(`   ✅ ${users.length} users created (password: 123456)\n`);

  // ===== 2. AIRLINES =====
  console.log("✈️  Seeding Airlines...");
  const airlines = await Airline.insertMany([
    { name: "Vietnam Airlines", iata_code: "VN", logo_url: "https://upload.wikimedia.org/wikipedia/en/a/a4/Vietnam_Airlines_logo.svg" },
    { name: "VietJet Air", iata_code: "VJ", logo_url: "https://upload.wikimedia.org/wikipedia/commons/8/8e/VietJet_Air_logo.svg" },
    { name: "Bamboo Airways", iata_code: "QH", logo_url: "https://upload.wikimedia.org/wikipedia/vi/6/60/Bamboo_Airways_Logo.png" },
  ]);
  console.log(`   ✅ ${airlines.length} airlines\n`);

  // ===== 3. AIRPORTS =====
  console.log("🛫 Seeding Airports...");
  const airports = await Airport.insertMany([
    { iata_code: "SGN", name: "Tân Sơn Nhất", city: "TP. Hồ Chí Minh", country: "Việt Nam" },
    { iata_code: "HAN", name: "Nội Bài", city: "Hà Nội", country: "Việt Nam" },
    { iata_code: "DAD", name: "Đà Nẵng", city: "Đà Nẵng", country: "Việt Nam" },
    { iata_code: "CXR", name: "Cam Ranh", city: "Nha Trang", country: "Việt Nam" },
    { iata_code: "PQC", name: "Phú Quốc", city: "Phú Quốc", country: "Việt Nam" },
  ]);
  console.log(`   ✅ ${airports.length} airports\n`);

  // ===== 4. FLIGHTS =====
  console.log("🛩️  Seeding Flights...");
  const flights = await Flight.insertMany([
    { airline_id: airlines[0]._id, flight_number: "VN200", departure_airport_id: airports[0]._id, arrival_airport_id: airports[1]._id, departure_time: futureDate(3, 6, 0), arrival_time: futureDate(3, 8, 15), status: "SCHEDULED", prices: { economy: 1500000, business: 3500000 } },
    { airline_id: airlines[0]._id, flight_number: "VN201", departure_airport_id: airports[1]._id, arrival_airport_id: airports[0]._id, departure_time: futureDate(3, 18, 0), arrival_time: futureDate(3, 20, 10), status: "SCHEDULED", prices: { economy: 1600000, business: 3800000 } },
    { airline_id: airlines[1]._id, flight_number: "VJ370", departure_airport_id: airports[0]._id, arrival_airport_id: airports[2]._id, departure_time: futureDate(5, 7, 30), arrival_time: futureDate(5, 9, 0), status: "SCHEDULED", prices: { economy: 890000, business: 2200000 } },
    { airline_id: airlines[1]._id, flight_number: "VJ520", departure_airport_id: airports[0]._id, arrival_airport_id: airports[4]._id, departure_time: futureDate(7, 10, 0), arrival_time: futureDate(7, 12, 0), status: "SCHEDULED", prices: { economy: 750000, business: 1800000 } },
    { airline_id: airlines[2]._id, flight_number: "QH101", departure_airport_id: airports[2]._id, arrival_airport_id: airports[1]._id, departure_time: futureDate(2, 14, 0), arrival_time: futureDate(2, 15, 30), status: "DELAYED", prices: { economy: 1200000, business: 2900000 } },
    { airline_id: airlines[0]._id, flight_number: "VN400", departure_airport_id: airports[1]._id, arrival_airport_id: airports[3]._id, departure_time: futureDate(10, 9, 0), arrival_time: futureDate(10, 11, 30), status: "SCHEDULED", prices: { economy: 1400000, business: 3200000 } },
  ]);
  console.log(`   ✅ ${flights.length} flights\n`);

  // ===== 5. FLIGHT FARES =====
  console.log("💲 Seeding Flight Fares...");
  const faresData = [];
  for (const flight of flights) {
    faresData.push(
      { flight_id: flight._id, cabin_class: "ECONOMY", fare_name: "Eco Saver", base_price: flight.prices.economy, promo_price: null, baggage_kg: 20, carry_on_kg: 7, is_refundable: false, change_fee: 500000, available_seats: 120, is_active: true },
      { flight_id: flight._id, cabin_class: "ECONOMY", fare_name: "Eco Flex", base_price: flight.prices.economy + 300000, baggage_kg: 30, carry_on_kg: 7, is_refundable: true, change_fee: 0, available_seats: 40, is_active: true },
      { flight_id: flight._id, cabin_class: "BUSINESS", fare_name: "Business Standard", base_price: flight.prices.business, baggage_kg: 40, carry_on_kg: 10, is_refundable: true, change_fee: 0, available_seats: 20, is_active: true },
    );
  }
  const fares = await FlightFare.insertMany(faresData);
  console.log(`   ✅ ${fares.length} flight fares\n`);

  // ===== 6. SEATS (Flight) =====
  console.log("💺 Seeding Flight Seats...");
  const flightSeatsData = [];
  for (const flight of flights) {
    // 6 Economy seats, 4 Business seats per flight
    for (let r = 1; r <= 3; r++) {
      for (const col of ["A", "B"]) {
        flightSeatsData.push({ flight_id: flight._id, seat_number: `${r}${col}`, class: "ECONOMY", status: "AVAILABLE", price_modifier: 0 });
      }
    }
    for (let r = 1; r <= 2; r++) {
      for (const col of ["A", "B"]) {
        flightSeatsData.push({ flight_id: flight._id, seat_number: `B${r}${col}`, class: "BUSINESS", status: "AVAILABLE", price_modifier: 200000 });
      }
    }
  }
  const flightSeats = await Seat.insertMany(flightSeatsData);
  console.log(`   ✅ ${flightSeats.length} flight seats\n`);

  // ===== 7. TRAINS =====
  console.log("🚆 Seeding Trains...");
  const trains = await Train.insertMany([
    { train_number: "SE1", name: "Tàu Thống Nhất SE1" },
    { train_number: "SE3", name: "Tàu Thống Nhất SE3" },
    { train_number: "SE7", name: "Tàu Nhanh SE7" },
    { train_number: "SPT1", name: "Tàu Sài Gòn - Phan Thiết" },
  ]);
  console.log(`   ✅ ${trains.length} trains\n`);

  // ===== 8. TRAIN STATIONS =====
  console.log("🏛️  Seeding Train Stations...");
  const stations = await TrainStation.insertMany([
    { name: "Ga Sài Gòn", city: "TP. Hồ Chí Minh" },
    { name: "Ga Hà Nội", city: "Hà Nội" },
    { name: "Ga Đà Nẵng", city: "Đà Nẵng" },
    { name: "Ga Nha Trang", city: "Nha Trang" },
    { name: "Ga Huế", city: "Huế" },
    { name: "Ga Phan Thiết", city: "Phan Thiết" },
  ]);
  console.log(`   ✅ ${stations.length} stations\n`);

  // ===== 9. TRAIN TRIPS =====
  console.log("🗓️  Seeding Train Trips...");
  const trainTrips = await TrainTrip.insertMany([
    { train_id: trains[0]._id, departure_station_id: stations[0]._id, arrival_station_id: stations[1]._id, departure_time: futureDate(2, 19, 0), arrival_time: futureDate(3, 5, 30), status: "SCHEDULED" },
    { train_id: trains[1]._id, departure_station_id: stations[1]._id, arrival_station_id: stations[0]._id, departure_time: futureDate(4, 22, 0), arrival_time: futureDate(5, 8, 0), status: "SCHEDULED" },
    { train_id: trains[2]._id, departure_station_id: stations[0]._id, arrival_station_id: stations[2]._id, departure_time: futureDate(3, 6, 0), arrival_time: futureDate(3, 22, 0), status: "SCHEDULED" },
    { train_id: trains[3]._id, departure_station_id: stations[0]._id, arrival_station_id: stations[5]._id, departure_time: futureDate(1, 7, 0), arrival_time: futureDate(1, 11, 30), status: "DELAYED" },
    { train_id: trains[0]._id, departure_station_id: stations[2]._id, arrival_station_id: stations[4]._id, departure_time: futureDate(6, 8, 0), arrival_time: futureDate(6, 12, 0), status: "SCHEDULED" },
  ]);
  console.log(`   ✅ ${trainTrips.length} train trips\n`);

  // ===== 10. TRAIN CARRIAGES =====
  console.log("🚃 Seeding Train Carriages...");
  const carriagesData = [];
  for (const trip of trainTrips) {
    carriagesData.push(
      { train_trip_id: trip._id, carriage_number: "TOA-01", type: "ECONOMY", base_price: 400000 },
      { train_trip_id: trip._id, carriage_number: "TOA-02", type: "ECONOMY", base_price: 400000 },
      { train_trip_id: trip._id, carriage_number: "TOA-VIP", type: "BUSINESS", base_price: 850000 },
    );
  }
  const carriages = await TrainCarriage.insertMany(carriagesData);
  console.log(`   ✅ ${carriages.length} carriages\n`);

  // ===== 11. SEATS (Train) =====
  console.log("💺 Seeding Train Seats...");
  const trainSeatsData = [];
  for (const carriage of carriages) {
    const seatCount = carriage.type === "BUSINESS" ? 4 : 6;
    for (let i = 1; i <= seatCount; i++) {
      trainSeatsData.push({ carriage_id: carriage._id, seat_number: `${carriage.carriage_number}-G${i}`, class: carriage.type, status: "AVAILABLE", price_modifier: 0 });
    }
  }
  const trainSeats = await Seat.insertMany(trainSeatsData);
  console.log(`   ✅ ${trainSeats.length} train seats\n`);

  // ===== 12. VOUCHERS =====
  console.log("🎟️  Seeding Vouchers...");
  const vouchers = await Voucher.insertMany([
    { code: "WELCOME50K", discount_type: "FIXED", discount_value: 50000, min_order_value: 500000, max_discount: 50000, usage_limit: 100, used_count: 12, expiry_date: futureDate(30), is_active: true },
    { code: "SUMMER2024", discount_type: "PERCENTAGE", discount_value: 15, min_order_value: 1000000, max_discount: 200000, usage_limit: 50, used_count: 5, expiry_date: futureDate(60), is_active: true },
    { code: "TETHOLIDAY", discount_type: "PERCENTAGE", discount_value: 20, min_order_value: 2000000, max_discount: 500000, usage_limit: 200, used_count: 88, expiry_date: futureDate(90), is_active: true },
    { code: "FLASHSALE", discount_type: "FIXED", discount_value: 100000, min_order_value: 800000, max_discount: 100000, usage_limit: 30, used_count: 30, expiry_date: futureDate(-5), is_active: false },
    { code: "NEWUSER10", discount_type: "PERCENTAGE", discount_value: 10, min_order_value: 0, max_discount: 150000, usage_limit: 500, used_count: 0, expiry_date: futureDate(120), is_active: true },
  ]);
  console.log(`   ✅ ${vouchers.length} vouchers\n`);

  // ===== 13. BOOKINGS + TICKETS + PAYMENTS =====
  console.log("📋 Seeding Bookings, Tickets & Payments...");

  // --- Booking 1: User An đặt vé máy bay SGN→HAN (CONFIRMED) ---
  const seat1 = flightSeats.find(s => s.flight_id.equals(flights[0]._id) && s.seat_number === "1A");
  const seat2 = flightSeats.find(s => s.flight_id.equals(flights[0]._id) && s.seat_number === "1B");
  await Seat.updateMany({ _id: { $in: [seat1._id, seat2._id] } }, { status: "BOOKED" });

  const booking1 = await Booking.create({
    user_id: users[1]._id,
    booking_code: "BK-FL-001",
    booking_type: "FLIGHT",
    trip_id: flights[0]._id,
    total_amount: 3000000,
    status: "CONFIRMED",
    voucher_applied: "WELCOME50K",
    created_at: new Date(Date.now() - 86400000 * 2),
  });
  await Ticket.insertMany([
    { booking_id: booking1._id, seat_id: seat1._id, passenger_name: "NGUYEN VAN AN", passenger_id_card: "012345678901", final_price: 1500000, gender: "MALE", passenger_type: "ADULT", contact_info: { phone: "0901234567", email: "nguyenvanan@gmail.com" } },
    { booking_id: booking1._id, seat_id: seat2._id, passenger_name: "NGUYEN THI MAI", passenger_id_card: "012345678902", final_price: 1500000, gender: "FEMALE", passenger_type: "ADULT", date_of_birth: new Date("1995-05-15") },
  ]);
  await Payment.create({ booking_id: booking1._id, method: "VNPAY", transaction_id: "VNP-20240301-001", amount: 2950000, status: "SUCCESS", paid_at: new Date(Date.now() - 86400000 * 2) });

  // --- Booking 2: User Bích đặt vé tàu SGN→HN (WAITING_PAYMENT) ---
  const trainSeat1 = trainSeats.find(s => s.carriage_id.equals(carriages[0]._id) && s.seat_number.endsWith("G1"));
  await Seat.updateOne({ _id: trainSeat1._id }, { status: "HELD" });

  const booking2 = await Booking.create({
    user_id: users[2]._id,
    booking_code: "BK-TR-002",
    booking_type: "TRAIN",
    trip_id: trainTrips[0]._id,
    total_amount: 400000,
    status: "WAITING_PAYMENT",
    expires_at: futureDate(0, 23, 59),
    created_at: new Date(),
  });
  await Ticket.create({ booking_id: booking2._id, seat_id: trainSeat1._id, passenger_name: "TRAN THI BICH", passenger_id_card: "098765432100", final_price: 400000, gender: "FEMALE", passenger_type: "ADULT", contact_info: { phone: "0912345678" } });
  await Payment.create({ booking_id: booking2._id, method: "MOMO", amount: 400000, status: "PENDING" });

  // --- Booking 3: User Cường đặt vé bay VJ370 (CONFIRMED) ---
  const seat3 = flightSeats.find(s => s.flight_id.equals(flights[2]._id) && s.seat_number === "2A");
  await Seat.updateOne({ _id: seat3._id }, { status: "BOOKED" });

  const booking3 = await Booking.create({
    user_id: users[3]._id,
    booking_code: "BK-FL-003",
    booking_type: "FLIGHT",
    trip_id: flights[2]._id,
    total_amount: 890000,
    status: "CONFIRMED",
    created_at: new Date(Date.now() - 86400000 * 5),
  });
  await Ticket.create({ booking_id: booking3._id, seat_id: seat3._id, passenger_name: "LE HOANG CUONG", passenger_id_card: "034567891234", final_price: 890000, gender: "MALE", passenger_type: "ADULT", contact_info: { phone: "0923456789", email: "lehoangcuong@gmail.com" } });
  await Payment.create({ booking_id: booking3._id, method: "MOCK", transaction_id: "MOCK-003", amount: 890000, status: "SUCCESS", paid_at: new Date(Date.now() - 86400000 * 5) });

  // --- Booking 4: Khách vãng lai đặt tàu (CANCELLED) ---
  const trainSeat2 = trainSeats.find(s => s.carriage_id.equals(carriages[2]._id) && s.seat_number.endsWith("G1"));

  const booking4 = await Booking.create({
    user_id: null,
    booking_code: "BK-TR-004",
    booking_type: "TRAIN",
    trip_id: trainTrips[1]._id,
    total_amount: 850000,
    status: "CANCELLED",
    created_at: new Date(Date.now() - 86400000 * 10),
  });
  await Ticket.create({ booking_id: booking4._id, seat_id: trainSeat2._id, passenger_name: "KHACH VANG LAI", passenger_id_card: "000000000000", final_price: 850000, gender: "MALE", passenger_type: "ADULT" });
  await Payment.create({ booking_id: booking4._id, method: "VNPAY", amount: 850000, status: "FAILED" });

  // --- Booking 5: User An đặt thêm vé bay Business (PENDING) ---
  const seatBiz = flightSeats.find(s => s.flight_id.equals(flights[3]._id) && s.seat_number === "B1A");
  await Seat.updateOne({ _id: seatBiz._id }, { status: "HELD" });

  const booking5 = await Booking.create({
    user_id: users[1]._id,
    booking_code: "BK-FL-005",
    booking_type: "FLIGHT",
    trip_id: flights[3]._id,
    total_amount: 2000000,
    status: "PENDING",
    voucher_applied: "SUMMER2024",
    expires_at: futureDate(0, 23, 59),
    created_at: new Date(),
  });
  await Ticket.create({ booking_id: booking5._id, seat_id: seatBiz._id, passenger_name: "NGUYEN VAN AN", passenger_id_card: "012345678901", final_price: 2000000, gender: "MALE", passenger_type: "ADULT" });

  console.log("   ✅ 5 bookings + 6 tickets + 5 payments\n");

  // ===== DONE =====
  console.log("═══════════════════════════════════════════════════");
  console.log("🎉 SEED HOÀN TẤT! Tổng kết:");
  console.log(`   👤 Users:          ${users.length}`);
  console.log(`   ✈️  Airlines:       ${airlines.length}`);
  console.log(`   🛫 Airports:       ${airports.length}`);
  console.log(`   🛩️  Flights:        ${flights.length}`);
  console.log(`   💲 Flight Fares:   ${fares.length}`);
  console.log(`   💺 Flight Seats:   ${flightSeats.length}`);
  console.log(`   🚆 Trains:         ${trains.length}`);
  console.log(`   🏛️  Stations:       ${stations.length}`);
  console.log(`   🗓️  Train Trips:    ${trainTrips.length}`);
  console.log(`   🚃 Carriages:      ${carriages.length}`);
  console.log(`   💺 Train Seats:    ${trainSeats.length}`);
  console.log(`   🎟️  Vouchers:       ${vouchers.length}`);
  console.log(`   📋 Bookings:       5`);
  console.log(`   🎫 Tickets:        6`);
  console.log(`   💳 Payments:       5`);
  console.log("═══════════════════════════════════════════════════");
  console.log("\n🔑 Login: admin@traveladmin.vn / 123456");
  console.log("🔑 User:  nguyenvanan@gmail.com / 123456\n");

  await mongoose.disconnect();
  console.log("🔌 Disconnected. Bye!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
