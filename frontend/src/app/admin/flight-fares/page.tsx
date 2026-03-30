"use client";
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from "@/components/admin/ToastProvider";
import { getLogoUrl } from '@/lib/utils';

interface FlightFareData {
  _id: string;
  flight_id: { 
    _id: string; 
    flight_number: string; 
    airline_id: { name: string, iata_code: string, logo_url: string };
    departure_airport_id: { iata_code: string, city: string };
    arrival_airport_id: { iata_code: string, city: string };
  };
  cabin_class: string;
  fare_name: string;
  base_price: number;
  promo_price: number | null;
  available_seats: number;
  is_active: boolean;
}

export default function AdminFlightFaresPage() {
  const { toast, confirm } = useToast();
  const [flightFares, setFlightFares] = useState<FlightFareData[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [cabinFilter, setCabinFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchFlightFares = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/flight-fares', {
        params: { 
          page, 
          limit, 
          q: searchQuery || null,
          cabin_class: cabinFilter === "ALL" ? null : cabinFilter,
          is_active: statusFilter === "ALL" ? null : (statusFilter === "ACTIVE")
        }
      });
      setFlightFares(res.data.data.flightFares);
      setPagination(res.data.data.pagination);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Lỗi tải danh sách cấu hình giá vé');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, searchQuery, cabinFilter, statusFilter]);

  useEffect(() => {
    fetchFlightFares();
  }, [fetchFlightFares]);

  const commitSearch = () => {
    setPage(1);
    setSearchQuery(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitSearch();
  };

  const handleDelete = async (id: string, fareName: string) => {
    const ok = await confirm({
      title: 'Xóa hạng vé',
      message: `Bạn có chắc muốn xóa cấu hình vé "${fareName}"? Thao tác này không thể hoàn tác.`,
      confirmText: 'Xóa',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/flight-fares/${id}`);
      toast.success("Thành công", "Đã xóa hạng vé thành công");
      fetchFlightFares();
    } catch (err: any) {
      toast.error("Lỗi xóa", err?.response?.data?.message || 'Lỗi khi xóa. Vui lòng thử lại.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getCabinStyles = (cabin: string) => {
    switch (cabin) {
      case "ECONOMY": return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
      case "PREMIUM_ECONOMY": return "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "BUSINESS": return "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "FIRST_CLASS": return "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const inputCls = "w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm transition-all text-slate-900 dark:text-white placeholder:text-slate-400";

  return (
    <div className="flex flex-col flex-1 gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">Quản lý Giá vé & Hạng khoang</h1>
          <p className="text-slate-500 dark:text-slate-400 text-base">Thiết lập chính sách giá, hạng ghế và sức chứa cho mạng lưới chuyến bay.</p>
        </div>
        <Link href="/admin/flight-fares/new" className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg shadow-orange-500/30">
          <span className="material-symbols-outlined text-xl font-bold">add</span>
          <span>Tạo cấu hình vé</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 w-full">
            <label className="flex flex-col gap-1.5 text-slate-900 dark:text-slate-300 text-sm font-semibold">
              Số hiệu / Hãng
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors">search</span>
                <input 
                  type="text" 
                  placeholder="VJ123, Vietnam Airlines..." 
                  value={q} 
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={inputCls} 
                />
              </div>
            </label>
            <label className="flex flex-col gap-1.5 text-slate-900 dark:text-slate-300 text-sm font-semibold">
              Hạng khoang
              <select 
                value={cabinFilter}
                onChange={(e) => { setCabinFilter(e.target.value); setPage(1); }}
                className="w-full py-2.5 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm text-slate-900 dark:text-white hover:border-slate-300 dark:hover:border-slate-600 transition-all outline-none"
              >
                <option value="ALL">Tất cả</option>
                <option value="ECONOMY">Economy</option>
                <option value="PREMIUM_ECONOMY">Premium Eco</option>
                <option value="BUSINESS">Business</option>
                <option value="FIRST_CLASS">First Class</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-slate-900 dark:text-slate-300 text-sm font-semibold">
              Trạng thái
              <select 
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full py-2.5 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm text-slate-900 dark:text-white hover:border-slate-300 dark:hover:border-slate-600 transition-all outline-none"
              >
                <option value="ALL">Tất cả</option>
                <option value="ACTIVE">Đang mở bán</option>
                <option value="INACTIVE">Tạm dừng</option>
              </select>
            </label>
          </div>
          <button onClick={commitSearch} className="w-full lg:w-auto bg-orange-500 text-white font-medium py-2.5 px-8 rounded-lg hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/20">
            Tìm kiếm
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[400px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Số hiệu / Hãng</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Hạng vé & Gói</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Giá niêm yết</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Ghế còn lại</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full border-4 border-slate-200 dark:border-slate-700" />
                        <div className="absolute top-0 left-0 h-10 w-10 rounded-full border-4 border-transparent border-t-orange-500 animate-spin" />
                      </div>
                      <p className="text-sm text-slate-400">Đang tải biểu phí...</p>
                    </div>
                  </td>
                </tr>
              ) : flightFares.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400">
                    <span className="material-symbols-outlined text-5xl text-slate-300">sell</span>
                    <p className="mt-3 text-sm italic">Không tìm thấy cấu hình vé nào phù hợp.</p>
                  </td>
                </tr>
              ) : (
                flightFares.map((fare) => (
                  <tr key={fare._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                          <img src={getLogoUrl(fare.flight_id?.airline_id?.logo_url)} alt="Logo" className="max-w-full max-h-full object-contain" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 dark:text-white uppercase leading-none mb-1">
                            {fare.flight_id?.flight_number}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium uppercase truncate max-w-[150px]">
                            {fare.flight_id?.airline_id?.name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getCabinStyles(fare.cabin_class)}`}>
                          {fare.cabin_class.replace(/_/g, " ")}
                        </span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{fare.fare_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono">
                      <div className="flex flex-col items-end whitespace-nowrap">
                        <span className={`text-sm ${fare.promo_price ? 'line-through text-slate-300 dark:text-slate-600' : 'font-bold text-slate-900 dark:text-white'}`}>
                          {formatCurrency(fare.base_price)}
                        </span>
                        {fare.promo_price && (
                          <span className="text-orange-600 dark:text-orange-400 font-black text-sm">
                            {formatCurrency(fare.promo_price)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <div className="flex flex-col items-center gap-1.5">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white">
                          <span className="material-symbols-outlined text-[16px] text-slate-400">event_seat</span>
                          {fare.available_seats}
                        </div>
                        {fare.is_active ? 
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-green-600"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Đang bán</span> : 
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400">● Tạm dừng</span>
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/admin/flight-fares/${fare._id}`} className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-500/10 rounded transition-colors" title="Chỉnh sửa">
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </Link>
                        <button onClick={() => handleDelete(fare._id, fare.fare_name)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors" title="Xóa">
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 mt-auto">
          <span className="text-sm text-slate-500">
            Hiển thị <span className="font-medium text-slate-900 dark:text-white">{flightFares.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}</span> đến <span className="font-medium text-slate-900 dark:text-white">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> của <span className="font-medium text-slate-900 dark:text-white">{pagination.total}</span> kết quả
          </span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-400 hover:text-orange-500 hover:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-[60px] text-center">{page} / {pagination.totalPages}</span>
            <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-400 hover:text-orange-500 hover:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
