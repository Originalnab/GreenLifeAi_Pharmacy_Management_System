import React from 'react';
import { FilterPeriod, PERIOD_META } from './DashboardFilterBar';

interface SalesBarChartProps {
  period: FilterPeriod;
  baseRevenue: number;
  baseCogs: number;
  baseExpenses: number;
  formatCurrency: (n: number) => string;
}

// Generate fake bar data scaled by multiplier and period
function generateBars(period: FilterPeriod, baseRevenue: number, baseCogs: number, baseExpenses: number) {
  const meta = PERIOD_META[period];
  const totalDays =
    period === 'today' || period === 'yesterday' ? 1 :
    (period === 'this_week' || period === 'last_week') ? 7 :
    (period === 'this_month' || period === 'last_month') ? 30 :
    (period === 'this_quarter' || period === 'last_quarter') ? 12 : // weeks
    (period === 'this_year') ? 9 : 7; // months

  const labels =
    (period === 'today' || period === 'yesterday')
      ? ['8am','10am','12pm','2pm','4pm','6pm','8pm']
      : (period === 'this_week' || period === 'last_week')
      ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
      : (period === 'this_month' || period === 'last_month')
      ? ['W1','W2','W3','W4','W5']
      : (period === 'this_quarter' || period === 'last_quarter')
      ? ['Jul','Aug','Sep']
      : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep'];

  const count = labels.length;
  const dailyRev = (baseRevenue * meta.multiplier) / count;
  const dailyCogs = (baseCogs * meta.multiplier) / count;
  const dailyExp = (baseExpenses * meta.multiplier) / count;

  const noise = (base: number, seed: number) =>
    base * (0.7 + 0.6 * ((Math.sin(seed * 7.3) + 1) / 2));

  return labels.map((label, i) => ({
    label,
    revenue: noise(dailyRev, i + 1),
    cogs:    noise(dailyCogs, i + 2),
    expenses: noise(dailyExp, i + 3),
  }));
}

export const SalesBarChart: React.FC<SalesBarChartProps> = ({
  period, baseRevenue, baseCogs, baseExpenses, formatCurrency,
}) => {
  const bars = generateBars(period, baseRevenue, baseCogs, baseExpenses);
  const maxVal = Math.max(...bars.flatMap(b => [b.revenue, b.cogs, b.expenses]), 1);

  const totalRevenue  = bars.reduce((a, b) => a + b.revenue, 0);
  const totalCogs     = bars.reduce((a, b) => a + b.cogs, 0);
  const totalGP       = totalRevenue - totalCogs;
  const totalExpenses = bars.reduce((a, b) => a + b.expenses, 0);
  const gpMargin      = totalRevenue > 0 ? ((totalGP / totalRevenue) * 100).toFixed(1) : '0.0';

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Revenue & Profit Trend</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {PERIOD_META[period].dateRange} · Revenue vs COGS vs Expenses
          </p>
        </div>
        {/* Summary totals */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Revenue</p>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-bold">GP</p>
            <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalGP)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Margin</p>
            <p className="text-sm font-extrabold text-blue-600 dark:text-blue-400">{gpMargin}%</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 mb-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5"><span className="w-3 h-2.5 rounded-sm bg-brand-500 inline-block" />Revenue</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-2.5 rounded-sm bg-amber-400 inline-block" />COGS</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-2.5 rounded-sm bg-rose-400 inline-block" />Expenses</span>
      </div>

      {/* Bars */}
      <div className="flex items-end gap-1 sm:gap-2 h-40">
        {bars.map((bar, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group">
            <div className="w-full flex items-end gap-px" style={{ height: '100%' }}>
              {/* Revenue */}
              <div
                title={`Revenue: ${formatCurrency(bar.revenue)}`}
                style={{ height: `${(bar.revenue / maxVal) * 100}%` }}
                className="flex-1 bg-gradient-to-t from-brand-700 to-brand-400 rounded-t-sm transition-all group-hover:opacity-90"
              />
              {/* COGS */}
              <div
                title={`COGS: ${formatCurrency(bar.cogs)}`}
                style={{ height: `${(bar.cogs / maxVal) * 100}%` }}
                className="flex-1 bg-gradient-to-t from-amber-600 to-amber-300 rounded-t-sm transition-all group-hover:opacity-90"
              />
              {/* Expenses */}
              <div
                title={`Expenses: ${formatCurrency(bar.expenses)}`}
                style={{ height: `${(bar.expenses / maxVal) * 100}%` }}
                className="flex-1 bg-gradient-to-t from-rose-600 to-rose-300 rounded-t-sm transition-all group-hover:opacity-90"
              />
            </div>
            <span className="text-[9px] font-semibold text-slate-400 mt-1 text-center leading-tight">
              {bar.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
