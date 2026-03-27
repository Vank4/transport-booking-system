const trainCarriageService = require("../services/trainCarriages.service");
const { successResponse } = require("../utils/apiResponse");

const trainCarriageController = {
  async createTrainCarriage(req, res, next) {
    try {
      const carriage = await trainCarriageService.createTrainCarriage(req.body);
      return successResponse(res, "Create train carriage success", carriage, 201);
    } catch (error) {
      return next(error);
    }
  },

  async getTrainCarriages(req, res, next) {
    try {
      const result = await trainCarriageService.getTrainCarriages(req.query);
      return successResponse(res, "Get train carriages success", result);
    } catch (error) {
      return next(error);
    }
  },

  async getTrainCarriageById(req, res, next) {
    try {
      const { id } = req.params;
      const carriage = await trainCarriageService.getTrainCarriageById(id);
      return successResponse(res, "Get train carriage success", carriage);
    } catch (error) {
      return next(error);
    }
  },

  async updateTrainCarriage(req, res, next) {
    try {
      const { id } = req.params;
      const carriage = await trainCarriageService.updateTrainCarriage(id, req.body);
      return successResponse(res, "Update train carriage success", carriage);
    } catch (error) {
      return next(error);
    }
  },

  async deleteTrainCarriage(req, res, next) {
    try {
      const { id } = req.params;
      const carriage = await trainCarriageService.deleteTrainCarriage(id);
      return successResponse(res, "Delete train carriage success", carriage);
    } catch (error) {
      return next(error);
    }
  }
};

module.exports = trainCarriageController;
