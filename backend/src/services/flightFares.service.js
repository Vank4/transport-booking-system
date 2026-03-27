const FlightFare = require("../models/flightFares.model");

const flightFareService = {
  async createFlightFare(data) {
    const flightFare = new FlightFare(data);
    await flightFare.save();
    return flightFare;
  },

  async getFlightFares(query) {
    const { page = 1, limit = 10, flight_id, cabin_class, is_active, q } = query;
    const skip = (page - 1) * limit;
    
    let filter = {};
    if (flight_id) filter.flight_id = flight_id;
    if (cabin_class) filter.cabin_class = cabin_class;
    
    // Normalize is_active to boolean if it's a string "true"/"false"
    if (is_active !== undefined && is_active !== null && is_active !== "" && is_active !== "null") {
      filter.is_active = is_active === "true" || is_active === true;
    }

    if (q) {
      const Flight = require("../models/flights.model");
      const Airline = require("../models/airlines.model");
      
      const airlines = await Airline.find({ name: { $regex: q, $options: "i" } }).select("_id");
      const airlineIds = airlines.map(a => a._id);
      
      const flights = await Flight.find({
        $or: [
          { flight_number: { $regex: q, $options: "i" } },
          { airline_id: { $in: airlineIds } }
        ]
      }).select("_id");
      
      const flightIds = flights.map(f => f._id);
      
      // If q is provided, we filter by these flight IDs. 
      // If flight_id was also explicitly provided, we take the intersection (but usually they aren't used together).
      if (filter.flight_id) {
        // This is a rare case in the current UI but good for robustness
        filter.flight_id = { $in: flightIds.filter(id => id.toString() === filter.flight_id.toString()) };
      } else {
        filter.flight_id = { $in: flightIds };
      }
    }

    const flightFares = await FlightFare.find(filter)
      .populate({
        path: "flight_id",
        populate: [
          { path: "airline_id", select: "name iata_code logo_url" },
          { path: "departure_airport_id", select: "name city iata_code" },
          { path: "arrival_airport_id", select: "name city iata_code" }
        ]
      })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await FlightFare.countDocuments(filter);
    
    return {
      flightFares,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async getFlightFareById(id) {
    const flightFare = await FlightFare.findById(id).populate({
      path: "flight_id",
      populate: [
        { path: "airline_id" },
        { path: "departure_airport_id" },
        { path: "arrival_airport_id" }
      ]
    });
    if (!flightFare) throw new Error("Flight Fare not found");
    return flightFare;
  },

  async updateFlightFare(id, data) {
    const flightFare = await FlightFare.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!flightFare) throw new Error("Flight Fare not found");
    return flightFare;
  },

  async deleteFlightFare(id) {
    const flightFare = await FlightFare.findByIdAndDelete(id);
    if (!flightFare) throw new Error("Flight Fare not found");
    return flightFare;
  }
};

module.exports = flightFareService;
