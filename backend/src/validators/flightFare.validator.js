const Joi = require("joi");

const createFlightFareSchema = Joi.object({
  flight_id: Joi.string().required(),
  cabin_class: Joi.string().valid("ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST_CLASS").required(),
  fare_name: Joi.string().required(),
  base_price: Joi.number().min(0).required(),
  promo_price: Joi.number().min(0).optional().allow(null),
  baggage_kg: Joi.number().min(0).optional(),
  carry_on_kg: Joi.number().min(0).optional(),
  is_refundable: Joi.boolean().optional(),
  change_fee: Joi.number().min(0).optional(),
  available_seats: Joi.number().min(0).optional(),
  is_active: Joi.boolean().optional()
});

const updateFlightFareSchema = Joi.object({
  flight_id: Joi.string().optional(),
  cabin_class: Joi.string().valid("ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST_CLASS").optional(),
  fare_name: Joi.string().optional(),
  base_price: Joi.number().min(0).optional(),
  promo_price: Joi.number().min(0).optional().allow(null),
  baggage_kg: Joi.number().min(0).optional(),
  carry_on_kg: Joi.number().min(0).optional(),
  is_refundable: Joi.boolean().optional(),
  change_fee: Joi.number().min(0).optional(),
  available_seats: Joi.number().min(0).optional(),
  is_active: Joi.boolean().optional()
});

const getFlightFaresSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  flight_id: Joi.string().optional(),
  cabin_class: Joi.string().optional(),
  is_active: Joi.boolean().optional(),
  q: Joi.string().allow("").optional()
});

module.exports = {
  createFlightFareSchema,
  updateFlightFareSchema,
  getFlightFaresSchema
};
