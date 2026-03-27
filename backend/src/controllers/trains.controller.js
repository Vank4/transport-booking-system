const trainService = require("../services/trains.service");
const { successResponse } = require("../utils/apiResponse");

const trainController = {
  async createTrain(req, res, next) {
    try {
      const train = await trainService.createTrain(req.body);
      return successResponse(res, "Create train success", train, 201);
    } catch (error) {
      return next(error);
    }
  },

  async getTrains(req, res, next) {
    try {
      const result = await trainService.getTrains(req.query);
      return successResponse(res, "Get trains success", result);
    } catch (error) {
      return next(error);
    }
  },

  async getTrainById(req, res, next) {
    try {
      const { id } = req.params;
      const train = await trainService.getTrainById(id);
      return successResponse(res, "Get train success", train);
    } catch (error) {
      return next(error);
    }
  },

  async updateTrain(req, res, next) {
    try {
      const { id } = req.params;
      const train = await trainService.updateTrain(id, req.body);
      return successResponse(res, "Update train success", train);
    } catch (error) {
      return next(error);
    }
  },

  async deleteTrain(req, res, next) {
    try {
      const { id } = req.params;
      const train = await trainService.deleteTrain(id);
      return successResponse(res, "Delete train success", train);
    } catch (error) {
      return next(error);
    }
  }
};

module.exports = trainController;
