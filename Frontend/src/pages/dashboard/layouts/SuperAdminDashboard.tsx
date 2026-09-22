import React, { useState } from 'react';
import {
  TrendingUp, Package, Clock, Banknote, CreditCard, ShoppingBag,
  FileText, BarChart2, Shield, Database, Users, Settings,
  ShoppingCart, Activity, AlertTriangle,
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
import { SystemHealthWidget } from '../widgets/SystemHealthWidget';

import { isDemoUser } from '../../../types';

interface SuperAdminDashboardProps { onNavigate: (tab: string) => void }

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onNavigate }) => {
  const [period, setPeriod] = useState<FilterPeriod>('today');
  const {
    sales, products, batches, activeShift, approvals, customers,
    suppliers, purchaseOrders, expenses, loans, users, auditLogs,
    approveRequest, rejectRequest, currentUser, formatCurrency, operatingMode,
  } = usePharmacy();

  const m = PERIOD_META[period].multiplier;
  const isDemo = operatingMode === 'DEMO';
  const todayRevenue  = sales.reduce((a, s) => a + (s.total || 0), 0);
  const revenue       = todayRevenue * m;
  const cogsBase      = sales.reduce((a, s) => a + (s.total ? s.total * 0.65 : 0), 0);
  const expBase       = expenses.reduce((a, e) => a + e.amount, 0);
  const grossProfit   = revenue - cogsBase * m;
  const txCount       = Math.round(sales.length * m);
  const totalAR       = customers.reduce((a, c) => a + c.currentBalance, 0);
  const totalAP       = suppliers.reduce((a, s) => a + (s.outstandingBalance ?? 0), 0);
  const totalLoans    = loans.reduce((a, l) => a + l.outstandingBalance, 0);
  const totalExpenses = expBase * m;
  const lowStockCount = products.filter(p => p.status !== 'IN_STOCK').length;
  const expCount      = batches.filter(b => {
    const d = (new Date(b.expiryDate).getTime() - new Date('2026-09-20').getTime()) / 86400000;
    return d <= 60 && d > 0;
  }).length;
  
  const staffAccounts = users.filter(u => isDemo || !isDemoUser(u));
  const activeUsers   = staffAccounts.filter(u => u.active).length;
  const failedLogins  = 3; // mock
  const pendingApprovals = approvals.filter(a => a.status === 'PENDING');
  const sparkRevenue  = [420000, 580000, 710000, 490000, 890000, 760000, todayRevenue].map(v => v * m / 7);

  const recommendations: Recommendation[] = [
    { type: 'info', title: 'System backup is current', description: 'Last backup completed successfully. Next scheduled backup in 4 hours.', actionLabel: 'Settings', onAction: () => onNavigate('settings') },
    ...(expCount > 0 ? [{ type: 'critical' as const, title: `${expCount} batches expiring within 60 days`, description: 'Review expiry queue and initiate return or disposal workflows.', actionLabel: 'Expiry Queue', onAction: () => onNavigate('inventory') }] : []),
    ...(lowStockCount > 3 ? [{ type: 'warning' as const, title: `${lowStockCount} products below reorder level`, description: 'Procurement should create purchase requests to prevent stockouts.', actionLabel: 'Purchasing', onAction: () => onNavigate('purchasing') }] : []),
    { type: 'positive', title: 'Gross margin tracking well', description: `GP of ${formatCurrency(grossProfit)} for the ${PERIOD_META[period].label.toLowerCase()} is within expected range.` },
    ...(failedLogins >= 3 ? [{ type: 'warning' as const, title: `${failedLogins} failed login attempts detected`, description: 'Review security logs to verify no unauthorized access attempts.', actionLabel: 'Audit Log', onAction: () => onNavigate('audit') }] : []),
    { type: 'info', title: 'User access review due', description: 'Recommend reviewing user roles and permissions for dormant accounts.', actionLabel: 'Admin', onAction: () => onNavigate('administration') },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col gap-4 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-2xl p-6 text-white shadow-lg shadow-slate-900/20 border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/30 text-rose-200 text-[11px] font-bold uppercase tracking-wider">System Command Center</span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-slate-300 text-[10px] font-semibold">Super Admin</span>
              <span className="text-xs text-slate-400">Backup: 2h ago · All systems nominal</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1.5">Welcome, {currentUser.name}</h1>
            <p className="text-xs text-slate-300 mt-1">Super Administrator · Greenlife Central Branch (Victoria Island)</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <DashboardFilterBar period={period} onChange={setPeriod} />
            <button onClick={() => onNavigate('administration')} className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold backdrop-blur-sm transition border border-white/10">
              <Users className="w-3.5 h-3.5" />Manage Users
            </button>
            <button onClick={() => onNavigate('settings')} className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold backdrop-blur-sm transition border border-white/10">
              <Settings className="w-3.5 h-3.5" />Settings
            </button>
          </div>
        </div>
      </div>

      {/* System Vitals Ribbon (4 cards) */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">System Vitals & Risk Control</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Active Staff Users" value={`${activeUsers} Active`} subValue={`${staffAccounts.length} total registered accounts`}
            icon={<Users className="w-5 h-5" />} iconBg="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400"
            trend="neutral" trendLabel="Security profiles current" accentColor="hover:border-indigo-500/50" onClick={() => onNavigate('administration')} />
          <KpiCard title="Pending Approvals" value={`${pendingApprovals.length} Pending`} subValue="Manager overrides queued"
            icon={<Clock className="w-5 h-5" />} iconBg="bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"
            trend={pendingApprovals.length > 2 ? 'down' : 'neutral'} trendLabel={pendingApprovals.length > 0 ? 'Requires sign-off' : 'Queue clear'} accentColor="hover:border-amber-500/50" />
          <KpiCard title="Low Stock Items" value={`${lowStockCount} Products`} subValue="Items below threshold"
            icon={<AlertTriangle className="w-5 h-5" />} iconBg="bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
            trend={lowStockCount > 3 ? 'down' : 'neutral'} trendLabel="Reorder queue active" accentColor="hover:border-rose-500/50" onClick={() => onNavigate('purchasing')} />
          <KpiCard title="Near Expiry Batches" value={`${expCount} Batches`} subValue="Expiring in ≤ 60 days"
            icon={<Package className="w-5 h-5" />} iconBg="bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"
            trend={expCount > 0 ? 'down' : 'up'} trendLabel="FEFO risk active" accentColor="hover:border-amber-500/50" onClick={() => onNavigate('inventory')} />
        </div>
      </div>

      {/* Business KPIs Ribbon (4 cards) */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Enterprise Financials ({PERIOD_META[period].label})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Gross Sales Revenue" value={formatCurrency(revenue)} subValue={`${txCount} orders recorded`}
            icon={<TrendingUp className="w-5 h-5" />} iconBg="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
            trend="up" trendLabel="+12.4% vs prev period" sparkData={sparkRevenue} accentColor="hover:border-emerald-500/50" onClick={() => onNavigate('sales')} />
          <KpiCard title="Gross Profit (Est.)" value={formatCurrency(grossProfit)} subValue={`Margin: ${revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : 0}%`}
            icon={<Banknote className="w-5 h-5" />} iconBg="bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400"
            trend="up" trendLabel="Healthy margin" accentColor="hover:border-brand-500/50" onClick={() => onNavigate('finance')} />
          <KpiCard title="Supplier Payables (AP)" value={formatCurrency(totalAP)} subValue={`${suppliers.length} active suppliers`}
            icon={<Package className="w-5 h-5" />} iconBg="bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
            trend="neutral" trendLabel="Scheduled dispatches" accentColor="hover:border-rose-500/50" onClick={() => onNavigate('parties')} />
          <KpiCard title="Customer Receivables" value={formatCurrency(totalAR)} subValue={`Expenses: ${formatCurrency(totalExpenses)}`}
            icon={<CreditCard className="w-5 h-5" />} iconBg="bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400"
            trend="neutral" trendLabel="Outstanding balances" accentColor="hover:border-purple-500/50" onClick={() => onNavigate('parties')} />
        </div>
      </div>

      {/* Core Analytics: Multi-Series Bar Chart & Double Line Chart paired with Payment Mix & P&L */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SalesBarChart period={period} baseRevenue={todayRevenue} baseCogs={cogsBase} baseExpenses={expBase} formatCurrency={formatCurrency} />
          <RevenueExpenseLineChart period={period} baseRevenue={todayRevenue} baseExpenses={expBase} formatCurrency={formatCurrency} />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <DonutChart
            title="Payment Method Breakdown"
            subtitle="Channel distribution"
            segments={[
              { label: 'Cash',       value: Math.round(revenue * 0.58), color: '#22c55e' },
              { label: 'Mobile Money',value: Math.round(revenue * 0.24), color: '#3b82f6' },
              { label: 'Card',        value: Math.round(revenue * 0.12), color: '#a855f7' },
              { label: 'Credit',      value: Math.round(revenue * 0.06), color: '#f59e0b' },
            ]}
            formatValue={v => formatCurrency(v)}
            centerLabel="Total"
            centerValue={formatCurrency(revenue)}
          />
          <FinancialSummaryWidget period={period} baseRevenue={todayRevenue} baseCogs={cogsBase} baseExpenses={expBase} totalAR={totalAR} totalAP={totalAP} totalLoans={totalLoans} formatCurrency={formatCurrency} />
        </div>
      </div>

      {/* Operational & Risk Command Center (3-card balanced triad) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StockOverviewWidget products={products} onNavigate={onNavigate} formatCurrency={formatCurrency} />
        <PurchasePipelineWidget purchaseOrders={purchaseOrders} onNavigate={onNavigate} formatCurrency={formatCurrency} />
        <ApprovalQueueWidget approvals={approvals} onApprove={approveRequest} onReject={rejectRequest} formatCurrency={formatCurrency} />
      </div>

      {/* Financial Command KPIs */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Financial Command</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Gross Revenue',    value: revenue,       sub: 'Total sales',       color: 'text-emerald-600 dark:text-emerald-400', bg: 'from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-950/10', border: 'border-emerald-200 dark:border-emerald-800' },
            { label: 'Supplier Payables',value: totalAP,       sub: 'Outstanding AP',    color: 'text-rose-600 dark:text-rose-400',       bg: 'from-rose-50 to-rose-100/50 dark:from-rose-950/30 dark:to-rose-950/10', border: 'border-rose-200 dark:border-rose-800' },
            { label: 'Customer Receivables',value: totalAR,    sub: 'Outstanding AR',    color: 'text-blue-600 dark:text-blue-400',       bg: 'from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-950/10', border: 'border-blue-200 dark:border-blue-800' },
            { label: 'Active Loan Balance',value: totalLoans,  sub: `${loans.length} loans`,color:'text-purple-600 dark:text-purple-400', bg: 'from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-950/10', border: 'border-purple-200 dark:border-purple-800' },
          ].map((item, i) => (
            <div key={i} className={`bg-gradient-to-br ${item.bg} rounded-xl border ${item.border} p-4`}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{item.label}</p>
              <p className={`text-xl font-extrabold mt-1.5 ${item.color}`}>{formatCurrency(item.value)}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* System Health + Expiry Risk & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SystemHealthWidget activeUserCount={activeUsers} failedLoginCount={failedLogins} lastBackup="2h ago" onNavigate={onNavigate} />
        </div>
        <div className="lg:col-span-1">
          <ExpiryRiskWidget batches={batches} onNavigate={onNavigate} />
        </div>
        <div className="lg:col-span-1">
          <RecommendationsPanel recommendations={recommendations} title="System Recommendations" />
        </div>
      </div>

      {/* User & Audit Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User activity */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Staff Accounts</h3>
            <button onClick={() => onNavigate('administration')} className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold hover:underline">Manage →</button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {staffAccounts.slice(0, 6).map(u => (
              <div key={u.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-clinical-500 flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0">
                  {u.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{u.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{u.role}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${u.active ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  {u.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent audit events */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Recent Audit Events</h3>
            <button onClick={() => onNavigate('audit')} className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold hover:underline">Full log →</button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {auditLogs.slice(0, 6).map((log, i) => (
              <div key={i} className="px-4 py-3 flex items-start gap-3">
                <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{log.action}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{log.actorName} · {log.module}</p>
                </div>
                <p className="text-[10px] text-slate-400 flex-shrink-0">{log.timestamp?.slice(11, 16) ?? '--'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Medicine Inventory — Full Overview</h3>
          <button onClick={() => onNavigate('catalogue')} className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline">View catalogue →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-4 py-3">Medicine</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Sell Price</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Margin</th>
                <th className="px-4 py-3">Stock Value</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {products.slice(0, 10).map(p => {
                const margin = p.unitCost > 0 ? (((p.sellingPrice - p.unitCost) / p.sellingPrice) * 100) : 0;
                const stockVal = p.availableQuantity * p.unitCost;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{p.brandName}</p>
                      <p className="text-[10px] text-slate-500">{p.genericName} · {p.strength}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.categoryName}</td>
                    <td className="px-4 py-3 font-semibold">{p.availableQuantity.toLocaleString()}</td>
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
                    <td className="px-4 py-3 font-bold text-blue-700 dark:text-blue-400">{formatCurrency(stockVal)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'IN_STOCK' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        p.status === 'LOW_STOCK'? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
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
    </div>
  );
};
