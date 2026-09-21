import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export type FilterPeriod =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year';

export interface FilterPeriodMeta {
  label: string;
  short: string;
  multiplier: number; // approximate data multiplier vs "today"
  dateRange: string;
}

export const PERIOD_META: Record<FilterPeriod, FilterPeriodMeta> = {
  today:        { label: 'Today',         short: 'Today',   multiplier: 1,    dateRange: 'Sept 20, 2026' },
  yesterday:    { label: 'Yesterday',     short: 'Yest.',   multiplier: 0.92, dateRange: 'Sept 19, 2026' },
  this_week:    { label: 'This Week',     short: 'Week',    multiplier: 5.8,  dateRange: 'Sept 15 – 20, 2026' },
  last_week:    { label: 'Last Week',     short: 'L.Week',  multiplier: 5.4,  dateRange: 'Sept 8 – 14, 2026' },
  this_month:   { label: 'This Month',    short: 'Month',   multiplier: 20,   dateRange: 'Sept 1 – 20, 2026' },
  last_month:   { label: 'Last Month',    short: 'L.Month', multiplier: 26,   dateRange: 'Aug 1 – 31, 2026' },
  this_quarter: { label: 'This Quarter',  short: 'Q3',      multiplier: 82,   dateRange: 'Jul – Sept 2026' },
  last_quarter: { label: 'Last Quarter',  short: 'Q2',      multiplier: 91,   dateRange: 'Apr – Jun 2026' },
  this_year:    { label: 'This Year',     short: 'YTD',     multiplier: 264,  dateRange: 'Jan – Sept 2026' },
};

const PERIOD_ORDER: FilterPeriod[] = [
  'today', 'yesterday', 'this_week', 'last_week',
  'this_month', 'last_month', 'this_quarter', 'last_quarter', 'this_year',
];

interface DashboardFilterBarProps {
  period: FilterPeriod;
  onChange: (p: FilterPeriod) => void;
  className?: string;
}

export const DashboardFilterBar: React.FC<DashboardFilterBarProps> = ({
  period, onChange, className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold mr-1">
        <Calendar className="w-3.5 h-3.5" />
        <span>Period:</span>
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        {PERIOD_ORDER.map(p => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`
              px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-150 border
              ${period === p
                ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/20 scale-105'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400'
              }
            `}
          >
            {PERIOD_META[p].short}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
        <ChevronDown className="w-3 h-3" />
        <span>{PERIOD_META[period].dateRange}</span>
      </div>
    </div>
  );
};
