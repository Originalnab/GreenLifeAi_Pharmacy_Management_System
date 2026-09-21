import React, { useState, useRef } from 'react';
import { 
  Boxes, Clock, ShieldAlert, History, ClipboardCheck, 
  AlertTriangle, Trash2, ArrowUpDown, Search, CheckCircle2, X, FileSpreadsheet,
  Plus, Info, BookOpen, HelpCircle, PackageCheck, Sparkles, ShieldCheck
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Batch } from '../../types';
import { FloatingBulkActionBar } from '../../components/common/FloatingBulkActionBar';
import { WorkflowGuideNotice } from '../../components/common/WorkflowGuideNotice';
import { FieldGuideNotice } from '../../components/common/FieldGuideNotice';

export const InventoryPage: React.FC = () => {
  const { 
    batches, stockMovements, quarantineBatch, disposeBatch, 
    products, currentUser, formatCurrency, currentCurrency, receiveStock
  } = usePharmacy();
  const [activeTab, setActiveTab] = useState<'batches' | 'ledger' | 'quarantine' | 'counts'>('batches');
  const [searchTerm, setSearchTerm] = useState('');
  const [batchStatusFilter, setBatchStatusFilter] = useState<string>('ALL');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('ALL');

  // Multi-row selection states for different tabs
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [selectedLedgerIds, setSelectedLedgerIds] = useState<string[]>([]);
  const [selectedQuarantineIds, setSelectedQuarantineIds] = useState<string[]>([]);
  const [selectedCountIds, setSelectedCountIds] = useState<string[]>([]);

  // Action Modals
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [showQuarantineModal, setShowQuarantineModal] = useState(false);
  const [quarantineReason, setQuarantineReason] = useState('');

  const [showDisposeModal, setShowDisposeModal] = useState(false);
  const [disposeReason, setDisposeReason] = useState('');

  // Manual Stock Intake / Adjustment Modal State
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [intakeForm, setIntakeForm] = useState({
    productId: products[0]?.id || '',
    batchNumber: 'STK-2026-001',
    mfgDate: '2026-03-01',
    expDate: '2028-06-30',
    qty: 100,
    unitCost: products[0]?.unitCost || 18.00,
    sellingPrice: products[0]?.sellingPrice || 30.00,
    storageLocation: 'Dispensary Shelf A-01',
    adjustmentType: 'INITIAL_ONBOARDING',
    reason: 'Initial opening stock onboarding count reconciliation.'
  });

  // Stock count demo state
  const [countItems, setCountItems] = useState([
    { id: 'prod_amox_500', name: 'Amoxil Forte 500mg', expected: 185, counted: 185, variance: 0 },
    { id: 'prod_coartem_80', name: 'Coartem 80/480', expected: 92, counted: 90, variance: -2 },
    { id: 'prod_para_500', name: 'Panadol Extra 500mg', expected: 340, counted: 340, variance: 0 },
  ]);
  const [isCountPosted, setIsCountPosted] = useState(false);

  const handleCommitIntake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intakeForm.batchNumber.trim()) {
      alert('Please specify a valid manufacturer batch / lot code.');
      return;
    }
    const refCode = `ADJ-${Date.now().toString().slice(-4)}`;
    receiveStock(refCode, [{
      productId: intakeForm.productId,
      batchNumber: intakeForm.batchNumber,
      mfgDate: intakeForm.mfgDate,
      expDate: intakeForm.expDate,
      qty: intakeForm.qty,
      unitCost: intakeForm.unitCost,
      sellingPrice: intakeForm.sellingPrice
    }]);
    alert(`Stock record ${refCode} successfully posted to active inventory and immutable movement ledger!`);
    setShowIntakeModal(false);
  };

  const filteredBatches = batches.filter(b => {
    const matchesSearch = 
      b.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = batchStatusFilter === 'ALL' || b.status === batchStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredMovements = stockMovements.filter(m => {
    const matchesType = movementTypeFilter === 'ALL' || m.movementType === movementTypeFilter;
    return matchesType;
  });

  const quarantinedBatches = batches.filter(b => 
    b.status === 'QUARANTINED' || b.status === 'EXPIRED' || b.status === 'DISPOSED'
  );

  // Batch selection handlers
  const isAllBatchesSelected = filteredBatches.length > 0 && filteredBatches.every(b => selectedBatchIds.includes(b.id));
  const isSomeBatchesSelected = filteredBatches.some(b => selectedBatchIds.includes(b.id)) && !isAllBatchesSelected;

  const toggleSelectAllBatches = () => {
    if (isAllBatchesSelected) {
      setSelectedBatchIds([]);
    } else {
      setSelectedBatchIds(filteredBatches.map(b => b.id));
    }
  };

  const toggleSelectBatch = (id: string) => {
    setSelectedBatchIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Ledger selection handlers
  const isAllLedgerSelected = filteredMovements.length > 0 && filteredMovements.every(m => selectedLedgerIds.includes(m.id));
  const isSomeLedgerSelected = filteredMovements.some(m => selectedLedgerIds.includes(m.id)) && !isAllLedgerSelected;

  const toggleSelectAllLedger = () => {
    if (isAllLedgerSelected) {
      setSelectedLedgerIds([]);
    } else {
      setSelectedLedgerIds(filteredMovements.map(m => m.id));
    }
  };

  const toggleSelectLedger = (id: string) => {
    setSelectedLedgerIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Export handlers
  const handleExportBatchesCSV = () => {
    const targets = batches.filter(b => selectedBatchIds.includes(b.id));
    if (targets.length === 0) return;
    const headers = ['Product Name', 'Batch Number', 'Mfg Date', 'Expiry Date', 'Location', 'Available Qty', 'Selling Price', 'Status'];
    const rows = targets.map(b => [
      `"${b.productName}"`,
      `"${b.batchNumber}"`,
      b.manufacturingDate,
      b.expiryDate,
      `"${b.storageLocation}"`,
      b.availableQuantity,
      b.sellingPrice,
      b.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `inventory_batches_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleExportLedgerCSV = () => {
    const targets = stockMovements.filter(m => selectedLedgerIds.includes(m.id));
    if (targets.length === 0) return;
    const headers = ['Timestamp', 'Type', 'Product', 'Batch', 'Delta', 'Before', 'After', 'Ref #', 'Actor', 'Reason'];
    const rows = targets.map(m => [
      `"${m.timestamp}"`,
      m.movementType,
      `"${m.productName}"`,
      `"${m.batchNumber}"`,
      m.quantity,
      m.balanceBefore,
      m.balanceAfter,
      `"${m.referenceNumber}"`,
      `"${m.actorName}"`,
      `"${m.reason || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `stock_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleQuarantine = () => {
    if (!quarantineReason.trim()) {
      alert('Please specify the quarantine reason.');
      return;
    }
    if (selectedBatch) {
      quarantineBatch(selectedBatch.id, quarantineReason);
      setShowQuarantineModal(false);
      setQuarantineReason('');
    }
  };

  const handleDispose = () => {
    if (!disposeReason.trim()) {
      alert('Please specify the disposal reason and destruction witness.');
      return;
    }
    if (selectedBatch) {
      disposeBatch(selectedBatch.id, disposeReason);
      setShowDisposeModal(false);
      setDisposeReason('');
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Boxes className="w-5 h-5 text-brand-600" />
            <span>Inventory, FEFO Batches & Stock Ledger</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immutable movement ledger, expiry timeline queues, quarantine isolations, and cycle audits.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowIntakeModal(true)}
            className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 flex items-center space-x-1.5 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Record Stock Intake / Adjustment</span>
          </button>
        </div>
      </div>

      {/* Educational Guidance: FEFO, Movement Ledger & Quality Audit Protocol */}
      <WorkflowGuideNotice
        title="Inventory Quality Guide: FEFO Stock Rotation, Quarantine & Movement Ledger"
        tag="Clinical Standards"
        badge="Quality & Compliance"
        icon={BookOpen}
        summary="Structured shelf protocols to protect patient safety, eliminate expired drug write-offs, and ensure 100% audit trail compliance."
      >
        <div className="space-y-3">
          {/* 3 Pillar Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3 bg-white/90 dark:bg-slate-900/80 rounded-xl border border-emerald-100 dark:border-emerald-900/50 space-y-1">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-bold text-xs text-emerald-900 dark:text-emerald-300">1. FEFO (First-Expired, First-Out)</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Batches closest to their expiry dates are automatically offered first during POS checkout, reducing expired medicine waste.
              </p>
              <div className="text-[10px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 p-1.5 rounded font-mono">
                e.g. Batch expiring <strong>Nov 2026</strong> is dispensed before Batch expiring <strong>Apr 2028</strong>.
              </div>
            </div>

            <div className="p-3 bg-white/90 dark:bg-slate-900/80 rounded-xl border border-blue-100 dark:border-blue-900/50 space-y-1">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="font-bold text-xs text-blue-900 dark:text-blue-300">2. Immutable Movement Ledger</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Every stock change (purchase, sale, damage, cycle count) records an audit entry with user timestamp and before/after balances.
              </p>
              <div className="text-[10px] bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 p-1.5 rounded font-mono">
                Never edit stock directly without generating an authorized ledger reason.
              </div>
            </div>

            <div className="p-3 bg-white/90 dark:bg-slate-900/80 rounded-xl border border-purple-100 dark:border-purple-900/50 space-y-1">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span className="font-bold text-xs text-purple-900 dark:text-purple-300">3. Quarantine & Witnessed Disposal</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Suspect, damaged, or recalled drugs are immediately frozen in quarantine holding before safe disposal with regulatory witness.
              </p>
              <div className="text-[10px] bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 p-1.5 rounded font-mono">
                Quarantined units are instantly blocked from POS cashier dispensing.
              </div>
            </div>
          </div>

          {/* Concrete Real-World Examples */}
          <div className="p-3 bg-white/70 dark:bg-slate-900/60 rounded-xl border border-cyan-100 dark:border-cyan-900/40 text-[11px] space-y-1.5">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>How to Use the Stock Intake & Adjustment Features:</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
              <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/80">
                <strong className="text-slate-900 dark:text-white">Example 1: Initial Stock Onboarding</strong>
                <p className="mt-0.5">
                  Use <em>Record Stock Intake / Adjustment</em> to register existing pharmacy opening stock: Select medicine, enter manufacturer batch #, set expiry date, and input counted base units.
                </p>
              </div>
              <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/80">
                <strong className="text-slate-900 dark:text-white">Example 2: Breakage or Cycle Count Discrepancy</strong>
                <p className="mt-0.5">
                  If 2 bottles of syrup break during shelf cleaning, record an adjustment with reason <em>"Damaged in shelf handling"</em> to keep book stock aligned with physical bottles.
                </p>
              </div>
            </div>
          </div>
        </div>
      </WorkflowGuideNotice>

      {/* Tab Switcher & Navigation */}
      <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('batches')}
          className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
            activeTab === 'batches' ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Active Batches & FEFO
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
            activeTab === 'ledger' ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Movement Ledger
        </button>
        <button
          onClick={() => setActiveTab('quarantine')}
          className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
            activeTab === 'quarantine' ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Quarantine & Disposal
        </button>
        <button
          onClick={() => setActiveTab('counts')}
          className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
            activeTab === 'counts' ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Physical Count Session
        </button>
      </div>

      {/* TAB 1: BATCHES & EXPIRY */}
      {activeTab === 'batches' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search batch number or medicine..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={batchStatusFilter}
                onChange={e => setBatchStatusFilter(e.target.value)}
                className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Expiry Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="NEAR_EXPIRY">Near Expiry</option>
                <option value="EXPIRED">Expired</option>
                <option value="QUARANTINED">Quarantined</option>
              </select>

              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                FEFO Ordered
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800 select-none">
                  <tr>
                    <th className="p-3 w-16 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <input
                          ref={el => {
                            if (el) el.indeterminate = isSomeBatchesSelected;
                          }}
                          type="checkbox"
                          checked={isAllBatchesSelected}
                          onChange={toggleSelectAllBatches}
                          className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                          title="Select All"
                        />
                        <span className="font-mono text-[11px] text-slate-400">#</span>
                      </div>
                    </th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Batch Number</th>
                    <th className="p-3">Mfg Date</th>
                    <th className="p-3">Expiry Date</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Quantity Available</th>
                    <th className="p-3">Selling Price ({currentCurrency.symbol})</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredBatches.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">
                        No batch records matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredBatches.map((batch, index) => {
                      const isSelected = selectedBatchIds.includes(batch.id);
                      return (
                        <tr 
                          key={batch.id} 
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
                                onChange={() => toggleSelectBatch(batch.id)}
                                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                              />
                              <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 w-5 text-right">
                                {index + 1}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                            {batch.productName}
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                            {batch.batchNumber}
                          </td>
                          <td className="p-3 text-slate-500">{batch.manufacturingDate}</td>
                          <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                            {batch.expiryDate}
                          </td>
                          <td className="p-3 text-slate-500">{batch.storageLocation}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                            {batch.availableQuantity} units
                          </td>
                          <td className="p-3 font-mono font-medium">{formatCurrency(batch.sellingPrice)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              batch.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                              batch.status === 'NEAR_EXPIRY' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                              batch.status === 'QUARANTINED' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                              'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {batch.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-1">
                            {batch.status !== 'QUARANTINED' && batch.status !== 'DISPOSED' && (
                              <button
                                onClick={() => {
                                  setSelectedBatch(batch);
                                  setShowQuarantineModal(true);
                                }}
                                className="px-2 py-1 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 hover:bg-purple-100 rounded text-[10px] font-bold"
                                title="Quarantine batch"
                              >
                                Quarantine
                              </button>
                            )}
                            {batch.status !== 'DISPOSED' && (
                              <button
                                onClick={() => {
                                  setSelectedBatch(batch);
                                  setShowDisposeModal(true);
                                }}
                                className="px-2 py-1 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-100 rounded text-[10px] font-bold"
                                title="Destruction & disposal"
                              >
                                Dispose
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Floating Bulk Action Bar for Batches */}
          <FloatingBulkActionBar
            selectedCount={selectedBatchIds.length}
            totalCount={filteredBatches.length}
            onClearSelection={() => setSelectedBatchIds([])}
            actions={[
              {
                label: 'Export Batches CSV',
                icon: FileSpreadsheet,
                onClick: handleExportBatchesCSV,
                variant: 'secondary'
              }
            ]}
          />
        </div>
      )}
      {/* TAB 2: IMMUTABLE MOVEMENT LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-white block">
                Immutable Stock Movement Ledger (Audit-Ready)
              </span>
              <span className="text-[11px] text-slate-500">
                No row mutation permitted. Changes reflect through balancing counter-entries.
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={movementTypeFilter}
                onChange={e => setMovementTypeFilter(e.target.value)}
                className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Movement Types</option>
                <option value="PURCHASE_RECEIVE">Purchase Receive</option>
                <option value="POS_SALE">POS Sale</option>
                <option value="QUARANTINE_TRANSFER">Quarantine Transfer</option>
                <option value="DISPOSAL_WRITE_OFF">Disposal Write-off</option>
                <option value="INVENTORY_ADJUSTMENT">Inventory Adjustment</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800 select-none">
                  <tr>
                    <th className="p-3 w-16 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <input
                          ref={el => {
                            if (el) el.indeterminate = isSomeLedgerSelected;
                          }}
                          type="checkbox"
                          checked={isAllLedgerSelected}
                          onChange={toggleSelectAllLedger}
                          className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                          title="Select All"
                        />
                        <span className="font-mono text-[11px] text-slate-400">#</span>
                      </div>
                    </th>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Movement Type</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Batch Number</th>
                    <th className="p-3">Quantity Delta</th>
                    <th className="p-3">Balance Before</th>
                    <th className="p-3">Balance After</th>
                    <th className="p-3">Reference #</th>
                    <th className="p-3">Actor</th>
                    <th className="p-3">Clinical / Business Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-400">
                        No ledger movements recorded matching the filter.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((mov, index) => {
                      const isSelected = selectedLedgerIds.includes(mov.id);
                      return (
                        <tr 
                          key={mov.id} 
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
                                onChange={() => toggleSelectLedger(mov.id)}
                                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                              />
                              <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 w-5 text-right">
                                {index + 1}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-500">{mov.timestamp}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              mov.movementType === 'PURCHASE_RECEIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                              mov.movementType === 'POS_SALE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                              mov.movementType === 'QUARANTINE_TRANSFER' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                              'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {mov.movementType}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{mov.productName}</td>
                          <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{mov.batchNumber}</td>
                          <td className={`p-3 font-bold font-mono ${mov.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                          </td>
                          <td className="p-3 font-mono">{mov.balanceBefore}</td>
                          <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{mov.balanceAfter}</td>
                          <td className="p-3 font-mono text-brand-600">{mov.referenceNumber}</td>
                          <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">{mov.actorName}</td>
                          <td className="p-3 text-slate-500 max-w-xs truncate">{mov.reason || 'N/A'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Floating Bulk Action Bar for Ledger */}
          <FloatingBulkActionBar
            selectedCount={selectedLedgerIds.length}
            totalCount={filteredMovements.length}
            onClearSelection={() => setSelectedLedgerIds([])}
            actions={[
              {
                label: 'Export Ledger CSV',
                icon: FileSpreadsheet,
                onClick: handleExportLedgerCSV,
                variant: 'secondary'
              }
            ]}
          />
        </div>
      )}

      {/* TAB 3: QUARANTINE & RECALL */}
      {activeTab === 'quarantine' && (
        <div className="space-y-3">
          <div className="bg-purple-50 dark:bg-purple-950/40 p-4 rounded-xl border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Quarantine & Clinical Recall Holding Zone</p>
              <p className="mt-0.5">
                Batches in this zone are strictly barred from the POS register. Disposal requires authorized witness sign-off.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-semibold text-slate-600 dark:text-slate-400 select-none">
                <tr>
                  <th className="p-3 w-16 text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      <input
                        type="checkbox"
                        checked={quarantinedBatches.length > 0 && quarantinedBatches.every(b => selectedQuarantineIds.includes(b.id))}
                        onChange={() => {
                          if (quarantinedBatches.every(b => selectedQuarantineIds.includes(b.id))) {
                            setSelectedQuarantineIds([]);
                          } else {
                            setSelectedQuarantineIds(quarantinedBatches.map(b => b.id));
                          }
                        }}
                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                        title="Select All"
                      />
                      <span className="font-mono text-[11px] text-slate-400">#</span>
                    </div>
                  </th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Batch Number</th>
                  <th className="p-3">Physical Qty</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {quarantinedBatches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No quarantined or recalled items.
                    </td>
                  </tr>
                ) : (
                  quarantinedBatches.map((b, index) => {
                    const isSelected = selectedQuarantineIds.includes(b.id);
                    return (
                      <tr 
                        key={b.id}
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
                              onChange={() => {
                                setSelectedQuarantineIds(prev =>
                                  prev.includes(b.id) ? prev.filter(id => id !== b.id) : [...prev, b.id]
                                );
                              }}
                              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                            />
                            <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 w-5 text-right">
                              {index + 1}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{b.productName}</td>
                        <td className="p-3 font-mono">{b.batchNumber}</td>
                        <td className="p-3 font-bold text-rose-600">{b.quantityOnHand} units</td>
                        <td className="p-3 text-slate-500">{b.storageLocation}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                            {b.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {b.status !== 'DISPOSED' && (
                            <button
                              onClick={() => {
                                setSelectedBatch(b);
                                setShowDisposeModal(true);
                              }}
                              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-[10px]"
                            >
                              Execute Destruction
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <FloatingBulkActionBar
            selectedCount={selectedQuarantineIds.length}
            totalCount={quarantinedBatches.length}
            onClearSelection={() => setSelectedQuarantineIds([])}
            actions={[
              {
                label: 'Export Isolation List',
                icon: FileSpreadsheet,
                onClick: () => alert(`Exporting ${selectedQuarantineIds.length} isolated batch records`),
                variant: 'secondary'
              }
            ]}
          />
        </div>
      )}

      {/* TAB 4: PHYSICAL STOCK COUNT SESSION */}
      {activeTab === 'counts' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Cycle Count Session #CNT-2026-0920</h3>
              <p className="text-xs text-slate-500">Dispensary Fast-Movers Audit • Auditor: Babatunde Fashola</p>
            </div>
            {!isCountPosted ? (
              <button
                onClick={() => {
                  setIsCountPosted(true);
                  alert('Stock count session posted. Discrepancy of -2 units Coartem written off to ledger.');
                }}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow"
              >
                Post Variance to Ledger
              </button>
            ) : (
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Audited & Posted</span>
              </span>
            )}
          </div>

          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-semibold text-slate-600 select-none">
              <tr>
                <th className="p-3 w-16 text-center">
                  <div className="flex items-center justify-center space-x-1.5">
                    <input
                      type="checkbox"
                      checked={countItems.length > 0 && countItems.every(c => selectedCountIds.includes(c.id))}
                      onChange={() => {
                        if (countItems.every(c => selectedCountIds.includes(c.id))) {
                          setSelectedCountIds([]);
                        } else {
                          setSelectedCountIds(countItems.map(c => c.id));
                        }
                      }}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                      title="Select All"
                    />
                    <span className="font-mono text-[11px] text-slate-400">#</span>
                  </div>
                </th>
                <th className="p-3">Medicine</th>
                <th className="p-3">System Expected</th>
                <th className="p-3">Physical Count</th>
                <th className="p-3">Variance</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {countItems.map((item, i) => {
                const isSelected = selectedCountIds.includes(item.id);
                return (
                  <tr 
                    key={i}
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
                          onChange={() => {
                            setSelectedCountIds(prev =>
                              prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                            );
                          }}
                          className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                        />
                        <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 w-5 text-right">
                          {i + 1}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{item.name}</td>
                    <td className="p-3 font-mono">{item.expected} units</td>
                    <td className="p-3">
                      <input
                        type="number"
                        disabled={isCountPosted}
                        value={item.counted}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 0;
                          const updated = [...countItems];
                          updated[i].counted = val;
                          updated[i].variance = val - updated[i].expected;
                          setCountItems(updated);
                        }}
                        className="w-20 px-2 py-1 border rounded bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                      />
                    </td>
                    <td className={`p-3 font-bold font-mono ${item.variance === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {item.variance === 0 ? '0 (Match)' : `${item.variance} units`}
                    </td>
                    <td className="p-3">
                      {item.variance === 0 ? (
                        <span className="text-emerald-600 font-bold">Exact Match</span>
                      ) : (
                        <span className="text-rose-600 font-bold">Discrepancy</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL 1: RECORD MANUAL STOCK INTAKE / ADJUSTMENT */}
      {showIntakeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCommitIntake} className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                  <Boxes className="w-5 h-5 text-brand-600" />
                  <span>Record Stock Intake / Adjustment</span>
                </h3>
                <p className="text-xs text-slate-500">Manually onboard opening inventory, adjust audit variances, or log stock movements</p>
              </div>
              <button type="button" onClick={() => setShowIntakeModal(false)}><X className="w-4 h-4" /></button>
            </div>

            {/* In-Modal Guidance */}
            <WorkflowGuideNotice
              compact
              title="Purpose of Stock Intake & Adjustments"
              badge="Stock Ledger Protocol"
              icon={Info}
              summary="Updates shelf stock balances outside the standard PO workflow (e.g. for opening balance onboarding, donations, or physical audit adjustments). Automatically writes an immutable audit record."
            />

            <div className="space-y-3.5 text-xs">
              {/* Field 1: Medicine Formulation */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200">
                    Medicine Formulation <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Registered Formulary Product</span>
                </div>
                <select
                  value={intakeForm.productId}
                  onChange={e => {
                    const p = products.find(prod => prod.id === e.target.value);
                    setIntakeForm({
                      ...intakeForm,
                      productId: e.target.value,
                      unitCost: p ? p.unitCost : 18,
                      sellingPrice: p ? p.sellingPrice : 30
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-semibold focus:ring-2 focus:ring-brand-500"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.brandName} ({p.genericName}) - Current: {p.availableQuantity} in stock</option>
                  ))}
                </select>
                <FieldGuideNotice label="Read formulary item & examples" title="Registered Formulary Product">
                  <p>Select the registered medicine whose balance will be updated.</p>
                  <p className="mt-1">
                    <strong>Examples:</strong> <code className="font-mono text-brand-600 bg-brand-50 dark:bg-brand-950 px-1 rounded">Amoxil Forte 500mg</code> or <code className="font-mono text-brand-600 bg-brand-50 dark:bg-brand-950 px-1 rounded">Panadol Extra 500mg</code>.
                  </p>
                </FieldGuideNotice>
              </div>

              {/* Field 2 & 3: Batch Number & Adjustment Type */}
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
                    value={intakeForm.batchNumber}
                    onChange={e => setIntakeForm({ ...intakeForm, batchNumber: e.target.value })}
                    placeholder="e.g. AMX-2026-01A, PARA-2026-B1..."
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-mono font-bold focus:ring-2 focus:ring-brand-500"
                  />
                  <FieldGuideNotice label="Read batch traceability & examples" title="Recall Traceability Key">
                    <p>Enter exact manufacturer lot stamped on packaging (e.g. <code className="font-mono">AMX-2026-01A</code>) for recall safety.</p>
                  </FieldGuideNotice>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">
                      Adjustment Operation Type <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Ledger Classification</span>
                  </div>
                  <select
                    value={intakeForm.adjustmentType}
                    onChange={e => setIntakeForm({ ...intakeForm, adjustmentType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-semibold focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="INITIAL_ONBOARDING">Initial Opening Stock Onboarding (+)</option>
                    <option value="AUDIT_SURPLUS">Physical Cycle Count Surplus (+)</option>
                    <option value="DONATION_INTAKE">Emergency Supply / Donation Intake (+)</option>
                    <option value="DAMAGE_WRITE_OFF">Breakage & Damage Write-Off (-)</option>
                  </select>
                  <FieldGuideNotice label="Read operation types" title="Ledger Classification">
                    <p>Categorizes the transaction in the immutable movement ledger for internal and regulatory audits.</p>
                  </FieldGuideNotice>
                </div>
              </div>

              {/* Field 4 & 5: Quantity & Shelf Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">
                      Quantity (Base Dispensing Units) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Atomic Unit Count</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    required
                    value={intakeForm.qty}
                    onChange={e => setIntakeForm({ ...intakeForm, qty: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-bold font-mono focus:ring-2 focus:ring-brand-500"
                  />
                  <FieldGuideNotice label="Read quantity rules & examples" title="Atomic Units Count">
                    <p>Always enter in atomic base units (e.g. <code>200</code> for 2 boxes of 100 tablets).</p>
                  </FieldGuideNotice>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">
                      Storage Bin / Shelf Location
                    </label>
                    <span className="text-[10px] text-slate-400">Physical Dispensary Location</span>
                  </div>
                  <input
                    type="text"
                    value={intakeForm.storageLocation}
                    onChange={e => setIntakeForm({ ...intakeForm, storageLocation: e.target.value })}
                    placeholder="e.g. Aisle 2 - Shelf B3, Cold Vault 01..."
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-brand-500"
                  />
                  <FieldGuideNotice label="Read bin location tips" title="Dispensary Shelf Bin">
                    <p>Assists dispensary staff in rapid medicine retrieval (e.g. <code>Shelf A-01</code>).</p>
                  </FieldGuideNotice>
                </div>
              </div>

              {/* Field 6: Manufacturing & Expiry Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">
                      Manufacturing Date
                    </label>
                    <span className="text-[10px] text-slate-400">Factory Production Date</span>
                  </div>
                  <input
                    type="date"
                    value={intakeForm.mfgDate}
                    onChange={e => setIntakeForm({ ...intakeForm, mfgDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-brand-500"
                  />
                  <FieldGuideNotice label="Read mfg date guide" title="Factory Synthesis Date">
                    <p>Date of manufacture printed on packaging (e.g. <code>2026-03-01</code>).</p>
                  </FieldGuideNotice>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">
                      Expiry Date <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-brand-600 font-semibold">FEFO Queue Priority</span>
                  </div>
                  <input
                    type="date"
                    required
                    value={intakeForm.expDate}
                    onChange={e => setIntakeForm({ ...intakeForm, expDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-bold text-brand-600 focus:ring-2 focus:ring-brand-500"
                  />
                  <FieldGuideNotice label="Read FEFO queue priority" title="First-Expired, First-Out Queue">
                    <p>Enables the automated FEFO algorithm to dispense older viable batches first at POS (e.g. <code>2028-06-30</code>).</p>
                  </FieldGuideNotice>
                </div>
              </div>

              {/* Field 7: Unit Cost & Selling Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">
                      Unit Cost Price ({currentCurrency.symbol}) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Valuation Cost</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={intakeForm.unitCost}
                    onChange={e => setIntakeForm({ ...intakeForm, unitCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-mono font-bold focus:ring-2 focus:ring-brand-500"
                  />
                  <FieldGuideNotice label="Read valuation cost note" title="Base Unit Cost">
                    <p>Acquisition or valuation cost per atomic base unit (e.g. <code>GH₵18.00</code>).</p>
                  </FieldGuideNotice>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">
                      Unit Selling Price ({currentCurrency.symbol}) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-brand-600 font-semibold">POS Retail Price</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={intakeForm.sellingPrice}
                    onChange={e => setIntakeForm({ ...intakeForm, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-mono font-bold text-brand-600 focus:ring-2 focus:ring-brand-500"
                  />
                  <FieldGuideNotice label="Read retail price note" title="Dispensary Shelf Price">
                    <p>Standard patient price charged at POS cashier counter (e.g. <code>GH₵30.00</code>).</p>
                  </FieldGuideNotice>
                </div>
              </div>

              {/* Field 8: Authorizing Reason & Audit Notes */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200">
                    Authorizing Reason & Audit Reference <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Audit Trail Justification</span>
                </div>
                <textarea
                  rows={2}
                  required
                  value={intakeForm.reason}
                  onChange={e => setIntakeForm({ ...intakeForm, reason: e.target.value })}
                  placeholder="Explain why this manual stock intake or adjustment is being recorded..."
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-brand-500"
                />
                <FieldGuideNotice label="Read audit justification tips & examples" title="Audit Trail Justification">
                  <div className="space-y-1">
                    <p><strong>Example 1:</strong> <em>"Initial opening stock onboarding count reconciliation from legacy system."</em></p>
                    <p><strong>Example 2:</strong> <em>"Monthly cycle count surplus discovered during aisle audit."</em></p>
                  </div>
                </FieldGuideNotice>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowIntakeModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow transition"
              >
                Post Stock Record & Movement
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: QUARANTINE MODAL */}
      {showQuarantineModal && selectedBatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-purple-700 dark:text-purple-400 flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5" />
                <span>Isolate to Quarantine Holding</span>
              </h3>
              <button onClick={() => setShowQuarantineModal(false)}><X className="w-4 h-4" /></button>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-950/50 rounded-xl border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 text-xs">
              Quarantining batch <strong className="font-mono">{selectedBatch.batchNumber}</strong> ({selectedBatch.productName}). This batch will immediately be <strong>frozen and removed from POS dispensing</strong>.
            </div>

            <div>
              <div className="flex items-center justify-between mb-1 text-xs">
                <label className="font-semibold text-slate-800 dark:text-slate-200">
                  Clinical / Regulatory Quarantine Reason <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">Audit Justification</span>
              </div>
              <textarea
                value={quarantineReason}
                onChange={e => setQuarantineReason(e.target.value)}
                placeholder="Specify clinical rationale, regulatory notice number, or physical packaging defect..."
                className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-800 text-xs h-24 focus:ring-2 focus:ring-purple-500"
              />
              <FieldGuideNotice label="Read clinical quarantine examples" title="Clinical & Regulatory Quarantine Justification">
                <div className="space-y-1">
                  <p><strong>Example 1:</strong> <em>"Manufacturer recall alert #REC-2026-04 regarding dissolution failure."</em></p>
                  <p><strong>Example 2:</strong> <em>"Precipitate and cloudiness observed in clear ampoule solution during routine shelf check."</em></p>
                </div>
              </FieldGuideNotice>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button onClick={() => setShowQuarantineModal(false)} className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button onClick={handleQuarantine} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow transition">
                Confirm Quarantine Isolation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DISPOSAL MODAL */}
      {showDisposeModal && selectedBatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-rose-600 flex items-center space-x-2">
                <Trash2 className="w-5 h-5" />
                <span>Execute Irreversible Drug Destruction</span>
              </h3>
              <button onClick={() => setShowDisposeModal(false)}><X className="w-4 h-4" /></button>
            </div>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs">
              ⚠️ <strong>WARNING:</strong> This action permanently writes off batch <strong className="font-mono">{selectedBatch.batchNumber}</strong> ({selectedBatch.availableQuantity} units) and logs an irreversible destruction event in the regulatory audit trail.
            </div>

            <div>
              <div className="flex items-center justify-between mb-1 text-xs">
                <label className="font-semibold text-slate-800 dark:text-slate-200">
                  Destruction Certificate & Witness Details <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">EPA / FDA Ghana Compliance</span>
              </div>
              <textarea
                value={disposeReason}
                onChange={e => setDisposeReason(e.target.value)}
                placeholder="Disposal certificate number, destruction method, witnessed by Superintendent Pharmacist..."
                className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-800 text-xs h-24 focus:ring-2 focus:ring-rose-500"
              />
              <FieldGuideNotice label="Read regulatory destruction examples" title="EPA & FDA Ghana Disposal Protocol">
                <div className="space-y-1">
                  <p><strong>Example 1:</strong> <em>"Controlled pharmaceutical incineration witnessed by Superintendent Pharmacist and EPA Officer (Cert #DISP-9921)."</em></p>
                  <p><strong>Example 2:</strong> <em>"Chemical neutralization and certified medical waste consignment handover to Zoomlion Ghana."</em></p>
                </div>
              </FieldGuideNotice>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button onClick={() => setShowDisposeModal(false)} className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button onClick={handleDispose} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow transition">
                Execute Authorized Destruction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
