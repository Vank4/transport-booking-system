"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { clearAuthSession, getStoredUserRole } from "@/lib/auth";

const pageTitles: Record<string, string> = {
  "/admin": "Tổng quan",
  "/admin/users": "Người dùng",
  "/admin/bookings": "Đơn đặt chỗ",
  "/admin/tickets": "Quản lý vé",
  "/admin/vouchers": "Mã giảm giá",
  "/admin/airlines": "Hãng bay",
  "/admin/airports": "Sân bay",
  "/admin/flights": "Chuyến bay",
  "/admin/flight-fares": "Giá vé Hàng không",
  "/admin/trains": "Tàu hỏa",
  "/admin/train-stations": "Ga tàu",
  "/admin/train-carriages": "Toa xe & Ghế",
  "/admin/train-trips": "Lịch trình",
  "/admin/reports": "Báo cáo Chiến lược",
  "/admin/settings": "Cài đặt",
};

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    router.replace("/auth/login");
  };

  // Tính tiêu đề trang hiện tại
  const pageTitle = Object.entries(pageTitles)
    .sort((a, b) => b[0].length - a[0].length) // longest match first
    .find(([path]) => pathname.startsWith(path))?.[1] ?? "Quản trị hệ thống";

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-6 backdrop-blur-sm">
      {/* Breadcrumb-style title */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-400 font-medium">Admin</span>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <span className="font-bold text-slate-900 dark:text-white">{pageTitle}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
        </button>



        {/* User Avatar Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-black shadow-md shadow-orange-500/30">
              A
            </div>
            <div className="hidden md:flex flex-col items-start leading-none">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Admin</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Quản trị viên</span>
            </div>
            <span className={`material-symbols-outlined text-[18px] text-slate-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}>
              expand_more
            </span>
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/60 dark:shadow-slate-900/60 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* User info header */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <p className="text-sm font-bold text-slate-900 dark:text-white">Quản trị viên</p>
                <p className="text-xs text-slate-500 mt-0.5">admin@traveladmin.vn</p>
              </div>

              {/* Menu items */}
              <div className="p-2">
                <Link
                  href="/admin/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium"
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-400">manage_accounts</span>
                  Hồ sơ & Cài đặt
                </Link>
                <Link
                  href="/admin/reports"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium"
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-400">analytics</span>
                  Báo cáo
                </Link>
              </div>

              {/* Logout */}
              <div className="p-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-bold"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
