const Flight = require("../models/flights.model");

const flightService = {
  async createFlight(data) {
    const flight = new Flight(data);
    await flight.save();
    return flight;
  },

  async getFlights(query) {
    const { page = 1, limit = 10, q = "", departure = "", arrival = "", airline_id, departure_airport_id, arrival_airport_id, status, date, sortBy = "departure_time", sortOrder = "desc" } = query;
    const skip = (page - 1) * limit;
    
    let filter = {};
    if (airline_id) filter.airline_id = airline_id;
    if (departure_airport_id) filter.departure_airport_id = departure_airport_id;
    if (arrival_airport_id) filter.arrival_airport_id = arrival_airport_id;
    if (status && status !== 'ALL') filter.status = status;

    if (date) {
      const d = new Date(date);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      filter.departure_time = { $gte: startOfDay, $lte: endOfDay };
    }

    const Airport = require("../models/airports.model");
    const Airline = require("../models/airlines.model");

    if (departure) {
      const depAirports = await Airport.find({
        $or: [
          { name: { $regex: departure, $options: "i" } },
          { city: { $regex: departure, $options: "i" } },
          { iata_code: { $regex: departure, $options: "i" } }
        ]
      }).select("_id");
      filter.departure_airport_id = { $in: depAirports.map(a => a._id) };
    }

    if (arrival) {
      const arrAirports = await Airport.find({
        $or: [
          { name: { $regex: arrival, $options: "i" } },
          { city: { $regex: arrival, $options: "i" } },
          { iata_code: { $regex: arrival, $options: "i" } }
        ]
      }).select("_id");
      filter.arrival_airport_id = { $in: arrAirports.map(a => a._id) };
    }

    if (q) {
      // General search for flight number or airline
      const airlines = await Airline.find({
        $or: [
          { name: { $regex: q, $options: "i" } },
          { iata_code: { $regex: q, $options: "i" } }
        ]
      }).select("_id");

      filter.$or = [
        { flight_number: { $regex: q, $options: "i" } },
        { airline_id: { $in: airlines.map(a => a._id) } }
      ];
    }

    const sortOptions = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const flights = await Flight.find(filter)
      .populate("airline_id", "name iata_code")
      .populate("departure_airport_id", "name iata_code city country")
      .populate("arrival_airport_id", "name iata_code city country")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await Flight.countDocuments(filter);
    
    return {
      flights,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async getFlightById(id) {
    const flight = await Flight.findById(id)
      .populate("airline_id", "name iata_code logo_url")
      .populate("departure_airport_id")
      .populate("arrival_airport_id");
    if (!flight) throw new Error("Flight not found");
    return flight;
  },

  async updateFlight(id, data) {
    const flight = await Flight.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!flight) throw new Error("Flight not found");
    return flight;
  },

  async deleteFlight(id) {
    const flight = await Flight.findByIdAndDelete(id);
    if (!flight) throw new Error("Flight not found");
    return flight;
  }
};

module.exports = flightService;
