const User = require("../models/users.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Đăng ký người dùng mới
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
    res.status(500).json({ message: "Internal server error!" });
  }
};

// Đăng nhập người dùng
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
