const Seat = require("../models/seats.model");
const Booking = require("../models/bookings.model");
const Payment = require("../models/payments.model");
const { emitSeatUpdate } = require("../socket");

/**
 * Giải phóng các ghế hết hạn và tự động hủy các Booking quá hạn thanh toán.
 * Kết hợp logic cập nhật database và thông báo Socket realtime.
 */
async function releaseExpiredSeats() {
  try {
    const now = new Date();
    // Tìm các Booking quá hạn 15 phút và đang ở trạng thái chờ
    const expiredBookings = await Booking.find({
      status: { $in: ["PENDING", "WAITING_PAYMENT"] },
      expires_at: { $lt: now }
    });

    const expiredBookingIds = expiredBookings.map(b => b._id);

    if (expiredBookingIds.length > 0) {
      // Cập nhật trạng thái Booking thành EXPIRED
      await Booking.updateMany(
        { _id: { $in: expiredBookingIds } },
        { $set: { status: "EXPIRED" } }
      );

      // Cập nhật trạng thái Payment liên quan thành FAILED
      await Payment.updateMany(
        { booking_id: { $in: expiredBookingIds }, status: "PENDING" },
        { $set: { status: "FAILED" } }
      );
    }

    // Tìm các ghế: Thuộc Booking vừa hết hạn HOẶC Ghế HELD đã quá hạn giữ (standalone hold)
    const expiredSeats = await Seat.find({
      $or: [
        { held_by_booking_id: { $in: expiredBookingIds } },
        { status: "HELD", hold_expired_at: { $lt: now } }
      ]
    });

    if (expiredSeats.length === 0) return;

    // Cập nhật hàng loạt trạng thái ghế về AVAILABLE
    const result = await Seat.updateMany(
      { _id: { $in: expiredSeats.map(s => s._id) } },
      {
        $set: {
          status: "AVAILABLE",
          held_by: null,
          held_by_booking_id: null,
          hold_expired_at: null,
        },
      }
    );

    console.log(`[SeatJob] Đã hủy ${expiredBookingIds.length} Booking. Giải phóng ${result.modifiedCount} ghế quá hạn.`);

    // Duyệt qua danh sách ghế vừa giải phóng để báo cho Frontend
    expiredSeats.forEach((seat) => {
      // Xác định tripId (Ưu tiên lấy từ flight_id, nếu là tàu hỏa thì cần logic tra cứu thêm)
      const tripId = seat.flight_id?.toString();
      if (!tripId) return;

      try {
        emitSeatUpdate(tripId, "seat_released", {
          tripId,
          seatId: seat._id,
          seat_number: seat.seat_number,
          status: "AVAILABLE",
          updatedAt: now,
        });
      } catch (error) {
      }
    });

  } catch (err) {
    console.error("[ExpiryJob] Lỗi trong quá trình xử lý hết hạn:", err);
  }
}

module.exports = releaseExpiredSeats;
