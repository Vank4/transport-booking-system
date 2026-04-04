const Flight = require("../models/flights.model");
const Airport = require("../models/airports.model");
const Airline = require("../models/airlines.model");
const Seat = require("../models/seats.model");
const FlightFare = require("../models/flightFares.model");
const TrainTrip = require("../models/trainTrips.model");
const TrainStation = require("../models/trainStations.model");
const TrainCarriage = require("../models/trainCarriages.model");

const clampLimit = (limit, fallback = 20) =>
  Math.max(1, Math.min(Number(limit) || fallback, 50));

const normalizeCountry = (value = "") => value.trim().toLowerCase();
const isVietnamAirport = (airport) =>
  ["vietnam", "viet nam", "vn"].includes(
    normalizeCountry(airport?.country || ""),
  );

const listAirports = async ({ q = "", limit = 20 } = {}) => {
  const trimmed = q.trim();
  const query = trimmed
    ? {
      $or: [
        { city: new RegExp(trimmed, "i") },
        { name: new RegExp(trimmed, "i") },
        { iata_code: new RegExp(trimmed, "i") },
        { country: new RegExp(trimmed, "i") },
      ],
    }
    : {};

  const items = await Airport.find(query)
    .sort({ city: 1, name: 1 })
    .limit(clampLimit(limit))
    .lean();

  return items.map((airport) => ({
    id: airport._id,
    code: airport.iata_code,
    label: airport.city,
    subtitle: `${airport.name} (${airport.iata_code})`,
    city: airport.city,
    country: airport.country,
    name: airport.name,
  }));
};

const listTrainStations = async ({ q = "", limit = 20 } = {}) => {
  const trimmed = q.trim();
  const query = trimmed
    ? {
      $or: [
        { city: new RegExp(trimmed, "i") },
        { name: new RegExp(trimmed, "i") },
      ],
    }
    : {};

  const items = await TrainStation.find(query)
    .sort({ city: 1, name: 1 })
    .limit(clampLimit(limit))
    .lean();

  return items.map((station) => ({
    id: station._id,
    code: station.name,
    label: station.city,
    subtitle: station.name,
    city: station.city,
    name: station.name,
  }));
};

