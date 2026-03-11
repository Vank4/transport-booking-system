const jwt = require("jsonwebtoken");
const env = require("../config/env");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authorization token missing!",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, env.jwtSecret);

    if (!decoded.userId) {
      return res.status(401).json({
        message: "Invalid token payload.",
      });
    }

    req.user = {
      userId: decoded.userId,
    };

    next();
  } catch (err) {
    console.error("[authMiddleware]", err.message);

    return res.status(401).json({
      message: "Invalid or expired token!",
    });
  }
};

module.exports = authMiddleware;
