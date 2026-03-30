"use client";

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/admin/ToastProvider';

interface TrainData {
  _id: string;
  train_number: string;
  name: string;
}

export default function AdminTrainsPage() {
  const { toast, confirm } = useToast();
  const [trains, setTrains] = useState<TrainData[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [searchString, setSearchString] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchTrains = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/trains', { params: { q: searchString || null, page, limit } });
      setTrains(res.data.data.trains);
      setPagination(res.data.data.pagination);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Lỗi tải danh sách tàu');
    } finally {
      setIsLoading(false);
    }
  }, [searchString, page, limit]);

  useEffect(() => { fetchTrains(); }, [fetchTrains]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { setPage(1); setSearchString(q); }
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'Xóa tàu hỏa',
      message: `Bạn có chắc chắn muốn xóa tàu ${name}?`,
      confirmText: 'Xóa',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/trains/${id}`);
      toast.success("Thành công", `Đã xóa tàu ${name} khỏi hệ thống.`);
      fetchTrains();
    } catch (err: any) {
      toast.error("Lỗi", err?.response?.data?.message || 'Không thể xóa.');
    }
  };

  return (
    <div className="flex flex-col max-w-[1200px] mx-auto flex-1 gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">Quản lý Tàu hỏa</h1>
          <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal">Danh sách các đoàn tàu trong hệ thống.</p>
        </div>
        <Link href="/admin/trains/new" className="flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-5 bg-orange-500 text-white hover:bg-orange-600 transition-colors text-sm font-bold leading-normal shadow-sm hover:shadow-md">
          <span className="material-symbols-outlined mr-2 text-[20px]">add</span>
          <span className="truncate">Thêm tàu</span>
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full md:w-2/3 lg:w-1/2">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400"><span className="material-symbols-outlined">search</span></div>
          <input className="block w-full rounded-lg border-0 py-2.5 pl-10 pr-4 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 ring-1 ring-inset ring-slate-200 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-sm" placeholder="Nhập tên hoặc số hiệu tàu (Enter...)" type="text" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={handleSearch} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col min-h-[400px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Số hiệu tàu</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Tên tàu</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr><td colSpan={3} className="py-12 text-center text-slate-500"><span className="material-symbols-outlined animate-spin text-3xl">hourglass_empty</span></td></tr>
              ) : error ? (
                <tr><td colSpan={3} className="py-8 text-center text-red-500">{error}</td></tr>
              ) : trains.length === 0 ? (
                <tr><td colSpan={3} className="py-12 text-center text-slate-500"><span className="material-symbols-outlined text-4xl text-slate-300">train</span><p className="mt-2">Không tìm thấy tàu nào.</p></td></tr>
              ) : trains.map((train) => (
                <tr key={train._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-600/20">{train.train_number}</span>
                  </td>
                  <td className="py-4 px-6"><span className="text-sm font-semibold text-slate-900 dark:text-white">{train.name}</span></td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/trains/${train._id}`} className="inline-flex items-center justify-center text-slate-400 hover:text-orange-500 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><span className="material-symbols-outlined text-[20px]">edit</span></Link>
                      <button onClick={() => handleDelete(train._id, train.train_number)} className="inline-flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-6 mt-auto">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <p className="text-sm text-slate-700 dark:text-slate-300">Hiển thị <span className="font-medium">{trains.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}</span> đến <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> trong số <span className="font-medium">{pagination.total}</span></p>
            <div>
              {pagination.totalPages > 1 && (
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 disabled:opacity-50"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
                  <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 disabled:opacity-50"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
