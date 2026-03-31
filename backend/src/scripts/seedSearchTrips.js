const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const Airline = require("../models/airlines.model");
const Airport = require("../models/airports.model");
const Flight = require("../models/flights.model");
const FlightFare = require("../models/flightFares.model");
const Seat = require("../models/seats.model");
const Train = require("../models/trains.model");
const TrainStation = require("../models/trainStations.model");
const TrainTrip = require("../models/trainTrips.model");
const TrainCarriage = require("../models/trainCarriages.model");

const FLIGHT_COUNT = 50;
const TRAIN_TRIP_COUNT = 50;
const GENERATED_FLIGHT_PREFIX = "SBF";
const GENERATED_TRAIN_PREFIX = "SEEDTR";

const AIRLINES = [
  { iata_code: "SF1", name: "SkyFast One", logo_url: "https://example.com/skyfast-one.png" },
  { iata_code: "SF2", name: "SkyFast Two", logo_url: "https://example.com/skyfast-two.png" },
  { iata_code: "SF3", name: "SkyFast Three", logo_url: "https://example.com/skyfast-three.png" },
  { iata_code: "SF4", name: "SkyFast Four", logo_url: "https://example.com/skyfast-four.png" },
];

const AIRPORTS = [
  { iata_code: "HAN", name: "Noi Bai International Airport", city: "Ha Noi", country: "Vietnam" },
  { iata_code: "SGN", name: "Tan Son Nhat International Airport", city: "Ho Chi Minh City", country: "Vietnam" },
  { iata_code: "DAD", name: "Da Nang International Airport", city: "Da Nang", country: "Vietnam" },
  { iata_code: "CXR", name: "Cam Ranh International Airport", city: "Khanh Hoa", country: "Vietnam" },
  { iata_code: "HPH", name: "Cat Bi International Airport", city: "Hai Phong", country: "Vietnam" },
  { iata_code: "PQC", name: "Phu Quoc International Airport", city: "Phu Quoc", country: "Vietnam" },
];

const TRAIN_STATIONS = [
  { name: "Ga Ha Noi", city: "Ha Noi" },
  { name: "Ga Vinh", city: "Nghe An" },
  { name: "Ga Hue", city: "Thua Thien Hue" },
  { name: "Ga Da Nang", city: "Da Nang" },
  { name: "Ga Nha Trang", city: "Khanh Hoa" },
  { name: "Ga Sai Gon", city: "Ho Chi Minh City" },
];

const FLIGHT_ROUTES = [
  { from: "HAN", to: "SGN", durationMinutes: 130, economy: 1450000, business: 3150000 },
  { from: "SGN", to: "HAN", durationMinutes: 135, economy: 1520000, business: 3220000 },
  { from: "HAN", to: "DAD", durationMinutes: 85, economy: 920000, business: 2090000 },
  { from: "DAD", to: "SGN", durationMinutes: 92, economy: 980000, business: 2180000 },
  { from: "SGN", to: "CXR", durationMinutes: 70, economy: 880000, business: 1980000 },
  { from: "HPH", to: "DAD", durationMinutes: 95, economy: 1080000, business: 2360000 },
  { from: "PQC", to: "HAN", durationMinutes: 125, economy: 1650000, business: 3380000 },
  { from: "HAN", to: "PQC", durationMinutes: 122, economy: 1590000, business: 3320000 },
  { from: "DAD", to: "HPH", durationMinutes: 97, economy: 1120000, business: 2400000 },
  { from: "CXR", to: "SGN", durationMinutes: 68, economy: 840000, business: 1900000 },
];

const TRAIN_ROUTES = [
  { from: "Ga Ha Noi", to: "Ga Vinh", durationMinutes: 330, economy: 420000, business: 760000 },
  { from: "Ga Ha Noi", to: "Ga Da Nang", durationMinutes: 920, economy: 780000, business: 1320000 },
  { from: "Ga Da Nang", to: "Ga Sai Gon", durationMinutes: 980, economy: 860000, business: 1440000 },
  { from: "Ga Sai Gon", to: "Ga Nha Trang", durationMinutes: 460, economy: 460000, business: 820000 },
  { from: "Ga Hue", to: "Ga Ha Noi", durationMinutes: 760, economy: 650000, business: 1140000 },
  { from: "Ga Nha Trang", to: "Ga Sai Gon", durationMinutes: 440, economy: 450000, business: 800000 },
  { from: "Ga Vinh", to: "Ga Ha Noi", durationMinutes: 320, economy: 410000, business: 740000 },
  { from: "Ga Da Nang", to: "Ga Hue", durationMinutes: 160, economy: 240000, business: 420000 },
  { from: "Ga Hue", to: "Ga Da Nang", durationMinutes: 155, economy: 235000, business: 415000 },
  { from: "Ga Ha Noi", to: "Ga Sai Gon", durationMinutes: 1920, economy: 1250000, business: 1960000 },
];

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function buildDepartureDate(index, hourSeed, minuteSeed) {
  const dayOffset = Math.floor(index / 5) + 1;
  const departure = new Date();
  departure.setUTCSeconds(0, 0);
  departure.setUTCDate(departure.getUTCDate() + dayOffset);
  departure.setUTCHours(hourSeed, minuteSeed, 0, 0);
  return departure;
}

