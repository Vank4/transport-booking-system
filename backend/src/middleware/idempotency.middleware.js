const AppError = require("../utils/appError");

async function enforceIdempotency(req, res, next) {
  try {
    const key = req.header("Idempotency-Key");
    if (!key) {
      return next(new AppError("Idempotency-Key header is required", 400));
    }
    // TODO: Bo sung hash request, replay response va conflict detection.
    req.idempotency = { key };
    return next();
  } catch (error) {
    return next(error);
  }
}

async function saveIdempotencyResponse(req, statusCode, body) {
  // TODO: Persist response theo key de phuc vu replay va verify.
  void req;
  void statusCode;
  void body;
}

module.exports = {
  enforceIdempotency,
  saveIdempotencyResponse,
};
