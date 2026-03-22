function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    message: "Not Found",
  });
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isProd = process.env.NODE_ENV === "production";

  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(isProd ? {} : { stack: err.stack }),
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
