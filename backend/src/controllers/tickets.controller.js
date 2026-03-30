const Ticket = require("../models/tickets.model");
const Booking = require("../models/bookings.model");
const Seat = require("../models/seats.model");

// GET /api/tickets
exports.getAllTickets = async (req, res) => {
  try {
    const { page = 1, limit = 10, q = "", booking_id } = req.query;
    
    const query = {};
    if (q) {
      query.$or = [
        { passenger_name: { $regex: q, $options: "i" } },
        { passenger_id_card: { $regex: q, $options: "i" } }
      ];
    }
    if (booking_id) {
      query.booking_id = booking_id;
    }

    const tickets = await Ticket.find(query)
      .populate("booking_id", "booking_code booking_type status")
      .populate("seat_id", "seat_number class")
      .sort({ _id: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Ticket.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        tickets,
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

// GET /api/tickets/:id
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate({
        path: "booking_id",
        populate: { path: "user_id", select: "full_name email phone" }
      })
      .populate("seat_id")
      .lean();

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Không tìm thấy vé" });
    }

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

// PUT /api/tickets/:id
exports.updateTicket = async (req, res) => {
  try {
    const { passenger_name, passenger_id_card, date_of_birth, gender, passenger_type, contact_info } = req.body;
    
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Không tìm thấy vé" });
    }

    // Update only passenger info to avoid complex pricing/seat recalculations for now
    if (passenger_name) ticket.passenger_name = passenger_name;
    if (passenger_id_card) ticket.passenger_id_card = passenger_id_card;
    if (date_of_birth) ticket.date_of_birth = date_of_birth;
    if (gender) ticket.gender = gender;
    if (passenger_type) ticket.passenger_type = passenger_type;
    if (contact_info) ticket.contact_info = contact_info;

    await ticket.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin hành khách thành công",
      data: ticket,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

// DELETE /api/tickets/:id
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Không tìm thấy vé" });
    }

    // Free the seat
    if (ticket.seat_id) {
      await Seat.findByIdAndUpdate(ticket.seat_id, {
        status: 'AVAILABLE',
        held_by_booking_id: null
      });
    }

    // Update the booking total mapping
    const booking = await Booking.findById(ticket.booking_id);
    if (booking) {
      booking.total_amount = Math.max(0, booking.total_amount - ticket.final_price);
      await booking.save();
    }

    await Ticket.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Xóa vé thành công và cập nhật lại giá tiền đơn hàng",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};
