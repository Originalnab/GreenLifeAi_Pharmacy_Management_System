import React, { useState } from 'react';
import { ShoppingBag, Banknote, FileText, Clock, CreditCard } from 'lucide-react';
import { usePharmacy } from '../../../context/PharmacyContext';
import { DashboardFilterBar, FilterPeriod, PERIOD_META } from '../widgets/DashboardFilterBar';
import { KpiCard } from '../widgets/KpiCard';

interface CashierDashboardProps { onNavigate: (tab: string) => void }

export const CashierDashboard: React.FC<CashierDashboardProps> = ({ onNavigate }) => {
  const [period, setPeriod] = useState<FilterPeriod>('today');
  const { sales, activeShift, currentUser, formatCurrency } = usePharmacy();

  const m = PERIOD_META[period].multiplier;
  const shiftSales  = sales.reduce((a, s) => a + s.total, 0) * m;
  const txCount     = Math.round(sales.length * m);
  const cashDue     = activeShift ? activeShift.expectedCash : 0;
  const shiftOpen   = activeShift ? '08:00' : '--';
  const heldSales   = [
    { ref: 'HELD-001', customer: 'Walk-in', items: 3, amount: 85.00 },
    { ref: 'HELD-002', customer: 'Mrs. Adjoa', items: 5, amount: 210.00 },
  ];

  const paymentBreakdown = [
    { label: 'Cash',        value: shiftSales * 0.58, color: 'bg-emerald-500', pct: 58 },
    { label: 'Mobile Money',value: shiftSales * 0.24, color: 'bg-blue-500',    pct: 24 },
    { label: 'Card',        value: shiftSales * 0.12, color: 'bg-purple-500',  pct: 12 },
    { label: 'Credit',      value: shiftSales * 0.06, color: 'bg-amber-500',   pct: 6  },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col gap-4 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg shadow-amber-700/10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-wider">Cashier Workspace</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeShift ? 'bg-emerald-500/30 text-emerald-100' : 'bg-rose-500/30 text-rose-100'}`}>
                SHIFT {activeShift ? 'OPEN' : 'CLOSED'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2">Welcome, {currentUser.name}</h1>
            <p className="text-xs text-amber-100 mt-1">Point of sale · Cash management · Shift reconciliation</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => onNavigate('pos')} className="flex items-center gap-2 bg-white text-amber-800 hover:bg-amber-50 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all hover:scale-105 active:scale-95">
              <ShoppingBag className="w-4 h-4" />Launch POS
            </button>
            <button onClick={() => onNavigate('finance')} className="flex items-center gap-2 bg-amber-700/60 text-white px-3.5 py-2.5 rounded-xl font-semibold text-xs border border-white/20 transition">
              <Banknote className="w-4 h-4" />Close Shift
            </button>
          </div>
        </div>
        <DashboardFilterBar period={period} onChange={setPeriod} className="mt-1" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Shift Sales" value={formatCurrency(shiftSales)} subValue="Active shift total"
          icon={<ShoppingBag className="w-5 h-5" />} iconBg="bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"
          trend="up" trendLabel="Active register" accentColor="hover:border-amber-500/50" />
        <KpiCard title="Transactions" value={`${txCount}`} subValue="Completed checkouts"
          icon={<FileText className="w-5 h-5" />} iconBg="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
          trend="up" trendLabel="Shift throughput" accentColor="hover:border-emerald-500/50" />
        <KpiCard title="Cash in Drawer" value={formatCurrency(cashDue)} subValue={`Float: ${formatCurrency(activeShift?.openingFloat ?? 0)}`}
          icon={<Banknote className="w-5 h-5" />} iconBg="bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
          trend="neutral" trendLabel="Expected drawer cash" accentColor="hover:border-blue-500/50" />
        <KpiCard title="Shift Status" value={activeShift ? 'Open' : 'Closed'} subValue={activeShift ? `Since ${shiftOpen} (${activeShift.shiftNumber})` : 'No active shift'}
          icon={<Clock className="w-5 h-5" />} iconBg="bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400"
          trend="neutral" trendLabel={activeShift ? 'Currently operating' : 'Offline'} accentColor="hover:border-purple-500/50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment method breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4">Payment Method Breakdown</h3>
          <div className="space-y-3">
            {paymentBreakdown.map((p, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{p.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">{formatCurrency(p.value)}</span>
                    <span className="text-[11px] text-slate-400 font-semibold w-8 text-right">{p.pct}%</span>
                  </div>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${p.color}`} style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Held sales queue */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Held Sales</h3>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold">{heldSales.length} on hold</span>
          </div>
          {heldSales.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No held sales.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {heldSales.map((hs, i) => (
                <div key={i} className="px-4 py-3.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{hs.ref}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{hs.customer} · {hs.items} items</p>
                  </div>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white flex-shrink-0">{formatCurrency(hs.amount)}</p>
                  <button onClick={() => onNavigate('pos')} className="flex-shrink-0 px-3 py-1.5 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded-lg text-[11px] font-bold hover:bg-amber-200 transition">Resume</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Recent Transactions (My Shift)</h3>
          <button onClick={() => onNavigate('sales')} className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold hover:underline">View all →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-4 py-3">Ref</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sales.slice(0, 8).map(s => (
                <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">{s.receiptNumber}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{s.customerName ?? 'Walk-in'}</td>
                  <td className="px-4 py-3 font-extrabold text-slate-900 dark:text-white">{formatCurrency(s.total)}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">{s.payments[0]?.method ?? 'CASH'}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{s.createdAt?.slice(11, 16) ?? '--'}</td>
                  <td className="px-4 py-3">
                    <button className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline">Reprint</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
