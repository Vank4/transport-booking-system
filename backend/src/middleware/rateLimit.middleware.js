const rateLimit = require("express-rate-limit");

// Limiter dành cho các tính năng nhạy cảm như Login, Register, Forgot Password
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10, // Giới hạn 10 request từ cùng 1 IP
  handler: (req, res, next) => {
    res.status(429).json({
      status: "error",
      message: "Quá nhiều lượt gửi yêu cầu từ IP này, vui lòng thử lại sau 15 phút.",
    });
  },
});

// Limiter chung cho toàn bộ API (tùy chọn gắn vào app.js)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 300, // 300 request từ 1 IP
  handler: (req, res, next) => {
    res.status(429).json({
      status: "error",
      message: "Hệ thống đang quá tải yêu cầu từ IP của bạn, vui lòng qua chậm một chút.",
    });
  },
});

module.exports = {
  authLimiter,
  apiLimiter,
};
