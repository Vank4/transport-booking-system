const Joi = require("joi");

const createTrainStationSchema = Joi.object({
  name: Joi.string().required(),
  city: Joi.string().required()
});

const updateTrainStationSchema = Joi.object({
  name: Joi.string().optional(),
  city: Joi.string().optional()
});

const getTrainStationsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  q: Joi.string().allow("").optional(), // search name or city
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("asc", "desc").optional()
});

module.exports = {
  createTrainStationSchema,
  updateTrainStationSchema,
  getTrainStationsSchema
};
