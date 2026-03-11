const Seat = require("../models/seats.model");
const { emitSeatUpdate } = require("../socket");

// Job: release expired holds and notify connected clients
async function releaseExpiredSeats() {
  try {
    const now = new Date();

    // Find all expired HELD seats before bulk-updating (need IDs + trip refs for emit)
    const expiredSeats = await Seat.find({
      status: "HELD",
      hold_expired_at: { $lt: now },
    });

    if (expiredSeats.length === 0) return;

    // Bulk release
    const result = await Seat.updateMany(
      { status: "HELD", hold_expired_at: { $lt: now } },
      {
        $set: {
          status: "AVAILABLE",
          held_by: null,
          held_by_booking_id: null,
          hold_expired_at: null,
        },
      },
    );

    console.log(`[SeatJob] Released ${result.modifiedCount} expired seats`);

    // Emit seat_released for each expired seat to its trip room
    expiredSeats.forEach((seat) => {
      // Determine tripId: prefer flight_id, fall back to carriage's train trip
      const tripId = seat.flight_id?.toString() ?? null;
      if (!tripId) return; // train seats need carriage lookup — skip for now

      try {
        emitSeatUpdate(tripId, "seat_released", {
          tripId,
          seatId: seat._id,
          seat_number: seat.seat_number,
          status: "AVAILABLE",
          updatedAt: now,
        });
      } catch {
        // socket not ready, ignore
      }
    });
  } catch (err) {
    console.error("[SeatJob] Error releasing seats:", err);
  }
}

module.exports = releaseExpiredSeats;
