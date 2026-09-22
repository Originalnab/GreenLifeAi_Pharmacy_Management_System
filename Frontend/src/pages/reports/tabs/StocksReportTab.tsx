import React, { useMemo } from 'react';
import { 
  Boxes, AlertTriangle, Clock, ShieldAlert, CheckCircle2, 
  Layers, ArrowRightLeft, TrendingDown, MapPin, Archive
} from 'lucide-react';
import { usePharmacy } from '../../../context/PharmacyContext';
import { ReportFilterState } from '../components/ReportFilterBar';
import { Pagination } from '../../../components/common/Pagination';
import { usePagination } from '../../../hooks/usePagination';

export const StocksReportTab: React.FC<{ filterState: ReportFilterState }> = ({ filterState }) => {
  const { batches, products, formatCurrency } = usePharmacy();
  const now = new Date();

  // Process and augment batches with expiry metrics
  const processedBatches = useMemo(() => {
    return batches.map(batch => {
      const product = products.find(p => p.id === batch.productId);
      const expiry = new Date(batch.expiryDate);
      const diffTime = expiry.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const qty = batch.remainingStock ?? batch.quantityOnHand ?? 0;
      const unitCost = batch.costPrice ?? batch.unitCost ?? product?.unitCost ?? 0;
      const totalVal = qty * unitCost;

      let riskCategory: 'EXPIRED' | 'CRITICAL_90' | 'WARNING_180' | 'HEALTHY' = 'HEALTHY';
      if (diffDays <= 0) riskCategory = 'EXPIRED';
      else if (diffDays <= 90) riskCategory = 'CRITICAL_90';
      else if (diffDays <= 180) riskCategory = 'WARNING_180';

      return {
        ...batch,
        product,
        daysToExpiry: diffDays,
        riskCategory,
        totalVal,
        unitCost
      };
    });
  }, [batches, products]);

  // Filter batches
  const filteredBatches = useMemo(() => {
    return processedBatches.filter(batch => {
      if (filterState.searchQuery.trim()) {
        const q = filterState.searchQuery.toLowerCase();
        const matchBatch = batch.batchNumber?.toLowerCase().includes(q);
        const matchProduct = batch.productName?.toLowerCase().includes(q) || batch.product?.genericName?.toLowerCase().includes(q);
        const matchSupplier = batch.supplierName?.toLowerCase().includes(q);
        const matchLoc = batch.storageLocation?.toLowerCase().includes(q);
        if (!matchBatch && !matchProduct && !matchSupplier && !matchLoc) return false;
      }

      if (filterState.secondaryFilter && filterState.secondaryFilter !== 'ALL') {
        if (filterState.secondaryFilter === 'EXPIRED' && batch.riskCategory !== 'EXPIRED') return false;
        if (filterState.secondaryFilter === 'CRITICAL_90' && batch.riskCategory !== 'CRITICAL_90') return false;
        if (filterState.secondaryFilter === 'WARNING_180' && batch.riskCategory !== 'WARNING_180') return false;
        if (filterState.secondaryFilter === 'HEALTHY' && batch.riskCategory !== 'HEALTHY') return false;
        if (filterState.secondaryFilter === 'QUARANTINED' && batch.status !== 'QUARANTINED') return false;
      }

      return true;
    });
  }, [processedBatches, filterState.searchQuery, filterState.secondaryFilter]);

  const {
    currentPage,
    setCurrentPage,
    paginatedItems: paginatedBatches
  } = usePagination(filteredBatches, 10, [filterState]);

  // Expiry Risk Counts & Capital at Risk
  const expiredCount = processedBatches.filter(b => b.riskCategory === 'EXPIRED').length;
  const expiredCapital = processedBatches.filter(b => b.riskCategory === 'EXPIRED').reduce((acc, b) => acc + b.totalVal, 0);

  const critical90Count = processedBatches.filter(b => b.riskCategory === 'CRITICAL_90').length;
  const critical90Capital = processedBatches.filter(b => b.riskCategory === 'CRITICAL_90').reduce((acc, b) => acc + b.totalVal, 0);

  const warning180Count = processedBatches.filter(b => b.riskCategory === 'WARNING_180').length;
  const warning180Capital = processedBatches.filter(b => b.riskCategory === 'WARNING_180').reduce((acc, b) => acc + b.totalVal, 0);

  const healthyCount = processedBatches.filter(b => b.riskCategory === 'HEALTHY').length;
  const healthyCapital = processedBatches.filter(b => b.riskCategory === 'HEALTHY').reduce((acc, b) => acc + b.totalVal, 0);

  return (
    <div className="space-y-6">
      {/* SUMMARY VIEW */}
      {filterState.viewMode === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Risk KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/20 border border-red-200 dark:border-red-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-red-700 dark:text-red-300 uppercase tracking-wider">
                <span>Expired Batches</span>
                <ShieldAlert className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-red-900 dark:text-red-200 tracking-tight">
                {expiredCount} <span className="text-xs font-normal text-red-600">({formatCurrency(expiredCapital)})</span>
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 font-semibold">Immediate quarantine & disposal</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                <span>Critical (&lt; 90 Days)</span>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-amber-900 dark:text-amber-200 tracking-tight">
                {critical90Count} <span className="text-xs font-normal text-amber-600">({formatCurrency(critical90Capital)})</span>
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold">FEFO priority dispensing needed</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/40 dark:to-amber-950/20 border border-yellow-200 dark:border-yellow-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-yellow-700 dark:text-yellow-300 uppercase tracking-wider">
                <span>Impending (90-180 Days)</span>
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-yellow-900 dark:text-yellow-200 tracking-tight">
                {warning180Count} <span className="text-xs font-normal text-yellow-600">({formatCurrency(warning180Capital)})</span>
              </p>
              <p className="text-xs text-slate-500 font-medium">Monitor movement velocity</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                <span>Healthy Stock (&gt; 180 Days)</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-emerald-900 dark:text-emerald-200 tracking-tight">
                {healthyCount} <span className="text-xs font-normal text-emerald-600">({formatCurrency(healthyCapital)})</span>
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">Optimal shelf-life runway</p>
            </div>
          </div>

          {/* Expiry Risk Distribution Breakdown */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Boxes className="w-5 h-5 text-brand-600" />
              Physical Batch Expiry Health & Capital Exposure
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-emerald-700 dark:text-emerald-400">Healthy Shelf Life (&gt; 180 Days)</span>
                  <span className="text-slate-900 dark:text-white">{healthyCount} Batches • {formatCurrency(healthyCapital)}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${batches.length > 0 ? (healthyCount / batches.length) * 100 : 0}%` }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-yellow-700 dark:text-yellow-400">Impending Expiry (90 - 180 Days)</span>
                  <span className="text-slate-900 dark:text-white">{warning180Count} Batches • {formatCurrency(warning180Capital)}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${batches.length > 0 ? (warning180Count / batches.length) * 100 : 0}%` }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-amber-700 dark:text-amber-400">Critical Risk (&lt; 90 Days)</span>
                  <span className="text-slate-900 dark:text-white">{critical90Count} Batches • {formatCurrency(critical90Capital)}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${batches.length > 0 ? (critical90Count / batches.length) * 100 : 0}%` }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-rose-700 dark:text-rose-400">Expired Batches</span>
                  <span className="text-slate-900 dark:text-white">{expiredCount} Batches • {formatCurrency(expiredCapital)}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${batches.length > 0 ? (expiredCount / batches.length) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED LEDGER VIEW */}
      {filterState.viewMode === 'detailed' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-200">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Physical Batch Inventory Register</h3>
              <p className="text-xs text-slate-500">FEFO tracking, expiry deadlines, and storage locations</p>
            </div>
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 px-2.5 py-1 rounded-full border border-brand-200 dark:border-brand-800">
              {filteredBatches.length} Physical Batches
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Batch #</th>
                  <th className="p-3.5">Product Name</th>
                  <th className="p-3.5">Expiry Date</th>
                  <th className="p-3.5 text-center">Days Remaining</th>
                  <th className="p-3.5 text-center">Remaining Stock</th>
                  <th className="p-3.5 text-right">Unit Cost</th>
                  <th className="p-3.5 text-right">Batch Cost Value</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5 text-center">Risk Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No batch inventory records match your criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedBatches.map(batch => (
                    <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                        {batch.batchNumber}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{batch.productName}</div>
                        <div className="text-[11px] text-slate-500">Supplier: {batch.supplierName || 'Primary Distributor'}</div>
                      </td>
                      <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">
                        {new Date(batch.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 text-center font-bold">
                        <span className={
                          batch.daysToExpiry <= 0 ? 'text-rose-600 dark:text-rose-400' :
                          batch.daysToExpiry <= 90 ? 'text-amber-600 dark:text-amber-400' :
                          batch.daysToExpiry <= 180 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-emerald-600 dark:text-emerald-400'
                        }>
                          {batch.daysToExpiry <= 0 ? 'EXPIRED' : `${batch.daysToExpiry}d`}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-900 dark:text-white">
                        {(batch.remainingStock ?? batch.quantityOnHand ?? 0).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right text-slate-600 dark:text-slate-300">
                        {formatCurrency(batch.unitCost)}
                      </td>
                      <td className="p-3.5 text-right font-black text-slate-900 dark:text-white">
                        {formatCurrency(batch.totalVal)}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{batch.storageLocation || 'Main Shelf'}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          batch.riskCategory === 'EXPIRED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' :
                          batch.riskCategory === 'CRITICAL_90' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                          batch.riskCategory === 'WARNING_180' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300' :
                          'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}>
                          {batch.riskCategory.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredBatches.length}
            pageSize={10}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};
