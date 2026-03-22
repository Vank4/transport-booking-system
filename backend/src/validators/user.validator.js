const Joi = require("joi");

const updateUserSchema = Joi.object({
  full_name: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  role: Joi.string().valid("USER", "ADMIN").optional(),
  status: Joi.string().valid("ACTIVE", "BLOCKED").optional()
});

const getUsersSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  role: Joi.string().valid("USER", "ADMIN", "ALL").optional(),
  status: Joi.string().valid("ACTIVE", "BLOCKED", "ALL").optional(),
  q: Joi.string().allow("").optional(),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("asc", "desc").optional()
});

module.exports = {
  updateUserSchema,
  getUsersSchema
};
