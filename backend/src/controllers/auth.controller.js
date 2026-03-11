const crypto = require("crypto");
const authService = require("../services/auth.service");

const PasswordResetToken = require("../models/passwordResetToken.model");
const User = require("../models/users.model");

const bcrypt = require("bcrypt");
const env = require("../config/env");

const { sendPasswordResetEmail } = require("../utils/emailService");

// ─── Đăng ký người dùng mới ──────────────────────────────────────────────────
exports.registerUser = async (req, res) => {
  try {
    const result = await authService.registerUser(req.body);

    return res.status(201).json(result);
  } catch (err) {
    console.error("[registerUser]", err);
    return res.status(400).json({ message: err.message });
  }
};

// ─── Đăng nhập người dùng ─────────────────────────────────────────────────────
exports.loginUser = async (req, res) => {
  try {
    const result = await authService.loginUser(req.body);

    return res.status(200).json(result);
  } catch (err) {
    console.error("[loginUser]", err);
    return res.status(400).json({ message: err.message });
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

// ─── Quên mật khẩu: sinh OTP và gửi qua email ────────────────────────────────
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    // Tìm tài khoản theo email
    const user = await User.findOne({ email });

    // Sinh OTP 6 chữ số an toàn
    const otp = String(crypto.randomInt(100000, 1000000));

    // Hash OTP trước khi lưu
    const otpHash = await bcrypt.hash(otp, 10);

    // Xóa token cũ của user (nếu có) rồi tạo mới
    await PasswordResetToken.deleteMany({ user_id: user._id });

    const expiresAt = new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000);

    await PasswordResetToken.create({
      user_id: user._id,
      otp_hash: otpHash,
      expires_at: expiresAt,
      used: false,
    });

    // Gửi OTP qua email và chờ kết quả để đảm bảo gửi thành công
    const recipient = user.email;
    try {
      await sendPasswordResetEmail(recipient, otp);
    } catch (err) {
      console.error("[Password Reset Email Error]", err);
      // Nếu gửi email thất bại, xóa token đã tạo để tránh token treo
      await PasswordResetToken.deleteMany({ user_id: user._id });
      return res
        .status(500)
        .json({ message: "Failed to send OTP email. Please try again later." });
    }

    return res.status(200).json({
      message:
        "If an account is found, an OTP has been sent to the email address associated with this account.",
    });
  } catch (err) {
    console.error("[forgotPassword]", err);
    return res.status(500).json({ message: "Internal server error!" });
  }
};

// ─── Đặt lại mật khẩu: xác minh OTP và cập nhật mật khẩu mới ────────────────
exports.resetPassword = async (req, res) => {
  const { email, otp, new_password, confirm_password } = req.body;

  // Kiểm tra các trường bắt buộc
  if (!otp || !new_password || !confirm_password) {
    return res.status(400).json({
      message: "OTP, new password, and confirm password are required.",
    });
  }

  // Kiểm tra mật khẩu xác nhận có khớp không
  if (new_password !== confirm_password) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  try {
    // Tìm tài khoản
    const query = { email };
    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({ message: "Account not found." });
    }

    // Tìm token chưa dùng, chưa hết hạn
    const tokenRecord = await PasswordResetToken.findOne({
      user_id: user._id,
      used: false,
      expires_at: { $gt: new Date() },
    });

    if (!tokenRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // So khớp OTP
    const isOtpValid = await bcrypt.compare(otp, tokenRecord.otp_hash);
    if (!isOtpValid) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // Hash mật khẩu mới
    const newPasswordHash = await bcrypt.hash(new_password, 10);

    // Cập nhật mật khẩu user
    await User.updateOne(
      { _id: user._id },
      { password_hash: newPasswordHash, updated_at: new Date() },
    );

    // Đánh dấu token đã dùng (hoặc xóa hẳn)
    await PasswordResetToken.updateOne(
      { _id: tokenRecord._id },
      { used: true },
    );

    return res.status(200).json({
      message: "Password reset successfully.",
    });
  } catch (err) {
    console.error("[resetPassword]", err);
    return res.status(500).json({ message: "Internal server error!" });
  }
};
