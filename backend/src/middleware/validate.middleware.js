const AppError = require("../utils/appError");

function validate(schema, source = "body") {
  return (req, res, next) => {
    const target = req[source] || {};
    const { error, value } = schema.validate(target, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return next(new AppError(error.details.map((d) => d.message).join("; "), 400));
    }

    req[source] = value;
    return next();
  };
}

module.exports = {
  validate,
};
