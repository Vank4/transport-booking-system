const trainStationService = require("../services/trainStations.service");
const { successResponse } = require("../utils/apiResponse");

const trainStationController = {
  async createTrainStation(req, res, next) {
    try {
      const station = await trainStationService.createTrainStation(req.body);
      return successResponse(res, "Create train station success", station, 201);
    } catch (error) {
      return next(error);
    }
  },

  async getTrainStations(req, res, next) {
    try {
      const result = await trainStationService.getTrainStations(req.query);
      return successResponse(res, "Get train stations success", result);
    } catch (error) {
      return next(error);
    }
  },

  async getTrainStationById(req, res, next) {
    try {
      const { id } = req.params;
      const station = await trainStationService.getTrainStationById(id);
      return successResponse(res, "Get train station success", station);
    } catch (error) {
      return next(error);
    }
  },

  async updateTrainStation(req, res, next) {
    try {
      const { id } = req.params;
      const station = await trainStationService.updateTrainStation(id, req.body);
      return successResponse(res, "Update train station success", station);
    } catch (error) {
      return next(error);
    }
  },

  async deleteTrainStation(req, res, next) {
    try {
      const { id } = req.params;
      const station = await trainStationService.deleteTrainStation(id);
      return successResponse(res, "Delete train station success", station);
    } catch (error) {
      return next(error);
    }
  }
};

module.exports = trainStationController;
