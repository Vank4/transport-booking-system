const Joi = require("joi");

const createAirportSchema = Joi.object({
  iata_code: Joi.string().required(),
  name: Joi.string().required(),
  city: Joi.string().required(),
  country: Joi.string().required()
});

const updateAirportSchema = Joi.object({
  iata_code: Joi.string().optional(),
  name: Joi.string().optional(),
  city: Joi.string().optional(),
  country: Joi.string().optional()
});

const getAirportsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  q: Joi.string().allow("").optional(),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("asc", "desc").optional()
});

module.exports = {
  createAirportSchema,
  updateAirportSchema,
  getAirportsSchema
};
