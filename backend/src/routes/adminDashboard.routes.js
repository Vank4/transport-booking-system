const express = require("express");
const router = express.Router();
const Booking = require("../models/bookings.model");
const User = require("../models/users.model");
const Payment = require("../models/payments.model");
const Flight = require("../models/flights.model");
const TrainTrip = require("../models/trainTrips.model");
const Voucher = require("../models/vouchers.model");

/**
 * GET /api/admin/dashboard
 * Trả về thống kê tổng hợp cho trang tổng quan admin.
 */
router.get("/", async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // ─── THỐNG KÊ TỔNG ─────────────────────────────
    const [
      totalUsers,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      totalFlights,
      totalTrainTrips,
      activeVouchers,
    ] = await Promise.all([
      User.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: { $in: ["PENDING", "WAITING_PAYMENT"] } }),
      Booking.countDocuments({ status: "CONFIRMED" }),
      Booking.countDocuments({ status: "CANCELLED" }),
      Flight.countDocuments(),
      TrainTrip.countDocuments(),
      Voucher.countDocuments({ is_active: true, expiry_date: { $gte: now } }),
    ]);

    // ─── DOANH THU ──────────────────────────────────
    const revenueAgg = await Payment.aggregate([
      { $match: { status: "SUCCESS" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // Doanh thu tháng này
    const revenueThisMonth = await Payment.aggregate([
      { $match: { status: "SUCCESS", paid_at: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const monthRevenue = revenueThisMonth[0]?.total || 0;

    // Doanh thu tháng trước
    const revenueLastMonth = await Payment.aggregate([
      { $match: { status: "SUCCESS", paid_at: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const lastMonthRevenue = revenueLastMonth[0]?.total || 0;

    // % thay đổi doanh thu
    const revenueChange = lastMonthRevenue > 0
      ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : monthRevenue > 0 ? 100 : 0;

    // Bookings tháng này & tháng trước
    const bookingsThisMonth = await Booking.countDocuments({ created_at: { $gte: startOfMonth } });
    const bookingsLastMonth = await Booking.countDocuments({ created_at: { $gte: startOfLastMonth, $lte: endOfLastMonth } });
    const bookingsChange = bookingsLastMonth > 0
      ? Math.round(((bookingsThisMonth - bookingsLastMonth) / bookingsLastMonth) * 100)
      : bookingsThisMonth > 0 ? 100 : 0;

    // Users tháng này & tháng trước
    const usersThisMonth = await User.countDocuments({ created_at: { $gte: startOfMonth } });
    const usersLastMonth = await User.countDocuments({ created_at: { $gte: startOfLastMonth, $lte: endOfLastMonth } });
    const usersChange = usersLastMonth > 0
      ? Math.round(((usersThisMonth - usersLastMonth) / usersLastMonth) * 100)
      : usersThisMonth > 0 ? 100 : 0;

    // ─── DOANH THU 7 NGÀY GẦN NHẤT ─────────────────
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayRevAgg = await Payment.aggregate([
        { $match: { status: "SUCCESS", paid_at: { $gte: d, $lt: nextDay } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      const dayBookings = await Booking.countDocuments({ created_at: { $gte: d, $lt: nextDay } });

      last7Days.push({
        date: d.toISOString().split("T")[0],
        dayOfWeek: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d.getDay()],
        revenue: dayRevAgg[0]?.total || 0,
        bookings: dayBookings,
      });
    }

    // ─── BOOKING GẦN NHẤT (5 cái mới nhất) ─────────
    const recentBookings = await Booking.find()
      .sort({ created_at: -1 })
      .limit(5)
      .populate("user_id", "full_name email")
      .lean();

    // Enrich booking with trip info
    const enrichedBookings = await Promise.all(
      recentBookings.map(async (b) => {
        let tripInfo = null;
        if (b.booking_type === "FLIGHT") {
          tripInfo = await Flight.findById(b.trip_id)
            .populate("departure_airport_id", "iata_code city")
            .populate("arrival_airport_id", "iata_code city")
            .lean();
        } else if (b.booking_type === "TRAIN") {
          tripInfo = await TrainTrip.findById(b.trip_id)
            .populate("departure_station_id", "name city")
            .populate("arrival_station_id", "name city")
            .lean();
        }
        return { ...b, tripInfo };
      })
    );

    // ─── PHÂN BỔ TRẠNG THÁI BOOKINGS ────────────────
    const statusBreakdown = {
      PENDING: pendingBookings,
      CONFIRMED: confirmedBookings,
      CANCELLED: cancelledBookings,
      EXPIRED: await Booking.countDocuments({ status: "EXPIRED" }),
    };

    res.json({
      success: true,
      data: {
        cards: {
          totalRevenue,
          revenueChange,
          totalBookings,
          bookingsChange,
          totalUsers,
          usersChange,
          pendingBookings,
        },
        chart: last7Days,
        recentBookings: enrichedBookings,
        statusBreakdown,
        counts: {
          flights: totalFlights,
          trainTrips: totalTrainTrips,
          activeVouchers,
        },
      },
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/admin/dashboard/reports
 * Trả về báo cáo chuyên sâu theo năm.
 */
router.get("/reports", async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    // 1. DOANH THU THEO THÁNG (12 tháng)
    const monthlyRevenue = [];
    for (let month = 0; month < 12; month++) {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59);

      const revAgg = await Payment.aggregate([
        { $match: { status: "SUCCESS", paid_at: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      const bookingsCount = await Booking.countDocuments({ created_at: { $gte: start, $lte: end } });
      
      monthlyRevenue.push({
        month: month + 1,
        label: `Tháng ${month + 1}`,
        revenue: revAgg[0]?.total || 0,
        bookings: bookingsCount
      });
    }

    // 2. PHÂN BỔ DOANH THU THEO LOẠI HÌNH
    const typeRevenue = await Booking.aggregate([
      { $match: { status: "CONFIRMED", created_at: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: "$booking_type", revenue: { $sum: "$total_amount" }, count: { $sum: 1 } } }
    ]);

    // 3. TOP 5 TUYẾN ĐƯỜNG (Dựa trên số lượng booking)
    const topRoutesAgg = await Booking.aggregate([
      { $match: { created_at: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: "$trip_id", count: { $sum: 1 }, revenue: { $sum: "$total_amount" }, type: { $first: "$booking_type" } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);

    const topRoutes = await Promise.all(topRoutesAgg.map(async (item) => {
      let routeName = "Unknown Route";
      if (item.type === "FLIGHT") {
        const f = await Flight.findById(item._id).populate("departure_airport_id arrival_airport_id").lean();
        if (f) routeName = `${f.departure_airport_id.iata_code} - ${f.arrival_airport_id.iata_code} (${f.flight_number})`;
      } else {
        const t = await TrainTrip.findById(item._id).populate("departure_station_id arrival_station_id").lean();
        if (t) routeName = `${t.departure_station_id.city} - ${t.arrival_station_id.city}`;
      }
      return { ...item, routeName };
    }));

    // 4. TỔNG HỢP KPI NĂM
    const totalRev = monthlyRevenue.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalBookings = monthlyRevenue.reduce((acc, curr) => acc + curr.bookings, 0);
    const avgOrderValue = totalBookings > 0 ? Math.round(totalRev / totalBookings) : 0;

    res.json({
      success: true,
      data: {
        year,
        summary: {
          totalRevenue: totalRev,
          totalBookings: totalBookings,
          avgOrderValue: avgOrderValue
        },
        monthlyRevenue,
        typeDistribution: typeRevenue,
        topRoutes
      }
    });
  } catch (err) {
    console.error("Reports error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
