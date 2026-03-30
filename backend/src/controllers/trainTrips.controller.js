const trainTripService = require("../services/trainTrips.service");
const { successResponse } = require("../utils/apiResponse");

const trainTripController = {
  async createTrainTrip(req, res, next) {
    try {
      const trainTrip = await trainTripService.createTrainTrip(req.body);
      return successResponse(res, "Create train trip success", trainTrip, 201);
    } catch (error) {
      return next(error);
    }
  },

  async getTrainTrips(req, res, next) {
    try {
      const result = await trainTripService.getTrainTrips(req.query);
      return successResponse(res, "Get train trips success", result);
    } catch (error) {
      return next(error);
    }
  },

  async getTrainTripById(req, res, next) {
    try {
      const { id } = req.params;
      const trainTrip = await trainTripService.getTrainTripById(id);
      return successResponse(res, "Get train trip success", trainTrip);
    } catch (error) {
      return next(error);
    }
  },

  async updateTrainTrip(req, res, next) {
    try {
      const { id } = req.params;
      const trainTrip = await trainTripService.updateTrainTrip(id, req.body);
      return successResponse(res, "Update train trip success", trainTrip);
    } catch (error) {
      return next(error);
    }
  },

  async deleteTrainTrip(req, res, next) {
    try {
      const { id } = req.params;
      const trainTrip = await trainTripService.deleteTrainTrip(id);
      return successResponse(res, "Delete train trip success", trainTrip);
    } catch (error) {
      return next(error);
    }
  }
};

module.exports = trainTripController;
