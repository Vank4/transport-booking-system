const Flight = require("../models/flights.model");
const Airport = require("../models/airports.model");
const Airline = require("../models/airlines.model");
const Seat = require("../models/seats.model");
const TrainTrip = require("../models/trainTrips.model");
const TrainStation = require("../models/trainStations.model");
const TrainCarriage = require("../models/trainCarriages.model");

const clampLimit = (limit, fallback = 20) =>
  Math.max(1, Math.min(Number(limit) || fallback, 50));

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
    const error = new Error("Diem di va diem den khong duoc trung nhau");
    error.status = 400;
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  const passengerCount = parseInt(passengers, 10) || 1;
  const query = {
    status: "SCHEDULED",
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

  if (departureDate) {
    const startOfDay = new Date(departureDate);
    const endOfDay = new Date(departureDate);

    if (filters.time_from) {
      const [h, m] = filters.time_from.split(":");
      startOfDay.setUTCHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
    } else {
      startOfDay.setUTCHours(0, 0, 0, 0);
    }

    if (filters.time_to) {
      const [h, m] = filters.time_to.split(":");
      endOfDay.setUTCHours(parseInt(h, 10), parseInt(m, 10), 59, 999);
    } else {
      endOfDay.setUTCHours(23, 59, 59, 999);
    }

    query.departure_time = { $gte: startOfDay, $lte: endOfDay };
  }

  const seatClass = filters.seat_class
    ? filters.seat_class.toLowerCase()
    : "economy";
  const priceField = `prices.${seatClass}`;

  if (filters.min_price || filters.max_price) {
    query[priceField] = {};
    if (filters.min_price) query[priceField].$gte = Number(filters.min_price);
    if (filters.max_price) query[priceField].$lte = Number(filters.max_price);
  }

  if (filters.airlines) {
    const airlineCodes = filters.airlines.split(",");
    const matchingAirlines = await Airline.find({
      iata_code: { $in: airlineCodes },
    });
    query.airline_id = { $in: matchingAirlines.map((airline) => airline._id) };
  }

  let sortCriteria = { departure_time: 1 };
  if (sort === "price:asc") sortCriteria = { [priceField]: 1 };
  if (sort === "price:desc") sortCriteria = { [priceField]: -1 };

  const flights = await Flight.find(query)
    .populate("airline_id", "name iata_code logo_url")
    .populate("departure_airport_id", "name iata_code city country")
    .populate("arrival_airport_id", "name iata_code city country")
    .sort(sortCriteria)
    .lean();

  const validFlights = [];
  for (const flight of flights) {
    const availableSeats = await Seat.countDocuments({
      flight_id: flight._id,
      status: "AVAILABLE",
      class: seatClass.toUpperCase(),
    });

    if (availableSeats >= passengerCount) {
      const resolvedPrices = {
        economy: flight.prices?.economy ?? 1500000,
        business: flight.prices?.business ?? 3000000,
      };
      validFlights.push({
        ...flight,
        prices: resolvedPrices,
        available_seats_count: availableSeats,
        current_price:
          resolvedPrices[seatClass] ??
          resolvedPrices.economy,
      });
    }
  }
  const filter_counts = {
    airlines: {},
    departure_time: {
      morning: 0, // 00:00 - 06:00
      noon: 0, // 06:00 - 12:00
      afternoon: 0, // 12:00 - 18:00
      evening: 0, // 18:00 - 24:00
    },
  };

  validFlights.forEach((flight) => {
    // 1. Đếm Hãng bay
    const airlineCode = flight.airline_id?.iata_code;
    if (airlineCode) {
      filter_counts.airlines[airlineCode] =
        (filter_counts.airlines[airlineCode] || 0) + 1;
    }

    // 2. Đếm Thời gian
    const hour = new Date(flight.departure_time).getHours();
    if (hour >= 0 && hour < 6) filter_counts.departure_time.morning += 1;
    else if (hour >= 6 && hour < 12) filter_counts.departure_time.noon += 1;
    else if (hour >= 12 && hour < 18)
      filter_counts.departure_time.afternoon += 1;
    else if (hour >= 18 && hour <= 24)
      filter_counts.departure_time.evening += 1;
  });

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = clampLimit(limit, 20);
  return {
    trips: validFlights.slice((pageNum - 1) * limitNum, pageNum * limitNum),
    total: validFlights.length,
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
    if (!originStation) {
      return { trips: [], total: 0, page, limit, filter_counts: {} };
    }
    query.departure_station_id = originStation._id;
  }

  if (destination) {
    const destStation = await TrainStation.findOne({ name: destination });
    if (!destStation) {
      return { trips: [], total: 0, page, limit, filter_counts: {} };
    }
    query.arrival_station_id = destStation._id;
  }

  if (departureDate) {
    const searchDate = new Date(departureDate);
    const start = new Date(searchDate).setUTCHours(0, 0, 0, 0);
    const end = new Date(searchDate).setUTCHours(23, 59, 59, 999);
    query.departure_time = { $gte: start, $lte: end };
  }

  const trips = await TrainTrip.find(query)
    .populate("train_id", "train_number name")
    .populate("departure_station_id", "name city")
    .populate("arrival_station_id", "name city")
    .lean();

  for (const trip of trips) {
    const carriageCondition = { train_trip_id: trip._id };
    if (filters.seat_class) {
      carriageCondition.type = filters.seat_class.toUpperCase();
    }

    const carriages = await TrainCarriage.find(carriageCondition).lean();
    trip.starting_price =
      carriages.length > 0
        ? Math.min(...carriages.map((carriage) => carriage.base_price))
        : 0;
  }

  const filter_counts = {
    airlines: {},
    departure_time: {
      morning: 0,
      noon: 0,
      afternoon: 0,
      evening: 0,
    },
  };

  trips.forEach((trip) => {
    const trainCode = trip.train_id?.train_number || trip.train_id?.name || "TRAIN";
    filter_counts.airlines[trainCode] =
      (filter_counts.airlines[trainCode] || 0) + 1;

    const hour = new Date(trip.departure_time).getHours();
    if (hour >= 0 && hour < 6) filter_counts.departure_time.morning += 1;
    else if (hour >= 6 && hour < 12) filter_counts.departure_time.noon += 1;
    else if (hour >= 12 && hour < 18) filter_counts.departure_time.afternoon += 1;
    else if (hour >= 18 && hour <= 24) filter_counts.departure_time.evening += 1;
  });

  let sortedTrips = [...trips];
  if (sort === "price:asc") {
    sortedTrips.sort((a, b) => (a.starting_price || 0) - (b.starting_price || 0));
  } else if (sort === "price:desc") {
    sortedTrips.sort((a, b) => (b.starting_price || 0) - (a.starting_price || 0));
  } else {
    sortedTrips.sort(
      (a, b) => new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime(),
    );
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

module.exports = {
  findFlights,
  findTrainTrips,
  getFlightDetails,
  getTrainTripDetails,
  checkFlightAvailability,
  checkTrainAvailability,
};

