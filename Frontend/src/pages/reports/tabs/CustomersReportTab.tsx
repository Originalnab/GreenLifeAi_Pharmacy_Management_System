import React, { useMemo } from 'react';
import { 
  Users, DollarSign, Award, HeartHandshake, Stethoscope, 
  CheckCircle2, AlertTriangle, ArrowUpRight, Phone, Mail
} from 'lucide-react';
import { usePharmacy } from '../../../context/PharmacyContext';
import { ReportFilterState } from '../components/ReportFilterBar';
import { Pagination } from '../../../components/common/Pagination';
import { usePagination } from '../../../hooks/usePagination';

export const CustomersReportTab: React.FC<{ filterState: ReportFilterState }> = ({ filterState }) => {
  const { customers, formatCurrency } = usePharmacy();

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      if (filterState.searchQuery.trim()) {
        const q = filterState.searchQuery.toLowerCase();
        const matchName = c.name?.toLowerCase().includes(q);
        const matchPhone = c.phone?.toLowerCase().includes(q);
        const matchEmail = c.email?.toLowerCase().includes(q);
        const matchChronic = c.chronicConditions?.some(cond => cond.toLowerCase().includes(q));
        if (!matchName && !matchPhone && !matchEmail && !matchChronic) return false;
      }

      if (filterState.secondaryFilter && filterState.secondaryFilter !== 'ALL') {
        if (filterState.secondaryFilter === 'CHRONIC' && (!c.chronicConditions || c.chronicConditions.length === 0)) return false;
        if (filterState.secondaryFilter === 'DEBT' && (!c.currentBalance || c.currentBalance <= 0)) return false;
      }

      return true;
    });
  }, [customers, filterState.searchQuery, filterState.secondaryFilter]);

  const {
    currentPage,
    setCurrentPage,
    paginatedItems: paginatedCustomers
  } = usePagination(filteredCustomers, 10, [filterState]);

  // Aggregate metrics
  const totalPatients = filteredCustomers.length;
  const totalLifetimePurchases = filteredCustomers.reduce((acc, c) => acc + (c.totalPurchases || 0), 0);
  const totalCreditBalance = filteredCustomers.reduce((acc, c) => acc + (c.currentBalance || 0), 0);
  const chronicPatients = filteredCustomers.filter(c => c.chronicConditions && c.chronicConditions.length > 0);
  const avgPatientSpend = totalPatients > 0 ? totalLifetimePurchases / totalPatients : 0;

  // Top Patients by Lifetime Purchases
  const topPatients = useMemo(() => {
    return [...filteredCustomers].sort((a, b) => (b.totalPurchases || 0) - (a.totalPurchases || 0)).slice(0, 5);
  }, [filteredCustomers]);

  return (
    <div className="space-y-6">
      {/* SUMMARY VIEW */}
      {filterState.viewMode === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/20 border border-indigo-200 dark:border-indigo-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                <span>Registered Patients</span>
                <Users className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-indigo-900 dark:text-indigo-200 tracking-tight">
                {totalPatients}
              </p>
              <p className="text-xs text-slate-500 font-medium">{chronicPatients.length} Active Chronic Care Patients</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                <span>Total Lifetime Purchases</span>
                <DollarSign className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-emerald-900 dark:text-emerald-200 tracking-tight">
                {formatCurrency(totalLifetimePurchases)}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">Cumulative Dispensary Revenue</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                <span>Avg Patient LTV</span>
                <Award className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-purple-900 dark:text-purple-200 tracking-tight">
                {formatCurrency(avgPatientSpend)}
              </p>
              <p className="text-xs text-slate-500 font-medium">Per-Customer Lifetime Value</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/40 dark:to-red-950/20 border border-rose-200 dark:border-rose-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                <span>Current Patient Balance</span>
                <HeartHandshake className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-rose-900 dark:text-rose-200 tracking-tight">
                {formatCurrency(totalCreditBalance)}
              </p>
              <p className="text-xs text-rose-700 dark:text-rose-300 font-semibold">Outstanding Patient AR</p>
            </div>
          </div>

          {/* Top VIP Patients */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-brand-600" />
              Highest Value Patient Matrix (Top Lifetime Spend)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase">
                  <tr>
                    <th className="p-3">Patient Name</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Chronic Conditions</th>
                    <th className="p-3 text-right">Credit Limit</th>
                    <th className="p-3 text-right">Lifetime Purchases</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {topPatients.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 flex items-center justify-center text-[10px] font-black">
                          #{idx + 1}
                        </span>
                        {p.name}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{p.phone}</td>
                      <td className="p-3">
                        {p.chronicConditions && p.chronicConditions.length > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            {p.chronicConditions.join(', ')}
                          </span>
                        ) : (
                          <span className="text-slate-400">General Care</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-700 dark:text-slate-300">{formatCurrency(p.creditLimit || 0)}</td>
                      <td className="p-3 text-right font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(p.totalPurchases || 0)}</td>
                    </tr>
                  ))}
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
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Patient & Customer Master Directory Ledger</h3>
              <p className="text-xs text-slate-500">Contact coordinates, chronic conditions, credit limits, and balances</p>
            </div>
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 px-2.5 py-1 rounded-full border border-brand-200 dark:border-brand-800">
              {filteredCustomers.length} Patients
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Patient Name</th>
                  <th className="p-3.5">Phone & Email</th>
                  <th className="p-3.5">Chronic Profile</th>
                  <th className="p-3.5 text-right">Credit Limit</th>
                  <th className="p-3.5 text-right">Current Balance</th>
                  <th className="p-3.5 text-right">Lifetime Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No patients found matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        {c.name}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">
                        <div>{c.phone}</div>
                        {c.email && <div className="text-[11px] text-slate-400">{c.email}</div>}
                      </td>
                      <td className="p-3.5">
                        {c.chronicConditions && c.chronicConditions.length > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            {c.chronicConditions.join(', ')}
                          </span>
                        ) : (
                          <span className="text-slate-400">General Care</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-700 dark:text-slate-300">
                        {formatCurrency(c.creditLimit || 0)}
                      </td>
                      <td className={`p-3.5 text-right font-bold ${(c.currentBalance || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
                        {formatCurrency(c.currentBalance || 0)}
                      </td>
                      <td className="p-3.5 text-right font-black text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(c.totalPurchases || 0)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredCustomers.length}
            pageSize={10}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};
