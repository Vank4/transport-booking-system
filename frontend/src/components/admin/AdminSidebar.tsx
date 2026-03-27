"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface NavItem {
  href?: string;
  icon?: string;
  label: string;
  exact?: boolean;
  isDivider?: boolean;
  children?: NavItem[];
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // State quản lý các nhóm đang mở
  const [openSections, setOpenSections] = useState<string[]>([]);

  const navGroups: NavItem[] = [
    { href: "/admin", icon: "dashboard", label: "Tổng quan", exact: true },
    { href: "/admin/users", icon: "group", label: "Người dùng" },

    {
      label: "ĐẶT CHỖ & TÀI CHÍNH",
      isDivider: true,
      children: [
        { href: "/admin/bookings", icon: "receipt_long", label: "Đơn đặt chỗ" },
        { href: "/admin/tickets", icon: "confirmation_number", label: "Quản lý vé" },
        { href: "/admin/vouchers", icon: "local_activity", label: "Mã giảm giá" },
      ]
    },

    {
      label: "HÀNG KHÔNG",
      isDivider: true,
      children: [
        { href: "/admin/airlines", icon: "airlines", label: "Hãng bay" },
        { href: "/admin/airports", icon: "airport_shuttle", label: "Sân bay" },
        { href: "/admin/flights", icon: "flight_takeoff", label: "Chuyến bay" },
        { href: "/admin/flight-fares", icon: "sell", label: "Giá vé Hàng không" },
      ]
    },

    {
      label: "ĐƯỜNG SẮT",
      isDivider: true,
      children: [
        { href: "/admin/trains", icon: "train", label: "Tàu hỏa" },
        { href: "/admin/train-stations", icon: "storefront", label: "Ga tàu" },
        { href: "/admin/train-carriages", icon: "airline_seat_recline_normal", label: "Toa xe & Ghế" },
        { href: "/admin/train-trips", icon: "calendar_clock", label: "Lịch trình" },
      ]
    },

    {
      label: "HỆ THỐNG",
      isDivider: true,
      children: [
        { href: "/admin/reports", icon: "description", label: "Báo cáo" },
        { href: "/admin/settings", icon: "settings", label: "Cài đặt" },
      ]
    },
  ];

  // Tự động mở Group chứa trang hiện tại
  useEffect(() => {
    navGroups.forEach(group => {
      if (group.children?.some(child => pathname.startsWith(child.href || ""))) {
        setOpenSections(prev => prev.includes(group.label) ? prev : [...prev, group.label]);
      }
    });
  }, [pathname]);

  const toggleSection = (label: string) => {
    setOpenSections(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  return (
    <aside className={`sticky top-0 h-screen flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"}`}>
      {/* Brand Header */}
      <div className={`shrink-0 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-6'} py-6 transition-all border-b border-slate-100 dark:border-slate-800`}>
        <div className="bg-orange-500 rounded-lg h-9 w-9 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
          <span className="material-symbols-outlined font-bold">travel</span>
        </div>
        {!isCollapsed && (
          <div className="flex flex-col whitespace-nowrap overflow-hidden">
            <h1 className="text-slate-900 dark:text-white text-base font-black leading-tight tracking-tight">TravelAdmin</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">Booking System</p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navGroups.map((group, index) => {
            if (!group.isDivider) {
              const isActive = pathname === group.href;
              return (
                <Link key={index} href={group.href || "#"} className={`flex items-center gap-3 py-2.5 rounded-xl transition-all ${isCollapsed ? 'justify-center' : 'px-4'} ${isActive ? "bg-orange-500 text-white shadow-md shadow-orange-500/20 font-bold" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
                  <span className="material-symbols-outlined text-[20px]">{group.icon}</span>
                  {!isCollapsed && <span className="text-sm">{group.label}</span>}
                </Link>
              );
            }

            const isOpen = openSections.includes(group.label);

            return (
              <div key={index} className="flex flex-col gap-1 mt-3">
                {!isCollapsed && (
                  <button onClick={() => toggleSection(group.label)} className="flex items-center justify-between px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors w-full group">
                    {group.label}
                    <span className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>
                )}
                {isCollapsed && <div className="h-px bg-slate-100 dark:bg-slate-800 my-2 mx-2"></div>}

                <div className={`flex flex-col gap-1 overflow-hidden transition-all duration-300 ${isOpen || isCollapsed ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                  {group.children?.map((child, cIdx) => {
                    const isActive = pathname.startsWith(child.href || "");
                    return (
                      <Link key={cIdx} href={child.href || "#"} className={`flex items-center gap-3 py-2.5 rounded-xl transition-all ${isCollapsed ? 'justify-center' : 'px-4'} ${isActive ? "bg-orange-500/10 text-orange-500 font-bold" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
                        <span className="material-symbols-outlined text-[20px]">{child.icon}</span>
                        {!isCollapsed && <span className="text-sm">{child.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 z-10 flex flex-col gap-4">
        <button onClick={() => setIsCollapsed(!isCollapsed)} className={`flex items-center justify-center p-2 text-slate-400 hover:text-orange-500 transition-colors rounded-xl bg-slate-50 dark:bg-slate-800 ${isCollapsed ? 'w-12 h-12' : 'w-full gap-2'}`}>
          <span className="material-symbols-outlined text-xl">{isCollapsed ? "dock_to_right" : "dock_to_left"}</span>
          {!isCollapsed && <span className="text-xs font-bold uppercase tracking-widest">Thu gọn</span>}
        </button>
      </div>
    </aside>
  );
}
