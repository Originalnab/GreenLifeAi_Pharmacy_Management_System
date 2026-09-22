import React, { useState } from 'react';
import { TrendingUp, CreditCard, Banknote, Building2, DollarSign } from 'lucide-react';
import { usePharmacy } from '../../../context/PharmacyContext';
import { DashboardFilterBar, FilterPeriod, PERIOD_META } from '../widgets/DashboardFilterBar';
import { KpiCard } from '../widgets/KpiCard';
import { FinancialSummaryWidget } from '../widgets/FinancialSummaryWidget';
import { RecommendationsPanel } from '../widgets/RecommendationCard';

interface AccountantDashboardProps { onNavigate: (tab: string) => void }

export const AccountantDashboard: React.FC<AccountantDashboardProps> = ({ onNavigate }) => {
  const [period, setPeriod] = useState<FilterPeriod>('today');
  const { sales, customers, suppliers, loans, expenses, shifts, currentUser, formatCurrency } = usePharmacy();

  const m = PERIOD_META[period].multiplier;
  const revenue     = sales.reduce((a, s) => a + s.total, 0) * m;
  const cogsBase    = revenue * 0.6;
  const expBase     = expenses.reduce((a, e) => a + e.amount, 0);
  const totalExpenses = expBase * m;
  const totalAR     = customers.reduce((a, c) => a + c.currentBalance, 0);
  const totalAP     = suppliers.reduce((a, s) => a + (s.outstandingBalance ?? 0), 0);
  const totalLoans  = loans.reduce((a, l) => a + l.outstandingBalance, 0);

  // AR ageing bands (mock)
  const agingBands = [
    { label: '0–30 Days',  value: totalAR * 0.45, color: 'bg-blue-400' },
    { label: '31–60 Days', value: totalAR * 0.32, color: 'bg-amber-400' },
    { label: '60+ Days',   value: totalAR * 0.23, color: 'bg-rose-500' },
  ];
  const maxAging = Math.max(...agingBands.map(b => b.value), 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col gap-4 bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-700 rounded-2xl p-6 text-white shadow-lg shadow-emerald-800/10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-wider">Finance Control</span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2">Welcome, {currentUser.name}</h1>
            <p className="text-xs text-emerald-200 mt-1">Revenue · Expenses · Receivables · Payables · Loans · Reconciliation</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => onNavigate('finance')} className="flex items-center gap-2 bg-white text-emerald-800 hover:bg-emerald-50 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all hover:scale-105">
              <DollarSign className="w-4 h-4" />Record Expense
            </button>
            <button onClick={() => onNavigate('reports')} className="flex items-center gap-2 bg-emerald-800/60 text-white px-3.5 py-2.5 rounded-xl font-semibold text-xs border border-white/20 transition">
              <TrendingUp className="w-4 h-4" />Reports
            </button>
          </div>
        </div>
        <DashboardFilterBar period={period} onChange={setPeriod} className="mt-1" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Gross Revenue" value={formatCurrency(revenue)} subValue={`Expenses: ${formatCurrency(totalExpenses)}`}
          icon={<TrendingUp className="w-5 h-5" />} iconBg="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
          trend="up" trendLabel="Total Sales" accentColor="hover:border-emerald-500/50" onClick={() => onNavigate('sales')} />
        <KpiCard title="Customer Receivables" value={formatCurrency(totalAR)} subValue="Outstanding customer credit"
          icon={<CreditCard className="w-5 h-5" />} iconBg="bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
          trend="neutral" trendLabel="Active credit accounts" accentColor="hover:border-blue-500/50" onClick={() => onNavigate('parties')} />
        <KpiCard title="Supplier Payables" value={formatCurrency(totalAP)} subValue="Outstanding vendor invoices"
          icon={<Building2 className="w-5 h-5" />} iconBg="bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
          trend={totalAP > 0 ? 'down' : 'neutral'} trendLabel="Payables due" accentColor="hover:border-rose-500/50" onClick={() => onNavigate('parties')} />
        <KpiCard title="Active Loan Balance" value={formatCurrency(totalLoans)} subValue={`${loans.length} active loan agreements`}
          icon={<Building2 className="w-5 h-5" />} iconBg="bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400"
          trend="neutral" trendLabel="Principal remaining" accentColor="hover:border-purple-500/50" onClick={() => onNavigate('finance')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FinancialSummaryWidget period={period} baseRevenue={revenue / m} baseCogs={cogsBase / m} baseExpenses={expBase} totalAR={totalAR} totalAP={totalAP} totalLoans={totalLoans} formatCurrency={formatCurrency} />

        {/* AR Ageing */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Receivables Ageing</h3>
            <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">Total: {formatCurrency(totalAR)}</span>
          </div>
          <div className="space-y-3">
            {agingBands.map((band, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{band.label}</span>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">{formatCurrency(band.value)}</span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${band.color}`}
                    style={{ width: `${(band.value / maxAging) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            <span className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(agingBands[2].value)}</span> is overdue 60+ days — priority follow-up required.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loan repayment schedule */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Loan Repayment Schedule</h3>
            <button onClick={() => onNavigate('finance')} className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold hover:underline">Manage →</button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {loans.map(l => (
              <div key={l.id} className="px-4 py-3.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{l.lenderName}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Next: {l.schedule?.find(s => s.status === 'PENDING')?.dueDate ?? 'N/A'} · {l.schedule?.length ?? 0} installments
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white">{formatCurrency(l.outstandingBalance)}</p>
                  <p className="text-[10px] text-slate-400">Remaining</p>
                </div>
                <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${l.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-slate-100 text-slate-500'}`}>
                  {l.status}
                </span>
              </div>
            ))}
            {loans.length === 0 && <div className="py-6 text-center text-xs text-slate-400">No active loans.</div>}
          </div>
        </div>

        {/* Shift reconciliation */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Shift Reconciliation</h3>
            <button onClick={() => onNavigate('finance')} className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold hover:underline">Manage →</button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {shifts.slice(0, 5).map((shift, i) => {
              const variance = shift.countedCash != null ? shift.countedCash - shift.expectedCash : null;
              return (
                <div key={i} className="px-4 py-3.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{shift.shiftNumber}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{shift.cashierName}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">{formatCurrency(shift.expectedCash)}</p>
                    {variance !== null && (
                      <p className={`text-[10px] font-bold ${Math.abs(variance) < 10 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                      </p>
                    )}
                  </div>
                  <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${shift.status === 'OPEN' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {shift.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <RecommendationsPanel recommendations={[
        ...(totalAP > 0 ? [{ type: 'warning' as const, title: `${formatCurrency(totalAP)} supplier payables outstanding`, description: 'Review ageing and settle overdue invoices to maintain supplier relationships.', actionLabel: 'Finance', onAction: () => onNavigate('finance') }] : []),
        ...(agingBands[2].value > 0 ? [{ type: 'warning' as const, title: 'Overdue receivables need follow-up', description: `${formatCurrency(agingBands[2].value)} has been outstanding for 60+ days.`, actionLabel: 'Customers', onAction: () => onNavigate('parties') }] : []),
        { type: 'info', title: 'Reconcile all closed shifts', description: 'Ensure all shift variances are documented and approved by end of day.', },
      ]} />
    </div>
  );
};
