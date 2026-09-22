import React, { useState } from 'react';
import { ShoppingCart, FileText, Truck, AlertTriangle } from 'lucide-react';
import { usePharmacy } from '../../../context/PharmacyContext';
import { DashboardFilterBar, FilterPeriod } from '../widgets/DashboardFilterBar';
import { KpiCard } from '../widgets/KpiCard';
import { PurchasePipelineWidget } from '../widgets/PurchasePipelineWidget';
import { RecommendationsPanel } from '../widgets/RecommendationCard';

interface ProcurementDashboardProps { onNavigate: (tab: string) => void }

export const ProcurementDashboard: React.FC<ProcurementDashboardProps> = ({ onNavigate }) => {
  const [period, setPeriod] = useState<FilterPeriod>('today');
  const { purchaseOrders, suppliers, products, currentUser, formatCurrency } = usePharmacy();

  const openRequests  = purchaseOrders.filter(p => p.status === 'DRAFT').length;
  const activeOrders  = purchaseOrders.filter(p => ['SUBMITTED','APPROVED'].includes(p.status)).length;
  const awaiting      = purchaseOrders.filter(p => p.status === 'APPROVED').length;
  const reorderAlerts = products.filter(p => p.availableQuantity <= p.reorderLevel).length;
  const totalAP       = suppliers.reduce((a, s) => a + (s.outstandingBalance ?? 0), 0);

  const reorderProducts = products
    .filter(p => p.availableQuantity <= p.reorderLevel)
    .sort((a, b) => a.availableQuantity - b.availableQuantity)
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col gap-4 bg-gradient-to-r from-cyan-700 via-blue-600 to-cyan-700 rounded-2xl p-6 text-white shadow-lg shadow-cyan-800/10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-wider">Procurement Control</span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2">Welcome, {currentUser.name}</h1>
            <p className="text-xs text-cyan-200 mt-1">Purchase requests · Orders · Supplier management · Price comparison</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => onNavigate('purchasing')} className="flex items-center gap-2 bg-white text-cyan-800 hover:bg-cyan-50 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all hover:scale-105">
              <ShoppingCart className="w-4 h-4" />New Purchase Request
            </button>
            <button onClick={() => onNavigate('parties')} className="flex items-center gap-2 bg-cyan-800/60 text-white px-3.5 py-2.5 rounded-xl font-semibold text-xs border border-white/20 transition">
              <FileText className="w-4 h-4" />Supplier Directory
            </button>
          </div>
        </div>
        <DashboardFilterBar period={period} onChange={setPeriod} className="mt-1" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Open Requests" value={`${openRequests} Drafts`} subValue="Purchase requests in draft"
          icon={<FileText className="w-5 h-5" />} iconBg="bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400"
          trend="neutral" trendLabel="Pending submission" accentColor="hover:border-cyan-500/50" onClick={() => onNavigate('purchasing')} />
        <KpiCard title="Active Orders" value={`${activeOrders} POs`} subValue="Submitted & approved orders"
          icon={<ShoppingCart className="w-5 h-5" />} iconBg="bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
          trend="neutral" trendLabel="In active pipeline" accentColor="hover:border-blue-500/50" onClick={() => onNavigate('purchasing')} />
        <KpiCard title="Awaiting Delivery" value={`${awaiting} POs`} subValue="Approved, pending dock receipt"
          icon={<Truck className="w-5 h-5" />} iconBg="bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400"
          trend={awaiting > 2 ? 'down' : 'neutral'} trendLabel="Follow up needed" accentColor="hover:border-purple-500/50" />
        <KpiCard title="Reorder Alerts" value={`${reorderAlerts} Products`} subValue="Stock below minimum threshold"
          icon={<AlertTriangle className="w-5 h-5" />} iconBg="bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"
          trend={reorderAlerts > 3 ? 'down' : 'neutral'} trendLabel="Order recommended" accentColor="hover:border-amber-500/50" onClick={() => onNavigate('inventory')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PurchasePipelineWidget purchaseOrders={purchaseOrders} onNavigate={onNavigate} formatCurrency={formatCurrency} />

        {/* Reorder recommendations */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Reorder Recommendations</h3>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">{reorderAlerts} products</span>
          </div>
          {reorderProducts.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">All products adequately stocked.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {reorderProducts.map(p => (
                <div key={p.id} className="px-4 py-3.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{p.brandName}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{p.genericName} · Reorder at {p.reorderLevel} units</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xs font-extrabold ${p.availableQuantity === 0 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {p.availableQuantity} in stock
                    </p>
                    <p className="text-[10px] text-slate-400">Suggest: {p.maxStockLevel - p.availableQuantity} units</p>
                  </div>
                  <button onClick={() => onNavigate('purchasing')} className="flex-shrink-0 px-3 py-1.5 bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 rounded-lg text-[11px] font-bold hover:bg-cyan-200 transition">Order</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Supplier balances */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Supplier Activity</h3>
          <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400">AP: {formatCurrency(totalAP)}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Terms</th>
                <th className="px-4 py-3">Outstanding AP</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {suppliers.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-[10px] font-extrabold flex-shrink-0">{s.name.charAt(0)}</div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{s.name}</p>
                        <p className="text-[10px] text-slate-400">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{s.paymentTermsDays} days</td>
                  <td className="px-4 py-3 font-bold">
                    <span className={`${(s.outstandingBalance ?? 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {formatCurrency(s.outstandingBalance ?? 0)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <RecommendationsPanel recommendations={[
        ...(reorderAlerts > 0 ? [{ type: 'warning' as const, title: `${reorderAlerts} products need reordering`, description: 'Create purchase requests to prevent stockouts before they impact sales.', actionLabel: 'New PO', onAction: () => onNavigate('purchasing') }] : []),
        ...(totalAP > 0 ? [{ type: 'info' as const, title: `${formatCurrency(totalAP)} outstanding to suppliers`, description: 'Review supplier payables ageing to avoid disrupting supply relationships.', actionLabel: 'Finance', onAction: () => onNavigate('finance') }] : []),
        { type: 'neutral', title: 'Compare supplier prices', description: 'Use price comparison for last 3 purchases to identify savings opportunities.', actionLabel: 'Suppliers', onAction: () => onNavigate('parties') },
      ]} />
    </div>
  );
};
