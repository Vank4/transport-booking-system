const jwt = require("jsonwebtoken");

// Middleware để kiểm tra token
const authMiddleware = (req, res, next) => {
  // Lấy token từ header (Authorization: Bearer token)
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied!" });
  }

  try {
    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Thêm thông tin người dùng vào request (userId, v.v.)
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid!" });
  }
};

module.exports = authMiddleware;
