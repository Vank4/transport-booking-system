"use client";

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/admin/ToastProvider';

interface TicketData {
  _id: string;
  passenger_name: string;
  passenger_id_card: string;
  final_price: number;
  passenger_type: string;
  booking_id: { _id: string; booking_code: string; booking_type: string; status: string } | null;
  seat_id: { _id: string; seat_number: string; class: string } | null;
}

export default function AdminTicketsPage() {
  const { toast, confirm } = useToast();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [searchString, setSearchString] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/tickets', {
        params: {
          q: searchString || null,
          page,
          limit
        }
      });
      setTickets(res.data.data.tickets);
      setPagination(res.data.data.pagination);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Lỗi tải danh sách vé');
    } finally {
      setIsLoading(false);
    }
  }, [searchString, page, limit]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setPage(1);
      setSearchString(q);
    }
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getBookingStatusBadge = (status: string) => {
    if (!status) return null;
    switch (status) {
      case "CONFIRMED": return <span className="px-2 py-0.5 text-[10px] uppercase rounded bg-green-100 text-green-700">Đã TT</span>;
      case "WAITING_PAYMENT": return <span className="px-2 py-0.5 text-[10px] uppercase rounded bg-yellow-100 text-yellow-700">Chờ TT</span>;
      case "CANCELLED": return <span className="px-2 py-0.5 text-[10px] uppercase rounded bg-red-100 text-red-700">Hủy</span>;
      default: return <span className="px-2 py-0.5 text-[10px] uppercase rounded bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="flex flex-col max-w-[1200px] mx-auto flex-1 gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">
            Vé & Hành khách (Tickets)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal">
            Tra cứu hành khách và xuất vé trên các chuyến.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full md:w-2/3 lg:w-1/2">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <span className="material-symbols-outlined">search</span>
          </div>
          <input
            className="block w-full rounded-lg border-0 py-2.5 pl-10 pr-4 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 ring-1 ring-inset ring-slate-200 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-sm sm:leading-6"
            placeholder="Tìm kiếm theo Tên hành khách, CCCD/CMND (Nhấn Enter...)"
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col min-h-[400px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Hành khách / CCCD</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Mã Booking</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Ghế ngồi</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Chi phí GHẾ</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <span className="material-symbols-outlined animate-spin text-3xl">hourglass_empty</span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-red-500">{error}</td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">confirmation_number</span>
                    <p className="mt-2">Không tìm thấy vé nào phù hợp.</p>
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white uppercase">
                          {ticket.passenger_name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                           <span className="text-xs text-slate-500">{ticket.passenger_id_card || 'Không có ID'}</span>
                           <span className="text-[10px] bg-slate-200 text-slate-600 px-1 rounded uppercase font-bold">{ticket.passenger_type}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {ticket.booking_id ? (
                        <div className="flex flex-col items-start gap-1">
                          <Link href={`/admin/bookings/${ticket.booking_id._id}`} className="text-sm font-bold text-orange-600 hover:underline">
                            {ticket.booking_id.booking_code}
                          </Link>
                          {getBookingStatusBadge(ticket.booking_id.status)}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400 italic">Mất liên kết</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex flex-col items-center">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] font-black border border-slate-200 dark:border-slate-700">
                          {ticket.seat_id?.seat_number || 'N/A'}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-1 uppercase">{ticket.seat_id?.class}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(ticket.final_price)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/tickets/${ticket._id}`}
                          className="inline-flex items-center justify-center text-slate-400 hover:text-orange-500 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */ }
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-6 mt-auto">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Hiển thị <span className="font-medium">{tickets.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}</span> đến <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> trong số <span className="font-medium">{pagination.total}</span> kết quả
              </p>
            </div>
            <div>
              {pagination.totalPages > 1 && (
                <nav aria-label="Pagination" className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
                  <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