const findFlights = async ({
  origin,
  destination,
  departureDate,
  passengers = 1,
  sort,
  page = 1,
  limit = 20,
  filters = {},
}) => {
  if (origin && destination && origin.toUpperCase() === destination.toUpperCase()) {
    const error = new Error("Điểm đi và điểm đến không được trùng nhau");
    error.status = 400;
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  const passengerCount = parseInt(passengers, 10) || 1;

  // ─── BƯỚC 1: Lọc FlightFare theo hạng ghế + giá ───────────────────────────
  const seatClass = filters.seat_class ? filters.seat_class.toLowerCase() : "economy";
  const cabinClass = seatClass.toUpperCase(); // ECONOMY | BUSINESS | ...

  let validFlightIds = null;
  const fareQuery = { is_active: true, cabin_class: cabinClass };

  if (filters.min_price || filters.max_price) {
    fareQuery.base_price = {};
    if (filters.min_price) fareQuery.base_price.$gte = Number(filters.min_price);
    if (filters.max_price) fareQuery.base_price.$lte = Number(filters.max_price);
  }

  const matchingFares = await FlightFare.find(fareQuery).select("flight_id base_price promo_price");
  validFlightIds = [...new Set(matchingFares.map((f) => f.flight_id.toString()))];

  if (validFlightIds.length === 0) {
    return { trips: [], total: 0, page, limit, filter_counts: {} };
  }

  // ─── BƯỚC 2: Build query Flight ────────────────────────────────────────────
  const query = {
    status: "SCHEDULED",
    _id: { $in: validFlightIds },
  };

  if (origin) {
    const originAirport = await Airport.findOne({ iata_code: origin.toUpperCase() });
    if (!originAirport) return { trips: [], total: 0, page, limit, filter_counts: {} };
    query.departure_airport_id = originAirport._id;
  }

  if (destination) {
    const destAirport = await Airport.findOne({ iata_code: destination.toUpperCase() });
    if (!destAirport) return { trips: [], total: 0, page, limit, filter_counts: {} };
    query.arrival_airport_id = destAirport._id;
  }

  const now = new Date();
  if (departureDate) {
    const startOfDay = new Date(departureDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(departureDate);
    endOfDay.setHours(23, 59, 59, 999);
    query.departure_time = {
      $gte: startOfDay < now ? now : startOfDay,
      $lte: endOfDay,
    };
  } else {
    query.departure_time = { $gte: now };
  }

  if (filters.airlines) {
    const airlineCodes = filters.airlines.split(",");
    const matchingAirlines = await Airline.find({ iata_code: { $in: airlineCodes } });
    query.airline_id = { $in: matchingAirlines.map((airline) => airline._id) };
  }

  const flights = await Flight.find(query)
    .populate("airline_id", "name iata_code logo_url")
    .populate("departure_airport_id", "name iata_code city country")
    .populate("arrival_airport_id", "name iata_code city country")
    .sort({ departure_time: 1 })
    .lean();

  // ─── BƯỚC 3: Lọc ghế trống + khung giờ + tính giá từ FlightFare ──────────
  // Build map fare theo flight_id để tra nhanh
  const faresByFlightId = {};
  matchingFares.forEach((f) => {
    const fid = f.flight_id.toString();
    if (!faresByFlightId[fid]) faresByFlightId[fid] = [];
    faresByFlightId[fid].push(f);
  });

  const validFlights = [];
  for (const flight of flights) {
    // 🔥 LỌC KHUNG GIỜ BẰNG JAVASCRIPT (Khắc phục triệt để lệch múi giờ)
    let isTimeValid = true;
    if (filters.times) {
      const selectedTimes = filters.times.split(",");
      const hour = new Date(flight.departure_time).getHours();

      let matched = false;
      if (selectedTimes.includes('morning') && hour >= 0 && hour < 6) matched = true;
      if (selectedTimes.includes('noon') && hour >= 6 && hour < 12) matched = true;
      if (selectedTimes.includes('afternoon') && hour >= 12 && hour < 18) matched = true;
      if (selectedTimes.includes('evening') && hour >= 18 && hour <= 24) matched = true;

      isTimeValid = matched;
    }

    if (!isTimeValid) continue;

    const availableSeats = await Seat.countDocuments({
      flight_id: flight._id,
      status: "AVAILABLE",
      class: cabinClass,
    });

    if (availableSeats < passengerCount) continue;

    // Tính starting_price từ FlightFare (giá thấp nhất trong hạng đang chọn)
    const flightFares = faresByFlightId[flight._id.toString()] || [];
    const startingPrice = flightFares.length > 0
      ? Math.min(...flightFares.map((f) => f.promo_price ?? f.base_price))
      : 0;

    validFlights.push({
      ...flight,
      available_seats_count: availableSeats,
      starting_price: startingPrice,
      current_price: startingPrice,
    });
  }

  // ─── BƯỚC 4: Filter counts + Sort ─────────────────────────────────────────
  const filter_counts = {
    airlines: {},
    departure_time: { morning: 0, noon: 0, afternoon: 0, evening: 0 },
  };

  validFlights.forEach((flight) => {
    const airlineCode = flight.airline_id?.iata_code;
    if (airlineCode) {
      filter_counts.airlines[airlineCode] = (filter_counts.airlines[airlineCode] || 0) + 1;
    }
    const hour = new Date(flight.departure_time).getHours();
    if (hour >= 0 && hour < 6) filter_counts.departure_time.morning += 1;
    else if (hour >= 6 && hour < 12) filter_counts.departure_time.noon += 1;
    else if (hour >= 12 && hour < 18) filter_counts.departure_time.afternoon += 1;
    else if (hour >= 18 && hour <= 24) filter_counts.departure_time.evening += 1;
  });

  // Sort bằng JS (tương tự findTrainTrips)
  let sortedFlights = [...validFlights];
  if (sort === "price:asc") {
    sortedFlights.sort((a, b) => (a.starting_price || 0) - (b.starting_price || 0));
  } else if (sort === "price:desc") {
    sortedFlights.sort((a, b) => (b.starting_price || 0) - (a.starting_price || 0));
  } else {
    sortedFlights.sort((a, b) => new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime());
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = clampLimit(limit, 20);
  return {
    trips: sortedFlights.slice((pageNum - 1) * limitNum, pageNum * limitNum),
    total: sortedFlights.length,
    page: pageNum,
    limit: limitNum,
    filter_counts,
  };
};

const findTrainTrips = async ({
  origin,
  destination,
  departureDate,
  page = 1,
  limit = 20,
  sort,
  filters = {},
}) => {
  let validTripIds = null;
  const carriageQuery = {};

  if (filters.seat_class) carriageQuery.type = filters.seat_class.toUpperCase();
  if (filters.min_price || filters.max_price) {
    carriageQuery.base_price = {};
    if (filters.min_price) carriageQuery.base_price.$gte = Number(filters.min_price);
    if (filters.max_price) carriageQuery.base_price.$lte = Number(filters.max_price);
  }

  if (Object.keys(carriageQuery).length > 0) {
    const carriages = await TrainCarriage.find(carriageQuery).select("train_trip_id");
    validTripIds = carriages.map((carriage) => carriage.train_trip_id);
    if (validTripIds.length === 0) {
      return { trips: [], total: 0, page, limit, filter_counts: {} };
    }
  }

  const query = { status: "SCHEDULED" };
  if (validTripIds) query._id = { $in: validTripIds };

  if (origin) {
    const originStation = await TrainStation.findOne({ name: origin });
    if (!originStation) return { trips: [], total: 0, page, limit, filter_counts: {} };
    query.departure_station_id = originStation._id;
  }

  if (destination) {
    const destStation = await TrainStation.findOne({ name: destination });
    if (!destStation) return { trips: [], total: 0, page, limit, filter_counts: {} };
    query.arrival_station_id = destStation._id;
  }

  if (departureDate) {
    const searchDate = new Date(departureDate);
    searchDate.setHours(0, 0, 0, 0);
    const end = new Date(searchDate);
    end.setHours(23, 59, 59, 999);
    query.departure_time = { $gte: searchDate, $lte: end };
  }

  const trips = await TrainTrip.find(query)
    .populate("train_id", "train_number name")
    .populate("departure_station_id", "name city")
    .populate("arrival_station_id", "name city")
    .lean();

  const validTrips = [];
  for (const trip of trips) {
    //LỌC KHUNG GIỜ CHO TÀU HỎA
    let isTimeValid = true;
    if (filters.times) {
      const selectedTimes = filters.times.split(",");
      const hour = new Date(trip.departure_time).getHours();

      let matched = false;
      if (selectedTimes.includes('morning') && hour >= 0 && hour < 6) matched = true;
      if (selectedTimes.includes('noon') && hour >= 6 && hour < 12) matched = true;
      if (selectedTimes.includes('afternoon') && hour >= 12 && hour < 18) matched = true;
      if (selectedTimes.includes('evening') && hour >= 18 && hour <= 24) matched = true;

      isTimeValid = matched;
    }

    if (!isTimeValid) continue;

    const carriageCondition = { train_trip_id: trip._id };
    if (filters.seat_class) {
      carriageCondition.type = filters.seat_class.toUpperCase();
    }

    const carriages = await TrainCarriage.find(carriageCondition).lean();
    trip.starting_price = carriages.length > 0 ? Math.min(...carriages.map((c) => c.base_price)) : 0;

    validTrips.push(trip);
  }

  const filter_counts = {
    airlines: {},
    departure_time: { morning: 0, noon: 0, afternoon: 0, evening: 0 },
  };

  validTrips.forEach((trip) => {
    const trainCode = trip.train_id?.train_number || trip.train_id?.name || "TRAIN";
    filter_counts.airlines[trainCode] = (filter_counts.airlines[trainCode] || 0) + 1;

    const hour = new Date(trip.departure_time).getHours();
    if (hour >= 0 && hour < 6) filter_counts.departure_time.morning += 1;
    else if (hour >= 6 && hour < 12) filter_counts.departure_time.noon += 1;
    else if (hour >= 12 && hour < 18) filter_counts.departure_time.afternoon += 1;
    else if (hour >= 18 && hour <= 24) filter_counts.departure_time.evening += 1;
  });

  let sortedTrips = [...validTrips];
  if (sort === "price:asc") {
    sortedTrips.sort((a, b) => (a.starting_price || 0) - (b.starting_price || 0));
  } else if (sort === "price:desc") {
    sortedTrips.sort((a, b) => (b.starting_price || 0) - (a.starting_price || 0));
  } else {
    sortedTrips.sort((a, b) => new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime());
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = clampLimit(limit, 20);
  return {
    trips: sortedTrips.slice((pageNum - 1) * limitNum, pageNum * limitNum),
    total: sortedTrips.length,
    page: pageNum,
    limit: limitNum,
    filter_counts,
  };
};

const getFlightDetails = async (flightId) => {
  const flight = await Flight.findById(flightId)
    .populate("airline_id", "name iata_code logo_url")
    .populate("departure_airport_id", "name city country iata_code")
    .populate("arrival_airport_id", "name city country iata_code")
    .lean();

  if (!flight) {
    const error = new Error("Khong tim thay chuyen bay");
    error.status = 404;
    error.code = "TRIP_NOT_FOUND";
    throw error;
  }

  if (flight.status === "CANCELLED") {
    const error = new Error("Chuyen bay nay da bi huy");
    error.status = 400;
    error.code = "TRIP_CANCELLED";
    throw error;
  }

  // Lấy danh sách hạng vé từ FlightFare
  const fares = await FlightFare.find({ flight_id: flightId, is_active: true })
    .select("cabin_class fare_name base_price promo_price baggage_kg carry_on_kg is_refundable change_fee available_seats")
    .sort({ base_price: 1 })
    .lean();

  const availableEconomy = await Seat.countDocuments({
    flight_id: flightId,
    class: "ECONOMY",
    status: "AVAILABLE",
  });
  const availableBusiness = await Seat.countDocuments({
    flight_id: flightId,
    class: "BUSINESS",
    status: "AVAILABLE",
  });

  return {
    ...flight,
    fares,
    available_seats: { economy: availableEconomy, business: availableBusiness },
  };
};

const getTrainTripDetails = async (tripId) => {
  const trip = await TrainTrip.findById(tripId)
    .populate("train_id", "train_number name")
    .populate("departure_station_id", "name city")
    .populate("arrival_station_id", "name city")
    .lean();

  if (!trip) {
    const error = new Error("Khong tim thay chuyen tau");
    error.status = 404;
    error.code = "TRIP_NOT_FOUND";
    throw error;
  }

  if (trip.status === "CANCELLED") {
    const error = new Error("Chuyen tau nay da bi huy");
    error.status = 400;
    error.code = "TRIP_CANCELLED";
    throw error;
  }

  const carriages = await TrainCarriage.find({ train_trip_id: tripId }).lean();
  return { ...trip, carriages_info: carriages };
};

const checkFlightAvailability = async (flightId, seatClass) => {
  const query = { flight_id: flightId, status: "AVAILABLE" };
  if (seatClass) query.class = seatClass.toUpperCase();

  const availableCount = await Seat.countDocuments(query);
  let status = "PLENTY";
  if (availableCount === 0) status = "SOLD_OUT";
  else if (availableCount <= 5) status = "FEW_LEFT";

  return { available_count: availableCount, status };
};

const checkTrainAvailability = async (tripId, seatClass) => {
  const carriageQuery = { train_trip_id: tripId };
  if (seatClass) carriageQuery.type = seatClass.toUpperCase();

  const carriages = await TrainCarriage.find(carriageQuery).select("_id");
  const carriageIds = carriages.map((carriage) => carriage._id);

  const availableCount = await Seat.countDocuments({
    carriage_id: { $in: carriageIds },
    status: "AVAILABLE",
  });

  let status = "PLENTY";
  if (availableCount === 0) status = "SOLD_OUT";
  else if (availableCount <= 5) status = "FEW_LEFT";

  return { available_count: availableCount, status };
};

const getHomeFlightDeals = async ({
  scope = "domestic",
  limit = 18,
  perDestinationLimit = 12,
} = {}) => {
  const normalizedScope = scope === "international" ? "international" : "domestic";
  const now = new Date();

  const flights = await Flight.find({
    status: "SCHEDULED",
    departure_time: { $gte: now },
  })
    .populate("departure_airport_id", "name city country iata_code")
    .populate("arrival_airport_id", "name city country iata_code")
    .sort({ departure_time: 1 })
    .limit(120)
    .lean();

  const filteredFlights = flights.filter((flight) => {
    const departureAirport = flight.departure_airport_id;
    const arrivalAirport = flight.arrival_airport_id;
    if (!departureAirport || !arrivalAirport) return false;

    const domestic =
      isVietnamAirport(departureAirport) && isVietnamAirport(arrivalAirport);

    return normalizedScope === "domestic" ? domestic : !domestic;
  });

  const flightIds = filteredFlights.map((flight) => flight._id);
  const fares = await FlightFare.find({
    flight_id: { $in: flightIds },
    is_active: true,
  })
    .select("flight_id base_price promo_price")
    .lean();

  const bestPriceByFlightId = new Map();
  fares.forEach((fare) => {
    const flightId = fare.flight_id.toString();
    const effectivePrice = fare.promo_price ?? fare.base_price ?? 0;
    const previous = bestPriceByFlightId.get(flightId);
    if (previous == null || effectivePrice < previous) {
      bestPriceByFlightId.set(flightId, effectivePrice);
    }
  });

  const groupedItems = new Map();

  filteredFlights.forEach((flight) => {
    const departureAirport = flight.departure_airport_id;
    const arrivalAirport = flight.arrival_airport_id;
    const destinationCode = arrivalAirport?.iata_code;
    if (!destinationCode) return;

    const startingPrice =
      bestPriceByFlightId.get(flight._id.toString()) ??
      flight.prices?.economy ??
      0;
    const oldPrice =
      startingPrice > 0 ? Math.round(startingPrice * 1.12) : startingPrice;

    const item = {
      id: flight._id,
      flight_id: flight._id,
      flight_number: flight.flight_number,
      departure_code: departureAirport?.iata_code ?? "",
      departure_city: departureAirport?.city ?? "",
      arrival_code: arrivalAirport?.iata_code ?? "",
      arrival_city: arrivalAirport?.city ?? "",
      departure_time: flight.departure_time,
      arrival_time: flight.arrival_time,
      destinationCode,
      destinationLabel: arrivalAirport?.city ?? destinationCode,
      current_price: startingPrice,
      old_price: oldPrice,
    };

    if (!groupedItems.has(destinationCode)) {
      groupedItems.set(destinationCode, []);
    }

    groupedItems.get(destinationCode).push(item);
  });

  const tabs = [];
  const items = [];

  Array.from(groupedItems.entries())
    .slice(0, clampLimit(limit, 18))
    .forEach(([code, group]) => {
      const sortedGroup = group
        .sort(
          (a, b) =>
            new Date(a.departure_time).getTime() -
            new Date(b.departure_time).getTime(),
        )
        .slice(0, clampLimit(perDestinationLimit, 6));

      if (sortedGroup.length === 0) return;

      tabs.push({
        code,
        label: sortedGroup[0].destinationLabel || code,
      });
      items.push(...sortedGroup);
    });

  return {
    scope: normalizedScope,
    tabs,
    items,
  };
};

module.exports = {
  listAirports,
  listTrainStations,
  findFlights,
  findTrainTrips,
  getFlightDetails,
  getTrainTripDetails,
  checkFlightAvailability,
  checkTrainAvailability,
  getHomeFlightDeals,
};
