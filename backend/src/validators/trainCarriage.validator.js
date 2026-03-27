const Joi = require("joi");

const createTrainCarriageSchema = Joi.object({
  train_trip_id: Joi.string().required(),
  carriage_number: Joi.string().required(),
  type: Joi.string().valid("ECONOMY", "BUSINESS").required(),
  base_price: Joi.number().min(0).required()
});

const updateTrainCarriageSchema = Joi.object({
  train_trip_id: Joi.string().optional(),
  carriage_number: Joi.string().optional(),
  type: Joi.string().valid("ECONOMY", "BUSINESS").optional(),
  base_price: Joi.number().min(0).optional()
});

const getTrainCarriagesSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  q: Joi.string().allow("", null).optional(),
  train_trip_id: Joi.string().optional(),
  type: Joi.string().valid("ECONOMY", "BUSINESS").optional(),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("asc", "desc").optional()
});

module.exports = {
  createTrainCarriageSchema,
  updateTrainCarriageSchema,
  getTrainCarriagesSchema
};
