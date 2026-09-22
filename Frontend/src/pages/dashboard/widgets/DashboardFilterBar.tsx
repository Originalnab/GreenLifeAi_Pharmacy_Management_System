import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check, Clock } from 'lucide-react';

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
  group: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly & Annual';
}

export const PERIOD_META: Record<FilterPeriod, FilterPeriodMeta> = {
  today:        { label: 'Today',                 short: 'Today',   multiplier: 1,    dateRange: 'Sept 20, 2026',     group: 'Daily' },
  yesterday:    { label: 'Yesterday',             short: 'Yest.',   multiplier: 0.92, dateRange: 'Sept 19, 2026',     group: 'Daily' },
  this_week:    { label: 'This Week',             short: 'Week',    multiplier: 5.8,  dateRange: 'Sept 15 – 20, 2026', group: 'Weekly' },
  last_week:    { label: 'Last Week',             short: 'L.Week',  multiplier: 5.4,  dateRange: 'Sept 8 – 14, 2026',  group: 'Weekly' },
  this_month:   { label: 'This Month',            short: 'Month',   multiplier: 20,   dateRange: 'Sept 1 – 20, 2026', group: 'Monthly' },
  last_month:   { label: 'Last Month',            short: 'L.Month', multiplier: 26,   dateRange: 'Aug 1 – 31, 2026',   group: 'Monthly' },
  this_quarter: { label: 'Quarter 3 (This Qtr)',  short: 'Q3',      multiplier: 82,   dateRange: 'Jul – Sept 2026',   group: 'Quarterly & Annual' },
  last_quarter: { label: 'Quarter 2 (Last Qtr)',  short: 'Q2',      multiplier: 91,   dateRange: 'Apr – Jun 2026',    group: 'Quarterly & Annual' },
  this_year:    { label: 'Year to Date (YTD)',    short: 'YTD',     multiplier: 264,  dateRange: 'Jan – Sept 2026',   group: 'Quarterly & Annual' },
};

const PERIOD_GROUPS: { name: FilterPeriodMeta['group']; periods: FilterPeriod[] }[] = [
  { name: 'Daily', periods: ['today', 'yesterday'] },
  { name: 'Weekly', periods: ['this_week', 'last_week'] },
  { name: 'Monthly', periods: ['this_month', 'last_month'] },
  { name: 'Quarterly & Annual', periods: ['this_quarter', 'last_quarter', 'this_year'] },
];

interface DashboardFilterBarProps {
  period: FilterPeriod;
  onChange: (p: FilterPeriod) => void;
  className?: string;
}

export const DashboardFilterBar: React.FC<DashboardFilterBarProps> = ({
  period,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const current = PERIOD_META[period] || PERIOD_META.today;

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (p: FilterPeriod) => {
    onChange(p);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={`
            group flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium
            transition-all duration-200 border shadow-sm backdrop-blur-md cursor-pointer select-none
            ${isOpen
              ? 'bg-white text-slate-900 border-white shadow-lg ring-2 ring-brand-500/30 dark:bg-slate-800 dark:text-white dark:border-slate-600'
              : 'bg-black/20 hover:bg-black/30 text-white border-white/20 hover:border-white/40 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:border-slate-700'
            }
          `}
        >
          <div className="flex items-center gap-1.5 text-emerald-300 dark:text-emerald-400">
            <Calendar className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-200 dark:text-slate-300">
              Period:
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-brand-500/30 text-brand-200 border border-brand-400/40 dark:bg-brand-500/20 dark:text-brand-300">
              {current.short}
            </span>
            <span className="font-bold hidden sm:inline-block">
              {current.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5 pl-2 border-l border-white/20 dark:border-slate-700 text-slate-300 text-[11px]">
            <span className="hidden md:inline font-medium">({current.dateRange})</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-brand-400' : 'text-slate-300'
              }`}
            />
          </div>
        </button>
      </div>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 top-full mt-2 w-72 sm:w-80 z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/5"
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Clock className="w-3.5 h-3.5 text-brand-500" />
              <span>Select Reporting Period</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              {PERIOD_GROUPS.reduce((acc, g) => acc + g.periods.length, 0)} Options
            </span>
          </div>

          {/* Grouped Options List */}
          <div className="max-h-72 overflow-y-auto py-1.5 space-y-2 divide-y divide-slate-100 dark:divide-slate-800/60">
            {PERIOD_GROUPS.map((group) => (
              <div key={group.name} className="pt-1.5 first:pt-0">
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {group.name}
                </div>
                <div className="space-y-0.5">
                  {group.periods.map((p) => {
                    const meta = PERIOD_META[p];
                    const isSelected = period === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleSelect(p)}
                        role="option"
                        aria-selected={isSelected}
                        className={`
                          w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all duration-150 cursor-pointer
                          ${isSelected
                            ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200 font-semibold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`
                              px-2 py-0.5 rounded text-[11px] font-bold shrink-0
                              ${isSelected
                                ? 'bg-brand-600 text-white shadow-sm'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                              }
                            `}
                          >
                            {meta.short}
                          </span>
                          <div className="truncate">
                            <div className="text-xs font-semibold leading-tight truncate">
                              {meta.label}
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                              {meta.dateRange}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 ml-2">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer current date range summary */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl mt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Active Range:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{current.dateRange}</span>
          </div>
        </div>
      )}
    </div>
  );
};

