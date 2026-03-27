const Airport = require("../models/airports.model");

const airportService = {
  async createAirport(data) {
    const airport = new Airport(data);
    await airport.save();
    return airport;
  },

  async getAirports(query) {
    const { page = 1, limit = 10, q = "", sortBy = "name", sortOrder = "asc" } = query;
    const skip = (page - 1) * limit;
    
    // search
    let filter = {};
    if (q) {
      filter = { $or: [{ name: { $regex: q, $options: "i" } }, { iata_code: { $regex: q, $options: "i" } }, { city: { $regex: q, $options: "i" } }] };
    }

    const sortOptions = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const airports = await Airport.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await Airport.countDocuments(filter);
    
    return {
      airports,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async getAirportById(id) {
    const airport = await Airport.findById(id);
    if (!airport) throw new Error("Airport not found");
    return airport;
  },

  async updateAirport(id, data) {
    const airport = await Airport.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!airport) throw new Error("Airport not found");
    return airport;
  },

  async deleteAirport(id) {
    const Flight = require("../models/flights.model");
    const flightExists = await Flight.findOne({ 
      $or: [{ departure_airport_id: id }, { arrival_airport_id: id }] 
    });
    if (flightExists) {
      throw new Error("Không thể xóa sân bay này vì đang có chuyến bay đang khai thác tại đây");
    }

    const airport = await Airport.findByIdAndDelete(id);
    if (!airport) throw new Error("Airport not found");
    return airport;
  }
};

module.exports = airportService;
