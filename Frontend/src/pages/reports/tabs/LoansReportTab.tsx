import React, { useMemo } from 'react';
import { 
  Building2, DollarSign, Calendar, TrendingUp, CheckCircle2, 
  Clock, ShieldAlert, Percent, CreditCard
} from 'lucide-react';
import { usePharmacy } from '../../../context/PharmacyContext';
import { ReportFilterState } from '../components/ReportFilterBar';
import { Pagination } from '../../../components/common/Pagination';
import { usePagination } from '../../../hooks/usePagination';

export const LoansReportTab: React.FC<{ filterState: ReportFilterState }> = ({ filterState }) => {
  const { loans, formatCurrency } = usePharmacy();

  // Filter loans
  const filteredLoans = useMemo(() => {
    return loans.filter(l => {
      if (filterState.searchQuery.trim()) {
        const q = filterState.searchQuery.toLowerCase();
        const matchLender = l.lenderName?.toLowerCase().includes(q);
        const matchRef = l.facilityReference?.toLowerCase().includes(q);
        if (!matchLender && !matchRef) return false;
      }

      if (filterState.secondaryFilter && filterState.secondaryFilter !== 'ALL') {
        if (l.status !== filterState.secondaryFilter) return false;
      }

      return true;
    });
  }, [loans, filterState.searchQuery, filterState.secondaryFilter]);

  const {
    currentPage,
    setCurrentPage,
    paginatedItems: paginatedLoans
  } = usePagination(filteredLoans, 10, [filterState]);

  // Aggregate metrics
  const totalPrincipal = filteredLoans.reduce((acc, l) => acc + l.principalAmount, 0);
  const totalRepayable = filteredLoans.reduce((acc, l) => acc + l.totalRepayable, 0);
  const totalPaid = filteredLoans.reduce((acc, l) => acc + l.totalPaid, 0);
  const totalOutstanding = filteredLoans.reduce((acc, l) => acc + l.outstandingBalance, 0);
  const repaymentProgress = totalRepayable > 0 ? (totalPaid / totalRepayable) * 100 : 100;

  return (
    <div className="space-y-6">
      {/* SUMMARY VIEW */}
      {filterState.viewMode === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/20 border border-indigo-200 dark:border-indigo-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                <span>Principal Disbursed</span>
                <DollarSign className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-indigo-900 dark:text-indigo-200 tracking-tight">
                {formatCurrency(totalPrincipal)}
              </p>
              <p className="text-xs text-slate-500 font-medium">Original Financed Capital</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                <span>Total Repayable Obligation</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-amber-900 dark:text-amber-200 tracking-tight">
                {formatCurrency(totalRepayable)}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold">Principal + Accrued Interest</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                <span>Total Principal & Interest Paid</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-emerald-900 dark:text-emerald-200 tracking-tight">
                {formatCurrency(totalPaid)}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                {repaymentProgress.toFixed(1)}% Amortized
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/40 dark:to-red-950/20 border border-rose-200 dark:border-rose-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                <span>Outstanding Balance</span>
                <CreditCard className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-rose-900 dark:text-rose-200 tracking-tight">
                {formatCurrency(totalOutstanding)}
              </p>
              <p className="text-xs text-rose-700 dark:text-rose-300 font-semibold">Current Liability</p>
            </div>
          </div>

          {/* Loan Facility Progress Breakdown */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-600" />
              Active Credit Facilities & Repayment Progress
            </h3>

            <div className="space-y-4">
              {filteredLoans.map(loan => {
                const prog = loan.totalRepayable > 0 ? (loan.totalPaid / loan.totalRepayable) * 100 : 100;
                return (
                  <div key={loan.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{loan.lenderName}</span>
                        <span className="text-xs text-slate-500 ml-2">Ref: {loan.facilityReference} • {loan.annualInterestRate}% p.a.</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold w-fit ${
                        loan.status === 'PAID_OFF' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}>
                        {loan.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-brand-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(1, prog))}%` }} />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Principal</span>
                        <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(loan.principalAmount)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Monthly Installment</span>
                        <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(loan.monthlyInstallment)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Paid</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(loan.totalPaid)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Outstanding</span>
                        <span className="font-black text-rose-600 dark:text-rose-400">{formatCurrency(loan.outstandingBalance)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* DETAILED LEDGER VIEW */}
      {filterState.viewMode === 'detailed' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-200">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Financing & Credit Facilities Ledger</h3>
              <p className="text-xs text-slate-500">Commercial loans, terms, maturity dates, and debt balances</p>
            </div>
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 px-2.5 py-1 rounded-full border border-brand-200 dark:border-brand-800">
              {filteredLoans.length} Facilities
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Lender Name</th>
                  <th className="p-3.5">Facility Ref</th>
                  <th className="p-3.5 text-right">Principal</th>
                  <th className="p-3.5 text-center">Interest Rate</th>
                  <th className="p-3.5 text-center">Term</th>
                  <th className="p-3.5 text-right">Monthly Due</th>
                  <th className="p-3.5 text-right">Total Paid</th>
                  <th className="p-3.5 text-right">Outstanding</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No loan records found.
                    </td>
                  </tr>
                ) : (
                  paginatedLoans.map(loan => (
                    <tr key={loan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        {loan.lenderName}
                      </td>
                      <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                        {loan.facilityReference}
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(loan.principalAmount)}
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-700 dark:text-slate-300">
                        {loan.annualInterestRate}%
                      </td>
                      <td className="p-3.5 text-center text-slate-600 dark:text-slate-400">
                        {loan.termMonths} Mos
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(loan.monthlyInstallment)}
                      </td>
                      <td className="p-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(loan.totalPaid)}
                      </td>
                      <td className="p-3.5 text-right font-black text-rose-600 dark:text-rose-400">
                        {formatCurrency(loan.outstandingBalance)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          loan.status === 'PAID_OFF' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}>
                          {loan.status.replace('_', ' ')}
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
            totalItems={filteredLoans.length}
            pageSize={10}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};
