const airlineService = require("../services/airlines.service");
const { successResponse } = require("../utils/apiResponse");

const airlineController = {
  async createAirline(req, res, next) {
    try {
      const airline = await airlineService.createAirline(req.body);
      return successResponse(res, "Create airline success", airline, 201);
    } catch (error) {
      return next(error);
    }
  },

  async getAirlines(req, res, next) {
    try {
      const result = await airlineService.getAirlines(req.query);
      return successResponse(res, "Get airlines success", result);
    } catch (error) {
      return next(error);
    }
  },

  async getAirlineById(req, res, next) {
    try {
      const { id } = req.params;
      const airline = await airlineService.getAirlineById(id);
      return successResponse(res, "Get airline success", airline);
    } catch (error) {
      return next(error);
    }
  },

  async updateAirline(req, res, next) {
    try {
      const { id } = req.params;
      const airline = await airlineService.updateAirline(id, req.body);
      return successResponse(res, "Update airline success", airline);
    } catch (error) {
      return next(error);
    }
  },

  async deleteAirline(req, res, next) {
    try {
      const { id } = req.params;
      const airline = await airlineService.deleteAirline(id);
      return successResponse(res, "Delete airline success", airline);
    } catch (error) {
      return next(error);
    }
  }
};

module.exports = airlineController;
