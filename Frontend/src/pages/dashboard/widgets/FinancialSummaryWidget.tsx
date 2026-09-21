import React from 'react';
import { FilterPeriod, PERIOD_META } from './DashboardFilterBar';

interface FinancialSummaryWidgetProps {
  period: FilterPeriod;
  baseRevenue: number;
  baseCogs: number;
  baseExpenses: number;
  totalAR: number;
  totalAP: number;
  totalLoans: number;
  formatCurrency: (n: number) => string;
}

export const FinancialSummaryWidget: React.FC<FinancialSummaryWidgetProps> = ({
  period, baseRevenue, baseCogs, baseExpenses, totalAR, totalAP, totalLoans, formatCurrency,
}) => {
  const m = PERIOD_META[period].multiplier;
  const revenue  = baseRevenue * m;
  const cogs     = baseCogs * m;
  const expenses = baseExpenses * m;
  const grossProfit = revenue - cogs;
  const netEstimate = grossProfit - expenses;
  const gpMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  const rows = [
    { label: 'Total Revenue',    value: revenue,     bar: 100,                          color: 'bg-brand-500' },
    { label: 'Cost of Goods Sold', value: -cogs,    bar: (cogs / revenue) * 100,       color: 'bg-amber-400' },
    { label: 'Gross Profit',     value: grossProfit, bar: gpMargin,                     color: 'bg-emerald-500' },
    { label: 'Operating Expenses',value: -expenses,  bar: (expenses / revenue) * 100,  color: 'bg-rose-400' },
    { label: 'Net Estimate',     value: netEstimate, bar: (netEstimate / revenue) * 100, color: netEstimate >= 0 ? 'bg-blue-500' : 'bg-red-500' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">P&L Summary</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{PERIOD_META[period].dateRange}</p>
      </div>

      <div className="p-5 space-y-3">
        {rows.map((row, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">{row.label}</span>
              <span className={`text-xs font-extrabold ${row.value < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                {row.value < 0 ? `(${formatCurrency(Math.abs(row.value))})` : formatCurrency(row.value)}
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${row.color}`}
                style={{ width: `${Math.min(100, Math.max(0, Math.abs(row.bar)))}%` }}
              />
            </div>
          </div>
        ))}

        <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-3">
          {[
            { label: 'Receivables (AR)', value: totalAR, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Payables (AP)',    value: totalAP,  color: 'text-rose-600 dark:text-rose-400' },
            { label: 'Loans',            value: totalLoans, color: 'text-purple-600 dark:text-purple-400' },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <p className="text-[10px] text-slate-400 font-semibold uppercase truncate">{item.label}</p>
              <p className={`text-sm font-extrabold mt-0.5 ${item.color}`}>{formatCurrency(item.value)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
