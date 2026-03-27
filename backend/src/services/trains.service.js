const Train = require("../models/trains.model");

const trainService = {
  async createTrain(data) {
    const train = new Train(data);
    await train.save();
    return train;
  },

  async getTrains(query) {
    const { page = 1, limit = 10, q = "", sortBy = "name", sortOrder = "asc" } = query;
    const skip = (page - 1) * limit;
    
    let filter = {};
    if (q) {
      filter = { $or: [{ name: { $regex: q, $options: "i" } }, { train_number: { $regex: q, $options: "i" } }] };
    }

    const sortOptions = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const trains = await Train.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await Train.countDocuments(filter);
    
    return {
      trains,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async getTrainById(id) {
    const train = await Train.findById(id);
    if (!train) throw new Error("Train not found");
    return train;
  },

  async updateTrain(id, data) {
    const train = await Train.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!train) throw new Error("Train not found");
    return train;
  },

  async deleteTrain(id) {
    const TrainTrip = require("../models/trainTrips.model");
    const tripCount = await TrainTrip.countDocuments({ train_id: id });
    if (tripCount > 0) {
      throw new Error("Không thể xóa tàu hỏa đang có lịch trình hoạt động. Vui lòng xóa các lịch trình liên quan trước.");
    }

    const train = await Train.findByIdAndDelete(id);
    if (!train) throw new Error("Tàu hỏa không tồn tại");
    return train;
  }
};

module.exports = trainService;
