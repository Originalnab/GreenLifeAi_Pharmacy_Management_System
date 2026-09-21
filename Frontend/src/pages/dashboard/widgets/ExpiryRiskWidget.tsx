import React from 'react';
import { Clock, AlertTriangle, CheckCircle2, Package } from 'lucide-react';
import { Batch } from '../../../types';

interface ExpiryRiskWidgetProps {
  batches: Batch[];
  onNavigate: (tab: string) => void;
}

const BANDS = [
  { label: 'Expired',       max: 0,  color: 'bg-red-100 dark:bg-red-950/50',    text: 'text-red-700 dark:text-red-300',    dot: 'bg-red-500',    icon: <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> },
  { label: '< 7 Days',      max: 7,  color: 'bg-rose-50 dark:bg-rose-950/30',   text: 'text-rose-700 dark:text-rose-300',  dot: 'bg-rose-500',   icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> },
  { label: '7–30 Days',     max: 30, color: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-300',dot: 'bg-amber-500',  icon: <Clock className="w-3.5 h-3.5 text-amber-500" /> },
  { label: '30–60 Days',    max: 60, color: 'bg-yellow-50 dark:bg-yellow-950/30',text:'text-yellow-700 dark:text-yellow-300',dot:'bg-yellow-500',icon: <Clock className="w-3.5 h-3.5 text-yellow-500" /> },
];

function getDaysToExpiry(expiryDate: string): number {
  const now = new Date('2026-09-20');
  const exp = new Date(expiryDate);
  return Math.floor((exp.getTime() - now.getTime()) / (1000 * 86400));
}

export const ExpiryRiskWidget: React.FC<ExpiryRiskWidgetProps> = ({ batches, onNavigate }) => {
  const riskBatches = batches
    .filter(b => {
      const d = getDaysToExpiry(b.expiryDate);
      return b.status !== 'DISPOSED' && d <= 60;
    })
    .sort((a, b) => getDaysToExpiry(a.expiryDate) - getDaysToExpiry(b.expiryDate))
    .slice(0, 8);

  const getBand = (days: number) => {
    if (days <= 0) return BANDS[0];
    if (days <= 7) return BANDS[1];
    if (days <= 30) return BANDS[2];
    return BANDS[3];
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Expiry Risk Queue</h3>
          {riskBatches.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
              {riskBatches.length} at risk
            </span>
          )}
        </div>
        <button
          onClick={() => onNavigate('inventory')}
          className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold hover:underline"
        >
          View all →
        </button>
      </div>

      {riskBatches.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
          No batches expiring within 60 days.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {riskBatches.map(batch => {
            const days = getDaysToExpiry(batch.expiryDate);
            const band = getBand(days);
            return (
              <div key={batch.id} className={`px-4 py-3 flex items-center gap-3 ${band.color}`}>
                <div className="flex-shrink-0">{band.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{batch.productId}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Batch {batch.batchNumber} · {batch.quantityOnHand} units
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-xs font-extrabold ${band.text}`}>
                    {days <= 0 ? 'EXPIRED' : `${days}d`}
                  </p>
                  <p className="text-[10px] text-slate-400">{batch.expiryDate}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
