const Joi = require("joi");

const createTrainSchema = Joi.object({
  train_number: Joi.string().required(),
  name: Joi.string().required()
});

const updateTrainSchema = Joi.object({
  train_number: Joi.string().optional(),
  name: Joi.string().optional()
});

const getTrainsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  q: Joi.string().allow("").optional(), // search name or train_number
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("asc", "desc").optional()
});

module.exports = {
  createTrainSchema,
  updateTrainSchema,
  getTrainsSchema
};
