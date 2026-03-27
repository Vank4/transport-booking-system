"use client";

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/admin/ToastProvider';

interface UserData {
  _id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  avatar: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const { toast, confirm } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBatchLoading, setIsBatchLoading] = useState(false);

  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter States
  const [q, setQ] = useState("");
  const [searchString, setSearchString] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const limit = 10;

  const allSelected = users.length > 0 && users.every(u => selectedIds.has(u._id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map(u => u._id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/users', {
        params: {
          q: searchString || null,
          role: roleFilter !== 'ALL' ? roleFilter : null,
          status: statusFilter !== 'ALL' ? statusFilter : null,
          page,
          limit
        }
      });
      setUsers(res.data.data.users);
      setPagination(res.data.data.pagination);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Lỗi tải danh sách người dùng');
    } finally {
      setIsLoading(false);
    }
  }, [searchString, roleFilter, statusFilter, page, limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setPage(1);
      setSearchString(q);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.put(`/users/${userId}`, { role: newRole });
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      toast.success('Đã đổi vai trò', `Người dùng đã được chuyển thành ${newRole === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}.`);
    } catch (err: any) {
      toast.error('Lỗi đổi vai trò', err?.response?.data?.message || 'Vui lòng thử lại.');
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      if (newStatus === "BLOCKED") {
        await api.put(`/users/${userId}/block`);
      } else {
        await api.put(`/users/${userId}/unblock`);
      }
      setUsers(users.map(u => u._id === userId ? { ...u, status: newStatus } : u));
      toast.success(newStatus === 'BLOCKED' ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
    } catch (err: any) {
      toast.error('Lỗi', err?.response?.data?.message || 'Vui lòng thử lại.');
    }
  };

  // ─── BATCH OPERATIONS ──────────────────────────
  const handleBatchRole = async (newRole: string) => {
    const ok = await confirm({
      title: 'Đổi vai trò hàng loạt',
      message: `Bạn sắp đổi vai trò ${selectedIds.size} người dùng thành ${newRole === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}. Tiếp tục?`,
      confirmText: 'Đổi vai trò',
      variant: 'warning',
    });
    if (!ok) return;
    try {
      setIsBatchLoading(true);
      await api.put('/users/batch-update', { userIds: Array.from(selectedIds), role: newRole });
      setUsers(users.map(u => selectedIds.has(u._id) ? { ...u, role: newRole } : u));
      toast.success('Thành công', `Đã cập nhật ${selectedIds.size} người dùng!`);
      setSelectedIds(new Set());
    } catch (err: any) {
      toast.error('Lỗi hàng loạt', err?.response?.data?.message || 'Vui lòng thử lại.');
    } finally {
      setIsBatchLoading(false);
    }
  };

  const handleBatchStatus = async (newStatus: string) => {
    const label = newStatus === 'BLOCKED' ? 'khóa' : 'mở khóa';
    const ok = await confirm({
      title: newStatus === 'BLOCKED' ? 'Khóa tài khoản hàng loạt' : 'Mở khóa hàng loạt',
      message: `Bạn sắp ${label} ${selectedIds.size} tài khoản. Hành động này sẽ ảnh hưởng đến quyền truy cập của người dùng.`,
      confirmText: newStatus === 'BLOCKED' ? 'Khóa tất cả' : 'Mở khóa tất cả',
      variant: newStatus === 'BLOCKED' ? 'danger' : 'default',
    });
    if (!ok) return;
    try {
      setIsBatchLoading(true);
      await api.put('/users/batch-update', { userIds: Array.from(selectedIds), status: newStatus });
      setUsers(users.map(u => selectedIds.has(u._id) ? { ...u, status: newStatus } : u));
      toast.success('Thành công', `Đã ${label} ${selectedIds.size} tài khoản!`);
      setSelectedIds(new Set());
    } catch (err: any) {
      toast.error('Lỗi hàng loạt', err?.response?.data?.message || 'Vui lòng thử lại.');
    } finally {
      setIsBatchLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return { date: '--', time: '--' };
    const d = new Date(dateString);
    return {
      date: d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  };

  return (
    <div className="flex flex-col max-w-[1200px] mx-auto flex-1 gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">
            Quản lý tài khoản người dùng
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal">
            Quản lý hành khách, đại lý và quản trị viên hệ thống.
          </p>
        </div>
        <Link href="/admin/users/new" className="flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-5 bg-orange-500 text-white hover:bg-orange-600 transition-colors text-sm font-bold leading-normal tracking-[0.015em] shadow-sm hover:shadow-md">
          <span className="material-symbols-outlined mr-2 text-[20px]">add</span>
          <span className="truncate">Thêm người dùng mới</span>
        </Link>
      </div>

      {/* Bộ lọc & Tìm kiếm */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="md:col-span-5 lg:col-span-6 relative flex items-center gap-2">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input
              className="block w-full rounded-lg border-0 py-2.5 pl-10 pr-4 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 ring-1 ring-inset ring-slate-200 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-sm sm:leading-6"
              placeholder="Nhập tên, email hoặc ID (Nhấn Enter...)"
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
        </div>
        <div className="md:col-span-7 lg:col-span-6 flex flex-wrap justify-end gap-3">
          <div className="relative group">
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
            >
              <option value="ALL">Vai trò: Tất cả</option>
              <option value="USER">Khách hàng</option>
              <option value="ADMIN">Quản trị viên</option>
            </select>
          </div>
          <div className="relative group">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
            >
              <option value="ALL">Trạng thái: Tất cả</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="BLOCKED">Bị khóa</option>
            </select>
          </div>
          <button
            className="flex items-center justify-center p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-orange-500 hover:border-orange-500 transition-colors"
            title="Xuất dữ liệu"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
          </button>
        </div>
      </div>

      {/* ─── BATCH ACTION BAR ────────────────────────────── */}
      {someSelected && (
        <div className="sticky top-16 z-30 flex items-center justify-between gap-4 bg-orange-500 text-white px-5 py-3 rounded-xl shadow-lg animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span className="text-sm font-bold">{selectedIds.size} người dùng đã chọn</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleBatchRole('ADMIN')} disabled={isBatchLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50">
              <span className="material-symbols-outlined text-[16px]">shield_person</span>
              Đổi → Admin
            </button>
            <button onClick={() => handleBatchRole('USER')} disabled={isBatchLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50">
              <span className="material-symbols-outlined text-[16px]">person</span>
              Đổi → User
            </button>
            <div className="w-px h-6 bg-white/30"></div>
            <button onClick={() => handleBatchStatus('BLOCKED')} disabled={isBatchLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50">
              <span className="material-symbols-outlined text-[16px]">block</span>
              Khóa tài khoản
            </button>
            <button onClick={() => handleBatchStatus('ACTIVE')} disabled={isBatchLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50">
              <span className="material-symbols-outlined text-[16px]">lock_open</span>
              Mở khóa
            </button>
            <div className="w-px h-6 bg-white/30"></div>
            <button onClick={() => setSelectedIds(new Set())} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition-colors">
              <span className="material-symbols-outlined text-[16px]">close</span>
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Bảng Dữ liệu */}
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col min-h-[400px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[60px]">
                  <input className="rounded border-slate-300 text-orange-500 focus:ring-orange-500 h-4 w-4 cursor-pointer" type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                </th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[240px]">
                  Người dùng
                </th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Vai trò
                </th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Trạng thái
                </th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Thời gian tạo
                </th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <span className="material-symbols-outlined animate-spin text-3xl">hourglass_empty</span>
                    <p className="mt-2 text-sm">Đang tải danh sách...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">group_off</span>
                    <p className="mt-2">Không tìm thấy người dùng nào phù hợp với bộ lọc.</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const { date, time } = formatDate(user.created_at);

                  return (
                    <tr key={user._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-6">
                        <input className="rounded border-slate-300 text-orange-500 focus:ring-orange-500 h-4 w-4 cursor-pointer" type="checkbox" checked={selectedIds.has(user._id)} onChange={() => toggleSelect(user._id)} />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div
                            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-10 w-10 shadow-sm border border-slate-200 dark:border-slate-700"
                            style={{
                              backgroundImage: `url("${user.avatar || '/default-avatar.svg'}")`,
                            }}
                          ></div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{user.full_name}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user._id, e.target.value)}
                          className={`text-xs font-semibold rounded-full px-2.5 py-1 ring-1 ring-inset focus:outline-none cursor-pointer text-center appearance-none ${
                            user.role === 'ADMIN'
                              ? 'bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-600 ring-slate-500/10 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          <option value="USER">Khách hàng</option>
                          <option value="ADMIN">Quản trị viên</option>
                        </select>
                      </td>
                      <td className="py-4 px-6">
                        <select
                          value={user.status}
                          onChange={(e) => handleStatusChange(user._id, e.target.value)}
                          className={`text-xs font-semibold rounded-md px-2 py-1 ring-1 ring-inset focus:outline-none cursor-pointer text-center appearance-none ${
                            user.status === 'ACTIVE'
                              ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          <option value="ACTIVE">Hoạt động</option>
                          <option value="BLOCKED">Bị khóa</option>
                        </select>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-700 dark:text-slate-300">{date}</span>
                          <span className="text-xs text-slate-400">{time}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/admin/users/${user._id}`}
                          className="inline-flex items-center justify-center text-slate-400 hover:text-orange-500 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-6 mt-auto">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Trước
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Hiển thị <span className="font-medium">{users.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}</span> đến <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> trong số <span className="font-medium">{pagination.total}</span> kết quả
              </p>
            </div>
            <div>
              {pagination.totalPages > 1 && (
                <nav aria-label="Pagination" className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  
                  {[...Array(pagination.totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    if (pageNum === 1 || pageNum === pagination.totalPages || Math.abs(pageNum - page) <= 1) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          aria-current={pageNum === page ? "page" : undefined}
                          className={
                            pageNum === page
                              ? "relative z-10 inline-flex items-center bg-orange-500 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
                              : "relative inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-900 dark:text-slate-300 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 focus:z-20 focus:outline-offset-0"
                          }
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (pageNum === 2 && page > 3) return <span key={`start-dots-${pageNum}`} className="relative inline-flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 ring-1 ring-inset ring-slate-300 dark:ring-slate-700">...</span>;
                    if (pageNum === pagination.totalPages - 1 && page < pagination.totalPages - 2) return <span key={`end-dots-${pageNum}`} className="relative inline-flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 ring-1 ring-inset ring-slate-300 dark:ring-slate-700">...</span>;
                    return null;
                  })}

                  <button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
