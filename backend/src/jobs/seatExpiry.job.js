const Seat = require("../models/seats.model");

// Job kiểm tra ghế hết hạn giữ
async function releaseExpiredSeats() {
  try {
    const now = new Date();

    const result = await Seat.updateMany(
      {
        status: "HELD",
        hold_expired_at: { $lt: now },
      },
      {
        $set: {
          status: "AVAILABLE",
          held_by_booking_id: null,
          hold_expired_at: null,
        },
      },
    );

    if (result.modifiedCount > 0) {
      console.log(`[SeatJob] Released ${result.modifiedCount} expired seats`);
    }
  } catch (err) {
    console.error("[SeatJob] Error releasing seats:", err);
  }
}

module.exports = releaseExpiredSeats;
