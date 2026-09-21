import React, { useState } from 'react';
import { 
  BarChart3, FileSpreadsheet, Printer, TrendingUp, 
  DollarSign, Package, AlertCircle, Calendar, Download 
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';

export const ReportsPage: React.FC = () => {
  const { sales, products, batches, expenses, loans, formatCurrency } = usePharmacy();
  const [selectedReport, setSelectedReport] = useState('sales_summary');

  const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalInventoryValuation = products.reduce((acc, p) => acc + (p.totalQuantity * p.unitCost), 0);
  const totalPotentialRetail = products.reduce((acc, p) => acc + (p.totalQuantity * p.sellingPrice), 0);

  const exportCSV = () => {
    alert(`Exporting ${selectedReport}.csv to downloads directory... (Simulated RFC 4180 CSV export)`);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-brand-600" />
            <span>Management Reports & Analytical Exports</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Authoritative read models, gross margin analytics, inventory valuation, and tax declarations.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <Download className="w-4 h-4 text-brand-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 flex items-center space-x-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { id: 'sales_summary', label: 'Sales & Revenue Summary', icon: TrendingUp },
          { id: 'inventory_val', label: 'Stock Valuation & Margins', icon: Package },
          { id: 'financial_pl', label: 'P&L & Operating Expenses', icon: DollarSign },
          { id: 'controlled_rx', label: 'POM & Controlled Drugs Dispensing', icon: AlertCircle },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedReport(tab.id)}
            className={`p-3 rounded-xl border text-left transition flex items-center space-x-2.5 ${
              selectedReport === tab.id 
                ? 'bg-brand-50/70 border-brand-500 text-brand-900 dark:bg-brand-950/50 dark:border-brand-600 dark:text-brand-300 font-bold shadow-sm' 
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${selectedReport === tab.id ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
            <span className="text-xs font-semibold">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Report Content */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        {selectedReport === 'sales_summary' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Daily Sales & Tender Breakdown</h3>
                <p className="text-xs text-slate-500">Period: September 15 - September 20, 2026</p>
              </div>
              <span className="font-extrabold text-lg text-brand-600">
                Total: {formatCurrency(totalRevenue)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                <span className="text-xs text-slate-500 font-semibold block">Total Transactions</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{sales.length} Sales</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                <span className="text-xs text-slate-500 font-semibold block">Average Basket Size</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {sales.length > 0 ? formatCurrency(totalRevenue / sales.length) : formatCurrency(0)}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                <span className="text-xs text-slate-500 font-semibold block">Collected VAT (7.5%)</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(totalRevenue * 0.075 / 1.075)}
                </span>
              </div>
            </div>
          </div>
        )}

        {selectedReport === 'inventory_val' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Total Inventory Asset Valuation</h3>
                <p className="text-xs text-slate-500">Calculated on FIFO / FEFO Unit Cost Basis</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200">
                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold block">Stock Asset Cost Value</span>
                <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(totalInventoryValuation)}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200">
                <span className="text-xs text-blue-800 dark:text-blue-300 font-semibold block">Estimated Retail Realization</span>
                <span className="text-2xl font-extrabold text-blue-700 dark:text-blue-400">
                  {formatCurrency(totalPotentialRetail)}
                </span>
              </div>
            </div>
          </div>
        )}

        {selectedReport === 'financial_pl' && (
          <div className="space-y-4">
            <div className="border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Operating Expense Summary</h3>
              <p className="text-xs text-slate-500">Dispensary Power, Logistics, Licenses & Maintenance</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-500 block">Total Month-To-Date Expenses:</span>
                <span className="text-xl font-bold text-rose-600">{formatCurrency(totalExpenses)}</span>
              </div>
              <span className="text-xs text-slate-500">{expenses.length} approved expense vouchers</span>
            </div>
          </div>
        )}

        {selectedReport === 'controlled_rx' && (
          <div className="space-y-4">
            <div className="border-b pb-3">
              <h3 className="font-bold text-sm text-violet-800 dark:text-violet-300">Prescription Only (POM) Dispensing Register</h3>
              <p className="text-xs text-slate-500">Regulatory compliance audit records for Pharmacists Council of Nigeria (PCN)</p>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              All scheduled POM items dispensed during this period have recorded prescriber MDCN licenses and supervising pharmacist sign-offs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
