import React, { useState } from 'react';
import { FilterPeriod, PERIOD_META } from './DashboardFilterBar';

interface SalesBarChartProps {
  period: FilterPeriod;
  baseRevenue: number;
  baseCogs: number;
  baseExpenses: number;
  formatCurrency: (n: number) => string;
}

// Generate multi-series bar data scaled by period
function generateBars(period: FilterPeriod, baseRevenue: number, baseCogs: number, baseExpenses: number) {
  const meta = PERIOD_META[period] || PERIOD_META.today;
  
  const effRevenue = Number(baseRevenue || 0);
  const effCogs = Number(baseCogs || 0);
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

  if (effRevenue === 0 && effCogs === 0 && effExpenses === 0) {
    return labels.map(label => ({
      label,
      revenue: 0,
      cogs: 0,
      expenses: 0,
      grossProfit: 0,
      netProfit: 0,
    }));
  }

  const count = labels.length;
  const totalRev = effRevenue * meta.multiplier;
  const totalCogs = effCogs * meta.multiplier;
  const totalExp = effExpenses * meta.multiplier;

  // Pattern weights for natural peak traffic simulation
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
    const cogs = totalCogs * w * (0.95 + 0.1 * Math.sin(i * 1.7));
    const exp = totalExp * w * (0.92 + 0.15 * Math.cos(i * 2.1));
    const grossProfit = rev - cogs;
    const netProfit = grossProfit - exp;

    return {
      label,
      revenue: rev,
      cogs,
      expenses: exp,
      grossProfit,
      netProfit,
    };
  });
}

export const SalesBarChart: React.FC<SalesBarChartProps> = ({
  period, baseRevenue, baseCogs, baseExpenses, formatCurrency,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const bars = generateBars(period, baseRevenue, baseCogs, baseExpenses);
  const maxVal = Math.max(...bars.flatMap(b => [b.revenue, b.cogs, b.expenses]), 1);

  const totalRevenue  = bars.reduce((a, b) => a + b.revenue, 0);
  const totalCogs     = bars.reduce((a, b) => a + b.cogs, 0);
  const totalGP       = totalRevenue - totalCogs;
  const totalExpenses = bars.reduce((a, b) => a + b.expenses, 0);
  const totalNet      = totalGP - totalExpenses;
  const gpMargin      = totalRevenue > 0 ? ((totalGP / totalRevenue) * 100).toFixed(1) : '0.0';
  const netMargin     = totalRevenue > 0 ? ((totalNet / totalRevenue) * 100).toFixed(1) : '0.0';

  const hoveredBar = hoveredIdx !== null ? bars[hoveredIdx] : null;

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">Revenue & Profit Trend</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Live Flow
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {PERIOD_META[period]?.dateRange || 'Sept 20, 2026'} · Revenue vs COGS vs Expenses
          </p>
        </div>

        {/* Aggregate KPI Badges */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div className="bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 text-right">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Revenue</p>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-right">
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold tracking-wider">Gross Profit</p>
            <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalGP)} ({gpMargin}%)</p>
          </div>
          <div className="bg-blue-50/60 dark:bg-blue-950/30 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-900/40 text-right">
            <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold tracking-wider">Net Est.</p>
            <p className="text-sm font-extrabold text-blue-600 dark:text-blue-400">{formatCurrency(totalNet)} ({netMargin}%)</p>
          </div>
        </div>
      </div>

      {/* Legend & Active Hover Tag */}
      <div className="flex items-center justify-between gap-4 mt-3 mb-3 text-xs font-semibold">
        <div className="flex items-center gap-4 text-[11px] text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2.5 rounded-sm bg-gradient-to-r from-brand-600 to-emerald-500 shadow-sm" />
            Revenue
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2.5 rounded-sm bg-gradient-to-r from-amber-500 to-amber-400 shadow-sm" />
            COGS
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2.5 rounded-sm bg-gradient-to-r from-rose-500 to-rose-400 shadow-sm" />
            Expenses
          </span>
        </div>

        {hoveredBar && (
          <div className="hidden md:flex items-center gap-3 text-[11px] bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 animate-in fade-in duration-100">
            <span className="font-bold text-slate-700 dark:text-slate-200">{hoveredBar.label}:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Rev: {formatCurrency(hoveredBar.revenue)}</span>
            <span className="text-amber-600 dark:text-amber-400">COGS: {formatCurrency(hoveredBar.cogs)}</span>
            <span className="text-rose-600 dark:text-rose-400">Exp: {formatCurrency(hoveredBar.expenses)}</span>
          </div>
        )}
      </div>

      {/* Chart Canvas with Background Grid Lines */}
      <div className="relative h-48 w-full pt-4">
        {/* Background Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-30 dark:opacity-20 pb-6">
          <div className="border-b border-dashed border-slate-400 dark:border-slate-600 w-full" />
          <div className="border-b border-dashed border-slate-400 dark:border-slate-600 w-full" />
          <div className="border-b border-dashed border-slate-400 dark:border-slate-600 w-full" />
          <div className="border-b border-slate-300 dark:border-slate-700 w-full" />
        </div>

        {/* Grouped Bars */}
        <div className="relative z-10 flex items-end gap-1.5 sm:gap-3 h-full pb-6">
          {bars.map((bar, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <div
                key={i}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`flex-1 flex flex-col items-center justify-end h-full group cursor-pointer transition-all duration-150 ${
                  isHovered ? 'scale-105' : 'hover:opacity-100'
                }`}
              >
                <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-full">
                  {/* Revenue Bar */}
                  <div
                    title={`Revenue: ${formatCurrency(bar.revenue)}`}
                    style={{ height: `${Math.max(6, (bar.revenue / maxVal) * 100)}%` }}
                    className={`flex-1 max-w-[14px] sm:max-w-[18px] bg-gradient-to-t from-emerald-600 to-brand-400 rounded-t-md shadow-sm transition-all ${
                      isHovered ? 'brightness-110 ring-2 ring-brand-400/40' : ''
                    }`}
                  />
                  {/* COGS Bar */}
                  <div
                    title={`COGS: ${formatCurrency(bar.cogs)}`}
                    style={{ height: `${Math.max(4, (bar.cogs / maxVal) * 100)}%` }}
                    className={`flex-1 max-w-[14px] sm:max-w-[18px] bg-gradient-to-t from-amber-600 to-amber-300 rounded-t-md shadow-sm transition-all ${
                      isHovered ? 'brightness-110 ring-2 ring-amber-400/40' : ''
                    }`}
                  />
                  {/* Expenses Bar */}
                  <div
                    title={`Expenses: ${formatCurrency(bar.expenses)}`}
                    style={{ height: `${Math.max(3, (bar.expenses / maxVal) * 100)}%` }}
                    className={`flex-1 max-w-[14px] sm:max-w-[18px] bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-md shadow-sm transition-all ${
                      isHovered ? 'brightness-110 ring-2 ring-rose-400/40' : ''
                    }`}
                  />
                </div>

                {/* X-Axis Label */}
                <span
                  className={`text-[10px] font-bold mt-2 truncate max-w-full transition-colors ${
                    isHovered
                      ? 'text-brand-600 dark:text-brand-400 underline font-extrabold'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {bar.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
