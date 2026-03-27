const Joi = require("joi");

const createFlightSchema = Joi.object({
  airline_id: Joi.string().required(),
  flight_number: Joi.string().required(),
  departure_airport_id: Joi.string().required(),
  arrival_airport_id: Joi.string().required().invalid(Joi.ref("departure_airport_id")),
  departure_time: Joi.date().required(),
  arrival_time: Joi.date().required().greater(Joi.ref("departure_time")),
  status: Joi.string().valid("SCHEDULED", "DELAYED", "CANCELLED", "COMPLETED").optional(),
  prices: Joi.object({
    economy: Joi.number().min(0).optional(),
    business: Joi.number().min(0).optional()
  }).optional()
}).messages({
  "any.invalid": "Sân bay đến phải khác sân bay đi",
  "date.greater": "Thời gian hạ cánh phải sau thời gian cất cánh"
});

const updateFlightSchema = Joi.object({
  airline_id: Joi.string().optional(),
  flight_number: Joi.string().optional(),
  departure_airport_id: Joi.string().optional(),
  arrival_airport_id: Joi.string().optional().invalid(Joi.ref("departure_airport_id")),
  departure_time: Joi.date().optional(),
  arrival_time: Joi.date().optional().greater(Joi.ref("departure_time")),
  status: Joi.string().valid("SCHEDULED", "DELAYED", "CANCELLED", "COMPLETED").optional(),
  prices: Joi.object({
    economy: Joi.number().min(0).optional(),
    business: Joi.number().min(0).optional()
  }).optional()
}).messages({
  "any.invalid": "Sân bay đến phải khác sân bay đi",
  "date.greater": "Thời gian hạ cánh phải sau thời gian cất cánh"
});

const getFlightsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  q: Joi.string().allow("").optional(),
  departure: Joi.string().allow("").optional(),
  arrival: Joi.string().allow("").optional(),
  date: Joi.string().allow("").optional(),
  airline_id: Joi.string().optional(),
  status: Joi.string().optional(),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("asc", "desc").optional()
});

module.exports = {
  createFlightSchema,
  updateFlightSchema,
  getFlightsSchema
};