async function ensureAirlines() {
  const airlineMap = new Map();

  for (const airline of AIRLINES) {
    let doc = await Airline.findOne({ iata_code: airline.iata_code });
    if (!doc) {
      doc = await Airline.create(airline);
    }
    airlineMap.set(airline.iata_code, doc);
  }

  return airlineMap;
}

async function ensureAirports() {
  const airportMap = new Map();

  for (const airport of AIRPORTS) {
    let doc = await Airport.findOne({ iata_code: airport.iata_code });
    if (!doc) {
      doc = await Airport.create(airport);
    }
    airportMap.set(airport.iata_code, doc);
  }

  return airportMap;
}

async function ensureTrainStations() {
  const stationMap = new Map();

  for (const station of TRAIN_STATIONS) {
    let doc = await TrainStation.findOne({ name: station.name });
    if (!doc) {
      doc = await TrainStation.create(station);
    }
    stationMap.set(station.name, doc);
  }

  return stationMap;
}

async function cleanupGeneratedData() {
  const generatedFlights = await Flight.find({
    flight_number: new RegExp(`^${GENERATED_FLIGHT_PREFIX}\\d{3}$`),
  }).select("_id");
  const generatedFlightIds = generatedFlights.map((item) => item._id);

  if (generatedFlightIds.length > 0) {
    await FlightFare.deleteMany({ flight_id: { $in: generatedFlightIds } });
    await Seat.deleteMany({ flight_id: { $in: generatedFlightIds } });
    await Flight.deleteMany({ _id: { $in: generatedFlightIds } });
  }

  const generatedTrains = await Train.find({
    train_number: new RegExp(`^${GENERATED_TRAIN_PREFIX}\\d{3}$`),
  }).select("_id");
  const generatedTrainIds = generatedTrains.map((item) => item._id);

  if (generatedTrainIds.length > 0) {
    const generatedTrips = await TrainTrip.find({
      train_id: { $in: generatedTrainIds },
    }).select("_id");
    const generatedTripIds = generatedTrips.map((item) => item._id);

    if (generatedTripIds.length > 0) {
      const generatedCarriages = await TrainCarriage.find({
        train_trip_id: { $in: generatedTripIds },
      }).select("_id");
      const generatedCarriageIds = generatedCarriages.map((item) => item._id);

      if (generatedCarriageIds.length > 0) {
        await Seat.deleteMany({ carriage_id: { $in: generatedCarriageIds } });
        await TrainCarriage.deleteMany({ _id: { $in: generatedCarriageIds } });
      }

      await TrainTrip.deleteMany({ _id: { $in: generatedTripIds } });
    }

    await Train.deleteMany({ _id: { $in: generatedTrainIds } });
  }
}

function buildFlightDocuments(airlines, airports) {
  const documents = [];

  for (let index = 0; index < FLIGHT_COUNT; index += 1) {
    const route = FLIGHT_ROUTES[index % FLIGHT_ROUTES.length];
    const airline = AIRLINES[index % AIRLINES.length];
    const departureTime = buildDepartureDate(index, 1 + ((index * 3) % 20), (index % 4) * 15);

    documents.push({
      airline_id: airlines.get(airline.iata_code)._id,
      flight_number: `${GENERATED_FLIGHT_PREFIX}${String(index + 1).padStart(3, "0")}`,
      departure_airport_id: airports.get(route.from)._id,
      arrival_airport_id: airports.get(route.to)._id,
      departure_time: departureTime,
      arrival_time: addMinutes(departureTime, route.durationMinutes),
      status: "SCHEDULED",
      prices: {
        economy: route.economy + (index % 5) * 45000,
        business: route.business + (index % 5) * 70000,
      },
    });
  }

  return documents;
}

