import React from 'react';
import { 
  TrendingUp, CreditCard, DollarSign, Receipt, ShoppingBag, 
  Percent, ArrowUpRight, CheckCircle2, User, Clock, ShieldAlert
} from 'lucide-react';
import { usePharmacy } from '../../../context/PharmacyContext';
import { ReportFilterState } from '../components/ReportFilterBar';
import { isDateWithinPeriod } from '../utils/reportFilters';
import { Pagination } from '../../../components/common/Pagination';
import { usePagination } from '../../../hooks/usePagination';

export const SalesSummaryReportTab: React.FC<{ filterState: ReportFilterState }> = ({ filterState }) => {
  const { sales, formatCurrency } = usePharmacy();

  // Helper to extract primary payment tender from Sale
  const getSaleTender = (s: any) => {
    return s.payments?.[0]?.method || s.paymentTender || 'CASH';
  };

  // Filter Sales
  const filteredSales = sales.filter((s) => {
    const withinDate = isDateWithinPeriod(s.createdAt, filterState.period, filterState.startDate, filterState.endDate);
    if (!withinDate) return false;

    const tender = getSaleTender(s);

    if (filterState.searchQuery.trim()) {
      const q = filterState.searchQuery.toLowerCase();
      const matchesRef = s.receiptNumber?.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
      const matchesCashier = s.cashierName?.toLowerCase().includes(q);
      const matchesCustomer = s.customerName?.toLowerCase().includes(q);
      const matchesTender = tender.toLowerCase().includes(q);
      const matchesItems = s.items?.some(i => i.productName?.toLowerCase().includes(q));
      if (!matchesRef && !matchesCashier && !matchesCustomer && !matchesTender && !matchesItems) return false;
    }

    if (filterState.secondaryFilter && filterState.secondaryFilter !== 'ALL') {
      if (tender !== filterState.secondaryFilter) return false;
    }

    return true;
  });

  const {
    currentPage,
    setCurrentPage,
    paginatedItems: paginatedSales
  } = usePagination(filteredSales, 10, [filterState]);

  // Calculate Metrics
  const grossSales = filteredSales.reduce((acc, s) => acc + (s.subtotal || s.total), 0);
  const totalDiscount = filteredSales.reduce((acc, s) => acc + (s.discountTotal || 0), 0);
  const totalVAT = filteredSales.reduce((acc, s) => acc + (s.taxTotal || 0), 0);
  const netRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const avgBasket = filteredSales.length > 0 ? netRevenue / filteredSales.length : 0;

  // Tender Breakdown
  const tenderCounts: Record<string, { count: number; total: number }> = {};
  filteredSales.forEach((s) => {
    const t = getSaleTender(s);
    if (!tenderCounts[t]) tenderCounts[t] = { count: 0, total: 0 };
    tenderCounts[t].count += 1;
    tenderCounts[t].total += s.total;
  });

  return (
    <div className="space-y-6">
      {/* EXECUTIVE SUMMARY VIEW */}
      {filterState.viewMode === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-50 to-emerald-50 dark:from-brand-950/40 dark:to-emerald-950/20 border border-brand-200 dark:border-brand-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-brand-700 dark:text-brand-300 uppercase tracking-wider">
                <span>Gross Realized Sales</span>
                <DollarSign className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatCurrency(grossSales)}
              </p>
              <div className="flex items-center space-x-1 text-xs text-brand-600 dark:text-brand-400 font-semibold">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Before deductions & rebates</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                <span>Net Invoiced Revenue</span>
                <Receipt className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-blue-900 dark:text-blue-200 tracking-tight">
                {formatCurrency(netRevenue)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                From {filteredSales.length} validated transactions
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                <span>Average Basket Size</span>
                <ShoppingBag className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-amber-900 dark:text-amber-200 tracking-tight">
                {formatCurrency(avgBasket)}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                Per patient transaction ticket
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                <span>Tax & Subsidies</span>
                <Percent className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-purple-900 dark:text-purple-200 tracking-tight">
                {formatCurrency(totalVAT)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Discounts given: <span className="font-bold text-rose-600 dark:text-rose-400">-{formatCurrency(totalDiscount)}</span>
              </p>
            </div>
          </div>

          {/* Tender Breakdown & Prescription Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <CreditCard className="w-5 h-5 text-brand-600" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Payment Settlement & Tender Distribution
                </h4>
              </div>

              <div className="space-y-3">
                {Object.keys(tenderCounts).length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No transactions in selected period</p>
                ) : (
                  Object.entries(tenderCounts).map(([tender, data]) => {
                    const pct = netRevenue > 0 ? (data.total / netRevenue) * 100 : 0;
                    return (
                      <div key={tender} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-700 dark:text-slate-300">{tender} ({data.count} sales)</span>
                          <span className="text-slate-900 dark:text-white font-mono font-bold">
                            {formatCurrency(data.total)} ({pct.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-brand-500 h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Prescription POM vs OTC Counter Sales
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">OTC General Sales</span>
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                    {filteredSales.filter(s => !s.hasPrescriptionDrugs && !s.prescription).length}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Direct retail checkouts</span>
                </div>

                <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/60 text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold text-violet-700 dark:text-violet-300 block">Prescription POM</span>
                  <span className="text-xl font-extrabold text-violet-800 dark:text-violet-200 font-mono">
                    {filteredSales.filter(s => s.hasPrescriptionDrugs || !!s.prescription).length}
                  </span>
                  <span className="text-[10px] text-violet-600 dark:text-violet-400 block">Doctor MDCN signed</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border text-xs text-slate-600 dark:text-slate-400 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                <span>All transactions recorded with immutable fiscal ledger checksums and cashier timestamps.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED LEDGER VIEW */}
      {filterState.viewMode === 'detailed' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in duration-200">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Itemized Sales Transaction Register</h4>
              <p className="text-xs text-slate-500">Full audit log of counter sales, tender settlements, and tax breakdown</p>
            </div>
            <span className="text-xs font-mono font-bold text-brand-600">
              Showing {filteredSales.length} Transactions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Receipt / ID</th>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Cashier</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Items Count</th>
                  <th className="p-3">Tender Method</th>
                  <th className="p-3 text-right">Subtotal</th>
                  <th className="p-3 text-right">Discount</th>
                  <th className="p-3 text-right">VAT</th>
                  <th className="p-3 text-right">Net Paid</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400">
                      No sales transactions found matching active period and search criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                      <td className="p-3 font-mono font-bold text-brand-700 dark:text-brand-400">
                        {sale.receiptNumber || sale.id.substring(0, 10).toUpperCase()}
                      </td>
                      <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                        {sale.createdAt ? new Date(sale.createdAt).toLocaleString() : '—'}
                      </td>
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sale.cashierName || 'Cashier'}</span>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {sale.customerName || 'Walk-in Patient'}
                      </td>
                      <td className="p-3 font-mono">
                        {sale.items?.length || 1} items
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {getSaleTender(sale)}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-right text-slate-600 dark:text-slate-400">
                        {formatCurrency(sale.subtotal || sale.total)}
                      </td>
                      <td className="p-3 font-mono text-right text-rose-600">
                        {sale.discountTotal ? `-${formatCurrency(sale.discountTotal)}` : '—'}
                      </td>
                      <td className="p-3 font-mono text-right text-purple-600">
                        {sale.taxTotal ? formatCurrency(sale.taxTotal) : '—'}
                      </td>
                      <td className="p-3 font-mono font-extrabold text-right text-slate-900 dark:text-white">
                        {formatCurrency(sale.total)}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          COMPLETED
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
