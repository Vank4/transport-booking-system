const User = require("../models/users.model");
const Booking = require("../models/bookings.model");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const env = require("../config/env");

// ─────────────────────────────────────────
// REGISTER (KAN-7)
// ─────────────────────────────────────────
exports.registerUser = async (data) => {
  const { full_name, email, phone, password } = data;

  if (!full_name || !email || !password) {
    throw new Error("Missing required fields.");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new Error("Email already exists!");
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

  return {
    message: "User registered successfully!",
  };
};

// ─────────────────────────────────────────
// LOGIN (KAN-6)
// ─────────────────────────────────────────
exports.loginUser = async (data) => {
  const { email, password } = data;

  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found!");
  }

  const match = await bcrypt.compare(password, user.password_hash);

  if (!match) {
    throw new Error("Invalid password!");
  }

  const accessToken = jwt.sign({ userId: user._id }, env.jwtSecret, {
    expiresIn: "1h",
  });

  const refreshToken = jwt.sign({ userId: user._id }, env.jwtRefreshSecret, {
    expiresIn: "7d",
  });

  return {
    message: "Login successful!",
    accessToken,
    refreshToken,
  };
};

// ─────────────────────────────────────────
// REFRESH TOKEN (KAN-8)
// ─────────────────────────────────────────
exports.refreshToken = async (data) => {
  const { refreshToken } = data;

  if (!refreshToken) {
    throw new Error("Refresh token required.");
  }

  try {
    const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret);

    const accessToken = jwt.sign({ userId: decoded.userId }, env.jwtSecret, {
      expiresIn: "1h",
    });

    return {
      accessToken,
    };
  } catch (err) {
    throw new Error("Invalid refresh token.");
  }
};

// ─────────────────────────────────────────
// GET PROFILE
// ─────────────────────────────────────────
exports.getProfile = async (userId) => {
  const user = await User.findById(userId).select("-password_hash -__v");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

// ─────────────────────────────────────────
// UPDATE PROFILE (KAN-26)
// ─────────────────────────────────────────
exports.updateProfile = async (userId, data) => {
  const { full_name, phone } = data;

  await User.updateOne(
    { _id: userId },
    {
      full_name,
      phone,
      updated_at: new Date(),
    },
  );

  return {
    message: "Profile updated successfully.",
  };
};

// ─────────────────────────────────────────
// MY BOOKINGS (KAN-32)
// ─────────────────────────────────────────
exports.myBookings = async (userId) => {
  const bookings = await Booking.find({ user_id: userId });

  return bookings;
};

// ─────────────────────────────────────────
// CHANGE PASSWORD (KAN-38)
// ─────────────────────────────────────────
exports.changePassword = async (userId, data) => {
  const { oldPassword, newPassword } = data;

  if (!oldPassword || !newPassword) {
    throw new Error("Old password and new password are required.");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  const match = await bcrypt.compare(oldPassword, user.password_hash);

  if (!match) {
    throw new Error("Old password is incorrect.");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await User.updateOne(
    { _id: userId },
    {
      password_hash: hashedPassword,
      updated_at: new Date(),
    },
  );

  return {
    message: "Password changed successfully.",
  };
};
