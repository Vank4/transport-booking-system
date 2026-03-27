const Joi = require("joi");

const updateUserSchema = Joi.object({
  full_name: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional().allow(""),
  date_of_birth: Joi.date().optional().allow(null, ""),
  gender: Joi.string().valid("Nam", "Nữ", "Khác").optional().allow(null, ""),
  nationality: Joi.object({
    code: Joi.string().allow("").optional(),
    name: Joi.string().allow("").optional()
  }).optional(),
  id_card: Joi.string().allow("").optional(),
  passport: Joi.string().allow("").optional(),
  avatar_url: Joi.string().allow("").optional(),
  address: Joi.object({
    country_code: Joi.string().allow("").optional(),
    country_name: Joi.string().allow("").optional(),
    city: Joi.string().allow("").optional(),
    district: Joi.string().allow("").optional(),
    address_detail: Joi.string().allow("").optional(),
    full_address: Joi.string().allow("").optional(),
  }).optional(),
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
