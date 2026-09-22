import React, { useState } from 'react';
import {
  TrendingUp, Package, Clock, Banknote, CreditCard, ShoppingBag,
  FileText, BarChart2, DollarSign, Users, Truck, AlertTriangle,
  ShoppingCart, ArrowUpRight,
} from 'lucide-react';
import { usePharmacy } from '../../../context/PharmacyContext';
import { DashboardFilterBar, FilterPeriod, PERIOD_META } from '../widgets/DashboardFilterBar';
import { KpiCard } from '../widgets/KpiCard';
import { SalesBarChart } from '../widgets/SalesBarChart';
import { RevenueExpenseLineChart } from '../widgets/RevenueExpenseLineChart';
import { DonutChart } from '../widgets/DonutChart';
import { ApprovalQueueWidget } from '../widgets/ApprovalQueueWidget';
import { ExpiryRiskWidget } from '../widgets/ExpiryRiskWidget';
import { FinancialSummaryWidget } from '../widgets/FinancialSummaryWidget';
import { RecommendationsPanel, Recommendation } from '../widgets/RecommendationCard';
import { PurchasePipelineWidget } from '../widgets/PurchasePipelineWidget';
import { StockOverviewWidget } from '../widgets/StockOverviewWidget';

interface ManagerDashboardProps { onNavigate: (tab: string) => void }

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ onNavigate }) => {
  const [period, setPeriod] = useState<FilterPeriod>('today');
  const {
    sales, products, batches, activeShift, approvals, customers,
    suppliers, purchaseOrders, expenses, loans,
    approveRequest, rejectRequest, currentUser, formatCurrency,
  } = usePharmacy();

  const m = PERIOD_META[period].multiplier;
  const todayRevenue  = sales.reduce((a, s) => a + s.total, 0);
  const revenue       = todayRevenue * m;
  const cogsBase      = todayRevenue * 0.6;
  const expBase       = expenses.reduce((a, e) => a + e.amount, 0);
  const grossProfit   = revenue - cogsBase * m;
  const txCount       = Math.round(sales.length * m);
  const avgTicket     = txCount > 0 ? revenue / txCount : 0;
  const totalAR       = customers.reduce((a, c) => a + c.currentBalance, 0);
  const totalAP       = suppliers.reduce((a, s) => a + (s.outstandingBalance ?? 0), 0);
  const totalLoans    = loans.reduce((a, l) => a + l.outstandingBalance, 0);
  const totalExpenses = expBase * m;
  const lowStockCount = products.filter(p => p.status !== 'IN_STOCK').length;
  const pendingApprovals = approvals.filter(a => a.status === 'PENDING');
  const expCount = batches.filter(b => {
    const d = (new Date(b.expiryDate).getTime() - new Date('2026-09-20').getTime()) / 86400000;
    return d <= 60 && d > 0;
  }).length;

  const sparkRevenue = [420000, 580000, 710000, 490000, 890000, 760000, todayRevenue].map(v => v * m / 7);

  const recommendations: Recommendation[] = [
    ...(expCount > 0 ? [{ type: 'critical' as const, title: `${expCount} batches expiring soon`, description: 'Initiate expiry review and consider quarantine or return to supplier.', actionLabel: 'Expiry Queue', onAction: () => onNavigate('inventory') }] : []),
    ...(lowStockCount > 3 ? [{ type: 'warning' as const, title: `${lowStockCount} products below reorder level`, description: 'Create purchase requests to prevent stockouts during peak hours.', actionLabel: 'Purchasing', onAction: () => onNavigate('purchasing') }] : []),
    ...(pendingApprovals.length > 0 ? [{ type: 'info' as const, title: `${pendingApprovals.length} items awaiting approval`, description: 'Review and authorize or reject pending requests to unblock staff.', actionLabel: 'Approvals', onAction: () => {} }] : []),
    { type: 'positive', title: 'Friday revenue peaks observed', description: 'Fri–Sat sales are ~40% higher. Consider scheduling additional cashier shifts.', },
    ...(totalAP > 0 ? [{ type: 'warning' as const, title: 'Supplier payables outstanding', description: `${formatCurrency(totalAP)} due to suppliers. Review ageing to avoid supply disruption.`, actionLabel: 'Finance', onAction: () => onNavigate('finance') }] : []),
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col gap-4 bg-gradient-to-r from-brand-700 via-brand-600 to-clinical-600 rounded-2xl p-6 text-white shadow-lg shadow-brand-700/10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-white/25 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-emerald-100">Operations Control</span>
              <span className="text-xs text-brand-200">Greenlife Central Dispensary · Single Branch Active</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1.5">Welcome, {currentUser.name}</h1>
            <p className="text-xs text-brand-200 mt-1">Full operational + financial visibility · Manager access level</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => onNavigate('pos')} className="flex items-center gap-2 bg-white text-brand-800 hover:bg-brand-50 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all hover:scale-105 active:scale-95">
              <ShoppingBag className="w-4 h-4 text-brand-600" />Launch POS
            </button>
            <button onClick={() => onNavigate('purchasing')} className="flex items-center gap-2 bg-brand-800/60 hover:bg-brand-800 text-white px-3.5 py-2.5 rounded-xl font-semibold text-xs border border-white/20 transition">
              <ShoppingCart className="w-4 h-4" />New PO
            </button>
            <button onClick={() => onNavigate('reports')} className="flex items-center gap-2 bg-brand-800/60 hover:bg-brand-800 text-white px-3.5 py-2.5 rounded-xl font-semibold text-xs border border-white/20 transition">
              <BarChart2 className="w-4 h-4" />Reports
            </button>
          </div>
        </div>
        <DashboardFilterBar period={period} onChange={setPeriod} className="mt-1" />
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Revenue" value={formatCurrency(revenue)} subValue={`${txCount} sales · GP: ${formatCurrency(grossProfit)}`}
          icon={<TrendingUp className="w-5 h-5" />} iconBg="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
          trend="up" trendLabel={`Margin: ${revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : 0}%`} accentColor="hover:border-emerald-500/50"
          sparkData={sparkRevenue} onClick={() => onNavigate('sales')} />
        <KpiCard title="Transaction Volume" value={txCount.toLocaleString()} subValue={`Avg Ticket: ${formatCurrency(avgTicket)}`}
          icon={<FileText className="w-5 h-5" />} iconBg="bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
          trend="up" trendLabel="Active checkout rate" accentColor="hover:border-blue-500/50" onClick={() => onNavigate('sales')} />
        <KpiCard title="Inventory Alerts" value={`${lowStockCount} Low`} subValue={`${expCount} batches expiring < 60d`}
          icon={<Package className="w-5 h-5" />} iconBg="bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"
          trend={lowStockCount > 3 ? 'down' : 'neutral'} trendLabel={lowStockCount > 3 ? 'Reorder needed' : 'Manageable'}
          accentColor="hover:border-amber-500/50" onClick={() => onNavigate('inventory')} />
        <KpiCard title="Working Capital" value={formatCurrency(totalAR)} subValue={`Supplier AP: ${formatCurrency(totalAP)}`}
          icon={<CreditCard className="w-5 h-5" />} iconBg="bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400"
          trend="neutral" trendLabel="Receivables / Payables" accentColor="hover:border-purple-500/50" onClick={() => onNavigate('parties')} />
      </div>

      {/* Analytics Core: Trend Chart & Payment Mix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SalesBarChart period={period} baseRevenue={todayRevenue} baseCogs={cogsBase} baseExpenses={expBase} formatCurrency={formatCurrency} />
          <RevenueExpenseLineChart period={period} baseRevenue={todayRevenue} baseExpenses={expBase} formatCurrency={formatCurrency} />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <DonutChart
            title="Payment Method Split"
            subtitle="Sales by payment channel"
            segments={[
              { label: 'Cash',       value: Math.round(revenue * 0.58), color: '#22c55e' },
              { label: 'Mobile Money',value: Math.round(revenue * 0.24), color: '#3b82f6' },
              { label: 'Card',        value: Math.round(revenue * 0.12), color: '#a855f7' },
              { label: 'Credit',      value: Math.round(revenue * 0.06), color: '#f59e0b' },
            ]}
            formatValue={v => formatCurrency(v)}
            centerLabel="Revenue"
            centerValue={formatCurrency(revenue)}
          />
          <FinancialSummaryWidget period={period} baseRevenue={todayRevenue} baseCogs={cogsBase} baseExpenses={expBase} totalAR={totalAR} totalAP={totalAP} totalLoans={totalLoans} formatCurrency={formatCurrency} />
        </div>
      </div>

      {/* Operational Matrix (3-card balanced triad) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StockOverviewWidget products={products} onNavigate={onNavigate} formatCurrency={formatCurrency} />
        <PurchasePipelineWidget purchaseOrders={purchaseOrders} onNavigate={onNavigate} formatCurrency={formatCurrency} />
        <ApprovalQueueWidget approvals={approvals} onApprove={approveRequest} onReject={rejectRequest} formatCurrency={formatCurrency} />
      </div>

      {/* Supplier Balances + Expiry Risk & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supplier balances */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col lg:col-span-1">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Supplier Balances (AP)</h3>
            <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400">{formatCurrency(totalAP)}</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1">
            {suppliers.slice(0, 5).map(sup => (
              <div key={sup.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-clinical-500 flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0">
                  {sup.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{sup.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{sup.paymentTermsDays}d terms</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-extrabold ${(sup.outstandingBalance ?? 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {formatCurrency(sup.outstandingBalance ?? 0)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expiry Risk */}
        <div className="lg:col-span-1">
          <ExpiryRiskWidget batches={batches} onNavigate={onNavigate} />
        </div>

        {/* Recommendations */}
        <div className="lg:col-span-1">
          <RecommendationsPanel recommendations={recommendations} />
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Medicine Inventory — Status Overview</h3>
          <button onClick={() => onNavigate('catalogue')} className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline">
            View catalogue →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-4 py-3">Medicine</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Unit Price</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Margin</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {products.slice(0, 8).map(p => {
                const margin = p.unitCost > 0 ? (((p.sellingPrice - p.unitCost) / p.sellingPrice) * 100) : 0;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{p.brandName}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{p.genericName} · {p.strength}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.categoryName}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{p.availableQuantity.toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{formatCurrency(p.sellingPrice)}</td>
                    <td className="px-4 py-3 text-slate-500">{formatCurrency(p.unitCost)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-12 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, margin)}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{margin.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'IN_STOCK'    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        p.status === 'LOW_STOCK'   ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                                                     'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>{p.status.replace('_', ' ')}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cashier Shift Strip */}
      {activeShift && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Active Cashier Shift</h3>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">OPEN</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Shift Number', value: activeShift.shiftNumber },
              { label: 'Cashier', value: activeShift.cashierName },
              { label: 'Expected Cash', value: formatCurrency(activeShift.expectedCash) },
              { label: 'Float', value: formatCurrency(activeShift.openingFloat) },
            ].map((item, i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2.5">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">{item.label}</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
