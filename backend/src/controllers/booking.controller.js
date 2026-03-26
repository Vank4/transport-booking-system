const Booking = require("../models/bookings.model");
const Payment = require("../models/payments.model");
const Seat = require("../models/seats.model");
const Ticket = require("../models/tickets.model");
const Voucher = require("../models/vouchers.model");
const FlightFare = require("../models/flightFares.model");
const Flight = require("../models/flights.model");
const TrainTrip = require("../models/trainTrips.model");
const Airport = require("../models/airports.model");
const TrainStation = require("../models/trainStations.model");
const Airline = require("../models/airlines.model");
const Train = require("../models/trains.model");

function mapBookingStatus(status) {
  if (status === "CONFIRMED") return "paid";
  if (status === "WAITING_PAYMENT" || status === "PENDING") return "pending";
  return "expired";
}

async function buildFlightBookingView(booking) {
  const flight = await Flight.findById(booking.trip_id).lean();
  if (!flight) return null;

  const [departureAirport, arrivalAirport, airline] = await Promise.all([
    Airport.findById(flight.departure_airport_id).lean(),
    Airport.findById(flight.arrival_airport_id).lean(),
    Airline.findById(flight.airline_id).lean(),
  ]);

  const origin = departureAirport?.city || "Ch\u01b0a x\u00e1c \u0111\u1ecbnh";
  const destination = arrivalAirport?.city || "Ch\u01b0a x\u00e1c \u0111\u1ecbnh";

  return {
    id: booking._id,
    code: booking.booking_code,
    route: `${origin} \u2192 ${destination}`,
    origin,
    destination,
    bookingDate: booking.created_at,
    departureDate: flight.departure_time,
    arrivalDate: flight.arrival_time,
    status: mapBookingStatus(booking.status),
    transportType: "flight",
    carrier: airline?.name || flight.flight_number || "Chuy\u1ebfn bay",
    price: booking.total_amount,
  };
}

async function buildTrainBookingView(booking) {
  const trainTrip = await TrainTrip.findById(booking.trip_id).lean();
  if (!trainTrip) return null;

  const [departureStation, arrivalStation, train] = await Promise.all([
    TrainStation.findById(trainTrip.departure_station_id).lean(),
    TrainStation.findById(trainTrip.arrival_station_id).lean(),
    Train.findById(trainTrip.train_id).lean(),
  ]);

  const origin = departureStation?.city || departureStation?.name || "Ch\u01b0a x\u00e1c \u0111\u1ecbnh";
  const destination = arrivalStation?.city || arrivalStation?.name || "Ch\u01b0a x\u00e1c \u0111\u1ecbnh";

  return {
    id: booking._id,
    code: booking.booking_code,
    route: `${origin} \u2192 ${destination}`,
    origin,
    destination,
    bookingDate: booking.created_at,
    departureDate: trainTrip.departure_time,
    arrivalDate: trainTrip.arrival_time,
    status: mapBookingStatus(booking.status),
    transportType: "train",
    carrier: train?.name || train?.train_number || "Chuy\u1ebfn t\u00e0u",
    price: booking.total_amount,
  };
}


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

    // Map để tra cứu giá từng ghế nhanh hơn (seat_id \u2192 final_price)
    const seatPriceMap = {};

    for (let seat of seatDocs) {
      if (seat.status === 'BOOKED' || seat.status === 'HELD') {
        return res.status(400).json({ message: `Ghế ${seat.seat_number} đã có người đặt hoặc đang giữ.` });
      }

      // 2. Query bảng giá từ FlightFare theo chuyến bay + hạng ghế
      // Chỉ áp dụng cho FLIGHT; TRAIN dùng base_price của TrainCarriage
      let seatPrice = 0;

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
        // TRAIN
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

    // 4. Tạo Ticket với final_price đúng từ bảng giá Tra cứu được
    const ticketPromises = passengers.map(async (p) => {
      const finalPrice = seatPriceMap[p.seat_id.toString()] || 0;

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
    if (booking.user_id.toString() !== req.user.userId) {
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
      user_id: req.user.userId,
    })
      .sort({ created_at: -1 })
      .lean();

    const data = (
      await Promise.all(
        bookings.map((booking) =>
          booking.booking_type === "FLIGHT"
            ? buildFlightBookingView(booking)
            : buildTrainBookingView(booking),
        ),
      )
    ).filter(Boolean);

    res.status(200).json({
      count: data.length,
      data,
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

    // CHECK NẾU ĐÃ ÁP DỤNG VOUCHER RỒI
    if (booking.voucher_applied) {
      return res.status(400).json({ success: false, message: "Booking này đã được áp dụng mã giảm giá. Không thể áp dụng thêm!" });
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
    booking.voucher_applied = voucher.code; // LƯU DẤU VẾT ĐÃ ÁP DỤNG
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


// ─── KAN-213: Xem lại toàn bộ thông tin Booking trước khi Checkout ──────────
exports.getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // KAN-214 & KAN-215: Tìm kiếm Booking và kiểm tra tính hợp lệ
    const booking = await Booking.findById(bookingId).lean();

    if (!booking) {
      return res.status(404).json({ success: false, message: "Không tìm thấy thông tin chuyến đi (Booking)!" });
    }

    const requestUserId = req.user && req.user.userId ? req.user.userId : null;
    if (booking.user_id && booking.user_id.toString() !== requestUserId) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập thông tin Booking này!" });
    }

    // KAN-216: Gom thông tin Hành Khách & Ghế ngồi từ bảng Tickets
    const tickets = await Ticket.find({ booking_id: booking._id })
      .populate({
        path: 'seat_id',
        select: 'seat_number class price_modifier status'
      })
      .lean();

    let passengerDetails = [];
    let totalDiscount = 0;

    // KAN-217: Ghép nối Dữ liệu Phụ (Tính năng Voucher Tương lai)
    if (tickets && tickets.length > 0) {
      passengerDetails = tickets.map(ticket => {
        return {
          ticket_id: ticket._id,
          passenger_name: ticket.passenger_name,
          id_card: ticket.passenger_id_card,
          seat_info: ticket.seat_id ? {
            id: ticket.seat_id._id,
            number: ticket.seat_id.seat_number,
            class: ticket.seat_id.class,
            additional_fee: ticket.seat_id.price_modifier
          } : null,
          final_price: ticket.final_price
        };
      });
    }

    // KAN-218: Gói ghém tất cả Data trả về cho Giao Diện Xong Xuôi
    res.status(200).json({
      success: true,
      data: {
        booking_summary: {
          id: booking._id,
          code: booking.booking_code,
          type: booking.booking_type,
          trip_id: booking.trip_id,
          status: booking.status,
          created_at: booking.created_at,
          expires_at: booking.expires_at,
        },
        financials: {
          total_amount: booking.total_amount, // Đã tự gánh tiền trừ từ hàm Voucher trước đó
          discount_applied: totalDiscount
        },
        passengers: passengerDetails
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi tải thông tin xác nhận!" });
  }
};