function buildFlightSeats(flights) {
  const seatDocuments = [];

  for (const flight of flights) {
    for (let row = 1; row <= 6; row += 1) {
      for (const suffix of ["A", "B", "C", "D"]) {
        seatDocuments.push({
          flight_id: flight._id,
          seat_number: `${row}${suffix}`,
          class: row <= 2 ? "BUSINESS" : "ECONOMY",
          status: "AVAILABLE",
          price_modifier: row <= 2 ? 250000 : 0,
        });
      }
    }
  }

  return seatDocuments;
}

function buildFlightFares(flights) {
  return flights.flatMap((flight) => {
    const economyPrice = flight.prices?.economy ?? 1500000;
    const businessPrice = flight.prices?.business ?? 3000000;

    return [
      {
        flight_id: flight._id,
        cabin_class: "ECONOMY",
        fare_name: "Eco Standard",
        base_price: economyPrice,
        promo_price: null,
        baggage_kg: 20,
        carry_on_kg: 7,
        is_refundable: false,
        change_fee: 350000,
        available_seats: 16,
        is_active: true,
      },
      {
        flight_id: flight._id,
        cabin_class: "BUSINESS",
        fare_name: "Business Flex",
        base_price: businessPrice,
        promo_price: null,
        baggage_kg: 32,
        carry_on_kg: 10,
        is_refundable: true,
        change_fee: 0,
        available_seats: 8,
        is_active: true,
      },
    ];
  });
}

function buildTrainDocuments(stations) {
  const trains = [];
  const trips = [];
  const carriageDrafts = [];

  for (let index = 0; index < TRAIN_TRIP_COUNT; index += 1) {
    const route = TRAIN_ROUTES[index % TRAIN_ROUTES.length];
    const departureTime = buildDepartureDate(index, 2 + ((index * 2) % 18), ((index + 1) % 4) * 15);
    const trainNumber = `${GENERATED_TRAIN_PREFIX}${String(index + 1).padStart(3, "0")}`;

    trains.push({
      train_number: trainNumber,
      name: `Seed Search Train ${String(index + 1).padStart(3, "0")}`,
    });

    trips.push({
      train_number: trainNumber,
      departure_station_id: stations.get(route.from)._id,
      arrival_station_id: stations.get(route.to)._id,
      departure_time: departureTime,
      arrival_time: addMinutes(departureTime, route.durationMinutes),
      status: "SCHEDULED",
      prices: route,
    });

    carriageDrafts.push({
      train_number: trainNumber,
      carriage_number: "E1",
      type: "ECONOMY",
      base_price: route.economy + (index % 4) * 20000,
    });
    carriageDrafts.push({
      train_number: trainNumber,
      carriage_number: "B1",
      type: "BUSINESS",
      base_price: route.business + (index % 4) * 30000,
    });
  }

  return { trains, trips, carriageDrafts };
}

async function seedSearchTrips() {
  try {
    await connectDB();

    await cleanupGeneratedData();

    const airlineMap = await ensureAirlines();
    const airportMap = await ensureAirports();
    const stationMap = await ensureTrainStations();

    const flightDocs = buildFlightDocuments(airlineMap, airportMap);
    const insertedFlights = await Flight.insertMany(flightDocs);
    await FlightFare.insertMany(buildFlightFares(insertedFlights));
    await Seat.insertMany(buildFlightSeats(insertedFlights));

    const { trains, trips, carriageDrafts } = buildTrainDocuments(stationMap);
    const insertedTrains = await Train.insertMany(trains);
    const trainIdByNumber = new Map(
      insertedTrains.map((train) => [train.train_number, train._id]),
    );

    const insertedTrips = await TrainTrip.insertMany(
      trips.map((trip) => ({
        train_id: trainIdByNumber.get(trip.train_number),
        departure_station_id: trip.departure_station_id,
        arrival_station_id: trip.arrival_station_id,
        departure_time: trip.departure_time,
        arrival_time: trip.arrival_time,
        status: trip.status,
      })),
    );

    const tripIdByTrainNumber = new Map(
      insertedTrips.map((trip, index) => [trips[index].train_number, trip._id]),
    );

    await TrainCarriage.insertMany(
      carriageDrafts.map((carriage) => ({
        train_trip_id: tripIdByTrainNumber.get(carriage.train_number),
        carriage_number: carriage.carriage_number,
        type: carriage.type,
        base_price: carriage.base_price,
      })),
    );

    console.log(
      `Seeded ${insertedFlights.length} flights and ${insertedTrips.length} train trips for search.`,
    );
  } catch (error) {
    console.error("Failed to seed search trips:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedSearchTrips();
