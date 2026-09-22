import React, { useState, useRef } from 'react';
import { 
  Boxes, Clock, ShieldAlert, History, ClipboardCheck, 
  AlertTriangle, Trash2, ArrowUpDown, Search, CheckCircle2, X, FileSpreadsheet,
  Plus, Info, BookOpen, HelpCircle, PackageCheck, Sparkles, ShieldCheck,
  Calendar, TrendingUp, RefreshCw
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Batch } from '../../types';
import { FloatingBulkActionBar } from '../../components/common/FloatingBulkActionBar';
import { WorkflowGuideNotice } from '../../components/common/WorkflowGuideNotice';
import { FieldGuideNotice } from '../../components/common/FieldGuideNotice';
import { Pagination } from '../../components/common/Pagination';
import { usePagination } from '../../hooks/usePagination';

export const InventoryPage: React.FC = () => {
  const { 
    batches, stockMovements, quarantineBatch, disposeBatch, 
    products, currentUser, formatCurrency, currentCurrency, receiveStock,
    toast, confirmDialog
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

  // Manual Stock Intake / Multi-Product Adjustment Modal State
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [updateMasterSellingPrice, setUpdateMasterSellingPrice] = useState(true);
  const [intakeMeta, setIntakeMeta] = useState({
    adjustmentType: 'INITIAL_ONBOARDING',
    reason: 'Initial opening stock onboarding count reconciliation.',
    defaultLocation: 'Dispensary Shelf A-01'
  });

  interface IntakeRow {
    id: string;
    productId: string;
    batchNumber: string;
    mfgDate: string;
    expDate: string;
    intakeUnitType: 'PACK' | 'BASE';
    packQty: number;
    packCost: number;
    packSellingPrice: number;
    qty: number;
    unitCost: number;
    sellingPrice: number;
    storageLocation: string;
  }

  const [intakeRows, setIntakeRows] = useState<IntakeRow[]>([]);

  // Automated Batch / Lot Number Generator
  const generateAutoBatchNumber = (prodName?: string) => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    let prefix = 'LOT';
    if (prodName) {
      const clean = prodName.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3);
      if (clean.length >= 2) prefix = clean;
    }
    const rand = Math.floor(100 + Math.random() * 900);
    return `${prefix}-${y}${m}${d}-${rand}`;
  };

  // Helper to open intake modal with initial rows if empty
  const handleOpenIntakeModal = () => {
    if (intakeRows.length === 0 && products.length > 0) {
      const today = new Date();
      const mfg = new Date(today.getFullYear(), today.getMonth() - 2, 1).toISOString().slice(0, 10);
      const exp = new Date(today.getFullYear() + 2, today.getMonth() + 4, 28).toISOString().slice(0, 10);
      const p1 = products[0];
      const p2 = products[1] || products[0];

      const p1Pack = p1.packagingTiers?.find(t => t.tierType === 'PACK');
      const p1Mult = p1Pack?.multiplier || 10;
      const p1HasPack = !!p1Pack;
      const p1PackCost = p1Pack?.costPrice || Number(((p1.unitCost || 18.00) * p1Mult).toFixed(2));
      const p1PackSelling = p1Pack?.sellingPrice || Number(((p1.sellingPrice || 30.00) * p1Mult).toFixed(2));

      const p2Pack = p2.packagingTiers?.find(t => t.tierType === 'PACK');
      const p2Mult = p2Pack?.multiplier || 10;
      const p2HasPack = !!p2Pack;
      const p2PackCost = p2Pack?.costPrice || Number(((p2.unitCost || 25.00) * p2Mult).toFixed(2));
      const p2PackSelling = p2Pack?.sellingPrice || Number(((p2.sellingPrice || 40.00) * p2Mult).toFixed(2));
      
      setIntakeRows([
        {
          id: `row_1`,
          productId: p1.id,
          batchNumber: generateAutoBatchNumber(p1.brandName),
          mfgDate: mfg,
          expDate: exp,
          intakeUnitType: (p1HasPack ? 'PACK' : 'BASE') as 'PACK' | 'BASE',
          packQty: p1HasPack ? 10 : 1,
          packCost: p1PackCost,
          packSellingPrice: p1PackSelling,
          qty: p1HasPack ? 10 * p1Mult : 100,
          unitCost: p1.unitCost || 18.00,
          sellingPrice: p1.sellingPrice || 30.00,
          storageLocation: 'Dispensary Shelf A-01'
        },
        ...(products.length > 1 ? [{
          id: `row_2`,
          productId: p2.id,
          batchNumber: generateAutoBatchNumber(p2.brandName),
          mfgDate: mfg,
          expDate: exp,
          intakeUnitType: (p2HasPack ? 'PACK' : 'BASE') as 'PACK' | 'BASE',
          packQty: p2HasPack ? 5 : 1,
          packCost: p2PackCost,
          packSellingPrice: p2PackSelling,
          qty: p2HasPack ? 5 * p2Mult : 50,
          unitCost: p2.unitCost || 25.00,
          sellingPrice: p2.sellingPrice || 40.00,
          storageLocation: 'Dispensary Shelf B-02'
        }] : [])
      ]);
    }
    setShowIntakeModal(true);
  };

  const handleAddIntakeRow = () => {
    const today = new Date();
    const mfg = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().slice(0, 10);
    const exp = new Date(today.getFullYear() + 2, today.getMonth() + 3, 28).toISOString().slice(0, 10);
    const prod = products[intakeRows.length % products.length] || products[0];

    const packTier = prod?.packagingTiers?.find(t => t.tierType === 'PACK');
    const mult = packTier?.multiplier || 10;
    const hasPack = !!packTier;
    const packCost = packTier?.costPrice || Number(((prod?.unitCost || 18.00) * mult).toFixed(2));
    const packSelling = packTier?.sellingPrice || Number(((prod?.sellingPrice || 30.00) * mult).toFixed(2));

    setIntakeRows(prev => [
      ...prev,
      {
        id: `row_${Date.now()}_${Math.random()}`,
        productId: prod?.id || '',
        batchNumber: generateAutoBatchNumber(prod?.brandName),
        mfgDate: mfg,
        expDate: exp,
        intakeUnitType: (hasPack ? 'PACK' : 'BASE') as 'PACK' | 'BASE',
        packQty: hasPack ? 5 : 1,
        packCost: packCost,
        packSellingPrice: packSelling,
        qty: hasPack ? 5 * mult : 50,
        unitCost: prod?.unitCost || 18.00,
        sellingPrice: prod?.sellingPrice || 30.00,
        storageLocation: intakeMeta.defaultLocation || 'Dispensary Shelf A-01'
      }
    ]);
  };

  const handleRemoveIntakeRow = (id: string) => {
    setIntakeRows(prev => prev.filter(r => r.id !== id));
  };

  const handleUpdateIntakeRow = (id: string, field: keyof IntakeRow, value: any) => {
    setIntakeRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      if (field === 'productId') {
        const prod = products.find(p => p.id === value);
        const packTier = prod?.packagingTiers?.find(t => t.tierType === 'PACK');
        const mult = packTier?.multiplier || 10;
        const hasPack = !!packTier;
        const packCost = packTier?.costPrice || Number(((prod?.unitCost || 18.00) * mult).toFixed(2));
        const packSelling = packTier?.sellingPrice || Number(((prod?.sellingPrice || 30.00) * mult).toFixed(2));
        return {
          ...r,
          productId: value,
          batchNumber: generateAutoBatchNumber(prod?.brandName),
          intakeUnitType: (hasPack ? 'PACK' : 'BASE') as 'PACK' | 'BASE',
          packQty: hasPack ? 5 : 1,
          packCost: packCost,
          packSellingPrice: packSelling,
          qty: hasPack ? 5 * mult : 50,
          unitCost: prod ? prod.unitCost : r.unitCost,
          sellingPrice: prod ? prod.sellingPrice : r.sellingPrice
        };
      }
      if (field === 'intakeUnitType') {
        const prod = products.find(p => p.id === r.productId);
        const packTier = prod?.packagingTiers?.find(t => t.tierType === 'PACK');
        const mult = packTier?.multiplier || 10;
        if (value === 'PACK') {
          const pCost = r.packCost || Number((r.unitCost * mult).toFixed(2));
          const pSell = r.packSellingPrice || Number((r.sellingPrice * mult).toFixed(2));
          const pQty = r.packQty > 0 ? r.packQty : Math.max(1, Math.round(r.qty / mult));
          return {
            ...r,
            intakeUnitType: 'PACK',
            packQty: pQty,
            packCost: pCost,
            packSellingPrice: pSell,
            qty: pQty * mult,
            unitCost: mult > 0 ? Number((pCost / mult).toFixed(2)) : r.unitCost,
            sellingPrice: mult > 0 ? Number((pSell / mult).toFixed(2)) : r.sellingPrice
          };
        } else {
          return {
            ...r,
            intakeUnitType: 'BASE'
          };
        }
      }
      if (field === 'packQty') {
        const num = Math.max(0, parseInt(value) || 0);
        const prod = products.find(p => p.id === r.productId);
        const mult = prod?.packagingTiers?.find(t => t.tierType === 'PACK')?.multiplier || 10;
        return { ...r, packQty: num, qty: num * mult };
      }
      if (field === 'packCost') {
        const cost = Math.max(0, parseFloat(value) || 0);
        const prod = products.find(p => p.id === r.productId);
        const mult = prod?.packagingTiers?.find(t => t.tierType === 'PACK')?.multiplier || 10;
        return { ...r, packCost: cost, unitCost: mult > 0 ? Number((cost / mult).toFixed(2)) : cost };
      }
      if (field === 'packSellingPrice') {
        const sell = Math.max(0, parseFloat(value) || 0);
        const prod = products.find(p => p.id === r.productId);
        const mult = prod?.packagingTiers?.find(t => t.tierType === 'PACK')?.multiplier || 10;
        return { ...r, packSellingPrice: sell, sellingPrice: mult > 0 ? Number((sell / mult).toFixed(2)) : sell };
      }
      if (field === 'qty') {
        const num = Math.max(0, parseInt(value) || 0);
        return { ...r, qty: num };
      }
      if (field === 'unitCost') {
        const cost = Math.max(0, parseFloat(value) || 0);
        return { ...r, unitCost: cost };
      }
      if (field === 'sellingPrice') {
        const sell = Math.max(0, parseFloat(value) || 0);
        return { ...r, sellingPrice: sell };
      }
      return { ...r, [field]: value };
    }));
  };

  // Stock count demo state
  const [countItems, setCountItems] = useState([
    { id: 'prod_amox_500', name: 'Amoxil Forte 500mg', expected: 185, counted: 185, variance: 0 },
    { id: 'prod_coartem_80', name: 'Coartem 80/480', expected: 92, counted: 90, variance: -2 },
    { id: 'prod_para_500', name: 'Panadol Extra 500mg', expected: 340, counted: 340, variance: 0 },
  ]);
  const [isCountPosted, setIsCountPosted] = useState(false);

  const handleCommitIntake = (e: React.FormEvent) => {
    e.preventDefault();
    if (intakeRows.length === 0) {
      toast.warning('Please add at least one product line to record stock intake.', 'Missing Product Lines');
      return;
    }
    for (let i = 0; i < intakeRows.length; i++) {
      const row = intakeRows[i];
      if (!row.productId) {
        toast.warning(`Please select a valid medicine formulation on row #${i + 1}.`, 'Incomplete Line');
        return;
      }
      if (!row.batchNumber.trim()) {
        toast.warning(`Please specify a manufacturer batch/lot number on row #${i + 1}.`, 'Batch Number Required');
        return;
      }
      if (!row.qty || row.qty <= 0) {
        toast.warning(`Please specify a valid quantity greater than 0 on row #${i + 1}.`, 'Invalid Quantity');
        return;
      }
    }

    const refCode = `ADJ-${Date.now().toString().slice(-4)}`;
    receiveStock(refCode, intakeRows.map(r => {
      const prod = products.find(p => p.id === r.productId);
      let packagingTiers = updateMasterSellingPrice ? prod?.packagingTiers : undefined;
      if (updateMasterSellingPrice && r.intakeUnitType === 'PACK' && packagingTiers) {
        packagingTiers = packagingTiers.map(t => {
          if (t.tierType === 'PACK') {
            return { ...t, costPrice: r.packCost, sellingPrice: r.packSellingPrice };
          }
          return t;
        });
      }
      return {
        productId: r.productId,
        batchNumber: r.batchNumber,
        mfgDate: r.mfgDate,
        expDate: r.expDate,
        qty: r.qty,
        unitCost: r.unitCost,
        sellingPrice: r.sellingPrice,
        packagingTiers,
        updateMasterSellingPrice
      };
    }));

    toast.success(`Successfully recorded stock intake for ${intakeRows.length} product lines under reference ${refCode}!`, 'Stock Intake Recorded');
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

  const {
    currentPage: batchesPage,
    setCurrentPage: setBatchesPage,
    paginatedItems: paginatedBatches,
  } = usePagination(filteredBatches, 10, [searchTerm, batchStatusFilter]);

  const {
    currentPage: movementsPage,
    setCurrentPage: setMovementsPage,
    paginatedItems: paginatedMovements,
  } = usePagination(filteredMovements, 10, [movementTypeFilter]);

  const {
    currentPage: quarantinePage,
    setCurrentPage: setQuarantinePage,
    paginatedItems: paginatedQuarantine,
  } = usePagination(quarantinedBatches, 10);

  const {
    currentPage: countItemsPage,
    setCurrentPage: setCountItemsPage,
    paginatedItems: paginatedCountItems,
  } = usePagination(countItems, 10);

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
      toast.warning('Please specify the quarantine reason.', 'Reason Required');
      return;
    }
    if (selectedBatch) {
      quarantineBatch(selectedBatch.id, quarantineReason);
      toast.warning(`Batch ${selectedBatch.batchNumber} has been quarantined: "${quarantineReason}"`, 'Batch Quarantined');
      setShowQuarantineModal(false);
      setQuarantineReason('');
    }
  };

  const handleDispose = () => {
    if (!disposeReason.trim()) {
      toast.warning('Please specify the disposal reason and destruction witness.', 'Disposal Details Required');
      return;
    }
    if (selectedBatch) {
      disposeBatch(selectedBatch.id, disposeReason);
      toast.error(`Batch ${selectedBatch.batchNumber} logged for destruction disposal.`, 'Batch Disposed');
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
            onClick={handleOpenIntakeModal}
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
                    paginatedBatches.map((batch, index) => {
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
                                {(batchesPage - 1) * 10 + index + 1}
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

            <Pagination
              currentPage={batchesPage}
              totalItems={filteredBatches.length}
              pageSize={10}
              onPageChange={setBatchesPage}
              itemName="batches"
            />
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
                    paginatedMovements.map((mov, index) => {
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
                                {(movementsPage - 1) * 10 + index + 1}
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

            <Pagination
              currentPage={movementsPage}
              totalItems={filteredMovements.length}
              pageSize={10}
              onPageChange={setMovementsPage}
              itemName="ledger movements"
            />
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
                  paginatedQuarantine.map((b, index) => {
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
                              {(quarantinePage - 1) * 10 + index + 1}
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

          <Pagination
            currentPage={quarantinePage}
            totalItems={quarantinedBatches.length}
            pageSize={10}
            onPageChange={setQuarantinePage}
            itemName="quarantined items"
          />

          <FloatingBulkActionBar
            selectedCount={selectedQuarantineIds.length}
            totalCount={quarantinedBatches.length}
            onClearSelection={() => setSelectedQuarantineIds([])}
            actions={[
              {
                label: 'Export Isolation List',
                icon: FileSpreadsheet,
                onClick: () => toast.info(`Exporting ${selectedQuarantineIds.length} isolated batch records...`, 'Export Started'),
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
                onClick={async () => {
                  const ok = await confirmDialog({
                    title: 'Post Stock Count Variance',
                    message: 'Commit this cycle count session? Discrepancy of -2 units Coartem will be written off to the inventory ledger.',
                    variant: 'warning',
                    confirmText: 'Post Variance',
                    cancelText: 'Cancel'
                  });
                  if (ok) {
                    setIsCountPosted(true);
                    toast.success('Stock count session posted. Discrepancy written off to ledger.', 'Audit Committed');
                  }
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
              {paginatedCountItems.map((item, i) => {
                const isSelected = selectedCountIds.includes(item.id);
                return (
                  <tr 
                    key={item.id}
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
                          {(countItemsPage - 1) * 10 + i + 1}
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
                        onChange={(e) => {
                          const updated = [...countItems];
                          const targetIdx = countItems.findIndex(c => c.id === item.id);
                          if (targetIdx !== -1) {
                            updated[targetIdx].counted = Number(e.target.value);
                            setCountItems(updated);
                          }
                        }}
                        className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                      />
                    </td>
                    <td className="p-3 font-mono font-bold">
                      <span className={item.counted - item.expected < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                        {item.counted - item.expected > 0 ? `+${item.counted - item.expected}` : item.counted - item.expected}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.counted === item.expected ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {item.counted === item.expected ? 'BALANCED' : 'VARIANCE'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <Pagination
            currentPage={countItemsPage}
            totalItems={countItems.length}
            pageSize={10}
            onPageChange={setCountItemsPage}
            itemName="audit count items"
          />
        </div>
      )}

      {/* MODAL 1: RECORD MANUAL STOCK INTAKE / MULTI-PRODUCT ADJUSTMENT (LANDSCAPE) */}
      {showIntakeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <form onSubmit={handleCommitIntake} className="bg-white dark:bg-slate-900 rounded-2xl max-w-7xl w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[95vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                    <span>Record Stock Intake & Multi-Product Adjustment</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                      Landscape Intake Mode
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Onboard opening stock batches, adjust physical counts, and calculate retail profit margins across multiple medicines
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowIntakeModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simplified Global Intake Settings (Top Bar) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Adjustment Operation Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={intakeMeta.adjustmentType}
                  onChange={e => setIntakeMeta({ ...intakeMeta, adjustmentType: e.target.value })}
                  className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="INITIAL_ONBOARDING">Initial Opening Stock Onboarding (+)</option>
                  <option value="AUDIT_SURPLUS">Physical Cycle Count Surplus (+)</option>
                  <option value="DONATION_INTAKE">Emergency Supply / Donation Intake (+)</option>
                  <option value="DAMAGE_WRITE_OFF">Breakage & Damage Write-Off (-)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Default Shelf / Storage Location
                </label>
                <input
                  type="text"
                  value={intakeMeta.defaultLocation}
                  onChange={e => setIntakeMeta({ ...intakeMeta, defaultLocation: e.target.value })}
                  placeholder="e.g. Dispensary Shelf A-01, Vault..."
                  className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Authorizing Reason & Audit Reference <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={intakeMeta.reason}
                  onChange={e => setIntakeMeta({ ...intakeMeta, reason: e.target.value })}
                  placeholder="e.g. Opening balance onboarding count reconciliation..."
                  className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Landscape Multi-Product Table */}
            <div className="flex-1 overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shrink-0">
                <span className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <Boxes className="w-3.5 h-3.5 text-brand-600" />
                  <span>Product Lines to Receive / Adjust ({intakeRows.length})</span>
                </span>
                <button
                  type="button"
                  onClick={handleAddIntakeRow}
                  className="px-2.5 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product Line</span>
                </button>
              </div>

              <div className="overflow-x-auto overflow-y-auto flex-1">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5 w-10 text-center">#</th>
                      <th className="p-2.5 min-w-[210px]">Medicine Name *</th>
                      <th className="p-2.5 min-w-[130px]">Batch / Lot # *</th>
                      <th className="p-2.5 min-w-[140px]">Unit Type</th>
                      <th className="p-2.5 min-w-[120px]">Mfg Date</th>
                      <th className="p-2.5 min-w-[120px]">Expiry Date *</th>
                      <th className="p-2.5 min-w-[130px]">Stock Qty *</th>
                      <th className="p-2.5 min-w-[130px]">Buy Price ({currentCurrency.symbol}) *</th>
                      <th className="p-2.5 min-w-[130px]">Sell Price ({currentCurrency.symbol}) *</th>
                      <th className="p-2.5 min-w-[150px]">Profit Margin</th>
                      <th className="p-2.5 min-w-[100px]">Total Value</th>
                      <th className="p-2.5 w-10 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {intakeRows.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="p-8 text-center text-slate-400 dark:text-slate-500">
                          <p className="font-semibold mb-2">No product lines in intake list.</p>
                          <button
                            type="button"
                            onClick={handleAddIntakeRow}
                            className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-bold shadow"
                          >
                            + Add First Product
                          </button>
                        </td>
                      </tr>
                    ) : (
                      intakeRows.map((row, index) => {
                        const prod = products.find(p => p.id === row.productId);
                        const packTier = prod?.packagingTiers?.find(t => t.tierType === 'PACK');
                        const packMultiplier = packTier?.multiplier || 10;
                        const hasPack = !!packTier;
                        const isPackMode = row.intakeUnitType === 'PACK';

                        const lineCost = (row.qty || 0) * (row.unitCost || 0);
                        const margin = (row.sellingPrice || 0) - (row.unitCost || 0);
                        const marginPercent = (row.sellingPrice || 0) > 0 ? ((margin / row.sellingPrice) * 100) : 0;
                        const markupPercent = (row.unitCost || 0) > 0 ? ((margin / row.unitCost) * 100) : 0;
                        const isHealthy = margin > 0 && marginPercent >= 20;
                        const isWarning = margin > 0 && marginPercent < 20;
                        const isLoss = margin <= 0;

                        return (
                          <tr key={row.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                            <td className="p-2 text-center font-mono font-bold text-slate-400">
                              {index + 1}
                            </td>
                            {/* Medicine Formulation */}
                            <td className="p-2">
                              <select
                                required
                                value={row.productId}
                                onChange={e => handleUpdateIntakeRow(row.id, 'productId', e.target.value)}
                                className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-semibold text-xs focus:ring-1 focus:ring-brand-500"
                              >
                                {products.map(p => (
                                  <option key={p.id} value={p.id}>
                                    {p.brandName} ({p.genericName}) [Stock: {p.availableQuantity}]
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Batch / Lot */}
                            <td className="p-2">
                              <div className="relative flex items-center">
                                <input
                                  type="text"
                                  required
                                  value={row.batchNumber}
                                  onChange={e => handleUpdateIntakeRow(row.id, 'batchNumber', e.target.value)}
                                  placeholder="Auto lot #"
                                  className="w-full pl-2 pr-7 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-mono font-bold text-xs focus:ring-1 focus:ring-brand-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const p = products.find(prod => prod.id === row.productId);
                                    handleUpdateIntakeRow(row.id, 'batchNumber', generateAutoBatchNumber(p?.brandName));
                                  }}
                                  className="absolute right-1 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 p-1 rounded"
                                  title="Re-generate auto Batch / Lot #"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
                                ✓ Auto-Generated
                              </span>
                            </td>

                            {/* Intake Unit Mode Selector */}
                            <td className="p-2">
                              {hasPack ? (
                                <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateIntakeRow(row.id, 'intakeUnitType', 'PACK')}
                                    className={`px-2 py-1 rounded text-[10px] font-bold transition flex items-center space-x-1 ${
                                      isPackMode
                                        ? 'bg-brand-600 text-white shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                    }`}
                                    title={`1 Pack = ${packMultiplier} ${prod?.baseUnit || 'units'}`}
                                  >
                                    <span>📦 Pack ({packMultiplier})</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateIntakeRow(row.id, 'intakeUnitType', 'BASE')}
                                    className={`px-2 py-1 rounded text-[10px] font-bold transition flex items-center space-x-1 ${
                                      !isPackMode
                                        ? 'bg-brand-600 text-white shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                    }`}
                                    title={`Loose ${prod?.baseUnit || 'units'}`}
                                  >
                                    <span>💊 {prod?.baseUnit || 'Loose'}</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-semibold border border-slate-200 dark:border-slate-700">
                                  💊 {prod?.baseUnit || 'Loose Unit'}
                                </span>
                              )}
                            </td>

                            {/* Mfg Date with Calendar Picker */}
                            <td className="p-2">
                              <input
                                type="date"
                                value={row.mfgDate}
                                onChange={e => handleUpdateIntakeRow(row.id, 'mfgDate', e.target.value)}
                                className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-brand-500"
                              />
                            </td>

                            {/* Expiry Date with Calendar Picker */}
                            <td className="p-2">
                              <input
                                type="date"
                                required
                                value={row.expDate}
                                onChange={e => handleUpdateIntakeRow(row.id, 'expDate', e.target.value)}
                                className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-bold text-brand-600 dark:text-brand-400 text-xs focus:ring-1 focus:ring-brand-500"
                              />
                            </td>

                            {/* Quantity */}
                            <td className="p-2">
                              {isPackMode ? (
                                <div>
                                  <input
                                    type="number"
                                    min="1"
                                    required
                                    value={row.packQty}
                                    onChange={e => handleUpdateIntakeRow(row.id, 'packQty', e.target.value)}
                                    className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-bold font-mono text-center text-xs focus:ring-1 focus:ring-brand-500"
                                    placeholder="Boxes"
                                  />
                                  <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold block mt-0.5 text-center truncate">
                                    = {row.qty.toLocaleString()} {prod?.baseUnit || 'tabs'}
                                  </span>
                                </div>
                              ) : (
                                <div>
                                  <input
                                    type="number"
                                    min="1"
                                    required
                                    value={row.qty}
                                    onChange={e => handleUpdateIntakeRow(row.id, 'qty', parseInt(e.target.value) || 0)}
                                    className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-bold font-mono text-center text-xs focus:ring-1 focus:ring-brand-500"
                                    placeholder="Loose units"
                                  />
                                  <span className="text-[10px] text-slate-400 block mt-0.5 text-center">
                                    {prod?.baseUnit || 'units'}
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Cost Price */}
                            <td className="p-2">
                              {isPackMode ? (
                                <div className="space-y-0.5">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    value={row.packCost}
                                    onChange={e => handleUpdateIntakeRow(row.id, 'packCost', e.target.value)}
                                    className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-bold font-mono text-xs focus:ring-1 focus:ring-brand-500"
                                    placeholder="Cost / Pack"
                                  />
                                  <span className="text-[10px] text-slate-400 block truncate">
                                    {formatCurrency(row.unitCost)} / {prod?.baseUnit || 'tab'}
                                  </span>
                                </div>
                              ) : (
                                <div className="space-y-0.5">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    value={row.unitCost}
                                    onChange={e => handleUpdateIntakeRow(row.id, 'unitCost', parseFloat(e.target.value) || 0)}
                                    className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-bold font-mono text-xs focus:ring-1 focus:ring-brand-500"
                                    placeholder="Cost / Unit"
                                  />
                                  <span className="text-[10px] text-slate-400 block truncate">
                                    Per {prod?.baseUnit || 'unit'}
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Selling Price */}
                            <td className="p-2">
                              {isPackMode ? (
                                <div className="space-y-0.5">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    value={row.packSellingPrice}
                                    onChange={e => handleUpdateIntakeRow(row.id, 'packSellingPrice', e.target.value)}
                                    className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-bold font-mono text-xs text-brand-600 dark:text-brand-400 focus:ring-1 focus:ring-brand-500"
                                    placeholder="Sell / Pack"
                                  />
                                  <span className="text-[10px] text-brand-600/80 font-medium block truncate">
                                    {formatCurrency(row.sellingPrice)} / {prod?.baseUnit || 'tab'}
                                  </span>
                                </div>
                              ) : (
                                <div className="space-y-0.5">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    value={row.sellingPrice}
                                    onChange={e => handleUpdateIntakeRow(row.id, 'sellingPrice', parseFloat(e.target.value) || 0)}
                                    className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-bold font-mono text-xs text-brand-600 dark:text-brand-400 focus:ring-1 focus:ring-brand-500"
                                    placeholder="Sell / Unit"
                                  />
                                  <span className="text-[10px] text-brand-600/80 font-medium block truncate">
                                    Per {prod?.baseUnit || 'unit'}
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Live Margin Calculation */}
                            <td className="p-2">
                              <div className="flex flex-col space-y-0.5">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                  isHealthy 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' 
                                    : isWarning 
                                    ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                                    : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                                }`}>
                                  {margin >= 0 ? `+${formatCurrency(margin)}` : formatCurrency(margin)} ({marginPercent.toFixed(1)}%)
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Markup: {markupPercent.toFixed(1)}%
                                </span>
                              </div>
                            </td>

                            {/* Total Line Valuation */}
                            <td className="p-2 font-mono font-bold text-slate-900 dark:text-white">
                              {formatCurrency(lineCost)}
                            </td>

                            {/* Action Remove */}
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveIntakeRow(row.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                                title="Remove this product line"
                              >
                                <Trash2 className="w-4 h-4" />
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

            {/* Bottom Valuation & Margin Summary Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 text-xs">
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Total Lines</span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white">{intakeRows.length} items</span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Total Units</span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  {intakeRows.reduce((sum, r) => sum + (r.qty || 0), 0)} units
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Valuation Cost</span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                  {formatCurrency(intakeRows.reduce((sum, r) => sum + ((r.qty || 0) * (r.unitCost || 0)), 0))}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider block">Projected Retail Value</span>
                <span className="text-base font-extrabold text-brand-600 dark:text-brand-400 font-mono">
                  {formatCurrency(intakeRows.reduce((sum, r) => sum + ((r.qty || 0) * (r.sellingPrice || 0)), 0))}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Projected Profit</span>
                {(() => {
                  const totalCost = intakeRows.reduce((sum, r) => sum + ((r.qty || 0) * (r.unitCost || 0)), 0);
                  const totalRetail = intakeRows.reduce((sum, r) => sum + ((r.qty || 0) * (r.sellingPrice || 0)), 0);
                  const totalProfit = totalRetail - totalCost;
                  const avgMargin = totalRetail > 0 ? (totalProfit / totalRetail) * 100 : 0;
                  return (
                    <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                      +{formatCurrency(totalProfit)} ({avgMargin.toFixed(1)}%)
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddIntakeRow}
                  className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
                >
                  <Plus className="w-4 h-4 text-brand-600" />
                  <span>Add Another Product</span>
                </button>

                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer bg-slate-100 dark:bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 select-none hover:bg-slate-200/70 dark:hover:bg-slate-750 transition" title="When checked, retail selling prices and pack definitions in the catalogue will be updated to reflect this shipment. When unchecked, only the received batch ledger and actual cost are recorded without altering master shelf prices.">
                  <input
                    type="checkbox"
                    checked={updateMasterSellingPrice}
                    onChange={e => setUpdateMasterSellingPrice(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Update Master Catalogue Shelf Prices & Tiers</span>
                </label>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setShowIntakeModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 flex items-center space-x-1.5 transition"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Post Multi-Product Stock Intake ({intakeRows.length} Items)</span>
                </button>
              </div>
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
