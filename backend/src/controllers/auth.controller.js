const crypto = require("crypto");
const bcrypt = require("bcrypt");

const authService = require("../services/auth.service");
const { AuthServiceError } = require("../services/auth.service");

const PasswordResetToken = require("../models/passwordResetToken.model");
const User = require("../models/users.model");

const env = require("../config/env");

const { sendPasswordResetEmail } = require("../utils/emailService");

// Helper: maps an AuthServiceError to the correct HTTP response
function handleError(res, err, label) {
  if (err instanceof AuthServiceError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }
  console.error(`[${label}]`, err);
  return res
    .status(500)
    .json({ status: "error", message: "Internal server error." });
}

// POST /api/auth/register
exports.registerUser = async (req, res) => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json(result);
  } catch (err) {
    handleError(res, err, "registerUser");
  }
};

// POST /api/auth/login
exports.loginUser = async (req, res) => {
  try {
    const result = await authService.loginUser(req.body);
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err, "loginUser");
  }
};

// ─── Refresh Access Token ─────────────────────────────────────────
exports.refreshToken = async (req, res) => {
  try {
    const result = await authService.refreshToken(req.body);

    return res.status(200).json(result);
  } catch (err) {
    console.error("[refreshToken]", err);
    return res.status(403).json({ message: err.message });
  }
};

// ─── Xem hồ sơ cá nhân ─────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const user = await authService.getProfile(req.user.userId);

    return res.status(200).json({
      message: "Get profile success",
      data: user,
    });
  } catch (err) {
    console.error("[getProfile]", err);

    if (err.message === "User not found") {
      return res.status(404).json({
        message: err.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ─── Update Profile ─────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const result = await authService.updateProfile(req.user.userId, req.body);

    return res.status(200).json(result);
  } catch (err) {
    console.error("[updateProfile]", err);
    return res.status(500).json({ message: err.message });
  }
};

// ─── My Bookings ─────────────────────────────────────────
exports.myBookings = async (req, res) => {
  try {
    const result = await authService.myBookings(req.user.userId);

    return res.status(200).json(result);
  } catch (err) {
    console.error("[myBookings]", err);
    return res.status(500).json({ message: err.message });
  }
};

// ─── Change Password ─────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const result = await authService.changePassword(req.user.userId, req.body);

    return res.status(200).json(result);
  } catch (err) {
    console.error("[changePassword]", err);
    return res.status(400).json({ message: err.message });
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const result = await authService.forgotPassword(req.body);
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err, "forgotPassword");
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const result = await authService.resetPassword(req.body);
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err, "resetPassword");
  }
};
