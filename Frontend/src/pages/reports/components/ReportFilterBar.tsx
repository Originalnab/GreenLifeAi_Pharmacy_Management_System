import React from 'react';
import { 
  Calendar, Search, Download, Printer, Filter, 
  BarChart3, ListOrdered, ChevronDown, RefreshCw, FileText
} from 'lucide-react';

export type ReportPeriod = 
  | 'TODAY' 
  | 'YESTERDAY' 
  | 'THIS_WEEK' 
  | 'LAST_WEEK' 
  | 'THIS_MONTH' 
  | 'LAST_MONTH' 
  | 'QUARTER_1' 
  | 'QUARTER_2' 
  | 'QUARTER_3' 
  | 'QUARTER_4' 
  | 'THIS_YEAR' 
  | 'ALL_TIME' 
  | 'CUSTOM';

export interface ReportFilterState {
  period: ReportPeriod;
  startDate?: string;
  endDate?: string;
  searchQuery: string;
  viewMode: 'summary' | 'detailed';
  secondaryFilter?: string;
}

interface ReportFilterBarProps {
  filterState: ReportFilterState;
  onFilterChange: (updates: Partial<ReportFilterState>) => void;
  onExportCSV: () => void;
  onPrintReport?: () => void;
  onPrint?: () => void;
  title?: string;
  searchPlaceholder?: string;
  secondaryFilterOptions?: Array<{ label: string; value: string }>;
  secondaryFilterLabel?: string;
  totalRecordCount?: number;
}

export const ReportFilterBar: React.FC<ReportFilterBarProps> = ({
  filterState,
  onFilterChange,
  onExportCSV,
  onPrintReport,
  onPrint,
  title,
  searchPlaceholder = 'Search records, reference numbers, or items...',
  secondaryFilterOptions,
  secondaryFilterLabel,
  totalRecordCount,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left Side: Period Dropdown, Custom Dates, Search */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Period Dropdown */}
          <div className="relative">
            <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <Calendar className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
              <select
                value={filterState.period}
                onChange={(e) => onFilterChange({ period: e.target.value as ReportPeriod })}
                className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-2"
              >
                <optgroup label="Daily & Weekly">
                  <option value="TODAY">Today's Shift (Live)</option>
                  <option value="YESTERDAY">Yesterday</option>
                  <option value="THIS_WEEK">This Week (Last 7 Days)</option>
                  <option value="LAST_WEEK">Last Week</option>
                </optgroup>
                <optgroup label="Monthly & Quarterly">
                  <option value="THIS_MONTH">This Month (MTD)</option>
                  <option value="LAST_MONTH">Last Month</option>
                  <option value="QUARTER_1">Quarter 1 (Jan - Mar)</option>
                  <option value="QUARTER_2">Quarter 2 (Apr - Jun)</option>
                  <option value="QUARTER_3">Quarter 3 (Jul - Sep)</option>
                  <option value="QUARTER_4">Quarter 4 (Oct - Dec)</option>
                </optgroup>
                <optgroup label="Annual & Custom">
                  <option value="THIS_YEAR">Year-to-Date (YTD 2026)</option>
                  <option value="ALL_TIME">Complete Historical Registry</option>
                  <option value="CUSTOM">Custom Date Range...</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* Custom Date Range Picker (Shown when period is CUSTOM) */}
          {filterState.period === 'CUSTOM' && (
            <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs animate-in fade-in">
              <span className="text-[10px] text-slate-400 font-bold uppercase">From:</span>
              <input
                type="date"
                value={filterState.startDate || ''}
                onChange={(e) => onFilterChange({ startDate: e.target.value })}
                className="bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 font-bold uppercase">To:</span>
              <input
                type="date"
                value={filterState.endDate || ''}
                onChange={(e) => onFilterChange({ endDate: e.target.value })}
                className="bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>
          )}

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={filterState.searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              className="w-full bg-slate-100 dark:bg-slate-800 pl-9 pr-3 py-2 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Secondary Category Filter Dropdown (Optional) */}
          {secondaryFilterOptions && secondaryFilterOptions.length > 0 && (
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {secondaryFilterLabel && (
                <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">{secondaryFilterLabel}:</span>
              )}
              <select
                value={filterState.secondaryFilter || 'ALL'}
                onChange={(e) => onFilterChange({ secondaryFilter: e.target.value })}
                className="bg-transparent font-medium text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                {secondaryFilterOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right Side: View Mode Toggle & Export Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Summary vs Detailed View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => onFilterChange({ viewMode: 'summary' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                filterState.viewMode === 'summary'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Summary</span>
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ viewMode: 'detailed' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                filterState.viewMode === 'detailed'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Detailed Ledger</span>
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={onExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 border border-slate-200 dark:border-slate-700 shadow-xs transition"
            title="Download formatted CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          {/* Print / PDF Document Button */}
          <button
            type="button"
            onClick={onPrintReport || onPrint}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-brand-600/20 transition cursor-pointer"
            title="Print or Save Official Regulatory PDF Document"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Record Counter & Date Feedback Pill */}
      {totalRecordCount !== undefined && (
        <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/80 font-medium">
          <span className="flex items-center space-x-1">
            <span>Filtered Scope:</span>
            <strong className="text-slate-700 dark:text-slate-300 font-mono">{filterState.period}</strong>
            {filterState.startDate && filterState.endDate && filterState.period === 'CUSTOM' && (
              <span className="font-mono text-slate-400">({filterState.startDate} to {filterState.endDate})</span>
            )}
          </span>
          <span className="font-mono font-bold text-brand-700 dark:text-brand-400">
            {totalRecordCount} Matching Records
          </span>
        </div>
      )}
    </div>
  );
};
