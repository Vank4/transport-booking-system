const Booking = require("../models/bookings.model");
const Payment = require("../models/payments.model");

// Tạo một booking mới
exports.createBooking = async (req, res) => {
  const { user_id, booking_code, booking_type, total_amount, status } =
    req.body;

  try {
    const booking = new Booking({
      user_id,
      booking_code,
      booking_type,
      total_amount,
      status,
      created_at: new Date(),
    });

    await booking.save();
    res.status(201).json({ message: "Booking created successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error!" });
  }
};

// Xử lý thanh toán
exports.processPayment = async (req, res) => {
  const { booking_id, method, transaction_id, amount, status } = req.body;

  try {
    const payment = new Payment({
      booking_id,
      method,
      transaction_id,
      amount,
      status,
      paid_at: new Date(),
    });

    await payment.save();
    res.status(200).json({ message: "Payment processed successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error!" });
  }
};

// Lấy tất cả booking của người dùng
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({});
    res.status(200).json({ bookings });
  } catch (err) {
    res.status(500).json({ message: "Internal server error!" });
  }
};
