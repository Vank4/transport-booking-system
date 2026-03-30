const Joi = require("joi");

const createAirlineSchema = Joi.object({
  name: Joi.string().required(),
  iata_code: Joi.string().allow("").optional(),
  logo_url: Joi.string().allow("").optional()
});

const updateAirlineSchema = Joi.object({
  name: Joi.string().optional(),
  iata_code: Joi.string().allow("").optional(),
  logo_url: Joi.string().allow("").optional()
});

const getAirlinesSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  q: Joi.string().allow("").optional(),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("asc", "desc").optional()
});

module.exports = {
  createAirlineSchema,
  updateAirlineSchema,
  getAirlinesSchema
};
