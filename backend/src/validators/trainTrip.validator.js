const Joi = require("joi");

const createTrainTripSchema = Joi.object({
  train_id: Joi.string().required(),
  departure_station_id: Joi.string().required(),
  arrival_station_id: Joi.string().required().invalid(Joi.ref("departure_station_id")),
  departure_time: Joi.date().required(),
  arrival_time: Joi.date().required().greater(Joi.ref("departure_time")),
  status: Joi.string().valid("SCHEDULED", "DELAYED", "CANCELLED", "COMPLETED").optional()
}).messages({
  "any.invalid": "Ga đến phải khác ga đi",
  "date.greater": "Giờ đến nơi phải sau giờ khởi hành"
});

const updateTrainTripSchema = Joi.object({
  train_id: Joi.string().optional(),
  departure_station_id: Joi.string().optional(),
  arrival_station_id: Joi.string().optional().invalid(Joi.ref("departure_station_id")),
  departure_time: Joi.date().optional(),
  arrival_time: Joi.date().optional().greater(Joi.ref("departure_time")),
  status: Joi.string().valid("SCHEDULED", "DELAYED", "CANCELLED", "COMPLETED").optional()
}).messages({
  "any.invalid": "Ga đến phải khác ga đi",
  "date.greater": "Giờ đến nơi phải sau giờ khởi hành"
});

const getTrainTripsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  q: Joi.string().allow("").optional(),
  departure: Joi.string().allow("").optional(),
  arrival: Joi.string().allow("").optional(),
  date: Joi.string().allow("").optional(),
  train_id: Joi.string().optional(),
  status: Joi.string().optional(),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("asc", "desc").optional()
});

module.exports = {
  createTrainTripSchema,
  updateTrainTripSchema,
  getTrainTripsSchema
};
