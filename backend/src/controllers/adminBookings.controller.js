const Booking = require("../models/bookings.model");
const Ticket = require("../models/tickets.model");
const Payment = require("../models/payments.model");
const Seat = require("../models/seats.model");
const Flight = require("../models/flights.model");
const TrainTrip = require("../models/trainTrips.model");
const User = require("../models/users.model");

// GET /api/admin/bookings
exports.getAllBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, q = "", status = "" } = req.query;
    
    const query = {};
    if (q) {
      query.$or = [
        { booking_code: { $regex: q, $options: "i" } },
      ];
    }
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate("user_id", "email full_name phone")
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        bookings,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

// GET /api/admin/bookings/:id
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user_id", "email full_name phone")
      .lean();

    if (!booking) {
      return res.status(404).json({ success: false, message: "Không tìm thấy booking" });
    }

    // Populate chuyến đi tương ứng
    let tripDetails = null;
    if (booking.booking_type === "FLIGHT") {
      tripDetails = await Flight.findById(booking.trip_id)
        .populate("airline_id", "name iata_code")
        .populate("departure_airport_id", "name city iata_code")
        .populate("arrival_airport_id", "name city iata_code")
        .lean();
    } else {
      tripDetails = await TrainTrip.findById(booking.trip_id)
        .populate("train_id", "name train_number")
        .populate("departure_station_id", "name city")
        .populate("arrival_station_id", "name city")
        .lean();
    }

    // Fetch tickets
    const tickets = await Ticket.find({ booking_id: booking._id })
      .populate("seat_id", "seat_number class status")
      .lean();

    // Fetch payments
    const payments = await Payment.find({ booking_id: booking._id }).lean();

    res.status(200).json({
      success: true,
      data: {
        booking,
        tripDetails,
        tickets,
        payments
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

// PUT /api/admin/bookings/:id/status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["PENDING", "WAITING_PAYMENT", "CONFIRMED", "CANCELLED", "EXPIRED"];
    
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Không tìm thấy booking" });
    }

    // Nếu chuyển sang CANCELLED hoặc EXPIRED, cần giải phóng ghế
    if (
      (status === "CANCELLED" || status === "EXPIRED") &&
      (booking.status !== "CANCELLED" && booking.status !== "EXPIRED")
    ) {
      const tickets = await Ticket.find({ booking_id: booking._id });
      const seatIds = tickets.map(t => t.seat_id);
      
      // Update seat status to AVAILABLE
      await Seat.updateMany(
        { _id: { $in: seatIds } },
        { $set: { status: 'AVAILABLE', held_by_booking_id: null } }
      );
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      data: booking,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

// DELETE /api/admin/bookings/:id
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Không tìm thấy booking" });
    }

    // Giải phóng ghế
    const tickets = await Ticket.find({ booking_id: booking._id });
    const seatIds = tickets.map(t => t.seat_id);
    if (seatIds.length > 0) {
      await Seat.updateMany(
        { _id: { $in: seatIds } },
        { $set: { status: 'AVAILABLE', held_by_booking_id: null } }
      );
    }

    // Xóa liên kết (Cascade)
    await Ticket.deleteMany({ booking_id: booking._id });
    await Payment.deleteMany({ booking_id: booking._id });
    await Booking.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Xóa booking thành công",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};
