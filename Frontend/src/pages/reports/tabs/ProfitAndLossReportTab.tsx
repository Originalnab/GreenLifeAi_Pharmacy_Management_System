import React, { useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Receipt, CreditCard, 
  Wallet, Layers, ArrowUpRight, ArrowDownRight, FileText, CheckCircle2
} from 'lucide-react';
import { usePharmacy } from '../../../context/PharmacyContext';
import { ReportFilterState } from '../components/ReportFilterBar';
import { isDateWithinPeriod } from '../utils/reportFilters';
import { Pagination } from '../../../components/common/Pagination';
import { usePagination } from '../../../hooks/usePagination';

export const ProfitAndLossReportTab: React.FC<{ filterState: ReportFilterState }> = ({ filterState }) => {
  const { sales, expenses, products, formatCurrency } = usePharmacy();

  // Filter Sales in Period
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const within = isDateWithinPeriod(s.createdAt, filterState.period, filterState.startDate, filterState.endDate);
      if (!within) return false;
      if (filterState.searchQuery.trim()) {
        const q = filterState.searchQuery.toLowerCase();
        if (!s.receiptNumber.toLowerCase().includes(q) && !s.cashierName?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [sales, filterState]);

  // Filter Expenses in Period
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const within = isDateWithinPeriod(e.expenseDate, filterState.period, filterState.startDate, filterState.endDate);
      if (!within) return false;
      if (filterState.searchQuery.trim()) {
        const q = filterState.searchQuery.toLowerCase();
        const matchPayee = e.payee?.toLowerCase().includes(q);
        const matchRef = e.referenceNumber?.toLowerCase().includes(q);
        const matchCat = e.category?.toLowerCase().includes(q);
        if (!matchPayee && !matchRef && !matchCat) return false;
      }
      if (filterState.secondaryFilter && filterState.secondaryFilter !== 'ALL') {
        if (e.category !== filterState.secondaryFilter) return false;
      }
      return true;
    });
  }, [expenses, filterState]);

  const {
    currentPage,
    setCurrentPage,
    paginatedItems: paginatedExpenses
  } = usePagination(filteredExpenses, 10, [filterState]);

  // Financial Metrics
  const grossRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);

  // Compute COGS for sales in period
  const totalCOGS = useMemo(() => {
    let cogs = 0;
    filteredSales.forEach(sale => {
      sale.items?.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const unitCost = prod?.unitCost || (item.unitPrice * 0.7); // Fallback to 70% if unrecorded
        const multiplier = item.unitMultiplier || 1;
        cogs += (unitCost * multiplier * item.quantity);
      });
    });
    return cogs;
  }, [filteredSales, products]);

  const grossProfit = grossRevenue - totalCOGS;
  const grossMarginPercent = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;

  const totalOperatingExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netIncome = grossProfit - totalOperatingExpenses;
  const netMarginPercent = grossRevenue > 0 ? (netIncome / grossRevenue) * 100 : 0;

  // Expense breakdown by category
  const expenseByCategory = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    filteredExpenses.forEach(e => {
      const cat = e.category || 'General';
      if (!map[cat]) map[cat] = { total: 0, count: 0 };
      map[cat].total += e.amount;
      map[cat].count += 1;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [filteredExpenses]);

  return (
    <div className="space-y-6">
      {/* SUMMARY VIEW */}
      {filterState.viewMode === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                <span>Gross Revenue</span>
                <DollarSign className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-emerald-900 dark:text-emerald-200 tracking-tight">
                {formatCurrency(grossRevenue)}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                {filteredSales.length} Completed Sales Receipts
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                <span>Cost of Goods Sold (COGS)</span>
                <TrendingDown className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-amber-900 dark:text-amber-200 tracking-tight">
                {formatCurrency(totalCOGS)}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                Gross Profit: <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(grossProfit)}</span> ({grossMarginPercent.toFixed(1)}%)
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/40 dark:to-red-950/20 border border-rose-200 dark:border-rose-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                <span>Operating Expenses (OPEX)</span>
                <Wallet className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-rose-900 dark:text-rose-200 tracking-tight">
                {formatCurrency(totalOperatingExpenses)}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                {filteredExpenses.length} Approved Expense Vouchers
              </p>
            </div>

            <div className={`p-5 rounded-2xl border shadow-sm space-y-2 ${
              netIncome >= 0 
                ? 'bg-gradient-to-br from-brand-50 to-emerald-50 dark:from-brand-950/40 dark:to-emerald-950/20 border-brand-200 dark:border-brand-800' 
                : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                <span className={netIncome >= 0 ? 'text-brand-700 dark:text-brand-300' : 'text-rose-700 dark:text-rose-300'}>
                  Net Operating Income (P&L)
                </span>
                {netIncome >= 0 ? <TrendingUp className="w-4 h-4 text-brand-600" /> : <TrendingDown className="w-4 h-4 text-rose-600" />}
              </div>
              <p className={`text-2xl font-black tracking-tight ${netIncome >= 0 ? 'text-brand-900 dark:text-brand-200' : 'text-rose-900 dark:text-rose-200'}`}>
                {formatCurrency(netIncome)}
              </p>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                {netMarginPercent.toFixed(1)}% Net Profit Margin
              </p>
            </div>
          </div>

          {/* Income Statement Waterfall Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600" />
                Comprehensive Income Statement Waterfall
              </h3>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium space-y-2">
                <div className="flex justify-between py-2 items-center">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">1. Gross Realized Revenue</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(grossRevenue)}</span>
                </div>
                <div className="flex justify-between py-2 text-slate-600 dark:text-slate-400">
                  <span className="pl-4 text-slate-500">Less: Cost of Goods Sold (COGS)</span>
                  <span className="text-amber-600 font-semibold">({formatCurrency(totalCOGS)})</span>
                </div>
                <div className="flex justify-between py-2.5 bg-slate-50 dark:bg-slate-800/40 px-3 rounded-lg">
                  <span className="font-bold text-slate-900 dark:text-white">Gross Operating Profit</span>
                  <span className="font-black text-slate-900 dark:text-white">{formatCurrency(grossProfit)}</span>
                </div>
                <div className="flex justify-between py-2 text-slate-600 dark:text-slate-400">
                  <span className="pl-4 text-slate-500">Less: Operating Expenses (OPEX)</span>
                  <span className="text-rose-600 font-semibold">({formatCurrency(totalOperatingExpenses)})</span>
                </div>
                <div className="flex justify-between py-3 bg-brand-50/70 dark:bg-brand-950/40 px-3 rounded-lg border border-brand-100 dark:border-brand-800">
                  <span className="font-black text-brand-900 dark:text-brand-200 text-sm">Net Operating Surplus / (Loss)</span>
                  <span className="font-black text-brand-700 dark:text-brand-300 text-base">{formatCurrency(netIncome)}</span>
                </div>
              </div>
            </div>

            {/* OPEX Category Distribution */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-600" />
                Operating Expense (OPEX) Category Allocation
              </h3>

              {expenseByCategory.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">No operating expenses recorded in this timeframe.</p>
              ) : (
                <div className="space-y-3">
                  {expenseByCategory.map(([cat, stat]) => {
                    const share = totalOperatingExpenses > 0 ? (stat.total / totalOperatingExpenses) * 100 : 0;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-800 dark:text-slate-200">{cat} ({stat.count} vouchers)</span>
                          <span className="text-slate-900 dark:text-white font-bold">{formatCurrency(stat.total)} ({share.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-rose-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(3, share))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DETAILED LEDGER VIEW */}
      {filterState.viewMode === 'detailed' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-200">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Operating Expense (OPEX) Disbursements Ledger</h3>
              <p className="text-xs text-slate-500">Itemized audit vouchers and approved outgoing cash payments</p>
            </div>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800">
              {filteredExpenses.length} Expense Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Voucher Date</th>
                  <th className="p-3.5">Reference #</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Payee / Vendor</th>
                  <th className="p-3.5">Payment Method</th>
                  <th className="p-3.5">Approved By</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No expense records found matching your selected period and search terms.
                    </td>
                  </tr>
                ) : (
                  paginatedExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">
                        {new Date(exp.expenseDate).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 font-bold font-mono text-slate-900 dark:text-white">
                        {exp.referenceNumber || exp.id}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">{exp.payee}</td>
                      <td className="p-3.5 font-semibold text-slate-600 dark:text-slate-400">{exp.paymentMethod}</td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">{exp.approvedBy}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          exp.status === 'PAID' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                          exp.status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                          'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {exp.status || 'PAID'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-black text-rose-600 dark:text-rose-400">
                        {formatCurrency(exp.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredExpenses.length}
            pageSize={10}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};
