import React, { useState } from 'react';
import { Package, Clock, Truck, RotateCcw } from 'lucide-react';
import { usePharmacy } from '../../../context/PharmacyContext';
import { DashboardFilterBar, FilterPeriod } from '../widgets/DashboardFilterBar';
import { KpiCard } from '../widgets/KpiCard';
import { ExpiryRiskWidget } from '../widgets/ExpiryRiskWidget';
import { StockOverviewWidget } from '../widgets/StockOverviewWidget';
import { RecommendationsPanel } from '../widgets/RecommendationCard';

interface StockOfficerDashboardProps { onNavigate: (tab: string) => void }

export const StockOfficerDashboard: React.FC<StockOfficerDashboardProps> = ({ onNavigate }) => {
  const [period, setPeriod] = useState<FilterPeriod>('today');
  const { products, batches, purchaseOrders, stockMovements, currentUser, formatCurrency } = usePharmacy();

  const lowStock  = products.filter(p => p.status !== 'IN_STOCK').length;
  const expCount  = batches.filter(b => { const d = (new Date(b.expiryDate).getTime() - new Date('2026-09-20').getTime()) / 86400000; return d > 0 && d <= 60; }).length;
  const awaitRec  = purchaseOrders.filter(po => po.status === 'APPROVED').length;
  const countsP   = 2; // mock stock counts pending

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col gap-4 bg-gradient-to-r from-indigo-700 via-slate-700 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-indigo-800/10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-wider">Stock Control</span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2">Welcome, {currentUser.name}</h1>
            <p className="text-xs text-indigo-200 mt-1">Receiving · Batch management · Expiry control · Stock counts</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => onNavigate('purchasing')} className="flex items-center gap-2 bg-white text-indigo-800 hover:bg-indigo-50 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all hover:scale-105">
              <Truck className="w-4 h-4" />Record Receiving
            </button>
            <button onClick={() => onNavigate('inventory')} className="flex items-center gap-2 bg-indigo-800/60 text-white px-3.5 py-2.5 rounded-xl font-semibold text-xs border border-white/20 transition">
              <RotateCcw className="w-4 h-4" />Stock Count
            </button>
          </div>
        </div>
        <DashboardFilterBar period={period} onChange={setPeriod} className="mt-1" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Low / Out of Stock" value={`${lowStock} Products`} subValue="Below safety reorder level"
          icon={<Package className="w-5 h-5" />} iconBg="bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"
          trend={lowStock > 3 ? 'down' : 'neutral'} trendLabel="Reorder needed" accentColor="hover:border-amber-500/50" onClick={() => onNavigate('inventory')} />
        <KpiCard title="Expiring < 60 Days" value={`${expCount} Batches`} subValue="Critical FEFO risk window"
          icon={<Clock className="w-5 h-5" />} iconBg="bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
          trend={expCount > 2 ? 'down' : 'neutral'} trendLabel="Quarantine review" accentColor="hover:border-rose-500/50" onClick={() => onNavigate('inventory')} />
        <KpiCard title="Awaiting Receiving" value={`${awaitRec} POs`} subValue="Approved, pending intake"
          icon={<Truck className="w-5 h-5" />} iconBg="bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
          trend={awaitRec > 0 ? 'down' : 'neutral'} trendLabel="Pending dock intake" accentColor="hover:border-blue-500/50" onClick={() => onNavigate('purchasing')} />
        <KpiCard title="Stock Counts Pending" value={`${countsP} Counts`} subValue="Scheduled cycle counts"
          icon={<RotateCcw className="w-5 h-5" />} iconBg="bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400"
          trend="neutral" trendLabel="Schedule due" accentColor="hover:border-purple-500/50" onClick={() => onNavigate('inventory')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpiryRiskWidget batches={batches} onNavigate={onNavigate} />

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">POs Ready to Receive</h3>
            <button onClick={() => onNavigate('purchasing')} className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold hover:underline">View all →</button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {purchaseOrders.filter(po => po.status === 'APPROVED').slice(0, 5).map(po => {
              const total = po.items.reduce((a, i) => a + i.totalCost, 0);
              return (
                <div key={po.id} className="px-4 py-3.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{po.poNumber}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{po.supplierName} · {po.items.length} items</p>
                  </div>
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white">{formatCurrency(total)}</p>
                  <button onClick={() => onNavigate('purchasing')} className="flex-shrink-0 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-[11px] font-bold hover:bg-indigo-200 transition">Receive</button>
                </div>
              );
            })}
            {purchaseOrders.filter(po => po.status === 'APPROVED').length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">No POs awaiting receiving.</div>
            )}
          </div>
        </div>
      </div>

      <StockOverviewWidget products={products} onNavigate={onNavigate} formatCurrency={formatCurrency} />

      {/* Recent stock movements */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Recent Stock Movements</h3>
          <button onClick={() => onNavigate('inventory')} className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold hover:underline">View ledger →</button>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {stockMovements.slice(0, 6).map((mv, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <div className={`px-2 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ${
                mv.movementType === 'PURCHASE_RECEIVE' || mv.movementType === 'RETURN_IN'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
              }`}>
                {mv.movementType === 'PURCHASE_RECEIVE' || mv.movementType === 'RETURN_IN' ? '+ IN' : '− OUT'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{mv.productName}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{mv.movementType.replace(/_/g,' ')} · Batch {mv.batchNumber}</p>
              </div>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white flex-shrink-0">{Math.abs(mv.quantity)} units</p>
            </div>
          ))}
        </div>
      </div>

      <RecommendationsPanel recommendations={[
        ...(expCount > 0 ? [{ type: 'critical' as const, title: `${expCount} batches expiring within 60 days`, description: 'Process quarantine or return workflows before medicines become unsaleable.', actionLabel: 'Expiry Queue', onAction: () => onNavigate('inventory') }] : []),
        ...(awaitRec > 0 ? [{ type: 'info' as const, title: `${awaitRec} purchase orders ready to receive`, description: 'Complete goods receiving to update stock balances and close open POs.', actionLabel: 'Receiving', onAction: () => onNavigate('purchasing') }] : []),
        { type: 'neutral', title: 'Schedule routine stock count', description: 'Regular physical counts prevent variance buildup and detect discrepancies early.', },
      ]} />
    </div>
  );
};
