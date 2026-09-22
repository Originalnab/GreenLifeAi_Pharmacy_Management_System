import React, { useMemo } from 'react';
import { 
  Truck, DollarSign, PackageCheck, Clock, CheckCircle2, 
  AlertCircle, Building2, ShoppingCart, ArrowUpRight
} from 'lucide-react';
import { usePharmacy } from '../../../context/PharmacyContext';
import { ReportFilterState } from '../components/ReportFilterBar';
import { isDateWithinPeriod } from '../utils/reportFilters';
import { Pagination } from '../../../components/common/Pagination';
import { usePagination } from '../../../hooks/usePagination';

export const PurchasesReportTab: React.FC<{ filterState: ReportFilterState }> = ({ filterState }) => {
  const { purchaseOrders, suppliers, formatCurrency } = usePharmacy();

  // Filter Purchase Orders
  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter(po => {
      const within = isDateWithinPeriod(po.createdAt, filterState.period, filterState.startDate, filterState.endDate);
      if (!within) return false;

      if (filterState.searchQuery.trim()) {
        const q = filterState.searchQuery.toLowerCase();
        const matchNo = po.poNumber?.toLowerCase().includes(q);
        const matchSupplier = po.supplierName?.toLowerCase().includes(q);
        const matchItem = po.items?.some(i => i.productName?.toLowerCase().includes(q));
        if (!matchNo && !matchSupplier && !matchItem) return false;
      }

      if (filterState.secondaryFilter && filterState.secondaryFilter !== 'ALL') {
        if (po.status !== filterState.secondaryFilter) return false;
      }

      return true;
    });
  }, [purchaseOrders, filterState]);

  const {
    currentPage,
    setCurrentPage,
    paginatedItems: paginatedPOs
  } = usePagination(filteredPOs, 10, [filterState]);

  // Aggregate metrics
  const totalPOAmount = filteredPOs.reduce((acc, po) => acc + po.totalAmount, 0);
  const completedPOs = filteredPOs.filter(po => po.status === 'COMPLETED');
  const completedAmount = completedPOs.reduce((acc, po) => acc + po.totalAmount, 0);
  const pendingPOs = filteredPOs.filter(po => po.status !== 'COMPLETED' && po.status !== 'CANCELLED');
  const pendingAmount = pendingPOs.reduce((acc, po) => acc + po.totalAmount, 0);

  // Supplier procurement distribution
  const supplierSpend = useMemo(() => {
    const map: Record<string, { name: string; count: number; totalAmount: number }> = {};
    filteredPOs.forEach(po => {
      const name = po.supplierName || 'General Distributor';
      if (!map[name]) map[name] = { name, count: 0, totalAmount: 0 };
      map[name].count += 1;
      map[name].totalAmount += po.totalAmount;
    });
    return Object.values(map).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredPOs]);

  return (
    <div className="space-y-6">
      {/* SUMMARY VIEW */}
      {filterState.viewMode === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/20 border border-indigo-200 dark:border-indigo-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                <span>Total Committed Spend</span>
                <DollarSign className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-indigo-900 dark:text-indigo-200 tracking-tight">
                {formatCurrency(totalPOAmount)}
              </p>
              <p className="text-xs text-slate-500 font-medium">{filteredPOs.length} Total Purchase Orders</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                <span>GRN Received Value</span>
                <PackageCheck className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-emerald-900 dark:text-emerald-200 tracking-tight">
                {formatCurrency(completedAmount)}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">{completedPOs.length} Fulfilled Orders</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                <span>Pending Deliveries</span>
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-amber-900 dark:text-amber-200 tracking-tight">
                {formatCurrency(pendingAmount)}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold">{pendingPOs.length} In-Transit / Approved POs</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                <span>Active Vendors</span>
                <Building2 className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-purple-900 dark:text-purple-200 tracking-tight">
                {supplierSpend.length}
              </p>
              <p className="text-xs text-slate-500 font-medium">Distributor Accounts</p>
            </div>
          </div>

          {/* Top Vendors Spend Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-brand-600" />
              Distributor Procurement Capital Allocation
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase">
                  <tr>
                    <th className="p-3">Distributor / Supplier</th>
                    <th className="p-3 text-center">Orders Placed</th>
                    <th className="p-3 text-right">Committed Spend</th>
                    <th className="p-3 text-right">Share of Procurement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {supplierSpend.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400">No procurement records found for this period.</td>
                    </tr>
                  ) : (
                    supplierSpend.map((s, idx) => {
                      const share = totalPOAmount > 0 ? (s.totalAmount / totalPOAmount) * 100 : 0;
                      return (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{s.name}</td>
                          <td className="p-3 text-center font-bold text-slate-900 dark:text-white">{s.count}</td>
                          <td className="p-3 text-right font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(s.totalAmount)}</td>
                          <td className="p-3 text-right font-bold text-slate-600 dark:text-slate-400">{share.toFixed(1)}%</td>
                        </tr>
                      );
                    })
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
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Procurement & GRN Receiving Ledger</h3>
              <p className="text-xs text-slate-500">Comprehensive audit of purchase orders, deliveries, and fulfillment status</p>
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
              {filteredPOs.length} Purchase Orders
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">PO Number</th>
                  <th className="p-3.5">Supplier Name</th>
                  <th className="p-3.5">Created Date</th>
                  <th className="p-3.5">Expected Delivery</th>
                  <th className="p-3.5 text-center">Items</th>
                  <th className="p-3.5">Approval</th>
                  <th className="p-3.5">PO Status</th>
                  <th className="p-3.5 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredPOs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No purchase orders found matching your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedPOs.map(po => (
                    <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                        {po.poNumber}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        {po.supplierName}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">
                        {new Date(po.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">
                        {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : 'Immediate'}
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-900 dark:text-white">
                        {po.items?.length || 0}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          po.approvalStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                          po.approvalStatus === 'REJECTED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {po.approvalStatus || 'APPROVED'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          po.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                          po.status === 'PARTIALLY_RECEIVED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                          po.status === 'SUBMITTED' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' :
                          'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-black text-slate-900 dark:text-white">
                        {formatCurrency(po.totalAmount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredPOs.length}
            pageSize={10}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};
