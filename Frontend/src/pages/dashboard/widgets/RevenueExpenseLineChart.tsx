import React, { useState } from 'react';
import { FilterPeriod, PERIOD_META } from './DashboardFilterBar';

interface RevenueExpenseLineChartProps {
  period: FilterPeriod;
  baseRevenue: number;
  baseExpenses: number;
  formatCurrency: (n: number) => string;
}

// Generate double line data scaled by period
function generateLineData(period: FilterPeriod, baseRevenue: number, baseExpenses: number) {
  const meta = PERIOD_META[period] || PERIOD_META.today;

  const effRevenue = Number(baseRevenue || 0);
  const effExpenses = Number(baseExpenses || 0);

  const labels =
    (period === 'today' || period === 'yesterday')
      ? ['8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM', '8:00 PM', '10:00 PM']
      : (period === 'this_week' || period === 'last_week')
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : (period === 'this_month' || period === 'last_month')
      ? ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5']
      : (period === 'this_quarter' || period === 'last_quarter')
      ? ['Month 1', 'Month 2', 'Month 3']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

  if (effRevenue === 0 && effExpenses === 0) {
    return labels.map(label => ({
      label,
      revenue: 0,
      expenses: 0,
      net: 0,
    }));
  }

  const count = labels.length;
  const totalRev = effRevenue * meta.multiplier;
  const totalExp = effExpenses * meta.multiplier;

  // Pattern weights for natural peak traffic
  const curveWeights = (period === 'today' || period === 'yesterday')
    ? [0.45, 0.85, 1.35, 1.15, 1.45, 1.65, 1.20, 0.70]
    : (period === 'this_week' || period === 'last_week')
    ? [0.85, 1.05, 1.15, 1.25, 1.40, 1.55, 0.95]
    : (period === 'this_month' || period === 'last_month')
    ? [0.90, 1.10, 1.25, 1.35, 0.85]
    : labels.map((_, i) => 0.8 + 0.5 * Math.sin((i + 1) * 0.9));

  const totalWeight = curveWeights.reduce((a, b) => a + b, 0) || 1;

  return labels.map((label, i) => {
    const w = curveWeights[i] / totalWeight;
    const rev = totalRev * w;
    const exp = totalExp * w * (0.85 + 0.3 * Math.sin((i + 1) * 2.3));
    const net = rev - exp;

    return {
      label,
      revenue: rev,
      expenses: exp,
      net,
    };
  });
}

