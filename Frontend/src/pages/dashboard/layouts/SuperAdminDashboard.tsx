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
import { DonutChart } from '../widgets/DonutChart';
import { ApprovalQueueWidget } from '../widgets/ApprovalQueueWidget';
import { ExpiryRiskWidget } from '../widgets/ExpiryRiskWidget';
import { FinancialSummaryWidget } from '../widgets/FinancialSummaryWidget';
import { RecommendationsPanel, Recommendation } from '../widgets/RecommendationCard';
import { PurchasePipelineWidget } from '../widgets/PurchasePipelineWidget';
import { StockOverviewWidget } from '../widgets/StockOverviewWidget';
import { SystemHealthWidget } from '../widgets/SystemHealthWidget';

interface SuperAdminDashboardProps { onNavigate: (tab: string) => void }

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onNavigate }) => {
  const [period, setPeriod] = useState<FilterPeriod>('today');
  const {
    sales, products, batches, activeShift, approvals, customers,
    suppliers, purchaseOrders, expenses, loans, users, auditLogs,
    approveRequest, rejectRequest, currentUser, formatCurrency,
  } = usePharmacy();

  const m = PERIOD_META[period].multiplier;
  const todayRevenue  = sales.reduce((a, s) => a + s.total, 0);
  const revenue       = todayRevenue * m;
  const cogsBase      = todayRevenue * 0.6;
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
  const activeUsers   = users.filter(u => u.active).length;
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
            <p className="text-xs text-slate-400 mt-1">Full system + operational + financial visibility · Installation v1.0.0</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => onNavigate('administration')} className="flex items-center gap-2 bg-white text-slate-800 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all hover:scale-105 active:scale-95">
              <Users className="w-4 h-4" />Manage Users
            </button>
            <button onClick={() => onNavigate('audit')} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3.5 py-2.5 rounded-xl font-semibold text-xs border border-slate-600 transition">
              <Activity className="w-4 h-4" />Audit Log
            </button>
            <button onClick={() => onNavigate('settings')} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3.5 py-2.5 rounded-xl font-semibold text-xs border border-slate-600 transition">
              <Settings className="w-4 h-4" />System Settings
            </button>
          </div>
        </div>
        <DashboardFilterBar period={period} onChange={setPeriod} className="opacity-80" />
      </div>

      {/* System Vitals Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard title="System Status" value="Operational" subValue="All services healthy"
          icon={<Database className="w-4 h-4" />} iconBg="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
          trend="up" trendLabel="100% uptime" badge="LIVE" badgeColor="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300"
          accentColor="hover:border-emerald-500/50" />
        <KpiCard title="Last Backup" value="2h ago" subValue="Sept 20, 22:15"
          icon={<Shield className="w-4 h-4" />} iconBg="bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
          trend="neutral" trendLabel="Safe & verified" badge="✓ Safe" badgeColor="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
          accentColor="hover:border-blue-500/50" onClick={() => onNavigate('settings')} />
        <KpiCard title="Active Users" value={`${activeUsers} Staff`} subValue={`${users.length} total accounts`}
          icon={<Users className="w-4 h-4" />} iconBg="bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400"
          trend="neutral" trendLabel="All roles assigned" accentColor="hover:border-purple-500/50" onClick={() => onNavigate('administration')} />
        <KpiCard title="Security Events" value={`${failedLogins} Failed Logins`} subValue="Last 24 hours"
          icon={<Activity className="w-4 h-4" />} iconBg={failedLogins >= 5 ? "bg-rose-100 dark:bg-rose-950/50 text-rose-600" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}
          trend={failedLogins >= 5 ? 'down' : 'neutral'} trendLabel={failedLogins >= 5 ? 'Review now' : 'No anomalies'}
          accentColor="hover:border-rose-500/50" onClick={() => onNavigate('audit')} />
      </div>

      {/* Operational KPIs */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Operational Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard title="Revenue" value={formatCurrency(revenue)} subValue={`${txCount} transactions`}
            icon={<TrendingUp className="w-4 h-4" />} iconBg="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
            trend="up" trendLabel={`GP: ${formatCurrency(grossProfit)}`} accentColor="hover:border-emerald-500/50"
            sparkData={sparkRevenue} onClick={() => onNavigate('sales')} />
          <KpiCard title="Transactions" value={txCount.toLocaleString()} subValue="Completed sales"
            icon={<FileText className="w-4 h-4" />} iconBg="bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
            trend="up" trendLabel="vs prior period" accentColor="hover:border-blue-500/50" />
          <KpiCard title="Low / Out of Stock" value={`${lowStockCount} Products`}
            icon={<Package className="w-4 h-4" />} iconBg="bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"
            trend={lowStockCount > 5 ? 'down' : 'neutral'} trendLabel="Reorder needed" accentColor="hover:border-amber-500/50" onClick={() => onNavigate('inventory')} />
          <KpiCard title="Expiring Batches" value={`${expCount}`} subValue="Within 60 days"
            icon={<Clock className="w-4 h-4" />} iconBg="bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
            trend={expCount > 3 ? 'down' : 'neutral'} trendLabel="At risk" accentColor="hover:border-rose-500/50" onClick={() => onNavigate('inventory')} />
          <KpiCard title="Customer AR" value={formatCurrency(totalAR)}
            icon={<CreditCard className="w-4 h-4" />} iconBg="bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400"
            trend="neutral" trendLabel="Outstanding" accentColor="hover:border-purple-500/50" onClick={() => onNavigate('parties')} />
          <KpiCard title="Expenses" value={formatCurrency(totalExpenses)}
            icon={<Banknote className="w-4 h-4" />} iconBg="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            trend="neutral" trendLabel="This period" accentColor="hover:border-slate-400/50" onClick={() => onNavigate('finance')} />
        </div>
      </div>

      {/* Revenue Chart */}
      <SalesBarChart period={period} baseRevenue={todayRevenue} baseCogs={cogsBase} baseExpenses={expBase} formatCurrency={formatCurrency} />

      {/* Main analytics grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <DonutChart
            title="Revenue by Payment Method"
            subtitle="All payment channels"
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
          <SystemHealthWidget activeUserCount={activeUsers} failedLoginCount={failedLogins} lastBackup="2h ago" onNavigate={onNavigate} />
        </div>

        <div className="lg:col-span-1 space-y-6">
          <PurchasePipelineWidget purchaseOrders={purchaseOrders} onNavigate={onNavigate} formatCurrency={formatCurrency} />
          <StockOverviewWidget products={products} onNavigate={onNavigate} formatCurrency={formatCurrency} />
        </div>

        <div className="lg:col-span-1 space-y-6">
          <ApprovalQueueWidget approvals={approvals} onApprove={approveRequest} onReject={rejectRequest} formatCurrency={formatCurrency} />
          <FinancialSummaryWidget period={period} baseRevenue={todayRevenue} baseCogs={cogsBase} baseExpenses={expBase} totalAR={totalAR} totalAP={totalAP} totalLoans={totalLoans} formatCurrency={formatCurrency} />
        </div>
      </div>

      {/* Financial Command Row */}
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

      {/* Expiry + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpiryRiskWidget batches={batches} onNavigate={onNavigate} />
        <RecommendationsPanel recommendations={recommendations} title="System Recommendations" />
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
            {users.slice(0, 6).map(u => (
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
