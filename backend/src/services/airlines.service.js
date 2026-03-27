const Airline = require("../models/airlines.model");

const airlineService = {
  async createAirline(data) {
    const airline = new Airline(data);
    await airline.save();
    return airline;
  },

  async getAirlines(query) {
    const { page = 1, limit = 10, q = "", sortBy = "name", sortOrder = "asc" } = query;
    const skip = (page - 1) * limit;
    
    // search
    let filter = {};
    if (q) {
      filter = { $or: [{ name: { $regex: q, $options: "i" } }, { iata_code: { $regex: q, $options: "i" } }] };
    }

    const sortOptions = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const airlines = await Airline.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await Airline.countDocuments(filter);
    
    return {
      airlines,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async getAirlineById(id) {
    const airline = await Airline.findById(id);
    if (!airline) throw new Error("Airline not found");
    return airline;
  },

  async updateAirline(id, data) {
    const airline = await Airline.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!airline) throw new Error("Airline not found");
    return airline;
  },

  async deleteAirline(id) {
    const Flight = require("../models/flights.model");
    const flightExists = await Flight.findOne({ airline_id: id });
    if (flightExists) {
      throw new Error("Không thể xóa hãng hàng không này vì đang có chuyến bay thuộc hệ thống");
    }

    const airline = await Airline.findByIdAndDelete(id);
    if (!airline) throw new Error("Airline not found");
    return airline;
  }
};

module.exports = airlineService;
