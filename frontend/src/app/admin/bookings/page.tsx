"use client";

import Link from 'next/link';
import { useEffect, useState, useCallback, useMemo } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/admin/ToastProvider';

interface BookingData {
  _id: string;
  booking_code: string;
  user_id: { _id: string; full_name: string; email: string; phone: string } | null;
  booking_type: string;
  trip_id: string; // for details
  total_amount: number;
  status: string;
  created_at: string;
  itinerary?: {
    from: string;
    to: string;
  };
}

export default function AdminBookingsPage() {
  const { toast, confirm } = useToast();
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [searchString, setSearchString] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "" = ALL
  const [page, setPage] = useState(1);
  const limit = 10;

  // Drawer state
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [drawerData, setDrawerData] = useState<any>(null);
  const [isDrawerLoading, setIsDrawerLoading] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/admin/bookings', {
        params: {
          q: searchString || null,
          status: statusFilter || null,
          page,
          limit
        }
      });
      setBookings(res.data.data.bookings);
      setPagination(res.data.data.pagination);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Lỗi tải danh sách bookings');
    } finally {
      setIsLoading(false);
    }
  }, [searchString, statusFilter, page, limit]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setDashboardStats(res.data.data.cards);
    } catch (err) {
      console.error("Lỗi tải thống kê:", err);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchStats();
  }, [fetchBookings]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setPage(1);
      setSearchString(q);
    }
  };

  const openDrawer = async (id: string) => {
    setSelectedBookingId(id);
    setDrawerData(null);
    try {
      setIsDrawerLoading(true);
      const res = await api.get(`/admin/bookings/${id}`);
      setDrawerData(res.data.data);
    } catch (err) {
      toast.error("Lỗi", "Không thể tải chi tiết đơn hàng.");
    } finally {
      setIsDrawerLoading(false);
    }
  };

  const closeDrawer = () => {
    setSelectedBookingId(null);
    setDrawerData(null);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedBookingId) return;
    const ok = await confirm({
      title: 'Xác nhận trạng thái',
      message: `Bạn có muốn đổi trạng thái đơn hàng sang ${newStatus}?`,
      confirmText: 'Cập nhật',
    });
    if (!ok) return;

    try {
      await api.put(`/admin/bookings/${selectedBookingId}/status`, { status: newStatus });
      toast.success("Thành công", "Đã cập nhật trạng thái đơn hàng.");
      fetchBookings();
      // Re-fetch details for the drawer
      openDrawer(selectedBookingId);
    } catch (err: any) {
      toast.error("Lỗi", err?.response?.data?.message || "Không thể cập nhật.");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-600/20">Chờ duyệt</span>;
      case "WAITING_PAYMENT":
        return <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">Chờ thanh toán</span>;
      case "CONFIRMED":
        return <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Đã thanh toán</span>;
      case "CANCELLED":
        return <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">Đã hủy</span>;
      default:
        return <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-600/20">{status}</span>;
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Theo dõi đơn đặt chỗ</h1>
          <p className="text-slate-500 dark:text-slate-400">Quản lý lộ trình, thanh toán và vé điện tử của khách hàng.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[20px]">file_download</span> Xuất CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Tổng doanh thu', value: formatCurrency(dashboardStats?.totalRevenue || 0), change: `+${dashboardStats?.revenueChange || 0}%`, icon: 'payments', up: true },
          { label: 'Đơn hàng hoạt động', value: dashboardStats?.totalBookings || 0, change: `+${dashboardStats?.bookingsChange || 0}%`, icon: 'confirmation_number', up: true },
          { label: 'Thanh toán đang chờ', value: dashboardStats?.pendingBookings || 0, badge: 'Cần xử lý', icon: 'pending_actions', alert: true },
          { label: 'Mã giảm giá h.động', value: dashboardStats?.activeVouchers || 0, icon: 'local_offer', info: 'Voucher' },
        ].map((card, idx) => (
          <div key={idx} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
              <span className="material-symbols-outlined">{card.icon}</span>
              <span className="text-sm font-medium uppercase tracking-wider text-[10px]">{card.label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
            {card.change && (
              <div className={`mt-2 flex items-center text-xs font-medium ${card.up ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'} dark:bg-emerald-900/20 w-fit px-2 py-0.5 rounded`}>
                <span className="material-symbols-outlined text-[14px] mr-1">{card.up ? 'trending_up' : 'trending_down'}</span> {card.change}
              </div>
            )}
            {card.badge && (
              <div className="mt-2 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 w-fit px-2 py-0.5 rounded">
                {card.badge}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {[
            { id: "", label: "Tất cả", count: pagination.total },
            { id: "CONFIRMED", label: "Đã thanh toán", color: "bg-emerald-500" },
            { id: "WAITING_PAYMENT", label: "Đang chờ", color: "bg-amber-500" },
            { id: "CANCELLED", label: "Đã hủy", color: "bg-red-500" },
            { id: "EXPIRED", label: "Hết hạn", color: "bg-slate-500" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setStatusFilter(tab.id); setPage(1); }}
              className={`group flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition-all shadow-sm ${
                statusFilter === tab.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              {tab.color && <span className={`size-2 rounded-full ${tab.color}`}></span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && <span className="flex size-5 items-center justify-center rounded-full bg-white/20 text-[10px]">{tab.count}</span>}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:min-w-64">
             <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">search</span>
             <input
               className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
               placeholder="Tìm theo mã Booking..."
               value={q}
               onChange={(e) => setQ(e.target.value)}
               onKeyDown={handleSearch}
             />
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] table-auto text-left text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-900 dark:text-white w-28 uppercase text-[10px]">Mã đơn</th>
                <th className="px-6 py-4 font-semibold text-slate-900 dark:text-white uppercase text-[10px]">Khách hàng</th>
                <th className="px-6 py-4 font-semibold text-slate-900 dark:text-white uppercase text-[10px]">Ngày đặt</th>
                <th className="px-6 py-4 font-semibold text-slate-900 dark:text-white uppercase text-[10px]">Số tiền</th>
                <th className="px-6 py-4 font-semibold text-slate-900 dark:text-white uppercase text-[10px]">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-slate-900 dark:text-white text-right uppercase text-[10px]">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <span className="material-symbols-outlined animate-spin text-4xl text-primary/40">loading</span>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                   <td colSpan={6} className="py-20 text-center text-slate-500">
                      Không tìm thấy đơn đặt chỗ nào.
                   </td>
                </tr>
              ) : bookings.map((booking) => (
                <tr
                  key={booking._id}
                  onClick={() => openDrawer(booking._id)}
                  className={`group transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer ${
                    selectedBookingId === booking._id ? 'bg-primary/5 dark:bg-primary/10' : ''
                  }`}
                >
                  <td className="px-6 py-4 font-bold text-primary dark:text-blue-400 tracking-tight uppercase">#{booking.booking_code.slice(-6)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 border border-slate-200 dark:border-slate-600">
                        {booking.user_id ? booking.user_id.full_name.charAt(0) : '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{booking.user_id?.full_name || "Khách vãng lai"}</p>
                        <p className="text-xs text-slate-500">{booking.user_id?.email || "N/A"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{formatDate(booking.created_at)}</td>
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{formatCurrency(booking.total_amount)}</td>
                  <td className="px-6 py-4">{getStatusBadge(booking.status)}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 group-hover:text-primary transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                      <span className="material-symbols-outlined">more_horiz</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 px-6 py-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Hiển thị <span className="font-medium text-slate-900 dark:text-white">{bookings.length > 0 ? (page-1)*limit + 1 : 0} - {Math.min(page*limit, pagination.total)}</span> trong <span className="font-medium text-slate-900 dark:text-white">{pagination.total}</span> đơn</p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="flex size-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="text-sm px-2 font-bold">{page} / {pagination.totalPages}</span>
            <button
              disabled={page === pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="flex size-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Booking Detail Drawer Overlay */}
      {selectedBookingId && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-slate-900/20 dark:bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={closeDrawer}>
          <div
            className="h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Chi tiết đơn hàng</h3>
                <p className="text-sm text-slate-500 font-mono tracking-tighter uppercase">{drawerData?.booking?.booking_code || "..."}</p>
              </div>
              <button onClick={closeDrawer} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {isDrawerLoading ? (
              <div className="flex-1 flex items-center justify-center">
                 <span className="material-symbols-outlined animate-spin text-4xl text-primary/40">loading</span>
              </div>
            ) : drawerData ? (
               <div className="p-6 flex-1 flex flex-col gap-8">
                  {/* Status Indicator */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[9px]">Trạng thái đơn hàng</span>
                    {getStatusBadge(drawerData.booking.status)}
                  </div>

                  {/* Customer Info */}
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-5 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 text-lg">
                        {drawerData.booking.user_id ? drawerData.booking.user_id.full_name.charAt(0) : '?'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{drawerData.booking.user_id?.full_name || "Khách vãng lai"}</p>
                        <p className="text-sm text-slate-500">{drawerData.booking.user_id?.email || "N/A"}</p>
                        <p className="text-sm text-slate-500">{drawerData.booking.user_id?.phone || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Itinerary Details */}
                  <div>
                    <h4 className="mb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Thông tin chuyến đi</h4>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900 shadow-sm">
                      {drawerData.tripDetails ? (
                         <>
                            <div className="flex items-center justify-between mb-6">
                              <div className="text-center">
                                <p className="text-2xl font-black text-slate-900 dark:text-white uppercase">
                                  {drawerData.booking.booking_type === 'FLIGHT' 
                                    ? drawerData.tripDetails.departure_airport_id?.iata_code 
                                    : drawerData.tripDetails.departure_station_id?.city.slice(0,3).toUpperCase()}
                                </p>
                                <p className="text-[10px] text-slate-500 uppercase font-bold">{drawerData.booking.booking_type === 'FLIGHT' ? drawerData.tripDetails.departure_airport_id?.city : drawerData.tripDetails.departure_station_id?.name}</p>
                              </div>
                              <div className="flex flex-1 flex-col items-center px-4">
                                <span className="text-[10px] font-bold text-slate-400 mb-2 uppercase">{drawerData.tripDetails.flight_number || drawerData.tripDetails.train_id?.name}</span>
                                <div className="relative w-full h-px bg-slate-200 dark:bg-slate-700">
                                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 p-1">
                                    <span className="material-symbols-outlined text-primary text-[18px] rotate-90">{drawerData.booking.booking_type === 'FLIGHT' ? 'flight' : 'train'}</span>
                                  </span>
                                </div>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-black text-slate-900 dark:text-white uppercase">
                                  {drawerData.booking.booking_type === 'FLIGHT' 
                                    ? drawerData.tripDetails.arrival_airport_id?.iata_code 
                                    : drawerData.tripDetails.arrival_station_id?.city.slice(0,3).toUpperCase()}
                                </p>
                                <p className="text-[10px] text-slate-500 uppercase font-bold">{drawerData.booking.booking_type === 'FLIGHT' ? drawerData.tripDetails.arrival_airport_id?.city : drawerData.tripDetails.arrival_station_id?.name}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                              <div><p className="text-slate-400 text-[10px] uppercase font-bold tracking-tighter">Ngày khởi hành</p><p className="font-semibold text-slate-900 dark:text-white">{formatDate(drawerData.tripDetails.departure_time).split(',')[0]}</p></div>
                              <div><p className="text-slate-400 text-[10px] uppercase font-bold tracking-tighter">Giờ</p><p className="font-semibold text-slate-900 dark:text-white">{formatDate(drawerData.tripDetails.departure_time).split(',')[1]}</p></div>
                              <div><p className="text-slate-400 text-[10px] uppercase font-bold tracking-tighter">Số hành khách</p><p className="font-semibold text-slate-900 dark:text-white">{drawerData.tickets.length} người</p></div>
                              <div><p className="text-slate-400 text-[10px] uppercase font-bold tracking-tighter">Hành lý</p><p className="font-semibold text-slate-900 dark:text-white">{drawerData.booking.booking_type === 'FLIGHT' ? '20kg included' : 'No limit'}</p></div>
                            </div>
                         </>
                      ) : <p className="text-slate-400 italic">Dữ liệu chuyến đi không khả dụng.</p>}
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div>
                    <h4 className="mb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Tóm tắt thanh toán</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Giá vé cơ bản ({drawerData.tickets.length}x)</span><span className="font-medium">{formatCurrency(drawerData.booking.total_amount * 0.9)}</span></div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Thuế & Phí dịch vụ (10%)</span><span className="font-medium">{formatCurrency(drawerData.booking.total_amount * 0.1)}</span></div>
                      <div className="border-t border-slate-200 dark:border-slate-800 my-4 pt-4 flex justify-between font-bold text-xl text-slate-900 dark:text-white tracking-tight italic">
                        <span>TỔNG CỘNG</span>
                        <span className="text-primary">{formatCurrency(drawerData.booking.total_amount)}</span>
                      </div>
                      <div className="mt-4 text-[10px] text-slate-500 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                        <span className="material-symbols-outlined text-[16px]">verified_user</span>
                        Bảo mật cấp bởi TravelGate • Phương thức: {drawerData.payments?.[0]?.method || "Chưa chọn"}
                      </div>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-3">
                    {drawerData.booking.status === "WAITING_PAYMENT" && (
                    <button
                      onClick={() => handleUpdateStatus("CONFIRMED")}
                      className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-blue-600 transition-all shadow-md shadow-primary/20"
                    >
                      Xác nhận Đã thanh toán
                    </button>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleUpdateStatus("CANCELLED")}
                        disabled={drawerData.booking.status === "CANCELLED" || drawerData.booking.status === "EXPIRED"}
                        className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        Hủy đơn hàng
                      </button>
                      <Link
                        href={`/admin/bookings/${drawerData.booking._id}`}
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all"
                      >
                        Quản lý vé
                      </Link>
                    </div>
                  </div>
               </div>
            ) : null}
          </div>
        </div>
      )}
    </main>
  );
}
