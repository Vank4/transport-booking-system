const airportService = require("../services/airports.service");
const { successResponse } = require("../utils/apiResponse");

const airportController = {
  async createAirport(req, res, next) {
    try {
      const airport = await airportService.createAirport(req.body);
      return successResponse(res, "Create airport success", airport, 201);
    } catch (error) {
      return next(error);
    }
  },

  async getAirports(req, res, next) {
    try {
      const result = await airportService.getAirports(req.query);
      return successResponse(res, "Get airports success", result);
    } catch (error) {
      return next(error);
    }
  },

  async getAirportById(req, res, next) {
    try {
      const { id } = req.params;
      const airport = await airportService.getAirportById(id);
      return successResponse(res, "Get airport success", airport);
    } catch (error) {
      return next(error);
    }
  },

  async updateAirport(req, res, next) {
    try {
      const { id } = req.params;
      const airport = await airportService.updateAirport(id, req.body);
      return successResponse(res, "Update airport success", airport);
    } catch (error) {
      return next(error);
    }
  },

  async deleteAirport(req, res, next) {
    try {
      const { id } = req.params;
      const airport = await airportService.deleteAirport(id);
      return successResponse(res, "Delete airport success", airport);
    } catch (error) {
      return next(error);
    }
  }
};

module.exports = airportController;
