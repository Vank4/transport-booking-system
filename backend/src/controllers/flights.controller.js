const flightService = require("../services/flights.service");
const { successResponse } = require("../utils/apiResponse");

const flightController = {
  async createFlight(req, res, next) {
    try {
      const flight = await flightService.createFlight(req.body);
      return successResponse(res, "Create flight success", flight, 201);
    } catch (error) {
      return next(error);
    }
  },

  async getFlights(req, res, next) {
    try {
      const result = await flightService.getFlights(req.query);
      return successResponse(res, "Get flights success", result);
    } catch (error) {
      return next(error);
    }
  },

  async getFlightById(req, res, next) {
    try {
      const { id } = req.params;
      const flight = await flightService.getFlightById(id);
      return successResponse(res, "Get flight success", flight);
    } catch (error) {
      return next(error);
    }
  },

  async updateFlight(req, res, next) {
    try {
      const { id } = req.params;
      const flight = await flightService.updateFlight(id, req.body);
      return successResponse(res, "Update flight success", flight);
    } catch (error) {
      return next(error);
    }
  },

  async deleteFlight(req, res, next) {
    try {
      const { id } = req.params;
      const flight = await flightService.deleteFlight(id);
      return successResponse(res, "Delete flight success", flight);
    } catch (error) {
      return next(error);
    }
  }
};

module.exports = flightController;
