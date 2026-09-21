import React from 'react';
import { Package, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Product } from '../../../types';

interface StockOverviewWidgetProps {
  products: Product[];
  onNavigate: (tab: string) => void;
  formatCurrency: (n: number) => string;
}

export const StockOverviewWidget: React.FC<StockOverviewWidgetProps> = ({
  products, onNavigate, formatCurrency,
}) => {
  const inStock    = products.filter(p => p.status === 'IN_STOCK').length;
  const lowStock   = products.filter(p => p.status === 'LOW_STOCK').length;
  const outOfStock = products.filter(p => p.status === 'OUT_OF_STOCK').length;
  const totalVal   = products.reduce((a, p) => a + p.availableQuantity * p.unitCost, 0);

  const critical = products
    .filter(p => p.status === 'LOW_STOCK' || p.status === 'OUT_OF_STOCK')
    .sort((a, b) => a.availableQuantity - b.availableQuantity)
    .slice(0, 5);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Stock Overview</h3>
        <button onClick={() => onNavigate('inventory')} className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold hover:underline">
          Full ledger →
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800">
        {[
          { label: 'In Stock',    value: inStock,    color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
          { label: 'Low Stock',   value: lowStock,   color: 'text-amber-600 dark:text-amber-400',    bg: 'bg-amber-50 dark:bg-amber-950/30' },
          { label: 'Out of Stock',value: outOfStock, color: 'text-rose-600 dark:text-rose-400',      bg: 'bg-rose-50 dark:bg-rose-950/30' },
          { label: 'Stock Value', value: formatCurrency(totalVal), color: 'text-blue-600 dark:text-blue-400', bg: '' },
        ].map((item, i) => (
          <div key={i} className={`px-3 py-3 text-center ${item.bg}`}>
            <p className={`text-base font-extrabold ${item.color}`}>{item.value}</p>
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 leading-tight">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Critical products */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {critical.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-7 h-7 mx-auto mb-1.5 text-emerald-400" />
            All products adequately stocked.
          </div>
        ) : (
          critical.map(p => (
            <div key={p.id} className="px-4 py-3 flex items-center gap-3">
              <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                p.status === 'OUT_OF_STOCK'
                  ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                  : 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
              }`}>
                {p.status === 'OUT_OF_STOCK' ? <AlertTriangle className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{p.brandName}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{p.genericName} · {p.strength}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">{p.availableQuantity} units</p>
                <p className="text-[10px] text-slate-400">Reorder: {p.reorderLevel}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
