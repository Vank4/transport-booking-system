const TrainCarriage = require("../models/trainCarriages.model");

const trainCarriageService = {
  async createTrainCarriage(data) {
    const carriage = new TrainCarriage(data);
    await carriage.save();
    return carriage;
  },

  async getTrainCarriages(query) {
    const { page = 1, limit = 10, q, train_trip_id, type, sortBy = "carriage_number", sortOrder = "asc" } = query;
    const skip = (page - 1) * limit;
    
    let filter = {};
    if (q) filter.carriage_number = { $regex: q, $options: "i" };
    if (train_trip_id) filter.train_trip_id = train_trip_id;
    if (type) filter.type = type;

    const sortOptions = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const carriages = await TrainCarriage.find(filter)
      .populate({
        path: "train_trip_id",
        populate: [
          { path: "train_id", select: "name train_number" },
          { path: "departure_station_id", select: "name city" },
          { path: "arrival_station_id", select: "name city" }
        ]
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await TrainCarriage.countDocuments(filter);
    
    return {
      carriages,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async getTrainCarriageById(id) {
    const carriage = await TrainCarriage.findById(id).populate({
      path: "train_trip_id",
      populate: [
        { path: "train_id" },
        { path: "departure_station_id" },
        { path: "arrival_station_id" }
      ]
    });
    if (!carriage) throw new Error("Train Carriage not found");
    return carriage;
  },

  async updateTrainCarriage(id, data) {
    const carriage = await TrainCarriage.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!carriage) throw new Error("Train Carriage not found");
    return carriage;
  },

  async deleteTrainCarriage(id) {
    const Seat = require("../models/seats.model");
    
    // Check if any seat in this carriage is BOOKED
    const bookedSeatCount = await Seat.countDocuments({ carriage_id: id, status: "BOOKED" });
    if (bookedSeatCount > 0) {
      throw new Error("Không thể xóa toa xe vì có ghế đang ở trạng thái 'Đã đặt' (BOOKED).");
    }

    const carriage = await TrainCarriage.findByIdAndDelete(id);
    if (!carriage) throw new Error("Toa xe không tồn tại");

    // Clean up all seats associated with this carriage
    await Seat.deleteMany({ carriage_id: id });
    
    return carriage;
  }
};

module.exports = trainCarriageService;