// Generate smooth SVG Catmull-Rom or cubic bezier curve path
function getSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 >= points.length ? i + 1 : i + 2];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export const RevenueExpenseLineChart: React.FC<RevenueExpenseLineChartProps> = ({
  period, baseRevenue, baseExpenses, formatCurrency,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const data = generateLineData(period, baseRevenue, baseExpenses);

  const maxVal = Math.max(...data.flatMap(d => [d.revenue, d.expenses]), 1);
  const totalRevenue = data.reduce((a, b) => a + b.revenue, 0);
  const totalExpenses = data.reduce((a, b) => a + b.expenses, 0);
  const totalNet = totalRevenue - totalExpenses;
  const netMargin = totalRevenue > 0 ? ((totalNet / totalRevenue) * 100).toFixed(1) : '0.0';

  const width = 650;
  const height = 170;
  const paddingX = 35;
  const paddingTop = 15;
  const paddingBottom = 25;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingTop - paddingBottom;

  const revPoints = data.map((d, i) => ({
    x: paddingX + (i / (data.length - 1)) * graphWidth,
    y: paddingTop + graphHeight - (d.revenue / maxVal) * graphHeight,
  }));

  const expPoints = data.map((d, i) => ({
    x: paddingX + (i / (data.length - 1)) * graphWidth,
    y: paddingTop + graphHeight - (d.expenses / maxVal) * graphHeight,
  }));

  const revPath = getSmoothPath(revPoints);
  const expPath = getSmoothPath(expPoints);

  const revAreaPath = `${revPath} L ${revPoints[revPoints.length - 1].x} ${paddingTop + graphHeight} L ${revPoints[0].x} ${paddingTop + graphHeight} Z`;
  const expAreaPath = `${expPath} L ${expPoints[expPoints.length - 1].x} ${paddingTop + graphHeight} L ${expPoints[0].x} ${paddingTop + graphHeight} Z`;

  const hoveredItem = hoveredIdx !== null ? data[hoveredIdx] : null;

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">Revenue & Expenses Trajectory</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Double Line
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {PERIOD_META[period]?.dateRange || 'Sept 20, 2026'} · Inflow vs Outflow Velocity
          </p>
        </div>

        {/* Aggregate KPI Badges */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div className="bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 text-right">
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold tracking-wider">Revenue Line</p>
            <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="bg-rose-50/60 dark:bg-rose-950/30 px-3 py-1.5 rounded-xl border border-rose-100 dark:border-rose-900/40 text-right">
            <p className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-bold tracking-wider">Expenses Line</p>
            <p className="text-sm font-extrabold text-rose-600 dark:text-rose-400">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="bg-blue-50/60 dark:bg-blue-950/30 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-900/40 text-right">
            <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold tracking-wider">Net Surplus</p>
            <p className="text-sm font-extrabold text-blue-600 dark:text-blue-400">{formatCurrency(totalNet)} ({netMargin}%)</p>
          </div>
        </div>
      </div>

      {/* Legend & Active Hover Tag */}
      <div className="flex items-center justify-between gap-4 mt-3 mb-2 text-xs font-semibold">
        <div className="flex items-center gap-4 text-[11px] text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-1 rounded-full bg-emerald-500 shadow-sm" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 -ml-2" />
            Revenue Inflow
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-1 rounded-full bg-rose-500 shadow-sm" />
            <span className="w-2 h-2 rounded-full bg-rose-500 -ml-2" />
            Operating Expenses
          </span>
        </div>

        {hoveredItem && (
          <div className="hidden md:flex items-center gap-3 text-[11px] bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 animate-in fade-in duration-100">
            <span className="font-bold text-slate-700 dark:text-slate-200">{hoveredItem.label}:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Rev: {formatCurrency(hoveredItem.revenue)}</span>
            <span className="text-rose-600 dark:text-rose-400 font-bold">Exp: {formatCurrency(hoveredItem.expenses)}</span>
            <span className="text-blue-600 dark:text-blue-400">Net: {formatCurrency(hoveredItem.net)}</span>
          </div>
        )}
      </div>

      {/* SVG Chart Canvas */}
      <div className="relative w-full h-48 pt-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Revenue Gradient */}
            <linearGradient id="lineRevGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>

            {/* Expenses Gradient */}
            <linearGradient id="lineExpGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingTop + graphHeight - ratio * graphHeight;
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeDasharray={ratio === 0 ? '0' : '4 4'}
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* Area Fills */}
          <path d={revAreaPath} fill="url(#lineRevGrad)" />
          <path d={expAreaPath} fill="url(#lineExpGrad)" />

          {/* Revenue Line */}
          <path
            d={revPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-sm"
          />

          {/* Expenses Line */}
          <path
            d={expPath}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-sm"
          />

          {/* Data Points and Interaction Circles */}
          {data.map((d, i) => {
            const rp = revPoints[i];
            const ep = expPoints[i];
            const isHovered = hoveredIdx === i;

            return (
              <g key={i}>
                {/* Vertical Cursor Guide on Hover */}
                {isHovered && (
                  <line
                    x1={rp.x}
                    y1={paddingTop}
                    x2={rp.x}
                    y2={paddingTop + graphHeight}
                    stroke="currentColor"
                    className="text-brand-500/60 dark:text-brand-400/60"
                    strokeDasharray="2 2"
                    strokeWidth="1.5"
                  />
                )}

                {/* Revenue Point */}
                <circle
                  cx={rp.x}
                  cy={rp.y}
                  r={isHovered ? 5.5 : 3.5}
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all duration-150 cursor-pointer"
                />

                {/* Expense Point */}
                <circle
                  cx={ep.x}
                  cy={ep.y}
                  r={isHovered ? 5.5 : 3.5}
                  fill="#f43f5e"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all duration-150 cursor-pointer"
                />

                {/* Invisible Hover Trigger Column */}
                <rect
                  x={rp.x - (graphWidth / (data.length - 1)) / 2}
                  y={paddingTop}
                  width={graphWidth / (data.length - 1)}
                  height={graphHeight + paddingBottom}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />

                {/* X-Axis Text Labels */}
                <text
                  x={rp.x}
                  y={height - 4}
                  textAnchor="middle"
                  className={`text-[9px] font-bold select-none transition-colors ${
                    isHovered
                      ? 'fill-brand-600 dark:fill-brand-400 font-extrabold'
                      : 'fill-slate-400 dark:fill-slate-500'
                  }`}
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
