import React, { useMemo } from 'react';
import { 
  CreditCard, DollarSign, Clock, AlertTriangle, CheckCircle2, 
  User, ShieldAlert, ArrowUpRight, Check
} from 'lucide-react';
import { usePharmacy } from '../../../context/PharmacyContext';
import { ReportFilterState } from '../components/ReportFilterBar';
import { Pagination } from '../../../components/common/Pagination';
import { usePagination } from '../../../hooks/usePagination';

export const CreditsReportTab: React.FC<{ filterState: ReportFilterState }> = ({ filterState }) => {
  const { creditSales, customers, formatCurrency } = usePharmacy();
  const now = new Date();

  // Process credit sales with aging computation
  const processedCreditSales = useMemo(() => {
    return creditSales.map(cs => {
      const dueDate = new Date(cs.dueDate || cs.createdAt);
      const diffTime = now.getTime() - dueDate.getTime();
      const overdueDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      
      let agingBucket: 'CURRENT' | 'DAYS_30' | 'DAYS_60' | 'DAYS_90_PLUS' = 'CURRENT';
      if (overdueDays > 90) agingBucket = 'DAYS_90_PLUS';
      else if (overdueDays > 60) agingBucket = 'DAYS_60';
      else if (overdueDays > 30) agingBucket = 'DAYS_30';

      const balance = cs.remainingBalance ?? cs.balanceDue ?? (cs.totalAmount - (cs.paidAmount || 0));

      return {
        ...cs,
        overdueDays,
        agingBucket,
        balance
      };
    });
  }, [creditSales]);

  // Filter credit sales
  const filteredSales = useMemo(() => {
    return processedCreditSales.filter(cs => {
      if (filterState.searchQuery.trim()) {
        const q = filterState.searchQuery.toLowerCase();
        const matchCustomer = cs.customerName?.toLowerCase().includes(q);
        const matchInvoice = cs.invoiceNumber?.toLowerCase().includes(q) || cs.saleNumber?.toLowerCase().includes(q);
        const matchPhone = cs.customerPhone?.toLowerCase().includes(q);
        if (!matchCustomer && !matchInvoice && !matchPhone) return false;
      }

      if (filterState.secondaryFilter && filterState.secondaryFilter !== 'ALL') {
        if (filterState.secondaryFilter === 'OVERDUE' && cs.overdueDays === 0) return false;
        if (filterState.secondaryFilter === 'SETTLED' && cs.status !== 'SETTLED' && cs.status !== 'PAID') return false;
        if (filterState.secondaryFilter === 'UNPAID' && cs.status === 'SETTLED') return false;
      }

      return true;
    });
  }, [processedCreditSales, filterState.searchQuery, filterState.secondaryFilter]);

  const {
    currentPage,
    setCurrentPage,
    paginatedItems: paginatedSales
  } = usePagination(filteredSales, 10, [filterState]);

  // Overall KPIs
  const totalInvoiced = processedCreditSales.reduce((acc, cs) => acc + (cs.totalAmount || cs.invoicedTotal || 0), 0);
  const totalCollected = processedCreditSales.reduce((acc, cs) => acc + (cs.paidAmount || 0), 0);
  const totalOutstanding = processedCreditSales.reduce((acc, cs) => acc + cs.balance, 0);
  const recoveryRate = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 100;

  // Aging Bucket Totals
  const currentBucketTotal = processedCreditSales.filter(c => c.agingBucket === 'CURRENT').reduce((acc, c) => acc + c.balance, 0);
  const days30BucketTotal = processedCreditSales.filter(c => c.agingBucket === 'DAYS_30').reduce((acc, c) => acc + c.balance, 0);
  const days60BucketTotal = processedCreditSales.filter(c => c.agingBucket === 'DAYS_60').reduce((acc, c) => acc + c.balance, 0);
  const days90PlusBucketTotal = processedCreditSales.filter(c => c.agingBucket === 'DAYS_90_PLUS').reduce((acc, c) => acc + c.balance, 0);

  return (
    <div className="space-y-6">
      {/* SUMMARY VIEW */}
      {filterState.viewMode === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/40 dark:to-red-950/20 border border-rose-200 dark:border-rose-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                <span>Total Receivables (AR)</span>
                <DollarSign className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-rose-900 dark:text-rose-200 tracking-tight">
                {formatCurrency(totalOutstanding)}
              </p>
              <p className="text-xs text-rose-700 dark:text-rose-300 font-semibold">Uncollected Patient Credit</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                <span>Total Collected</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-emerald-900 dark:text-emerald-200 tracking-tight">
                {formatCurrency(totalCollected)}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                {recoveryRate.toFixed(1)}% Recovery Rate
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                <span>Overdue Debt (30+ Days)</span>
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-amber-900 dark:text-amber-200 tracking-tight">
                {formatCurrency(days30BucketTotal + days60BucketTotal + days90PlusBucketTotal)}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold">Past Due Invoices</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                <span>Total Invoiced</span>
                <CreditCard className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-purple-900 dark:text-purple-200 tracking-tight">
                {formatCurrency(totalInvoiced)}
              </p>
              <p className="text-xs text-slate-500 font-medium">{creditSales.length} Credit Facility Sales</p>
            </div>
          </div>

          {/* Aging Waterfall Matrix */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-600" />
              Accounts Receivable (AR) Aging Analysis
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">Current (0-30 Days)</span>
                <div className="text-xl font-black text-emerald-900 dark:text-emerald-100 mt-1">{formatCurrency(currentBucketTotal)}</div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">Healthy Runway</div>
              </div>

              <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                <span className="text-[10px] font-bold text-yellow-700 dark:text-yellow-300 uppercase">31 - 60 Days Overdue</span>
                <div className="text-xl font-black text-yellow-900 dark:text-yellow-100 mt-1">{formatCurrency(days30BucketTotal)}</div>
                <div className="text-[11px] text-yellow-700 dark:text-yellow-400 mt-1">Follow-up reminder sent</div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">61 - 90 Days Overdue</span>
                <div className="text-xl font-black text-amber-900 dark:text-amber-100 mt-1">{formatCurrency(days60BucketTotal)}</div>
                <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">High collections priority</div>
              </div>

              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase">90+ Days (Critical / Default)</span>
                <div className="text-xl font-black text-rose-900 dark:text-rose-100 mt-1">{formatCurrency(days90PlusBucketTotal)}</div>
                <div className="text-[11px] text-rose-700 dark:text-rose-400 mt-1">Legal / Credit Lock</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED LEDGER VIEW */}
      {filterState.viewMode === 'detailed' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-200">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Customer Credit & Accounts Receivable Ledger</h3>
              <p className="text-xs text-slate-500">Itemized debtor accounts, payment records, and aging buckets</p>
            </div>
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 px-2.5 py-1 rounded-full border border-brand-200 dark:border-brand-800">
              {filteredSales.length} Credit Accounts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Customer Name</th>
                  <th className="p-3.5">Sale Date</th>
                  <th className="p-3.5">Due Date</th>
                  <th className="p-3.5 text-right">Invoiced Total</th>
                  <th className="p-3.5 text-right">Paid Amount</th>
                  <th className="p-3.5 text-right">Balance Due</th>
                  <th className="p-3.5 text-center">Aging Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No credit account records found.
                    </td>
                  </tr>
                ) : (
                  paginatedSales.map(cs => (
                    <tr key={cs.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                        {cs.invoiceNumber || cs.saleNumber}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{cs.customerName}</div>
                        <div className="text-[11px] text-slate-500">{cs.customerPhone || 'Direct Account'}</div>
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">
                        {new Date(cs.saleDate || cs.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">
                        {new Date(cs.dueDate).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(cs.totalAmount || cs.invoicedTotal || 0)}
                      </td>
                      <td className="p-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(cs.paidAmount || 0)}
                      </td>
                      <td className="p-3.5 text-right font-black text-rose-600 dark:text-rose-400">
                        {formatCurrency(cs.balance)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          cs.balance === 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                          cs.agingBucket === 'DAYS_90_PLUS' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' :
                          cs.agingBucket === 'DAYS_60' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                          cs.agingBucket === 'DAYS_30' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}>
                          {cs.balance === 0 ? 'SETTLED' : cs.agingBucket.replace('_', ' ')}
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
            totalItems={filteredSales.length}
            pageSize={10}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};
