import React, { useMemo } from 'react';
import { 
  Building2, DollarSign, Clock, Phone, Mail, 
  CheckCircle2, AlertTriangle, ShieldCheck, ArrowUpRight
} from 'lucide-react';
import { usePharmacy } from '../../../context/PharmacyContext';
import { ReportFilterState } from '../components/ReportFilterBar';
import { Pagination } from '../../../components/common/Pagination';
import { usePagination } from '../../../hooks/usePagination';

export const SuppliersReportTab: React.FC<{ filterState: ReportFilterState }> = ({ filterState }) => {
  const { suppliers, formatCurrency } = usePharmacy();

  // Filter suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      if (filterState.searchQuery.trim()) {
        const q = filterState.searchQuery.toLowerCase();
        const matchName = s.name?.toLowerCase().includes(q);
        const matchCode = s.code?.toLowerCase().includes(q);
        const matchContact = s.contactPerson?.toLowerCase().includes(q);
        const matchPhone = s.phone?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchContact && !matchPhone) return false;
      }

      if (filterState.secondaryFilter && filterState.secondaryFilter !== 'ALL') {
        if (s.status !== filterState.secondaryFilter) return false;
      }

      return true;
    });
  }, [suppliers, filterState.searchQuery, filterState.secondaryFilter]);

  const {
    currentPage,
    setCurrentPage,
    paginatedItems: paginatedSuppliers
  } = usePagination(filteredSuppliers, 10, [filterState]);

  // Aggregate metrics
  const totalPayables = filteredSuppliers.reduce((acc, s) => acc + (s.outstandingBalance || 0), 0);
  const activeSuppliers = filteredSuppliers.filter(s => s.status === 'ACTIVE');
  const avgPaymentTerms = filteredSuppliers.length > 0 
    ? Math.round(filteredSuppliers.reduce((acc, s) => acc + (s.paymentTermsDays || 30), 0) / filteredSuppliers.length) 
    : 30;

  const highestPayableSupplier = useMemo(() => {
    return [...filteredSuppliers].sort((a, b) => (b.outstandingBalance || 0) - (a.outstandingBalance || 0))[0];
  }, [filteredSuppliers]);

  return (
    <div className="space-y-6">
      {/* SUMMARY VIEW */}
      {filterState.viewMode === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/40 dark:to-red-950/20 border border-rose-200 dark:border-rose-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                <span>Total Accounts Payable (AP)</span>
                <DollarSign className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-rose-900 dark:text-rose-200 tracking-tight">
                {formatCurrency(totalPayables)}
              </p>
              <p className="text-xs text-rose-700 dark:text-rose-300 font-semibold">Outstanding Supplier Debt</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/20 border border-indigo-200 dark:border-indigo-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                <span>Active Vendors</span>
                <Building2 className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-indigo-900 dark:text-indigo-200 tracking-tight">
                {activeSuppliers.length} / {filteredSuppliers.length}
              </p>
              <p className="text-xs text-slate-500 font-medium">Verified Supplier Network</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                <span>Avg Payment Terms</span>
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-amber-900 dark:text-amber-200 tracking-tight">
                {avgPaymentTerms} Days
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold">Credit Grace Period</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                <span>Top AP Exposure</span>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <p className="text-lg font-black text-purple-900 dark:text-purple-200 truncate tracking-tight">
                {highestPayableSupplier?.name || 'None'}
              </p>
              <p className="text-xs font-bold text-purple-700 dark:text-purple-300">
                {highestPayableSupplier ? formatCurrency(highestPayableSupplier.outstandingBalance) : 'GH₵ 0.00'}
              </p>
            </div>
          </div>

          {/* Supplier AP Ranking Breakdown */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-brand-600" />
              Supplier Accounts Payable Distribution & Exposure
            </h3>

            <div className="space-y-3">
              {filteredSuppliers.map(s => {
                const share = totalPayables > 0 ? (s.outstandingBalance / totalPayables) * 100 : 0;
                return (
                  <div key={s.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1 md:w-1/3">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{s.name}</div>
                      <div className="text-xs text-slate-500">Terms: {s.paymentTermsDays || 30} Days • Contact: {s.contactPerson}</div>
                    </div>

                    <div className="w-full md:w-1/3">
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-500">AP Exposure</span>
                        <span className="text-slate-900 dark:text-white font-bold">{share.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full" style={{ width: `${Math.min(100, Math.max(2, share))}%` }} />
                      </div>
                    </div>

                    <div className="text-right md:w-1/4">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Balance Payable</span>
                      <span className="text-sm font-black text-rose-600 dark:text-rose-400">{formatCurrency(s.outstandingBalance)}</span>
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
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Supplier Accounts Payable (AP) Ledger</h3>
              <p className="text-xs text-slate-500">Vendor contacts, credit terms, and debt obligations</p>
            </div>
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 px-2.5 py-1 rounded-full border border-brand-200 dark:border-brand-800">
              {filteredSuppliers.length} Suppliers
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Vendor Name</th>
                  <th className="p-3.5">Vendor Code</th>
                  <th className="p-3.5">Contact Person</th>
                  <th className="p-3.5">Phone / Email</th>
                  <th className="p-3.5 text-center">Credit Terms</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Outstanding Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No suppliers found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedSuppliers.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        {s.name}
                      </td>
                      <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                        {s.code}
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300">
                        {s.contactPerson}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">
                        <div>{s.phone}</div>
                        <div className="text-[11px] text-slate-400">{s.email}</div>
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-900 dark:text-white">
                        {s.paymentTermsDays || 30} Days
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                          'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-black text-rose-600 dark:text-rose-400">
                        {formatCurrency(s.outstandingBalance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredSuppliers.length}
            pageSize={10}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};
