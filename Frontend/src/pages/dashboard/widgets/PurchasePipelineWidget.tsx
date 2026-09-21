import React from 'react';
import { ShoppingCart, Clock, CheckCircle2, Truck, AlertCircle } from 'lucide-react';
import { PurchaseOrder } from '../../../types';

interface PurchasePipelineWidgetProps {
  purchaseOrders: PurchaseOrder[];
  onNavigate: (tab: string) => void;
  formatCurrency: (n: number) => string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  DRAFT:     { label: 'Draft',     color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', icon: <Clock className="w-3.5 h-3.5" /> },
  SUBMITTED: { label: 'Submitted', color: 'text-blue-600 dark:text-blue-400',  bg: 'bg-blue-100 dark:bg-blue-950', icon: <ShoppingCart className="w-3.5 h-3.5" /> },
  APPROVED:  { label: 'Approved',  color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  RECEIVED:  { label: 'Received',  color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-950', icon: <Truck className="w-3.5 h-3.5" /> },
  PARTIAL:   { label: 'Partial',   color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-100 dark:bg-amber-950', icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

export const PurchasePipelineWidget: React.FC<PurchasePipelineWidgetProps> = ({
  purchaseOrders, onNavigate, formatCurrency,
}) => {
  const active = purchaseOrders
    .filter(po => po.status !== 'COMPLETED' && po.status !== 'CANCELLED')
    .slice(0, 6);

  // Pipeline counts
  const counts = {
    DRAFT:     purchaseOrders.filter(p => p.status === 'DRAFT').length,
    SUBMITTED: purchaseOrders.filter(p => p.status === 'SUBMITTED').length,
    APPROVED:  purchaseOrders.filter(p => p.status === 'APPROVED').length,
    RECEIVED:  purchaseOrders.filter(p => p.status === 'COMPLETED').length,
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Purchase Pipeline</h3>
        <button onClick={() => onNavigate('purchasing')} className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold hover:underline">
          View all →
        </button>
      </div>

      {/* Funnel strip */}
      <div className="grid grid-cols-4 border-b border-slate-100 dark:border-slate-800">
        {(['DRAFT', 'SUBMITTED', 'APPROVED', 'RECEIVED'] as const).map(status => {
          const cfg = STATUS_CONFIG[status];
          return (
            <div key={status} className={`px-3 py-3 text-center border-r border-slate-100 dark:border-slate-800 last:border-r-0 ${cfg.bg}`}>
              <p className={`text-lg font-extrabold ${cfg.color}`}>{counts[status]}</p>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{cfg.label}</p>
            </div>
          );
        })}
      </div>

      {/* Active PO list */}
      {active.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
          No active purchase orders.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {active.map(po => {
            const cfg = STATUS_CONFIG[po.status] ?? STATUS_CONFIG['DRAFT'];
            const total = po.items.reduce((a, i) => a + i.totalCost, 0);
            return (
              <div key={po.id} className="px-4 py-3 flex items-center gap-3">
                <div className={`p-1.5 rounded-lg flex-shrink-0 ${cfg.bg} ${cfg.color}`}>{cfg.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{po.poNumber}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{po.supplierName} · {po.items.length} items</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white">{formatCurrency(total)}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
