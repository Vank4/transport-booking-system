const Booking = require("../models/bookings.model");
const Payment = require("../models/payments.model");
const Seat = require("../models/seats.model");
const Ticket = require("../models/tickets.model");

// Tạo booking mới
exports.createBooking = async (req, res) => {
  try {
    const { trip_id, booking_type, seats, passengers } = req.body;
    const user_id = req.user && req.user.userId ? req.user.userId : null; // Lấy ID nếu có, không có thì xài null (Khách Vãng Lai)

    // 1. Kiểm tra trạng thái hàng ghế (KAn-203)
    const seatDocs = await Seat.find({ _id: { $in: seats } });
    if (seatDocs.length !== seats.length) {
      return res.status(400).json({ message: 'Một hoặc nhiều mã ghế không tồn tại.' });
    }

    let total_amount = 0;

    for (let seat of seatDocs) {
      if (seat.status === 'BOOKED' || seat.status === 'HELD') {
        return res.status(400).json({ message: `Ghế ${seat.seat_number} đã có người đặt hoặc đang giữ.` });
      }
      // 2. Tính tiền tự động ở backend (Giả lập vé gốc 500k + phụ phí ghế)
      let seatPrice = 500000 + (seat.price_modifier || 0);
      total_amount += seatPrice;
    }

    // 3. Tạo Booking thông minh
    const newBooking = new Booking({
      user_id: user_id,
      booking_code: "BKG" + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000),
      booking_type: booking_type,
      trip_id: trip_id,
      total_amount: total_amount,
      status: 'WAITING_PAYMENT',
      expires_at: new Date(Date.now() + 15 * 60 * 1000) // Hết hạn 15p
    });

    await newBooking.save();

    // 4. Tạo luôn dàn Vé máy bay / Vé tàu vào database Ticket
    const ticketPromises = passengers.map(async (p) => {
      return Ticket.create({
        booking_id: newBooking._id,
        seat_id: p.seat_id,
        passenger_name: p.passenger_name,
        passenger_id_card: p.passenger_id_card,
        final_price: 500000 // Tạm tính giống ở trên vòng lặp
      });
    });

    await Promise.all(ticketPromises);

    // 5. Cập nhật khóa ghế ngăn người khác mua trùng
    await Seat.updateMany(
      { _id: { $in: seats } },
      { $set: { status: 'HELD', held_by_booking_id: newBooking._id } }
    );

    res.status(201).json({
      message: "Booking created successfully, pending for payment",
      booking: newBooking
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
