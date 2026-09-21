import React, { useState, useRef } from 'react';
import { 
  Truck, Plus, Search, CheckCircle2, Clock, 
  PackageCheck, FileText, X, AlertTriangle, Sparkles, FileSpreadsheet, CheckCheck,
  Info, BookOpen, HelpCircle, ShieldCheck
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { PurchaseOrder } from '../../types';
import { FloatingBulkActionBar } from '../../components/common/FloatingBulkActionBar';
import { WorkflowGuideNotice } from '../../components/common/WorkflowGuideNotice';
import { FieldGuideNotice } from '../../components/common/FieldGuideNotice';

export const PurchasingPage: React.FC = () => {
  const { 
    purchaseOrders, suppliers, products, receiveStock, 
    addPurchaseOrder, formatCurrency, currentCurrency 
  } = usePharmacy();
  const [showPOModal, setShowPOModal] = useState(false);
  const [showGRNModal, setShowGRNModal] = useState(false);

  // Filters & selection
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [supplierFilter, setSupplierFilter] = useState<string>('ALL');
  const [selectedPOIds, setSelectedPOIds] = useState<string[]>([]);

  // New PO State
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [expectedDate, setExpectedDate] = useState('2026-09-30');
  const [poNotes, setPoNotes] = useState('Standard replenishment order. Requires Certificate of Analysis (CoA) with minimum 18 months remaining shelf-life.');
  const [poLines, setPoLines] = useState([
    { productId: products[0]?.id || '', orderedQty: 100, unitCost: products[0]?.unitCost || 1000 }
  ]);

  // GRN State
  const [grnNumber, setGrnNumber] = useState(`GRN-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [grnItems, setGrnItems] = useState([
    {
      productId: products[0]?.id || '',
      batchNumber: 'NEW-BATCH-001',
      mfgDate: '2026-03-01',
      expDate: '2028-03-01',
      qty: 50,
      unitCost: 18.00,
      sellingPrice: 30.00
    }
  ]);

  // Live Margin Calculation on GRN
  const currentItem = grnItems[0];
  const grnProfit = currentItem.sellingPrice - currentItem.unitCost;
  const grnMargin = currentItem.sellingPrice > 0 ? (grnProfit / currentItem.sellingPrice) * 100 : 0;

  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch = 
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || po.status === statusFilter;
    const matchesSupplier = supplierFilter === 'ALL' || po.supplierId === supplierFilter;
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  const isAllSelected = filteredPOs.length > 0 && filteredPOs.every(po => selectedPOIds.includes(po.id));
  const isSomeSelected = filteredPOs.some(po => selectedPOIds.includes(po.id)) && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedPOIds([]);
    } else {
      setSelectedPOIds(filteredPOs.map(po => po.id));
    }
  };

  const toggleSelectPO = (id: string) => {
    setSelectedPOIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleExportPOCSV = () => {
    const targetPOs = purchaseOrders.filter(po => selectedPOIds.includes(po.id));
    if (targetPOs.length === 0) return;
    const headers = ['PO Number', 'Supplier', 'Created Date', 'Expected Date', 'Lines Count', 'Total Value', 'Approval', 'Status'];
    const rows = targetPOs.map(po => [
      `"${po.poNumber}"`,
      `"${po.supplierName}"`,
      `"${po.createdAt}"`,
      `"${po.expectedDate}"`,
      po.items.length,
      po.totalAmount,
      `"${po.approvedBy || 'Pending'}"`,
      po.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `purchase_orders_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleBulkApprove = () => {
    alert(`Authorized approval for ${selectedPOIds.length} purchase orders.`);
    setSelectedPOIds([]);
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === supplierId);
    const items = poLines.map(line => {
      const p = products.find(prod => prod.id === line.productId);
      return {
        productId: line.productId,
        productName: p ? p.brandName : 'Product',
        orderedQty: line.orderedQty,
        receivedQty: 0,
        unitCost: line.unitCost,
        totalCost: line.orderedQty * line.unitCost
      };
    });

    const totalAmount = items.reduce((acc, i) => acc + i.totalCost, 0);

    addPurchaseOrder({
      supplierId,
      supplierName: sup ? sup.name : 'Supplier',
      expectedDate,
      items,
      totalAmount,
      status: 'SUBMITTED',
      notes: poNotes || 'Standard stock replenishment.'
    });

    setShowPOModal(false);
  };

  const handleCommitGRN = () => {
    receiveStock(grnNumber, grnItems);
    alert(`Goods Receipt ${grnNumber} committed! Stock and cost posted to inventory.`);
    setShowGRNModal(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Truck className="w-5 h-5 text-brand-600" />
            <span>Purchasing & Goods Receiving (GRN)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Purchase Orders, supplier delivery verification, batch intake, and cost-margin risk validation.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowGRNModal(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 transition"
          >
            <PackageCheck className="w-4 h-4" />
            <span>Receive Goods (GRN)</span>
          </button>
          <button
            onClick={() => setShowPOModal(true)}
            className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 flex items-center space-x-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Educational Guidance: Procurement Workflow from PO to GRN */}
      <WorkflowGuideNotice
        title="Procurement Guide: How Purchase Orders (PO) and Goods Receipt (GRN) Work"
        tag="Procurement Lifecycle"
        badge="3-Step Protocol"
        icon={BookOpen}
        summary="Standard pharmaceutical protocol bridging external supplier purchasing with dispensary inventory accounting and FEFO quality compliance."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3 bg-white/90 dark:bg-slate-900/80 rounded-xl border border-brand-100 dark:border-brand-900/50 space-y-1">
            <div className="flex items-center space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-[11px]">1</span>
              <span className="font-bold text-xs text-brand-900 dark:text-brand-300">Raise Purchase Order (PO)</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Formally request stock from accredited suppliers with agreed quantity, wholesale price, and expected delivery date.
            </p>
            <div className="text-[10px] bg-brand-50 dark:bg-brand-950/50 text-brand-800 dark:text-brand-300 p-1.5 rounded font-mono">
              e.g. Order <strong>100 packs</strong> of Amoxil Forte from MegaCare Ltd at GH₵18.00/pack.
            </div>
          </div>

          <div className="p-3 bg-white/90 dark:bg-slate-900/80 rounded-xl border border-amber-100 dark:border-amber-900/50 space-y-1">
            <div className="flex items-center space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-[11px]">2</span>
              <span className="font-bold text-xs text-amber-900 dark:text-amber-300">Shipment & Physical Audit</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Supplier delivers goods with delivery note/waybill. Pharmacist inspects seal integrity and packaging labels.
            </p>
            <div className="text-[10px] bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 p-1.5 rounded font-mono">
              Check cold-chain ice packs (2°C–8°C) and ensure seal labels are untampered.
            </div>
          </div>

          <div className="p-3 bg-white/90 dark:bg-slate-900/80 rounded-xl border border-emerald-100 dark:border-emerald-900/50 space-y-1">
            <div className="flex items-center space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-[11px]">3</span>
              <span className="font-bold text-xs text-emerald-900 dark:text-emerald-300">Goods Received Note (GRN)</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Log manufacturer <strong>Batch Number</strong>, <strong>Expiry Date</strong> for FEFO rotation, and live margin risk check before POS shelf release.
            </p>
            <div className="text-[10px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 p-1.5 rounded font-mono">
              e.g. Batch <strong>AMX-2026-B09</strong>, Exp <strong>2028-03-01</strong>, Cost GH₵18 $\to$ Sell GH₵30 (40% margin).
            </div>
          </div>
        </div>
      </WorkflowGuideNotice>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search PO #, supplier name..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          {/* Supplier Filter */}
          <select
            value={supplierFilter}
            onChange={e => setSupplierFilter(e.target.value)}
            className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Suppliers</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* PO Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">All PO Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="APPROVED">Approved</option>
            <option value="PARTIALLY_RECEIVED">Partially Received</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Purchase Orders Table */}
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
                <th className="p-3">PO Number</th>
                <th className="p-3">Supplier</th>
                <th className="p-3">Created Date</th>
                <th className="p-3">Expected Date</th>
                <th className="p-3">Lines</th>
                <th className="p-3">Total Value</th>
                <th className="p-3">Approval</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPOs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    No purchase orders found matching filters.
                  </td>
                </tr>
              ) : (
                filteredPOs.map((po, index) => {
                  const isSelected = selectedPOIds.includes(po.id);
                  return (
                    <tr 
                      key={po.id} 
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
                            onChange={() => toggleSelectPO(po.id)}
                            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                          />
                          <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 w-5 text-right">
                            {index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold text-brand-600 dark:text-brand-400">{po.poNumber}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{po.supplierName}</td>
                      <td className="p-3 text-slate-500">{po.createdAt}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300 font-medium">{po.expectedDate}</td>
                      <td className="p-3">
                        {po.items.map((i, idx) => (
                          <span key={idx} className="block text-[11px] text-slate-500">
                            {i.productName} ({i.receivedQty}/{i.orderedQty})
                          </span>
                        ))}
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(po.totalAmount)}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{po.approvedBy || 'Pending'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          po.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          po.status === 'PARTIALLY_RECEIVED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                          po.status === 'APPROVED' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {po.status.replace('_', ' ')}
                        </span>
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
        selectedCount={selectedPOIds.length}
        totalCount={filteredPOs.length}
        onClearSelection={() => setSelectedPOIds([])}
        actions={[
          {
            label: 'Export POs CSV',
            icon: FileSpreadsheet,
            onClick: handleExportPOCSV,
            variant: 'secondary'
          },
          {
            label: 'Batch Approve',
            icon: CheckCheck,
            onClick: handleBulkApprove,
            variant: 'primary'
          }
        ]}
      />

      {/* MODAL 1: Create Purchase Order */}
      {showPOModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreatePO} className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-brand-600" />
                  <span>Raise Purchase Order (PO)</span>
                </h3>
                <p className="text-xs text-slate-500">Formal procurement order sent to accredited pharmaceutical distributor</p>
              </div>
              <button type="button" onClick={() => setShowPOModal(false)}><X className="w-4 h-4" /></button>
            </div>

            {/* In-Modal Guidance */}
            <WorkflowGuideNotice
              compact
              title="Purchase Order Purpose & Workflow"
              badge="PO Guidelines"
              icon={Info}
              summary="A Purchase Order locks in wholesale supply commitments with licensed distributors. Once approved, suppliers dispatch goods against this PO, which will be reconciled during Goods Receipt (GRN)."
            />

            <div className="space-y-3.5 text-xs">
              {/* Field 1: Supplier */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200">
                    Pharmaceutical Supplier <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Accredited Wholesale Vendor</span>
                </div>
                <select
                  value={supplierId}
                  onChange={e => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-semibold focus:ring-2 focus:ring-brand-500"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code}) — Terms: {s.paymentTermsDays}d</option>
                  ))}
                </select>
                <FieldGuideNotice label="Read supplier selection & terms" title="Accredited Wholesale Vendors">
                  <p>Choose an FDA-licensed pharmaceutical distributor with active credit terms.</p>
                  <p className="mt-1">
                    <strong>Examples:</strong> <code className="font-mono text-brand-600 bg-brand-50 dark:bg-brand-950 px-1 rounded">MegaCare Pharmaceuticals Ltd</code> (30-day net terms) or <code className="font-mono text-brand-600 bg-brand-50 dark:bg-brand-950 px-1 rounded">Ernest Chemists Wholesale</code>.
                  </p>
                </FieldGuideNotice>
              </div>

              {/* Field 2: Delivery Date */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200">
                    Expected Delivery Date <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Lead Time Arrival Target</span>
                </div>
                <input
                  type="date"
                  required
                  value={expectedDate}
                  onChange={e => setExpectedDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-brand-500"
                />
                <FieldGuideNotice label="Read lead time target & examples" title="Expected Delivery Target">
                  <p>
                    Set 3–5 business days out (e.g. <code>2026-09-30</code>) based on distributor lead times to schedule physical bay intake and avoid pharmacy stockouts.
                  </p>
                </FieldGuideNotice>
              </div>

              {/* Field 3: Medicine Line & Quantity */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200">
                    Medicine Item & Order Quantity <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Dispensary Formulary Item</span>
                </div>
                <div className="flex gap-2">
                  <select
                    value={poLines[0].productId}
                    onChange={e => {
                      const p = products.find(prod => prod.id === e.target.value);
                      setPoLines([{ ...poLines[0], productId: e.target.value, unitCost: p ? p.unitCost : 10 }]);
                    }}
                    className="flex-1 px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-semibold focus:ring-2 focus:ring-brand-500"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.brandName} - Baseline Cost: {formatCurrency(p.unitCost)}</option>
                    ))}
                  </select>
                  <div className="w-28">
                    <input
                      type="number"
                      min="1"
                      value={poLines[0].orderedQty}
                      onChange={e => setPoLines([{ ...poLines[0], orderedQty: parseInt(e.target.value) || 1 }])}
                      placeholder="Qty"
                      className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-bold font-mono text-center focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
                <FieldGuideNotice label="Read order lines & calculation" title="Formulary Line Requisition">
                  <p>
                    Calculates purchase line commitment: <code className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1 rounded">Amoxil Forte 500mg — {poLines[0].orderedQty} packs</code> (Estimated Total: {formatCurrency(poLines[0].orderedQty * poLines[0].unitCost)}).
                  </p>
                </FieldGuideNotice>
              </div>

              {/* Field 4: Quality & Delivery Notes */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200">
                    Delivery Specifications & Terms
                  </label>
                  <span className="text-[10px] text-slate-400">Regulatory & Cold Chain Instructions</span>
                </div>
                <textarea
                  rows={2}
                  value={poNotes}
                  onChange={e => setPoNotes(e.target.value)}
                  placeholder="Specify shelf-life, certificate requirements, or delivery bay guidelines..."
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-brand-500"
                />
                <FieldGuideNotice label="Read delivery terms & compliance examples" title="Regulatory & Quality Terms">
                  <div className="space-y-1">
                    <p><strong>Example 1:</strong> <em>"Requires batch Certificate of Analysis (CoA) with minimum 18 months remaining shelf-life upon delivery."</em></p>
                    <p><strong>Example 2:</strong> <em>"Cold chain items must be transported in validated cooler box maintained between 2°C and 8°C."</em></p>
                  </div>
                </FieldGuideNotice>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowPOModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow transition"
              >
                Submit Purchase Order
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: Goods Received Note (GRN) with Live Cost/Margin Risk Guidance */}
      {showGRNModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                  <PackageCheck className="w-5 h-5 text-emerald-600" />
                  <span>Receive Goods Note (GRN Intake)</span>
                </h3>
                <p className="text-xs text-slate-500">Log incoming batches, set FEFO expiry dates, and audit invoice margins</p>
              </div>
              <button type="button" onClick={() => setShowGRNModal(false)}><X className="w-4 h-4" /></button>
            </div>

            {/* In-Modal Guidance */}
            <WorkflowGuideNotice
              compact
              title="Goods Receipt & FEFO Activation"
              badge="Ghana FDA Protocol"
              icon={ShieldCheck}
              summary="Completing a GRN directly posts physical stock to active inventory shelves. Assigning manufacturer batch numbers and expiry dates is mandatory for FEFO stock rotation."
            />

            <div className="space-y-3.5 text-xs">
              {/* Field 1: GRN Reference & Product */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">
                      GRN Audit Reference <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Internal Intake ID</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={grnNumber}
                    onChange={e => setGrnNumber(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-mono font-bold focus:ring-2 focus:ring-brand-500"
                  />
                  <FieldGuideNotice label="Read reference guide & examples" title="Internal Intake ID">
                    <p>Internal audit reference matching supplier waybill (e.g. <code>GRN-2026-8814</code>).</p>
                  </FieldGuideNotice>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">
                      Medicine Received <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Formulation Line</span>
                  </div>
                  <select
                    value={grnItems[0].productId}
                    onChange={e => {
                      const p = products.find(prod => prod.id === e.target.value);
                      setGrnItems([{ 
                        ...grnItems[0], 
                        productId: e.target.value,
                        unitCost: p ? p.unitCost : 10,
                        sellingPrice: p ? p.sellingPrice : 20
                      }]);
                    }}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-semibold focus:ring-2 focus:ring-brand-500"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.brandName}</option>
                    ))}
                  </select>
                  <FieldGuideNotice label="Read stock posting note" title="Dispensary Inventory Ledger">
                    <p>Selected formulation stock balance will increase automatically upon receipt confirmation.</p>
                  </FieldGuideNotice>
                </div>
              </div>

              {/* Field 2: Batch & Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">
                      Manufacturer Batch / Lot # <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-rose-500 font-semibold">Recall Traceability</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={grnItems[0].batchNumber}
                    onChange={e => setGrnItems([{ ...grnItems[0], batchNumber: e.target.value }])}
                    placeholder="e.g. AMX-2026-B09, PARA-LOT-44A..."
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-mono font-bold focus:ring-2 focus:ring-brand-500"
                  />
                  <FieldGuideNotice label="Read batch traceability & examples" title="Recall Traceability Key">
                    <p>Enter exact lot stamped on packaging (e.g. <code className="font-mono">AMX-2026-B09</code>) for instant batch recall capability.</p>
                  </FieldGuideNotice>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">
                      Received Quantity (Base Units) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Atomic Units Count</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    required
                    value={grnItems[0].qty}
                    onChange={e => setGrnItems([{ ...grnItems[0], qty: parseInt(e.target.value) || 0 }])}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-bold font-mono focus:ring-2 focus:ring-brand-500"
                  />
                  <FieldGuideNotice label="Read quantity rules & examples" title="Atomic Units Count">
                    <p>Count and enter in atomic base units (e.g. <code>500</code> for 5 boxes of 100 tablets).</p>
                  </FieldGuideNotice>
                </div>
              </div>

              {/* Field 3: Manufacturing & Expiry Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">
                      Manufacturing Date
                    </label>
                    <span className="text-[10px] text-slate-400">Production Audit</span>
                  </div>
                  <input
                    type="date"
                    value={grnItems[0].mfgDate}
                    onChange={e => setGrnItems([{ ...grnItems[0], mfgDate: e.target.value }])}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-brand-500"
                  />
                  <FieldGuideNotice label="Read mfg date usage" title="Production Audit Timestamp">
                    <p>Date of factory synthesis stamped on packaging (e.g. <code>2026-03-01</code>).</p>
                  </FieldGuideNotice>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">
                      Expiry Date <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-brand-600 font-semibold">FEFO Queue Key</span>
                  </div>
                  <input
                    type="date"
                    required
                    value={grnItems[0].expDate}
                    onChange={e => setGrnItems([{ ...grnItems[0], expDate: e.target.value }])}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-bold text-brand-600 focus:ring-2 focus:ring-brand-500"
                  />
                  <FieldGuideNotice label="Read FEFO queue rules & examples" title="First-Expired, First-Out Queue">
                    <p>Positions batch in First-Expired, First-Out queue to prioritize older stock (e.g. <code>2028-03-01</code>).</p>
                  </FieldGuideNotice>
                </div>
              </div>

              {/* Field 4: Invoice Cost & Selling Price with Live Margin Guidance */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    Invoice Verification & Retail Profit Margin
                  </span>
                  <FieldGuideNotice label="Read margin guidelines" title="Dispensary Margin Benchmarks">
                    <p>Maintain healthy retail margin (recommended ≥ 15%) to cover cold-chain storage and operations. Negative margins result in pharmacy financial loss.</p>
                  </FieldGuideNotice>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                      Invoice Cost Price ({currentCurrency.symbol}) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={grnItems[0].unitCost}
                      onChange={e => setGrnItems([{ ...grnItems[0], unitCost: parseFloat(e.target.value) || 0 }])}
                      className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 font-bold font-mono focus:ring-2 focus:ring-brand-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Actual price billed by supplier</span>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                      Dispensary Selling Price ({currentCurrency.symbol}) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={grnItems[0].sellingPrice}
                      onChange={e => setGrnItems([{ ...grnItems[0], sellingPrice: parseFloat(e.target.value) || 0 }])}
                      className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 font-bold font-mono text-brand-600 focus:ring-2 focus:ring-brand-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Shelf price charged to patients at POS</span>
                  </div>
                </div>

                {/* Live Risk Guidance Card */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3 text-[11px]">
                    <span>Profit per Unit: <strong className="font-mono text-slate-900 dark:text-white">{formatCurrency(grnProfit)}</strong></span>
                    <span>Gross Margin: <strong className="font-mono text-slate-900 dark:text-white">{grnMargin.toFixed(1)}%</strong></span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    grnMargin < 0 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                    grnMargin < 15 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}>
                    {grnMargin < 0 ? '⚠️ Negative Margin (Loss)' : grnMargin < 15 ? '⚠️ Low Margin Warning (<15%)' : '✓ Healthy Margin (≥15%)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowGRNModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCommitGRN}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow transition"
              >
                Commit Goods Receipt & Post to Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
