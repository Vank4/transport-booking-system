const jwt = require("jsonwebtoken");
const env = require("../config/env");

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, env.jwtSecret, { expiresIn: "1h" });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, env.jwtRefreshSecret, { expiresIn: "7d" });
};

const verifyToken = (token, secret) => {
  return jwt.verify(token, secret);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
};
