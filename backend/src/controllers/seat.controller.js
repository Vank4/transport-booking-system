const Seat = require("../models/seats.model");

// Kiểm tra trạng thái ghế
exports.checkSeatStatus = async (req, res) => {
  const { seatId } = req.params;

  try {
    const seat = await Seat.findById(seatId);

    if (!seat) {
      return res.status(404).json({ message: "Seat not found!" });
    }

    res.status(200).json({
      seatId: seat._id,
      status: seat.status,
      holdExpiredAt: seat.hold_expired_at,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error!" });
  }
};

// Giữ ghế
exports.holdSeat = async (req, res) => {
  const { seatId } = req.params;
  const { booking_id } = req.body;

  try {
    const seat = await Seat.findById(seatId);

    if (!seat) {
      return res.status(404).json({ message: "Seat not found!" });
    }

    const now = new Date();

    // Nếu ghế đang HELD nhưng đã hết hạn -> cho phép giữ lại
    if (
      seat.status === "HELD" &&
      seat.hold_expired_at &&
      seat.hold_expired_at > now
    ) {
      return res.status(400).json({
        message: "Seat is currently held by another booking!",
      });
    }

    seat.status = "HELD";
    seat.held_by_booking_id = booking_id;
    seat.hold_expired_at = new Date(Date.now() + 15 * 60 * 1000);

    await seat.save();

    res.status(200).json({
      message: "Seat held successfully!",
      seatId: seat._id,
      holdExpiredAt: seat.hold_expired_at,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error!" });
  }
};

// Thả ghế
exports.releaseSeat = async (req, res) => {
  const { seatId } = req.params;

  try {
    const seat = await Seat.findById(seatId);

    if (!seat) {
      return res.status(404).json({ message: "Seat not found!" });
    }

    seat.status = "AVAILABLE";
    seat.held_by_booking_id = null;
    seat.hold_expired_at = null;

    await seat.save();

    res.status(200).json({
      message: "Seat released successfully!",
      seatId: seat._id,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error!" });
  }
};
