// Middleware để xử lý các lỗi trong ứng dụng
const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
    errors: { code: err.code || "INTERNAL_ERROR" },
  });
};

module.exports = errorHandler;
