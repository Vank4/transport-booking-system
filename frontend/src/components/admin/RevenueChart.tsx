import { useMemo } from "react";

interface RevenueChartProps {
  chartData: { date: string; dayOfWeek: string; revenue: number; bookings: number }[];
  totalRevenue: number;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

const formatShortCurrency = (amount: number) => {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} triệu`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toString();
};

export default function RevenueChart({ chartData, totalRevenue }: RevenueChartProps) {
  // Memoize heavy calculations so they don't block the main thread on every re-render
  // unless the actual chart data changes.
  const { maxRevenue, chartPoints, linePath, areaPath } = useMemo(() => {
    const maxRev = Math.max(...chartData.map((d) => d.revenue), 1);
    
    const points = chartData.map((d, i) => {
      const x = (i / (chartData.length - 1)) * 100;
      const y = 38 - (d.revenue / maxRev) * 35;
      return { x, y };
    });

    const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
    const area = `${line} V 40 H 0 Z`;

    return {
      maxRevenue: maxRev,
      chartPoints: points,
      linePath: line,
      areaPath: area
    };
  }, [chartData]); // Dependency array: only recalculate if chartData array reference changes

  return (
    <div className="lg:col-span-2 flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Doanh thu 7 ngày gần nhất</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Tổng: {formatCurrency(totalRevenue)}</p>
        </div>
      </div>
      <div className="relative h-64 w-full">
        <svg className="h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 40">
          <g className="stroke-slate-100 dark:stroke-slate-700" strokeWidth="0.5">
            <line x1="0" x2="100" y1="30" y2="30" />
            <line x1="0" x2="100" y1="20" y2="20" />
            <line x1="0" x2="100" y1="10" y2="10" />
          </g>
          <defs>
            <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#ff5b00" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ff5b00" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={linePath} fill="none" stroke="#ff5b00" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          <path d={areaPath} fill="url(#areaGradient)" stroke="none" />
          {/* Data points */}
          {chartPoints.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="1.5" fill="#ff5b00" stroke="white" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
            </g>
          ))}
        </svg>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-slate-400 py-1 pointer-events-none">
          <span>{formatShortCurrency(maxRevenue)}</span>
          <span>{formatShortCurrency(maxRevenue / 2)}</span>
          <span>0</span>
        </div>
      </div>
      <div className="mt-4 flex justify-between px-2 text-xs font-medium text-slate-400">
        {chartData.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <span>{d.dayOfWeek}</span>
            <span className="text-[10px] text-slate-300">{d.bookings} đơn</span>
          </div>
        ))}
      </div>
    </div>
  );
}
