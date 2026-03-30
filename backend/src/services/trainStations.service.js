const TrainStation = require("../models/trainStations.model");

const trainStationService = {
  async createTrainStation(data) {
    const station = new TrainStation(data);
    await station.save();
    return station;
  },

  async getTrainStations(query) {
    const { page = 1, limit = 10, q = "", sortBy = "name", sortOrder = "asc" } = query;
    const skip = (page - 1) * limit;
    
    let filter = {};
    if (q) {
      filter = { $or: [{ name: { $regex: q, $options: "i" } }, { city: { $regex: q, $options: "i" } }] };
    }

    const sortOptions = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const stations = await TrainStation.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await TrainStation.countDocuments(filter);
    
    return {
      stations,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async getTrainStationById(id) {
    const station = await TrainStation.findById(id);
    if (!station) throw new Error("Train Station not found");
    return station;
  },

  async updateTrainStation(id, data) {
    const station = await TrainStation.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!station) throw new Error("Train Station not found");
    return station;
  },

  async deleteTrainStation(id) {
    const TrainTrip = require("../models/trainTrips.model");
    const tripCount = await TrainTrip.countDocuments({
      $or: [{ departure_station_id: id }, { arrival_station_id: id }]
    });

    if (tripCount > 0) {
      throw new Error("Không thể xóa ga tàu đang được sử dụng trong các lịch trình vận hành.");
    }

    const station = await TrainStation.findByIdAndDelete(id);
    if (!station) throw new Error("Ga tàu không tồn tại");
    return station;
  }
};

module.exports = trainStationService;
