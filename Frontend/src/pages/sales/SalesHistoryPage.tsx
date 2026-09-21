import React, { useState, useRef } from 'react';
import { 
  Receipt, Search, Filter, Printer, Eye, RotateCcw, 
  CheckCircle2, AlertTriangle, X, Download, FileSpreadsheet
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Sale } from '../../types';
import { FloatingBulkActionBar } from '../../components/common/FloatingBulkActionBar';

export const SalesHistoryPage: React.FC = () => {
  const { sales, logAuditEvent, formatCurrency } = usePharmacy();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'REFUNDED'>('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('ALL');
  const [selectedSaleIds, setSelectedSaleIds] = useState<string[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnCondition, setReturnCondition] = useState<'RESELLABLE' | 'DAMAGED'>('RESELLABLE');
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  const filteredSales = sales.filter(s => {
    const matchesSearch = 
      s.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.customerName && s.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      s.cashierName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

    const matchesPayment = paymentMethodFilter === 'ALL' || 
      s.payments.some(p => p.method.toUpperCase().includes(paymentMethodFilter.toUpperCase()));

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const isAllSelected = filteredSales.length > 0 && filteredSales.every(s => selectedSaleIds.includes(s.id));
  const isSomeSelected = filteredSales.some(s => selectedSaleIds.includes(s.id)) && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedSaleIds([]);
    } else {
      setSelectedSaleIds(filteredSales.map(s => s.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedSaleIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleExportSelectedCSV = () => {
    const targetSales = sales.filter(s => selectedSaleIds.includes(s.id));
    if (targetSales.length === 0) return;
    
    const headers = ['Receipt #', 'Date', 'Cashier', 'Customer', 'Items Count', 'Payment Methods', 'Total Amount', 'Status'];
    const rows = targetSales.map(s => [
      s.receiptNumber,
      `"${s.createdAt}"`,
      `"${s.cashierName}"`,
      `"${s.customerName || 'Walk-in'}"`,
      s.items.length,
      `"${s.payments.map(p => `${p.method}: ${p.amount}`).join('; ')}"`,
      s.total,
      s.status
    ]);
    
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkPrintReceipts = () => {
    window.print();
  };

  const handleReturn = () => {
    if (!returnReason.trim()) {
      alert('Please state the clinical or customer reason for the return.');
      return;
    }
    if (selectedSale) {
      logAuditEvent('SALE_REFUNDED', 'sales', selectedSale.receiptNumber, `Refunded condition ${returnCondition}. Reason: ${returnReason}`);
      alert(`Refund of ${formatCurrency(selectedSale.total)} approved. Return reference generated.`);
      setShowReturnModal(false);
      setShowDetailModal(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Page Title & Search/Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-brand-600" />
            <span>Sales History & Return Records</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immutable transaction records, tender splits, and authorized returns.
          </p>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search receipt #, customer..."
              className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 w-48 sm:w-56 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="REFUNDED">Refunded</option>
          </select>

          {/* Payment Method Filter */}
          <select
            value={paymentMethodFilter}
            onChange={e => setPaymentMethodFilter(e.target.value)}
            className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Payment Methods</option>
            <option value="CASH">Cash</option>
            <option value="M-PESA">Mobile Money (M-Pesa)</option>
            <option value="CARD">Card / POS</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800 select-none">
              <tr>
                <th className="p-3 w-16 text-center">
                  <div className="flex items-center justify-center space-x-1.5">
                    <input
                      ref={el => {
                        if (el) el.indeterminate = isSomeSelected;
                      }}
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                      title="Select All"
                    />
                    <span className="font-mono text-[11px] text-slate-400">#</span>
                  </div>
                </th>
                <th className="p-3">Receipt #</th>
                <th className="p-3">Date & Time</th>
                <th className="p-3">Cashier</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Items</th>
                <th className="p-3">Payment Tender</th>
                <th className="p-3">Total Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    No sales records found matching the active filters.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale, index) => {
                  const isSelected = selectedSaleIds.includes(sale.id);
                  return (
                    <tr 
                      key={sale.id} 
                      className={`transition-colors ${
                        isSelected 
                          ? 'bg-brand-50/70 dark:bg-brand-950/40 border-l-2 border-l-brand-600' 
                          : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(sale.id)}
                            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                          />
                          <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 w-5 text-right">
                            {index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold text-brand-600 dark:text-brand-400">
                        {sale.receiptNumber}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{sale.createdAt}</td>
                      <td className="p-3 text-slate-800 dark:text-slate-200 font-medium">{sale.cashierName}</td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">{sale.customerName || 'Walk-in Customer'}</td>
                      <td className="p-3">{sale.items.length} items</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {sale.payments.map((p, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-semibold">
                              {p.method}: {formatCurrency(p.amount)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(sale.total)}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sale.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {sale.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1">
                        <button
                          onClick={() => {
                            setSelectedSale(sale);
                            setShowDetailModal(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-brand-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                          title="Inspect sale"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSale(sale);
                            setShowReturnModal(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-rose-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                          title="Process Return / Refund"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      <FloatingBulkActionBar
        selectedCount={selectedSaleIds.length}
        totalCount={filteredSales.length}
        onClearSelection={() => setSelectedSaleIds([])}
        actions={[
          {
            label: 'Export CSV',
            icon: FileSpreadsheet,
            onClick: handleExportSelectedCSV,
            variant: 'secondary'
          },
          {
            label: 'Print Receipts',
            icon: Printer,
            onClick: handleBulkPrintReceipts,
            variant: 'primary'
          }
        ]}
      />

      {/* Sale Detail Modal */}
      {showDetailModal && selectedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Transaction: {selectedSale.receiptNumber}</h3>
                <p className="text-xs text-slate-500">{selectedSale.createdAt} • Cashier: {selectedSale.cashierName}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)}><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-bold text-slate-700 dark:text-slate-300">Line Items & Batches:</p>
              <div className="border rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50 divide-y divide-slate-200 dark:divide-slate-700">
                {selectedSale.items.map((it, idx) => (
                  <div key={idx} className="py-2 first:pt-0 last:pb-0 flex justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{it.productName} (x{it.quantity})</p>
                      <p className="text-[10px] text-slate-500">Batch #{it.batchNumber} • Exp: {it.expiryDate}</p>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(it.subtotal)}</span>
                  </div>
                ))}
              </div>

              {selectedSale.prescription && (
                <div className="p-3 bg-violet-50 dark:bg-violet-950/40 rounded-xl border border-violet-200 dark:border-violet-800 text-[11px] space-y-1">
                  <p className="font-bold text-violet-800 dark:text-violet-300">Verified Prescription (POM)</p>
                  <p>Prescriber: {selectedSale.prescription.prescriberName} ({selectedSale.prescription.prescriberLicense})</p>
                  <p>Patient: {selectedSale.prescription.patientName} • Hospital: {selectedSale.prescription.hospitalClinic}</p>
                  <p>Supervising Pharmacist: {selectedSale.prescription.verifiedByPharmacistName}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setShowReturnModal(true);
                }}
                className="px-4 py-2 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-100 rounded-lg text-xs font-semibold"
              >
                Initiate Return
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return / Refund Modal */}
      {showReturnModal && selectedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-sm">Process Clinical Return / Refund</h3>
              </div>
              <button onClick={() => setShowReturnModal(false)}><X className="w-4 h-4" /></button>
            </div>

            <p className="text-xs text-slate-500">
              Receipt: <span className="font-bold font-mono">{selectedSale.receiptNumber}</span> (Total {formatCurrency(selectedSale.total)})
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Medication Physical Condition</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReturnCondition('RESELLABLE')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold text-center ${
                      returnCondition === 'RESELLABLE' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Resellable (Restock)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReturnCondition('DAMAGED')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold text-center ${
                      returnCondition === 'DAMAGED' ? 'bg-rose-50 border-rose-500 text-rose-800' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Damaged (Write Off)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Return Reason / Clinical Notes *</label>
                <textarea
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  placeholder="e.g. Physician changed prescription dosage before consumption, seal unbroken."
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-xs h-20"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReturn}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow"
              >
                Authorize Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
