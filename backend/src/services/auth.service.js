const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/users.model");
const Booking = require("../models/bookings.model");
const PasswordResetToken = require("../models/passwordResetToken.model");

const { sendPasswordResetEmail } = require("../utils/email.service");
const env = require("../config/env");

// ─────────────────────────────────────────
// Custom Error
// ─────────────────────────────────────────
class AuthServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "AuthServiceError";
    this.statusCode = statusCode;
  }
}

// ─────────────────────────────────────────
// REGISTER (KAN-7)
// ─────────────────────────────────────────
async function registerUser({ full_name, email, phone, password }) {
  if (!full_name || !email || !password) {
    throw new AuthServiceError("Missing required fields.", 400);
  }

  if (password.length < 6) {
    throw new AuthServiceError("Password must be at least 6 characters.", 400);
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new AuthServiceError("Email already exists.", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({
    full_name,
    email,
    phone,
    password_hash: hashedPassword,
    role: "USER",
    status: "ACTIVE",
    created_at: new Date(),
  });

  await user.save();

  return { message: "User registered successfully." };
}

// ─────────────────────────────────────────
// LOGIN (KAN-6)
// ─────────────────────────────────────────
async function loginUser({ email, password }) {
  if (!email || !password) {
    throw new AuthServiceError("Email and password are required.", 400);
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new AuthServiceError("User not found.", 404);
  }

  const match = await bcrypt.compare(password, user.password_hash);

  if (!match) {
    throw new AuthServiceError("Invalid password.", 400);
  }

  const accessToken = jwt.sign({ userId: user._id }, env.jwtSecret, {
    expiresIn: "1h",
  });

  const refreshToken = jwt.sign({ userId: user._id }, env.jwtRefreshSecret, {
    expiresIn: "7d",
  });

  return {
    message: "Login successful.",
    accessToken,
    refreshToken,
  };
}

// ─────────────────────────────────────────
// REFRESH TOKEN (KAN-8)
// ─────────────────────────────────────────
async function refreshToken({ refreshToken }) {
  if (!refreshToken) {
    throw new AuthServiceError("Refresh token required.", 400);
  }

  try {
    const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret);

    const accessToken = jwt.sign({ userId: decoded.userId }, env.jwtSecret, {
      expiresIn: "1h",
    });

    return { accessToken };
  } catch (err) {
    throw new AuthServiceError("Invalid refresh token.", 401);
  }
}

// ─────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────
async function forgotPassword({ email }) {
  if (!email) throw new AuthServiceError("Email is required.", 400);

  const user = await User.findOne({ email });

  const otp = String(crypto.randomInt(100000, 1000000));
  const otpHash = await bcrypt.hash(otp, 10);

  if (user) {
    await PasswordResetToken.deleteMany({ user_id: user._id });

    const expiresAt = new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000);

    await PasswordResetToken.create({
      user_id: user._id,
      otp_hash: otpHash,
      expires_at: expiresAt,
      used: false,
    });

    try {
      await sendPasswordResetEmail(user.email, otp);
    } catch (err) {
      await PasswordResetToken.deleteMany({ user_id: user._id });

      throw new AuthServiceError(
        "Failed to send OTP email. Please try again later.",
        500,
      );
    }
  }

  return {
    message:
      "If an account is found, an OTP has been sent to the email address associated with this account.",
  };
}

// ─────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────
async function resetPassword({ email, otp, new_password, confirm_password }) {
  if (!otp || !new_password || !confirm_password) {
    throw new AuthServiceError(
      "OTP, new password, and confirm password are required.",
      400,
    );
  }

  if (new_password !== confirm_password) {
    throw new AuthServiceError("Passwords do not match.", 400);
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new AuthServiceError("Account not found.", 404);
  }

  const tokenRecord = await PasswordResetToken.findOne({
    user_id: user._id,
    used: false,
    expires_at: { $gt: new Date() },
  });

  if (!tokenRecord) {
    throw new AuthServiceError("Invalid or expired OTP.", 400);
  }

  const isOtpValid = await bcrypt.compare(otp, tokenRecord.otp_hash);

  if (!isOtpValid) {
    throw new AuthServiceError("Invalid or expired OTP.", 400);
  }

  const newPasswordHash = await bcrypt.hash(new_password, 10);

  await User.updateOne(
    { _id: user._id },
    {
      password_hash: newPasswordHash,
      updated_at: new Date(),
    },
  );

  await PasswordResetToken.updateOne({ _id: tokenRecord._id }, { used: true });

  return { message: "Password reset successfully." };
}

// ─────────────────────────────────────────
// GET PROFILE
// ─────────────────────────────────────────
async function getProfile(userId) {
  const user = await User.findById(userId).select("-password_hash -__v");

  if (!user) {
    throw new AuthServiceError("User not found.", 404);
  }

  return user;
}

// ─────────────────────────────────────────
// UPDATE PROFILE (KAN-26)
// ─────────────────────────────────────────
async function updateProfile(userId, { full_name, phone }) {
  await User.updateOne(
    { _id: userId },
    {
      full_name,
      phone,
      updated_at: new Date(),
    },
  );

  return { message: "Profile updated successfully." };
}

// ─────────────────────────────────────────
// MY BOOKINGS (KAN-32)
// ─────────────────────────────────────────
async function myBookings(userId) {
  const bookings = await Booking.find({ user_id: userId });

  return bookings;
}

// ─────────────────────────────────────────
// CHANGE PASSWORD (KAN-38)
// ─────────────────────────────────────────
async function changePassword(userId, { oldPassword, newPassword }) {
  if (!oldPassword || !newPassword) {
    throw new AuthServiceError(
      "Old password and new password are required.",
      400,
    );
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AuthServiceError("User not found.", 404);
  }

  const match = await bcrypt.compare(oldPassword, user.password_hash);

  if (!match) {
    throw new AuthServiceError("Old password is incorrect.", 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await User.updateOne(
    { _id: userId },
    {
      password_hash: hashedPassword,
      updated_at: new Date(),
    },
  );

  return { message: "Password changed successfully." };
}

module.exports = {
  AuthServiceError,
  registerUser,
  loginUser,
  refreshToken,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  myBookings,
  changePassword,
};
