const flightFareService = require("../services/flightFares.service");
const { successResponse } = require("../utils/apiResponse");

const flightFareController = {
  async createFlightFare(req, res, next) {
    try {
      const flightFare = await flightFareService.createFlightFare(req.body);
      return successResponse(res, "Create flight fare success", flightFare, 201);
    } catch (error) {
      return next(error);
    }
  },

  async getFlightFares(req, res, next) {
    try {
      const result = await flightFareService.getFlightFares(req.query);
      return successResponse(res, "Get flight fares success", result);
    } catch (error) {
      return next(error);
    }
  },

  async getFlightFareById(req, res, next) {
    try {
      const { id } = req.params;
      const flightFare = await flightFareService.getFlightFareById(id);
      return successResponse(res, "Get flight fare success", flightFare);
    } catch (error) {
      return next(error);
    }
  },

  async updateFlightFare(req, res, next) {
    try {
      const { id } = req.params;
      const flightFare = await flightFareService.updateFlightFare(id, req.body);
      return successResponse(res, "Update flight fare success", flightFare);
    } catch (error) {
      return next(error);
    }
  },

  async deleteFlightFare(req, res, next) {
    try {
      const { id } = req.params;
      const flightFare = await flightFareService.deleteFlightFare(id);
      return successResponse(res, "Delete flight fare success", flightFare);
    } catch (error) {
      return next(error);
    }
  }
};

module.exports = flightFareController;
