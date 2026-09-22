import React, { useMemo } from 'react';
import { 
  Users, DollarSign, ArrowRightLeft, AlertTriangle, CheckCircle2, 
  Clock, ShieldCheck, TrendingUp, TrendingDown, Terminal
} from 'lucide-react';
import { usePharmacy } from '../../../context/PharmacyContext';
import { ReportFilterState } from '../components/ReportFilterBar';
import { isDateWithinPeriod } from '../utils/reportFilters';
import { Pagination } from '../../../components/common/Pagination';
import { usePagination } from '../../../hooks/usePagination';

export const SalesLedgerReportTab: React.FC<{ filterState: ReportFilterState }> = ({ filterState }) => {
  const { shifts, sales, formatCurrency } = usePharmacy();

  // Filter Shifts
  const filteredShifts = useMemo(() => {
    return shifts.filter(s => {
      const within = isDateWithinPeriod(s.startTime, filterState.period, filterState.startDate, filterState.endDate);
      if (!within) return false;

      if (filterState.searchQuery.trim()) {
        const q = filterState.searchQuery.toLowerCase();
        const matchCashier = s.cashierName?.toLowerCase().includes(q);
        const matchShiftNo = s.shiftNumber?.toLowerCase().includes(q);
        const matchTerminal = s.terminalId?.toLowerCase().includes(q);
        if (!matchCashier && !matchShiftNo && !matchTerminal) return false;
      }

      if (filterState.secondaryFilter && filterState.secondaryFilter !== 'ALL') {
        if (s.status !== filterState.secondaryFilter) return false;
      }

      return true;
    });
  }, [shifts, filterState]);

  const {
    currentPage,
    setCurrentPage,
    paginatedItems: paginatedShifts
  } = usePagination(filteredShifts, 10, [filterState]);

  // Aggregate metrics
  const totalShiftSales = filteredShifts.reduce((acc, s) => {
    const total = (s.cashSales || 0) + (s.cardSales || 0) + (s.transferSales || 0) + (s.momoSales || 0) + (s.creditSales || 0);
    return acc + total;
  }, 0);

  const totalCashCollected = filteredShifts.reduce((acc, s) => acc + (s.cashSales || 0), 0);
  const totalVariance = filteredShifts.reduce((acc, s) => acc + (s.variance || 0), 0);
  const totalFloat = filteredShifts.reduce((acc, s) => acc + (s.openingFloat || 0), 0);

  // Cashier leaderboard
  const cashierLeaderboard = useMemo(() => {
    const map: Record<string, { name: string; shiftsCount: number; totalSales: number; variance: number }> = {};
    filteredShifts.forEach(s => {
      const name = s.cashierName || 'Unknown Cashier';
      const shiftTotal = (s.cashSales || 0) + (s.cardSales || 0) + (s.transferSales || 0) + (s.momoSales || 0) + (s.creditSales || 0);
      if (!map[name]) map[name] = { name, shiftsCount: 0, totalSales: 0, variance: 0 };
      map[name].shiftsCount += 1;
      map[name].totalSales += shiftTotal;
      map[name].variance += (s.variance || 0);
    });
    return Object.values(map).sort((a, b) => b.totalSales - a.totalSales);
  }, [filteredShifts]);

  return (
    <div className="space-y-6">
      {/* SUMMARY VIEW */}
      {filterState.viewMode === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/20 border border-indigo-200 dark:border-indigo-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                <span>Total Shift Throughput</span>
                <DollarSign className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-indigo-900 dark:text-indigo-200 tracking-tight">
                {formatCurrency(totalShiftSales)}
              </p>
              <p className="text-xs text-slate-500 font-medium">{filteredShifts.length} Reconciled Shifts</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                <span>Total Cash Processed</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-emerald-900 dark:text-emerald-200 tracking-tight">
                {formatCurrency(totalCashCollected)}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">Physical Cash Handled</p>
            </div>

            <div className={`p-5 rounded-2xl border shadow-sm space-y-2 ${
              totalVariance === 0 
                ? 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700' 
                : totalVariance > 0 
                  ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800' 
                  : 'bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/40 dark:to-red-950/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                <span className={totalVariance < 0 ? 'text-rose-700 dark:text-rose-300' : 'text-slate-700 dark:text-slate-300'}>
                  Cash Drawer Variance
                </span>
                {totalVariance < 0 ? <TrendingDown className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <p className={`text-2xl font-black tracking-tight ${totalVariance < 0 ? 'text-rose-900 dark:text-rose-200' : 'text-slate-900 dark:text-white'}`}>
                {totalVariance > 0 ? `+${formatCurrency(totalVariance)}` : formatCurrency(totalVariance)}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                {totalVariance === 0 ? 'Perfect reconciliation' : totalVariance < 0 ? 'Net Cash Shortage' : 'Net Cash Overage'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                <span>Active Cashiers</span>
                <Users className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-purple-900 dark:text-purple-200 tracking-tight">
                {cashierLeaderboard.length}
              </p>
              <p className="text-xs text-slate-500 font-medium">Float Total: {formatCurrency(totalFloat)}</p>
            </div>
          </div>

          {/* Cashier Performance Leaderboard */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-brand-600" />
              Cashier Performance & Shift Reconciliation Summary
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase">
                  <tr>
                    <th className="p-3">Cashier</th>
                    <th className="p-3 text-center">Shifts Logged</th>
                    <th className="p-3 text-right">Total Throughput</th>
                    <th className="p-3 text-right">Net Drawer Variance</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {cashierLeaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">No cashier shift records in this period.</td>
                    </tr>
                  ) : (
                    cashierLeaderboard.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{c.name}</td>
                        <td className="p-3 text-center font-bold text-slate-900 dark:text-white">{c.shiftsCount}</td>
                        <td className="p-3 text-right font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(c.totalSales)}</td>
                        <td className={`p-3 text-right font-bold ${c.variance < 0 ? 'text-rose-600' : c.variance > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                          {c.variance > 0 ? `+${formatCurrency(c.variance)}` : formatCurrency(c.variance)}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            BALANCED
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED LEDGER VIEW */}
      {filterState.viewMode === 'detailed' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-200">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Shift Reconciliation & Drawer Audit Ledger</h3>
              <p className="text-xs text-slate-500">Breakdown of tender totals, drawer counts, and closing variances</p>
            </div>
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 px-2.5 py-1 rounded-full border border-brand-200 dark:border-brand-800">
              {filteredShifts.length} Shifts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Shift #</th>
                  <th className="p-3.5">Cashier</th>
                  <th className="p-3.5">Terminal</th>
                  <th className="p-3.5 text-right">Float</th>
                  <th className="p-3.5 text-right">Cash Sales</th>
                  <th className="p-3.5 text-right">Card / MoMo</th>
                  <th className="p-3.5 text-right">Expected</th>
                  <th className="p-3.5 text-right">Counted</th>
                  <th className="p-3.5 text-right">Variance</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredShifts.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No shift records found for this period.
                    </td>
                  </tr>
                ) : (
                  paginatedShifts.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                        {s.shiftNumber}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        {s.cashierName}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400 font-mono">
                        {s.terminalId}
                      </td>
                      <td className="p-3.5 text-right text-slate-600 dark:text-slate-300">
                        {formatCurrency(s.openingFloat || 0)}
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(s.cashSales || 0)}
                      </td>
                      <td className="p-3.5 text-right text-slate-600 dark:text-slate-300">
                        {formatCurrency((s.cardSales || 0) + (s.momoSales || 0) + (s.transferSales || 0))}
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-700 dark:text-slate-300">
                        {formatCurrency(s.expectedCash || 0)}
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(s.countedCash ?? s.expectedCash ?? 0)}
                      </td>
                      <td className={`p-3.5 text-right font-bold ${
                        (s.variance || 0) < 0 ? 'text-rose-600 dark:text-rose-400' :
                        (s.variance || 0) > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                        'text-slate-500'
                      }`}>
                        {(s.variance || 0) > 0 ? `+${formatCurrency(s.variance || 0)}` : formatCurrency(s.variance || 0)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'RECONCILED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                          s.status === 'CLOSED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredShifts.length}
            pageSize={10}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};
