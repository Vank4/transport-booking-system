"use client";
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from "@/components/admin/ToastProvider";

interface AirportData {
  _id: string;
  name: string;
  iata_code: string;
  city: string;
  country: string;
  created_at: string;
}

export default function AdminAirportsPage() {
  const { toast } = useToast();
  const [airports, setAirports] = useState<AirportData[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchAirports = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/airports', {
        params: {
          q: searchQuery || null,
          page,
          limit
        }
      });
      setAirports(res.data.data.airports);
      setPagination(res.data.data.pagination);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Lỗi tải danh sách sân bay');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, page]);

  useEffect(() => {
    fetchAirports();
  }, [fetchAirports]);

  const commitSearch = () => {
    setPage(1);
    setSearchQuery(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitSearch();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa sân bay "${name}"?`)) return;
    try {
      await api.delete(`/airports/${id}`);
      toast.success("Thành công", `Đã xóa sân bay ${name}`);
      fetchAirports();
    } catch (err: any) {
      toast.error("Lỗi xóa", err?.response?.data?.message || "Không thể xóa sân bay này.");
    }
  };

  const inputCls = "block w-full rounded-xl border-0 py-2.5 pl-10 pr-4 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 ring-1 ring-inset ring-slate-200 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 sm:text-sm transition-all";

  return (
    <div className="flex flex-col max-w-[1200px] mx-auto flex-1 gap-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-orange-500 font-bold text-sm uppercase tracking-wider">
            <span className="material-symbols-outlined text-[20px]">hub</span>
            Hạ tầng hàng không
          </div>
          <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-tight">Sân Bay</h1>
          <p className="text-slate-500 text-lg max-w-xl">Quản lý mạng lưới các cảng hàng không nội địa và quốc tế.</p>
        </div>
        <Link href="/admin/airports/new" className="h-11 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex items-center gap-2 font-black text-sm shadow-lg shadow-orange-500/20 transition-all shrink-0">
          <span className="material-symbols-outlined font-bold">add</span>
          THÊM SÂN BAY MỚI
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            type="text"
            placeholder="Tìm theo tên sân bay, thành phố hoặc IATA..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={handleKeyDown}
            className={inputCls}
          />
        </div>
        <button onClick={commitSearch} className="h-11 px-6 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-800 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shrink-0">
          TÌM KIẾM
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="py-5 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Tên Sân Bay</th>
                <th className="py-5 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Mã IATA</th>
                <th className="py-5 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Vị trí</th>
                <th className="py-5 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="p-6"><div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-lg w-full"></div></td>
                  </tr>
                ))
              ) : airports.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <span className="material-symbols-outlined text-6xl">travel_explore</span>
                      <p className="font-medium">Không tìm thấy sân bay nào phù hợp.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                airports.map((airport) => (
                  <tr key={airport._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-sm">
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                          <span className="material-symbols-outlined">flight_land</span>
                        </div>
                        <span className="text-slate-900 dark:text-white font-bold">{airport.name}</span>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <span className="inline-flex items-center rounded-lg bg-orange-50 dark:bg-orange-900/30 px-3 py-1 text-xs font-black text-orange-700 dark:text-orange-400 border border-orange-100 dark:border-orange-800 uppercase">
                        {airport.iata_code}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                        <span className="material-symbols-outlined text-[18px]">location_on</span>
                        {airport.city}, {airport.country}
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/admin/airports/${airport._id}`} className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-orange-500 transition-all shadow-sm">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </Link>
                        <button onClick={() => handleDelete(airport._id, airport.name)} className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-red-500 transition-all shadow-sm">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/30">
          <p className="text-sm font-medium text-slate-500">
            Hiển thị <span className="text-slate-900 dark:text-white">{(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}</span> của <span className="text-slate-900 dark:text-white">{pagination.total}</span> sân bay
          </p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-slate-50 group transition-all">
              Trước
            </button>
            <div className="flex items-center px-4 font-black text-sm text-orange-500">{page} / {pagination.totalPages}</div>
            <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-slate-50 transition-all">
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
