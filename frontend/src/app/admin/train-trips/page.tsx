"use client";

import Link from 'next/link';
import { useEffect, useState, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/admin/ToastProvider';

interface TripData {
  _id: string;
  train_id: { _id: string; name: string; train_number: string } | null;
  departure_station_id: { _id: string; name: string; city: string } | null;
  arrival_station_id: { _id: string; name: string; city: string } | null;
  departure_time: string;
  arrival_time: string;
  status: string;
}

export default function AdminTrainTripsPage() {
  const { toast, confirm } = useToast();
  const [trips, setTrips] = useState<TripData[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Input state (what user is typing — NOT triggers fetch)
  const [departureQ, setDepartureQ] = useState("");
  const [arrivalQ, setArrivalQ] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Committed search state (triggers fetch)
  const [committedDeparture, setCommittedDeparture] = useState("");
  const [committedArrival, setCommittedArrival] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // General search (train number/name)
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchTrips = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/train-trips', {
        params: {
          departure: committedDeparture || null,
          arrival: committedArrival || null,
          q: searchQuery || null,
          date: dateFilter || null,
          status: statusFilter !== 'ALL' ? statusFilter : null,
          page, limit
        }
      });
      setTrips(res.data.data.trainTrips || res.data.data.trips || res.data.data);
      if (res.data.data.pagination) setPagination(res.data.data.pagination);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Lỗi tải danh sách lịch trình');
    } finally {
      setIsLoading(false);
    }
  }, [committedDeparture, committedArrival, searchQuery, dateFilter, statusFilter, page, limit]);

  const isInitialMount = useRef(true);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchTrips();
  }, [dateFilter, statusFilter, fetchTrips]);

  const commitSearch = () => {
    setCommittedDeparture(departureQ);
    setCommittedArrival(arrivalQ);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitSearch();
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'Xóa lịch trình',
      message: `Bạn có chắc muốn xóa lịch trình ${name}? Các toa xe và ghế liên quan có thể bị ảnh hưởng.`,
      confirmText: 'Xóa',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/train-trips/${id}`);
      toast.success('Đã xóa', `Lịch trình ${name} đã được xóa.`);
      fetchTrips();
    } catch (err: any) {
      toast.error('Lỗi', err?.response?.data?.message || 'Không thể xóa.');
    }
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" }),
      time: d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      SCHEDULED: { label: "Đã lên lịch", cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
      DELAYED:   { label: "Bị hoãn",     cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
      CANCELLED: { label: "Đã hủy",      cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
      COMPLETED: { label: "Hoàn thành",   cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
    };
    const s = map[status] || { label: status, cls: "bg-slate-100 text-slate-600" };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>;
  };

  const inputCls = "w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm transition-all text-slate-900 dark:text-white placeholder:text-slate-400";

  return (
    <div className="flex flex-col flex-1 gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">Lịch trình Tàu hỏa</h1>
          <p className="text-slate-500 dark:text-slate-400 text-base">Quản lý và cập nhật tuyến đường, lịch chạy tàu trên toàn hệ thống.</p>
        </div>
        <Link href="/admin/train-trips/new" className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg shadow-orange-500/30">
          <span className="material-symbols-outlined text-xl">add</span>
          <span>Tạo lịch trình mới</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 w-full">
            <label className="flex flex-col gap-1.5">
              <span className="text-slate-900 dark:text-slate-300 text-sm font-semibold">Ga đi</span>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500">train</span>
                <input className={inputCls} placeholder="Ga Sài Gòn, TP.HCM..." value={departureQ} onChange={e => setDepartureQ(e.target.value)} onKeyDown={handleKeyDown} />
              </div>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-slate-900 dark:text-slate-300 text-sm font-semibold">Ga đến</span>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500">location_on</span>
                <input className={inputCls} placeholder="Ga Hà Nội, Đà Nẵng..." value={arrivalQ} onChange={e => setArrivalQ(e.target.value)} onKeyDown={handleKeyDown} />
              </div>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-slate-900 dark:text-slate-300 text-sm font-semibold">Ngày khởi hành</span>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500">date_range</span>
                <input type="date" className={inputCls} value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1); }} />
              </div>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-slate-900 dark:text-slate-300 text-sm font-semibold">Trạng thái</span>
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="w-full py-2.5 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm text-slate-900 dark:text-white">
                <option value="ALL">Tất cả</option>
                <option value="SCHEDULED">Đã lên lịch</option>
                <option value="DELAYED">Bị hoãn</option>
                <option value="CANCELLED">Đã hủy</option>
                <option value="COMPLETED">Hoàn thành</option>
              </select>
            </label>
          </div>
          <button onClick={commitSearch} className="w-full lg:w-auto bg-orange-500 text-white font-medium py-2.5 px-6 rounded-lg hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/20">
            Tìm kiếm
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col min-h-[400px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tàu</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lộ trình</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Khởi hành</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Đến nơi</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr><td colSpan={6} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2"><div className="relative"><div className="h-10 w-10 rounded-full border-4 border-slate-200 dark:border-slate-700" /><div className="absolute top-0 left-0 h-10 w-10 rounded-full border-4 border-transparent border-t-orange-500 animate-spin" /></div><p className="text-sm text-slate-400">Đang tải...</p></div>
                </td></tr>
              ) : error ? (
                <tr><td colSpan={6} className="py-8 text-center text-red-500">{error}</td></tr>
              ) : trips.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-slate-400">
                  <span className="material-symbols-outlined text-5xl text-slate-300">calendar_clock</span>
                  <p className="mt-3 text-sm">Không tìm thấy lịch trình nào.</p>
                </td></tr>
              ) : trips.map((trip) => {
                const dep = formatDateTime(trip.departure_time);
                const arr = formatDateTime(trip.arrival_time);
                return (
                  <tr key={trip._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                          <span className="material-symbols-outlined text-lg">train</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">{trip.train_id?.train_number || 'N/A'}</span>
                          <span className="text-xs text-slate-400">{trip.train_id?.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">{trip.departure_station_id?.city || '?'}</span>
                          <span className="material-symbols-outlined text-xs text-slate-400">arrow_forward</span>
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">{trip.arrival_station_id?.city || '?'}</span>
                        </div>
                        <span className="text-xs text-slate-400">{trip.departure_station_id?.name} → {trip.arrival_station_id?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-900 dark:text-white">{dep.date}</span>
                        <span className="text-xs text-slate-400">{dep.time}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-900 dark:text-white">{arr.date}</span>
                        <span className="text-xs text-slate-400">{arr.time}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">{getStatusBadge(trip.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/admin/train-trips/${trip._id}`} className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-500/10 rounded transition-colors" title="Chỉnh sửa">
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </Link>
                        <button onClick={() => handleDelete(trip._id, trip.train_id?.train_number || trip._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Xóa">
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 mt-auto">
          <span className="text-sm text-slate-500">
            Hiển thị <span className="font-medium text-slate-900 dark:text-white">{trips.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}</span> đến <span className="font-medium text-slate-900 dark:text-white">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> của <span className="font-medium text-slate-900 dark:text-white">{pagination.total}</span> kết quả
          </span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-400 hover:text-orange-500 hover:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-[60px] text-center">{page} / {pagination.totalPages || 1}</span>
            <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} className="p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-400 hover:text-orange-500 hover:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
