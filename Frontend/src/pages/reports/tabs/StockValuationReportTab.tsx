import React, { useMemo } from 'react';
import { 
  Boxes, DollarSign, TrendingUp, AlertTriangle, ShieldCheck, 
  PackageCheck, Layers, PieChart, ArrowUpRight, BarChart3, 
  Archive
} from 'lucide-react';
import { usePharmacy } from '../../../context/PharmacyContext';
import { ReportFilterState } from '../components/ReportFilterBar';
import { Pagination } from '../../../components/common/Pagination';
import { usePagination } from '../../../hooks/usePagination';

export const StockValuationReportTab: React.FC<{ filterState: ReportFilterState }> = ({ filterState }) => {
  const { products, batches, categories, formatCurrency } = usePharmacy();

  // Aggregate product stock and valuation based on active batches & products
  const reportData = useMemo(() => {
    return products.map(product => {
      const productBatches = batches.filter(b => b.productId === product.id);
      const totalUnits = productBatches.reduce((acc, b) => acc + (b.remainingStock ?? b.quantityOnHand ?? 0), 0);
      
      const totalCostValue = productBatches.reduce((acc, b) => {
        const cost = b.costPrice ?? b.unitCost ?? product.unitCost ?? 0;
        const qty = b.remainingStock ?? b.quantityOnHand ?? 0;
        return acc + (cost * qty);
      }, 0);

      const totalRetailValue = productBatches.reduce((acc, b) => {
        const price = b.sellingPrice ?? product.sellingPrice ?? 0;
        const qty = b.remainingStock ?? b.quantityOnHand ?? 0;
        return acc + (price * qty);
      }, 0);

      const avgUnitCost = totalUnits > 0 ? totalCostValue / totalUnits : product.unitCost;
      const marginAmount = totalRetailValue - totalCostValue;
      const marginPercent = totalRetailValue > 0 ? (marginAmount / totalRetailValue) * 100 : 0;

      return {
        product,
        categoryName: product.categoryName || categories.find(c => c.id === product.categoryId)?.name || 'Uncategorized',
        totalUnits,
        avgUnitCost,
        sellingPrice: product.sellingPrice,
        totalCostValue,
        totalRetailValue,
        marginAmount,
        marginPercent,
        batchCount: productBatches.length,
        status: product.status
      };
    });
  }, [products, batches, categories]);

  // Filtered by search & secondary category filter
  const filteredData = useMemo(() => {
    return reportData.filter(item => {
      if (filterState.searchQuery.trim()) {
        const q = filterState.searchQuery.toLowerCase();
        const matchName = item.product.brandName.toLowerCase().includes(q) || item.product.genericName.toLowerCase().includes(q);
        const matchSku = item.product.sku?.toLowerCase().includes(q) || item.product.barcode?.toLowerCase().includes(q);
        const matchCat = item.categoryName.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchCat) return false;
      }

      if (filterState.secondaryFilter && filterState.secondaryFilter !== 'ALL') {
        if (item.categoryName !== filterState.secondaryFilter && item.product.categoryId !== filterState.secondaryFilter) {
          return false;
        }
      }

      return true;
    });
  }, [reportData, filterState.searchQuery, filterState.secondaryFilter]);

  const {
    currentPage,
    setCurrentPage,
    paginatedItems: paginatedData
  } = usePagination(filteredData, 10, [filterState]);

  // Overall KPIs
  const totalSKUs = filteredData.length;
  const totalStockUnits = filteredData.reduce((acc, i) => acc + i.totalUnits, 0);
  const totalCostValuation = filteredData.reduce((acc, i) => acc + i.totalCostValue, 0);
  const totalRetailValuation = filteredData.reduce((acc, i) => acc + i.totalRetailValue, 0);
  const potentialMargin = totalRetailValuation - totalCostValuation;
  const overallMarginPercent = totalRetailValuation > 0 ? (potentialMargin / totalRetailValuation) * 100 : 0;

  // Category Breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { count: number; units: number; costVal: number; retailVal: number }> = {};
    filteredData.forEach(item => {
      const cat = item.categoryName;
      if (!map[cat]) map[cat] = { count: 0, units: 0, costVal: 0, retailVal: 0 };
      map[cat].count += 1;
      map[cat].units += item.totalUnits;
      map[cat].costVal += item.totalCostValue;
      map[cat].retailVal += item.totalRetailValue;
    });
    return Object.entries(map).sort((a, b) => b[1].costVal - a[1].costVal);
  }, [filteredData]);

  return (
    <div className="space-y-6">
      {/* SUMMARY VIEW */}
      {filterState.viewMode === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/20 border border-indigo-200 dark:border-indigo-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                <span>Total Asset Value (Cost)</span>
                <Boxes className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatCurrency(totalCostValuation)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Calculated across {totalStockUnits.toLocaleString()} total units
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                <span>Total Retail Value</span>
                <DollarSign className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-emerald-900 dark:text-emerald-200 tracking-tight">
                {formatCurrency(totalRetailValuation)}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Potential Gross Revenue</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                <span>Unrealized Margin</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-amber-900 dark:text-amber-200 tracking-tight">
                {formatCurrency(potentialMargin)}
              </p>
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                {overallMarginPercent.toFixed(1)}% Expected Margin
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                <span>Catalogued SKUs</span>
                <PackageCheck className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-purple-900 dark:text-purple-200 tracking-tight">
                {totalSKUs}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {batches.length} Total Physical Batches
              </p>
            </div>
          </div>

          {/* Category-Level Valuation Breakdown */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  Category Asset & Margin Distribution
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Valuation spread and weighted margin contribution across therapeutic categories
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {categoryBreakdown.map(([catName, stats]) => {
                const costShare = totalCostValuation > 0 ? (stats.costVal / totalCostValuation) * 100 : 0;
                const catMargin = stats.retailVal - stats.costVal;
                const catMarginPct = stats.retailVal > 0 ? (catMargin / stats.retailVal) * 100 : 0;

                return (
                  <div key={catName} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 md:w-1/3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{catName}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {stats.count} SKUs • {stats.units.toLocaleString()} Units
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-brand-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.max(2, costShare))}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">{costShare.toFixed(1)}% of total inventory capital</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 md:w-1/2 text-right">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Cost Value</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{formatCurrency(stats.costVal)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Retail Value</span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.retailVal)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Exp. Margin</span>
                        <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                          {catMarginPct.toFixed(1)}% ({formatCurrency(catMargin)})
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* DETAILED LEDGER VIEW */}
      {filterState.viewMode === 'detailed' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-200">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Product Valuation Ledger</h3>
              <p className="text-xs text-slate-500">Itemized stock valuation at cost vs retail price</p>
            </div>
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 px-2.5 py-1 rounded-full border border-brand-200 dark:border-brand-800">
              {filteredData.length} Formulary Items
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Product & Generic</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5 text-center">Available Stock</th>
                  <th className="p-3.5 text-right">Avg Unit Cost</th>
                  <th className="p-3.5 text-right">Selling Price</th>
                  <th className="p-3.5 text-right">Total Cost</th>
                  <th className="p-3.5 text-right">Total Retail</th>
                  <th className="p-3.5 text-right">Margin %</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No inventory records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map(item => (
                    <tr key={item.product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{item.product.brandName}</div>
                        <div className="text-[11px] text-slate-500">{item.product.genericName} • {item.product.strength}</div>
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">{item.categoryName}</td>
                      <td className="p-3.5 text-center font-bold text-slate-900 dark:text-white">
                        {item.totalUnits.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">{item.product.baseUnit}</span>
                      </td>
                      <td className="p-3.5 text-right text-slate-600 dark:text-slate-300">{formatCurrency(item.avgUnitCost)}</td>
                      <td className="p-3.5 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(item.sellingPrice)}</td>
                      <td className="p-3.5 text-right font-bold text-slate-700 dark:text-slate-300">{formatCurrency(item.totalCostValue)}</td>
                      <td className="p-3.5 text-right font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(item.totalRetailValue)}</td>
                      <td className="p-3.5 text-right font-bold text-brand-600 dark:text-brand-400">
                        {item.marginPercent.toFixed(1)}%
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'IN_STOCK' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                          item.status === 'LOW_STOCK' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                          'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}>
                          {item.status.replace('_', ' ')}
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
            totalItems={filteredData.length}
            pageSize={10}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};
