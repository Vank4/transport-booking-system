const Seat = require("../models/seats.model");
const Booking = require("../models/bookings.model");
const Payment = require("../models/payments.model");
const { emitSeatUpdate } = require("../socket");

// Job kiểm tra ghế và booking hết hạn giữ + Update Realtime qua Socket
async function releaseExpiredSeats() {
  try {
    const now = new Date();
    let seatsToReleaseForSocket = []; // Gom góp các ghế vừa được nhả để bắn lên Socket cho Frontend biết

    // 1. Tìm tất cả các Booking đã quá hạn 15 phút (expires_at < now) và đang chờ thanh toán
    const expiredBookings = await Booking.find({
      status: { $in: ["PENDING", "WAITING_PAYMENT"] },
      expires_at: { $lt: now }
    });

    if (expiredBookings.length > 0) {
      const expiredBookingIds = expiredBookings.map(b => b._id);

      // Cập nhật trạng thái Booking thành EXPIRED
      await Booking.updateMany(
        { _id: { $in: expiredBookingIds } },
        { $set: { status: "EXPIRED" } }
      );

      // Cập nhật trạng thái Payment thành FAILED
      await Payment.updateMany(
        { booking_id: { $in: expiredBookingIds }, status: "PENDING" },
        { $set: { status: "FAILED" } }
      );

      // TìM TRƯỚC các Ghế của Booking này để cất vào mảng chạy Socket tí nữa
      const bookingSeats = await Seat.find({ held_by_booking_id: { $in: expiredBookingIds } });
      seatsToReleaseForSocket = seatsToReleaseForSocket.concat(bookingSeats);

      // Nhả tất cả các ghế (Seat) thuộc về các Booking này lại thành AVAILABLE
      const releasedBookingSeats = await Seat.updateMany(
        { held_by_booking_id: { $in: expiredBookingIds } },
        {
          $set: {
            status: "AVAILABLE",
            held_by_booking_id: null,
            hold_expired_at: null
          }
        }
      );
      
      console.log(`[ExpiryJob] Đã thanh trừng ${expiredBookingIds.length} Booking quá hạn thanh toán! Giải phóng ${releasedBookingSeats.modifiedCount} ghế.`);
    }

    // 2. Tìm và nhả các ghế bị giữ tự do (qua API holdSeat ngoài lề, ví dụ khách bấm chọn ghế mà chua ấn thanh toán)
    const standaloneSeats = await Seat.find({
      status: "HELD",
      held_by_booking_id: null, // Chỉ nhắm vào ghế giữ tự do không gắn với Booking
      hold_expired_at: { $lt: now },
    });

    if (standaloneSeats.length > 0) {
      seatsToReleaseForSocket = seatsToReleaseForSocket.concat(standaloneSeats);

      const standaloneReleased = await Seat.updateMany(
        {
          status: "HELD",
          held_by_booking_id: null,
          hold_expired_at: { $lt: now },
        },
        {
          $set: {
            status: "AVAILABLE",
            held_by_booking_id: null,
            hold_expired_at: null,
          },
        }
      );

      console.log(`[ExpiryJob] Giải phóng thêm ${standaloneReleased.modifiedCount} ghế giữ tự do quá hạn.`);
    }

    // 3. (Phần của Develop) - BẮN TÍN HIỆU SOCKET LÊN FRONTEND
    if (seatsToReleaseForSocket.length > 0) {
      console.log(`[SeatJob] Giải phóng thành công tổng cộng ${seatsToReleaseForSocket.length} ghế! Tiến hành báo cho Frontend...`);

      seatsToReleaseForSocket.forEach((seat) => {
        // Determine tripId: prefer flight_id, fall back to carriage's train trip
        const tripId = seat.flight_id?.toString() ?? null; 
        if (!tripId) return; 

        try {
          if (typeof emitSeatUpdate === "function") {
             emitSeatUpdate(tripId, "seat_released", {
                tripId,
                seatId: seat._id,
                seat_number: seat.seat_number,
                status: "AVAILABLE",
                updatedAt: now,
              });
          }
        } catch {
          // Ignore if socket is not ready yet
        }
      });
    }

  } catch (err) {
    console.error("[ExpiryJob] Lỗi quy trình hủy vé tự động:", err);
  }
}

module.exports = releaseExpiredSeats;
