const jwt = require("jsonwebtoken");
const crypto = require("crypto");

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function generateAccessToken(payload) {
  return jwt.sign(payload, requiredEnv("ACCESS_TOKEN_SECRET"), {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "1h",
  });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, requiredEnv("REFRESH_TOKEN_SECRET"), {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES || "7d",
    jwtid: crypto.randomUUID(),
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, requiredEnv("ACCESS_TOKEN_SECRET"));
}

function verifyRefreshToken(token) {
  return jwt.verify(token, requiredEnv("REFRESH_TOKEN_SECRET"));
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
