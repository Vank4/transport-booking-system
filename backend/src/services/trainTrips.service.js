const TrainTrip = require("../models/trainTrips.model");

const trainTripService = {
  async createTrainTrip(data) {
    const trainTrip = new TrainTrip(data);
    await trainTrip.save();
    return trainTrip;
  },

  async getTrainTrips(query) {
    const { page = 1, limit = 10, train_id, status, departure = "", arrival = "", q = "", date, sortBy = "departure_time", sortOrder = "desc" } = query;
    const skip = (page - 1) * limit;
    
    let filter = {};
    if (train_id) filter.train_id = train_id;
    if (status && status !== 'ALL') filter.status = status;
    
    if (date) {
      const d = new Date(date);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      filter.departure_time = { $gte: startOfDay, $lte: endOfDay };
    }
    
    const TrainStation = require("../models/trainStations.model");
    const Train = require("../models/trains.model");

    if (departure) {
      const depStations = await TrainStation.find({
        $or: [
          { name: { $regex: departure, $options: "i" } },
          { city: { $regex: departure, $options: "i" } }
        ]
      }).select("_id");
      filter.departure_station_id = { $in: depStations.map(s => s._id) };
    }

    if (arrival) {
      const arrStations = await TrainStation.find({
        $or: [
          { name: { $regex: arrival, $options: "i" } },
          { city: { $regex: arrival, $options: "i" } }
        ]
      }).select("_id");
      filter.arrival_station_id = { $in: arrStations.map(s => s._id) };
    }

    if (q) {
      const trains = await Train.find({
        $or: [
          { name: { $regex: q, $options: "i" } },
          { train_number: { $regex: q, $options: "i" } }
        ]
      }).select("_id");
      filter.train_id = { $in: trains.map(t => t._id) };
    }

    const sortOptions = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const trainTrips = await TrainTrip.find(filter)
      .populate("train_id", "name train_number")
      .populate("departure_station_id", "name city")
      .populate("arrival_station_id", "name city")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await TrainTrip.countDocuments(filter);
    
    return {
      trainTrips,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async getTrainTripById(id) {
    const trainTrip = await TrainTrip.findById(id)
      .populate("train_id")
      .populate("departure_station_id")
      .populate("arrival_station_id");
    if (!trainTrip) throw new Error("Train Trip not found");
    return trainTrip;
  },

  async updateTrainTrip(id, data) {
    const trainTrip = await TrainTrip.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!trainTrip) throw new Error("Train Trip not found");
    return trainTrip;
  },

  async deleteTrainTrip(id) {
    const trainTrip = await TrainTrip.findByIdAndDelete(id);
    if (!trainTrip) throw new Error("Train Trip not found");
    return trainTrip;
  }
};

module.exports = trainTripService;
