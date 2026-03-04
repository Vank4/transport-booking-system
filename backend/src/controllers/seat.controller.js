const Seat = require("../models/seats.model");

// Kiểm tra trạng thái ghế
exports.checkSeatStatus = async (req, res) => {
  const { seatId } = req.params;

  try {
    const seat = await Seat.findById(seatId);
    if (!seat) return res.status(404).json({ message: "Seat not found!" });

    res.status(200).json({ status: seat.status });
  } catch (err) {
    res.status(500).json({ message: "Internal server error!" });
  }
};

// Giữ ghế
exports.holdSeat = async (req, res) => {
  const { seatId } = req.params;

  try {
    const seat = await Seat.findById(seatId);
    if (!seat) return res.status(404).json({ message: "Seat not found!" });

    seat.status = "HELD";
    seat.held_by_booking_id = req.body.booking_id; // Thêm thông tin booking ID
    seat.hold_expired_at = new Date().getTime() + 15 * 60 * 1000;

    await seat.save();
    res.status(200).json({ message: "Seat held successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error!" });
  }
};

// Thả ghế
exports.releaseSeat = async (req, res) => {
  const { seatId } = req.params;

  try {
    const seat = await Seat.findById(seatId);
    if (!seat) return res.status(404).json({ message: "Seat not found!" });

    seat.status = "AVAILABLE";
    seat.held_by_booking_id = null;
    seat.hold_expired_at = null;

    await seat.save();
    res.status(200).json({ message: "Seat released successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error!" });
  }
};
