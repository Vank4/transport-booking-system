const Booking = require("../models/bookings.model");
const Payment = require("../models/payments.model");

// Tạo booking mới
exports.createBooking = async (req, res) => {
  try {
    const { booking_code, booking_type, total_amount, status } = req.body;

    const booking = new Booking({
      user_id: req.user.id, // lấy từ token, không lấy từ client
      booking_code,
      booking_type,
      total_amount,
      status: status || "PENDING",
      created_at: new Date(),
    });

    await booking.save();

    res.status(201).json({
      message: "Booking created successfully!",
      booking,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error!" });
  }
};

// Xử lý thanh toán
exports.processPayment = async (req, res) => {
  try {
    const { booking_id, method, transaction_id, amount, status } = req.body;

    // kiểm tra booking tồn tại
    const booking = await Booking.findById(booking_id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found!" });
    }

    // kiểm tra booking thuộc user
    if (booking.user_id.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You are not allowed to pay for this booking",
      });
    }

    const payment = new Payment({
      booking_id,
      method,
      transaction_id,
      amount,
      status,
      paid_at: new Date(),
    });

    await payment.save();

    // cập nhật trạng thái booking nếu thanh toán thành công
    if (status === "SUCCESS") {
      booking.status = "CONFIRMED";
      await booking.save();
    }

    res.status(200).json({
      message: "Payment processed successfully!",
      payment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error!" });
  }
};

// Lấy tất cả booking của user đang đăng nhập
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      user_id: req.user.id,
    }).sort({ created_at: -1 });

    res.status(200).json({
      count: bookings.length,
      bookings,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error!" });
  }
};

// Lấy chi tiết 1 booking
exports.getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found!" });
    }

    // kiểm tra quyền truy cập
    if (booking.user_id.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You are not allowed to view this booking",
      });
    }

    res.status(200).json({ booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error!" });
  }
};
