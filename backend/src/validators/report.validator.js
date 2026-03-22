const Joi = require("joi");

const createReportSchema = Joi.object({
  title: Joi.string().trim().min(3).max(120).required(),
  type: Joi.string().valid("daily", "weekly", "monthly", "custom").default("daily"),
  fromDate: Joi.date().required(),
  toDate: Joi.date().required(),
});

const reportListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  status: Joi.string().valid("pending", "processing", "completed", "failed"),
  sortBy: Joi.string().valid("createdAt", "updatedAt").default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});

module.exports = {
  createReportSchema,
  reportListQuerySchema,
};
