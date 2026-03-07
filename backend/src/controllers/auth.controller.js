const crypto = require("crypto");
const User = require("../models/users.model");
const PasswordResetToken = require("../models/passwordResetToken.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { sendPasswordResetEmail } = require("../utils/emailService");

// ─── Đăng ký người dùng mới ──────────────────────────────────────────────────
exports.registerUser = async (req, res) => {
  const { full_name, email, phone, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "Email already exists!" });

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
    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    console.error("[registerUser]", err);
    res.status(500).json({ message: "Internal server error!" });
  }
};

// ─── Đăng nhập người dùng ─────────────────────────────────────────────────────
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found!" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ message: "Invalid password!" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ message: "Login successful!", token });
  } catch (err) {
    res.status(500).json({ message: "Internal server error!" });
  }
};

// ─── Quên mật khẩu: sinh OTP và gửi qua email ────────────────────────────────
exports.forgotPassword = async (req, res) => {
  const { email, phone } = req.body;

  if (!email && !phone) {
    return res
      .status(400)
      .json({ message: "Email or phone number is required." });
  }

  try {
    // Tìm tài khoản theo email hoặc số điện thoại
    const query = email ? { email } : { phone };
    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({ message: "Account not found." });
    }

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

    // Gửi OTP qua email (chạy ngầm để không chặn phản hồi)
    const recipient = user.email;
    sendPasswordResetEmail(recipient, otp).catch((err) => {
      console.error("[Background Email Error]", err);
    });

    return res.status(200).json({
      message: "OTP sent to your email.",
    });
  } catch (err) {
    console.error("[forgotPassword]", err);
    return res.status(500).json({ message: "Internal server error!" });
  }
};

// ─── Đặt lại mật khẩu: xác minh OTP và cập nhật mật khẩu mới ────────────────
exports.resetPassword = async (req, res) => {
  const { email, phone, otp, new_password, confirm_password } = req.body;

  // Kiểm tra các trường bắt buộc
  if (!otp || !new_password || !confirm_password) {
    return res.status(400).json({
      message: "OTP, new password, and confirm password are required.",
    });
  }

  if (!email && !phone) {
    return res
      .status(400)
      .json({ message: "Email or phone number is required." });
  }

  // Kiểm tra mật khẩu xác nhận có khớp không
  if (new_password !== confirm_password) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  try {
    // Tìm tài khoản
    const query = email ? { email } : { phone };
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
