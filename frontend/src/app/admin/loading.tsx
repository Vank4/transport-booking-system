"use client";

export default function AdminLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-slate-200 dark:border-slate-700"></div>
        <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-transparent border-t-orange-500 animate-spin"></div>
      </div>
      <p className="text-sm font-medium text-slate-400 dark:text-slate-500 animate-pulse">Đang tải dữ liệu...</p>
    </div>
  );
}
