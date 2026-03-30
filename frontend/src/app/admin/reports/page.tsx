"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

interface ReportData {
  year: number;
  summary: {
    totalRevenue: number;
    totalBookings: number;
    avgOrderValue: number;
  };
  monthlyRevenue: {
    month: number;
    label: string;
    revenue: number;
    bookings: number;
  }[];
  typeDistribution: { _id: string; revenue: number; count: number }[];
  topRoutes: { _id: string; count: number; revenue: number; routeName: string }[];
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

const formatShortCurrency = (amount: number) => {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} triệu`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toString();
};

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchReports = async (year: number) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/admin/dashboard/reports?year=${year}`);
      setData(res.data.data);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(selectedYear);
  }, [selectedYear]);

  const handleExport = () => {
    if (!data) return;
    
    // 1. HEADER & SUMMARY SECTION
    const summaryHeader = [
      ["BÁO CÁO CHIẾN LƯỢC DOANH THU HỆ THỐNG"],
      [`Năm báo cáo: ${selectedYear}`],
      [`Ngày xuất: ${new Date().toLocaleString("vi-VN")}`],
      [],
      ["CHỈ SỐ TỔNG QUAN"],
      ["Tổng doanh thu", formatCurrency(summary.totalRevenue)],
      ["Tổng đơn hàng", summary.totalBookings],
      ["Giá trị trung bình đơn (AOV)", formatCurrency(summary.avgOrderValue)],
      [],
      ["CHI TIẾT THEO THÁNG"]
    ];

    // 2. DATA TABLE SECTION
    const dataHeaders = ["Tháng", "Doanh thu (VND)", "Tăng trưởng (%)", "Số lượng đơn", "Doanh thu TB / Đơn"];
    const dataRows = data.monthlyRevenue.map((m, i) => {
      const prev = i > 0 ? data.monthlyRevenue[i-1].revenue : 0;
      const growth = prev > 0 ? ((m.revenue - prev) / prev * 100).toFixed(1) : "0";
      const arpb = m.bookings > 0 ? Math.round(m.revenue / m.bookings) : 0;
      return [m.label, m.revenue, growth + "%", m.bookings, arpb];
    });

    // 3. TOP ROUTES SECTION
    const routeSection = [
      [],
      ["TOP 5 TUYẾN ĐƯỜNG HIỆU QUẢ"],
      ["Tuyến đường", "Số đơn", "Doanh thu (VND)"],
      ...data.topRoutes.map(r => [r.routeName, r.count, r.revenue])
    ];

    const csvRows = [
      ...summaryHeader,
      dataHeaders,
      ...dataRows,
      ...routeSection
    ];
    
    const csvContent = csvRows.map(row => row.join(",")).join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao-cao-chien-luoc-${selectedYear}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <span className="material-symbols-outlined animate-spin text-4xl text-orange-500">hourglass_empty</span>
        <p className="text-slate-500 font-medium">Đang tổng hợp dữ liệu chiến lược...</p>
      </div>
    );
  }

  if (!data) return <div className="p-10 text-center text-red-500">Không thể tải dữ liệu báo cáo.</div>;

  const { summary, monthlyRevenue, typeDistribution, topRoutes } = data;

  // ─── CHART CALCULATIONS ──────────────────────────────────
  const maxMonthlyRevenue = Math.max(...monthlyRevenue.map(m => m.revenue), 1);
  const chartPoints = monthlyRevenue.map((m, i) => {
    const x = (i / (monthlyRevenue.length - 1)) * 100;
    const y = 80 - (m.revenue / maxMonthlyRevenue) * 70;
    return { x, y };
  });
  const linePath = chartPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} V 100 H 0 Z`;

  // Pie chart calculation (very simple 2-slice)
  const totalTypeRev = typeDistribution.reduce((s, t) => s + t.revenue, 0);
  const flightPct = totalTypeRev > 0 ? (typeDistribution.find(t => t._id === "FLIGHT")?.revenue || 0) / totalTypeRev : 0.5;
  const trainPct = 1 - flightPct;

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-900 dark:text-white text-3xl font-black tracking-tight flex items-center gap-3">
            <span className="material-symbols-outlined text-orange-500 text-4xl">analytics</span>
            Báo cáo Chiến lược Doanh thu
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base">Phân tích hiệu suất kinh doanh và xu hướng vận tải năm {selectedYear}.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 shadow-sm">
            {[2023, 2024, 2025, 2026].map(y => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${selectedYear === y ? "bg-orange-500 text-white shadow-md" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
              >
                {y}
              </button>
            ))}
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-lg font-bold text-sm hover:opacity-90 transition-all shadow-lg"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            Xuất CSV
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 -mr-10 -mt-10 rounded-full group-hover:scale-110 transition-transform duration-500" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Tổng Doanh Thu Năm</p>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-2">{formatCurrency(summary.totalRevenue)}</h2>
          <div className="mt-4 flex items-center gap-2 text-green-500 text-sm font-bold">
            <span className="material-symbols-outlined text-[18px]">trending_up</span>
            8.4% so với 2023
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 -mr-10 -mt-10 rounded-full group-hover:scale-110 transition-transform duration-500" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Trung bình / Đơn (AOV)</p>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-2">{formatCurrency(summary.avgOrderValue)}</h2>
          <div className="mt-4 text-slate-500 text-sm font-medium">Dựa trên {summary.totalBookings.toLocaleString()} đơn hàng</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 -mr-10 -mt-10 rounded-full group-hover:scale-110 transition-transform duration-500" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Tỷ lệ Hoàn tất</p>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-2">92.5%</h2>
          <div className="mt-4 flex items-center gap-2 text-purple-500 text-sm font-bold">
             Tăng trưởng 2.1%
          </div>
        </div>
      </div>

      {/* MAIN REVENUE CHART */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Xu hướng Doanh thu Tháng</h3>
            <p className="text-slate-500 text-sm mt-1">Biểu đồ biến động ngân thu năm {selectedYear}</p>
          </div>
          <div className="flex gap-4">
             <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"></span>
                <span className="text-xs font-bold text-slate-500">Doanh thu (VND)</span>
             </div>
          </div>
        </div>
        
        <div className="relative h-80 w-full group">
          <svg className="h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(line => (
              <line 
                key={line} 
                x1="0" x2="100" y1={line} y2={line} 
                className="stroke-slate-100 dark:stroke-slate-700/50" 
                strokeWidth="0.5" 
              />
            ))}
            
            <defs>
              <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            <path d={linePath} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="drop-shadow-lg" />
            <path d={areaPath} fill="url(#revenueGradient)" stroke="none" />
            
            {/* Dots */}
            {chartPoints.map((p, i) => (
              <circle 
                key={i} 
                cx={p.x} cy={p.y} r="3" 
                className="fill-white stroke-orange-500 stroke-[2.5] cursor-pointer hover:r-4 transition-all duration-300" 
                vectorEffect="non-scaling-stroke" 
              />
            ))}
          </svg>
          
          {/* Legend labels */}
          <div className="absolute bottom-0 w-full flex justify-between px-1 translate-y-8">
            {monthlyRevenue.map((m, i) => (
              <span key={i} className="text-[10px] font-bold text-slate-400">{m.month}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TOP ROUTES BAR CHART */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8">Top 5 Tuyến đường Doanh thu</h3>
          <div className="flex flex-col gap-6">
            {topRoutes.map((route, i) => {
              const maxRouteRev = Math.max(...topRoutes.map(r => r.revenue), 1);
              const pct = (route.revenue / maxRouteRev) * 100;
              return (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-slate-700 dark:text-slate-300 truncate max-w-[70%]">{route.routeName}</span>
                    <span className="text-orange-600">{formatShortCurrency(route.revenue)}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${i === 0 ? "from-orange-600 to-orange-400" : "from-slate-400 to-slate-300"} transition-all duration-1000 ease-out`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TRANSPORT TYPE PIE CHART */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
           <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8">Cơ cấu Loại hình Vận tải</h3>
           <div className="flex flex-col md:flex-row items-center justify-center gap-12 py-4">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 32 32">
                   {/* Circle background (Total base - Đường sắt) */}
                   <circle 
                     r="12" cx="16" cy="16" 
                     className="fill-none stroke-blue-500 stroke-[8]" 
                   />
                   {/* Flight slice (orange) - Overlays on top */}
                   <circle 
                     r="12" cx="16" cy="16" 
                     className="fill-none stroke-orange-500 stroke-[8] transition-all duration-1000 ease-in-out" 
                     style={{ 
                       // Nếu đạt 100% thì không dùng dasharray để tránh khe hở nhỏ ở đỉnh
                       strokeDasharray: flightPct >= 1 ? "none" : `${flightPct * 75.4} 75.4`,
                       strokeDashoffset: 0
                     }} 
                   />
                   
                   {/* Center hole for donut effect */}
                   <circle r="8" cx="16" cy="16" className="fill-white dark:fill-slate-800" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{(flightPct * 100).toFixed(0)}%</span>
                  <span className="text-[11px] uppercase font-black text-slate-400 mt-1.5 tracking-widest">Hàng không</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-4 w-full md:w-auto">
                 <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded bg-orange-500"></div>
                    <div className="flex flex-col">
                       <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Hàng không</span>
                       <span className="text-xs text-slate-500">{formatShortCurrency(typeDistribution.find(t => t._id === "FLIGHT")?.revenue || 0)}</span>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded bg-blue-500"></div>
                    <div className="flex flex-col">
                       <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Đường sắt</span>
                       <span className="text-xs text-slate-500">{formatShortCurrency(typeDistribution.find(t => t._id === "TRAIN")?.revenue || 0)}</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* MONTHLY DATA TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-100 dark:border-slate-700">
           <h3 className="text-xl font-black text-slate-900 dark:text-white">Bảng thống kê Chi tiết</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                <th className="px-8 py-4">Thời gian</th>
                <th className="px-8 py-4 text-right">Doanh thu</th>
                <th className="px-8 py-4 text-center">Sản lượng đơn</th>
                <th className="px-8 py-4 text-right">Tăng trưởng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {monthlyRevenue.map((m, i) => {
                const prev = i > 0 ? monthlyRevenue[i-1].revenue : 0;
                const growth = prev > 0 ? ((m.revenue - prev) / prev) * 100 : 0;
                return (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-8 py-4 text-sm font-bold text-slate-700 dark:text-slate-200">{m.label}</td>
                    <td className="px-8 py-4 text-sm font-mono text-right font-semibold">{formatCurrency(m.revenue)}</td>
                    <td className="px-8 py-4 text-sm text-center font-medium">{m.bookings}</td>
                    <td className="px-8 py-4 text-right">
                      {i === 0 ? <span className="text-slate-300">-</span> : (
                        <span className={`text-xs font-bold flex items-center justify-end gap-1 ${growth >= 0 ? "text-green-500" : "text-red-500"}`}>
                           <span className="material-symbols-outlined text-[14px]">{growth >= 0 ? "arrow_upward" : "arrow_downward"}</span>
                           {Math.abs(growth).toFixed(1)}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
