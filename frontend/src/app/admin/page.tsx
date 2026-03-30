"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface DashboardData {
  cards: {
    totalRevenue: number;
    revenueChange: number;
    totalBookings: number;
    bookingsChange: number;
    totalUsers: number;
    usersChange: number;
    pendingBookings: number;
  };
  chart: { date: string; dayOfWeek: string; revenue: number; bookings: number }[];
  recentBookings: any[];
  statusBreakdown: { PENDING: number; CONFIRMED: number; CANCELLED: number; EXPIRED: number };
  counts: { flights: number; trainTrips: number; activeVouchers: number };
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

const formatShortCurrency = (amount: number) => {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} triệu`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toString();
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get("/admin/dashboard");
        setData(res.data.data);
      } catch (err) {
        console.error("Failed to fetch dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="material-symbols-outlined animate-spin text-4xl text-slate-400">hourglass_empty</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-red-500">Không thể tải dữ liệu tổng quan.</p>
      </div>
    );
  }

  const { cards, chart, recentBookings, statusBreakdown, counts } = data;

  // Build SVG chart path from real data
  const maxRevenue = Math.max(...chart.map((d) => d.revenue), 1);
  const chartPoints = chart.map((d, i) => {
    const x = (i / (chart.length - 1)) * 100;
    const y = 38 - (d.revenue / maxRevenue) * 35;
    return { x, y };
  });
  const linePath = chartPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} V 40 H 0 Z`;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <span className="inline-flex items-center rounded-full bg-green-50 dark:bg-green-900/30 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-600/20">Xác nhận</span>;
      case "PENDING":
      case "WAITING_PAYMENT":
        return <span className="inline-flex items-center rounded-full bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-400 ring-1 ring-inset ring-yellow-600/20">Chờ xử lý</span>;
      case "CANCELLED":
        return <span className="inline-flex items-center rounded-full bg-red-50 dark:bg-red-900/30 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-400 ring-1 ring-inset ring-red-600/20">Đã hủy</span>;
      case "EXPIRED":
        return <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">Hết hạn</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{status}</span>;
    }
  };

  const ChangeIndicator = ({ value }: { value: number }) => (
    <span className={`flex items-center text-sm font-medium ${value >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
      <span className="material-symbols-outlined text-[16px]">{value >= 0 ? "trending_up" : "trending_down"}</span>
      {Math.abs(value)}%
    </span>
  );

  return (
    <div className="space-y-6">
      {/* ─── STAT CARDS ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tổng doanh thu</p>
            <span className="material-symbols-outlined text-green-500 bg-green-50 dark:bg-green-900/20 p-1 rounded-md text-[20px]">payments</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{formatShortCurrency(cards.totalRevenue)}</h3>
            <ChangeIndicator value={cards.revenueChange} />
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">so với tháng trước</p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tổng đơn đặt</p>
            <span className="material-symbols-outlined text-orange-500 bg-orange-50 dark:bg-orange-900/20 p-1 rounded-md text-[20px]">receipt_long</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{cards.totalBookings.toLocaleString()}</h3>
            <ChangeIndicator value={cards.bookingsChange} />
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">so với tháng trước</p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Người dùng</p>
            <span className="material-symbols-outlined text-purple-500 bg-purple-50 dark:bg-purple-900/20 p-1 rounded-md text-[20px]">person</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{cards.totalUsers.toLocaleString()}</h3>
            <ChangeIndicator value={cards.usersChange} />
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">so với tháng trước</p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Vé chờ xử lý</p>
            <span className="material-symbols-outlined text-amber-500 bg-amber-50 dark:bg-amber-900/20 p-1 rounded-md text-[20px]">pending_actions</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{cards.pendingBookings}</h3>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">đơn chờ thanh toán / xác nhận</p>
        </div>
      </div>

      {/* ─── CHART + RECENT BOOKINGS ──────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Doanh thu 7 ngày gần nhất</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Tổng: {formatCurrency(chart.reduce((s, d) => s + d.revenue, 0))}</p>
            </div>
          </div>
          <div className="relative h-64 w-full">
            <svg className="h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 40">
              <g className="stroke-slate-100 dark:stroke-slate-700" strokeWidth="0.5">
                <line x1="0" x2="100" y1="30" y2="30" />
                <line x1="0" x2="100" y1="20" y2="20" />
                <line x1="0" x2="100" y1="10" y2="10" />
              </g>
              <defs>
                <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ff5b00" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#ff5b00" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={linePath} fill="none" stroke="#ff5b00" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              <path d={areaPath} fill="url(#areaGradient)" stroke="none" />
              {/* Data points */}
              {chartPoints.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="1.5" fill="#ff5b00" stroke="white" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                </g>
              ))}
            </svg>
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-slate-400 py-1 pointer-events-none">
              <span>{formatShortCurrency(maxRevenue)}</span>
              <span>{formatShortCurrency(maxRevenue / 2)}</span>
              <span>0</span>
            </div>
          </div>
          <div className="mt-4 flex justify-between px-2 text-xs font-medium text-slate-400">
            {chart.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <span>{d.dayOfWeek}</span>
                <span className="text-[10px] text-slate-300">{d.bookings} đơn</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="lg:col-span-1 flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Đặt chỗ gần đây</h2>
            <Link className="text-sm font-medium text-orange-500 hover:text-orange-600" href="/admin/bookings">
              Xem tất cả
            </Link>
          </div>
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
            {recentBookings.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">Chưa có đơn đặt chỗ nào.</p>
            ) : (
              recentBookings.map((b) => {
                const isFlight = b.booking_type === "FLIGHT";
                let route = "N/A";
                if (b.tripInfo) {
                  if (isFlight) {
                    route = `${b.tripInfo.departure_airport_id?.iata_code || "?"} → ${b.tripInfo.arrival_airport_id?.iata_code || "?"}`;
                  } else {
                    route = `${b.tripInfo.departure_station_id?.city || "?"} → ${b.tripInfo.arrival_station_id?.city || "?"}`;
                  }
                }
                return (
                  <Link key={b._id} href={`/admin/bookings/${b._id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full ${isFlight ? "bg-orange-100 dark:bg-orange-900/30 text-orange-500" : "bg-blue-100 dark:bg-blue-900/30 text-blue-500"} flex items-center justify-center`}>
                        <span className="material-symbols-outlined text-[20px]">{isFlight ? "flight" : "train"}</span>
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{route}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          #{b.booking_code} • {formatDate(b.created_at)}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(b.status)}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ─── BOTTOM STATS ROW ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-blue-500 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">flight_takeoff</span>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{counts.flights}</p>
              <p className="text-xs text-slate-500">Chuyến bay</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">train</span>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{counts.trainTrips}</p>
              <p className="text-xs text-slate-500">Lịch trình tàu</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-500 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">local_activity</span>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{counts.activeVouchers}</p>
              <p className="text-xs text-slate-500">Voucher đang hoạt động</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">cancel</span>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{statusBreakdown.CANCELLED}</p>
              <p className="text-xs text-slate-500">Đơn đã hủy</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6">
        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          © 2024 TravelAdmin System. Bảo lưu mọi quyền. v1.2.0
        </p>
      </div>
    </div>
  );
}
