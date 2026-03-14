const Booking = require("../models/bookings.model");
const Payment = require("../models/payments.model");
const Seat = require("../models/seats.model");
const Ticket = require("../models/tickets.model");
const Voucher = require("../models/vouchers.model");
const FlightFare = require("../models/flightFares.model");


// Tạo booking mới
exports.createBooking = async (req, res) => {
  try {
    const { trip_id, booking_type, seats, passengers } = req.body;
    const user_id = req.user && req.user.userId ? req.user.userId : null;

    // 1. Kiểm tra trạng thái hàng ghế
    const seatDocs = await Seat.find({ _id: { $in: seats } });
    if (seatDocs.length !== seats.length) {
      return res.status(400).json({ message: 'Một hoặc nhiều mã ghế không tồn tại.' });
    }

    let total_amount = 0;

    // Map để tra cứu giá từng ghế nhanh hơn (seat_id → effective_price)
    const seatPriceMap = {};

    for (let seat of seatDocs) {
      if (seat.status === 'BOOKED' || seat.status === 'HELD') {
        return res.status(400).json({ message: `Ghế ${seat.seat_number} đã có người đặt hoặc đang giữ.` });
      }

      // 2. Query bảng giá từ FlightFare theo chuyến bay + hạng ghế
      // Chỉ áp dụng cho FLIGHT; TRAIN dùng base_price của TrainCarriage
      let seatPrice;

      if (booking_type === 'FLIGHT') {
        const fare = await FlightFare.findOne({
          flight_id: trip_id,
          cabin_class: seat.class,
          is_active: true,
        });

        if (!fare) {
          return res.status(400).json({
            message: `Không tìm thấy bảng giá cho hạng ${seat.class} trên chuyến bay này. Vui lòng liên hệ quản trị viên.`,
          });
        }

        // Ưu tiên giá khuyến mãi, nếu không có thì dùng giá gốc
        const effectivePrice = fare.promo_price != null ? fare.promo_price : fare.base_price;
        seatPrice = effectivePrice + (seat.price_modifier || 0);
      } else {
        // TRAIN: giữ nguyên logic cũ (TrainCarriage.base_price được tính ngoài)
        // Tạm giữ price_modifier của ghế tàu
        seatPrice = seat.price_modifier || 0;
      }

      seatPriceMap[seat._id.toString()] = seatPrice;
      total_amount += seatPrice;
    }

    // 3. Tạo Booking
    const newBooking = new Booking({
      user_id: user_id,
      booking_code: "BKG" + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000),
      booking_type: booking_type,
      trip_id: trip_id,
      total_amount: total_amount,
      status: 'WAITING_PAYMENT',
      expires_at: new Date(Date.now() + 15 * 60 * 1000),
    });

    await newBooking.save();

    // 4. Tạo Ticket với final_price đúng từ bảng giá FlightFare
    const ticketPromises = passengers.map(async (p) => {
      const thisSeat = seatDocs.find(s => s._id.toString() === p.seat_id.toString());
      const finalPrice = thisSeat ? seatPriceMap[thisSeat._id.toString()] : 0;

      return Ticket.create({
        booking_id: newBooking._id,
        seat_id: p.seat_id,
        passenger_name: p.passenger_name,
        passenger_id_card: p.passenger_id_card,
        final_price: finalPrice,
      });
    });

    await Promise.all(ticketPromises);

    // 5. Khoá ghế để ngăn người khác đặt trùng
    await Seat.updateMany(
      { _id: { $in: seats } },
      { $set: { status: 'HELD', held_by_booking_id: newBooking._id } }
    );

    res.status(201).json({
      message: "Booking created successfully, pending for payment",
      booking: newBooking,
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
// Áp dụng Voucher vào Booking 
exports.applyVoucher = async (req, res) => {
  try {
    const { booking_id, voucher_code } = req.body;

    // KAN-209: Kiểm tra đầu vào tồn tại và tìm Booking
    if (!booking_id || !voucher_code) {
      return res.status(400).json({ success: false, message: "Thiếu mã Booking hoặc Mã giảm giá!" });
    }

    const Booking = require("../models/bookings.model");
    const booking = await Booking.findById(booking_id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Không tìm thấy thông tin chuyến đi (Booking)!" });
    }

    // Tường lửa chống lấy trộm / sửa Booking người khác
    const requestUserId = req.user && req.user.userId ? req.user.userId : null;
    if (booking.user_id && booking.user_id.toString() !== requestUserId) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền sửa đổi Booking này!" });
    }

    // Chặn áp dụng lên Booking đã nộp tiền
    if (booking.status !== "WAITING_PAYMENT" && booking.status !== "PENDING") {
      return res.status(400).json({ success: false, message: "Booking đã hết hạn, đã hủy hoặc đã hoàn tất thanh toán!" });
    }

    // KAN-209 & KAN-210: Kiểm tra điều kiện khắc nghiệt của Voucher
    const voucher = await Voucher.findOne({ code: voucher_code.toUpperCase() });

    if (!voucher) {
      return res.status(404).json({ success: false, message: "Mã giảm giá không tồn tại!" });
    }

    if (!voucher.is_active || voucher.used_count >= voucher.usage_limit) {
      return res.status(400).json({ success: false, message: "Mã giảm giá đã hết lượt sử dụng hoặc bị vô hiệu hóa!" });
    }

    const now = new Date();
    if (now > voucher.expiry_date) {
      return res.status(400).json({ success: false, message: "Mã giảm giá đã hết hạn sử dụng!" });
    }

    if (booking.total_amount < voucher.min_order_value) {
      return res.status(400).json({ success: false, message: `Mã giảm giá chỉ áp dụng cho đơn hàng từ ${voucher.min_order_value.toLocaleString()} VND!` });
    }

    // KAN-211: Tính toán số tiền được giảm giá
    let discount_amount = 0;
    if (voucher.discount_type === "PERCENTAGE") {
      // Tính theo %
      discount_amount = (booking.total_amount * voucher.discount_value) / 100;
      // Áp trần tối đa
      if (voucher.max_discount && discount_amount > voucher.max_discount) {
        discount_amount = voucher.max_discount;
      }
    } else {
      // FIXED - Trừ thẳng tiền mặt
      discount_amount = voucher.discount_value;
    }

    // Chặn số Âm (Nếu voucher 500k áp cho hoá đơn 100k)
    if (discount_amount >= booking.total_amount) {
      discount_amount = booking.total_amount;
    }

    const old_total = booking.total_amount;
    const new_total = booking.total_amount - discount_amount;

    // KAN-212: Tiêu hao lượt dùng Voucher & Cập nhật Hoá Đơn
    voucher.used_count += 1;
    await voucher.save();

    booking.total_amount = new_total;
    await booking.save(); // Lưu giá mới vào DB

    // Phản hồi về Frontend thành công
    res.status(200).json({
      success: true,
      message: "Áp dụng mã giảm giá thành công!",
      data: {
        booking_id: booking._id,
        voucher_code: voucher.code,
        old_total: old_total,
        discount_amount: discount_amount,
        final_total: new_total
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi áp dụng voucher!" });
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
