import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Truck, Plus, Search, CheckCircle2, Clock, 
  PackageCheck, FileText, X, AlertTriangle, Sparkles, FileSpreadsheet, CheckCheck,
  Info, BookOpen, HelpCircle, ShieldCheck,
  Trash2, Calendar, TrendingUp, RefreshCw, Boxes,
  Eye, Edit3, Barcode, Warehouse, MapPin, Layers, Package, Save
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { PurchaseOrder, Batch, BatchStatus } from '../../types';
import { FloatingBulkActionBar } from '../../components/common/FloatingBulkActionBar';
import { WorkflowGuideNotice } from '../../components/common/WorkflowGuideNotice';
import { FieldGuideNotice } from '../../components/common/FieldGuideNotice';
import { Pagination } from '../../components/common/Pagination';
import { usePagination } from '../../hooks/usePagination';

interface PurchaseBatchGroup {
  batchNumber: string;
  grnNumber: string;
  deliveryNote: string;
  supplierId: string;
  supplierName: string;
  storageLocation: string;
  receivedDate: string;
  items: Batch[];
  totalProductsCount: number;
  totalRemainingStock: number;
  totalInitialStock: number;
  totalCostValue: number;
  totalRetailValue: number;
  earliestExpiryDate: string;
  status: BatchStatus;
}

interface EditableBatchItem {
  id: string;
  productId: string;
  productName: string;
  mfgDate: string;
  expiryDate: string;
  remainingStock: number;
  initialStock: number;
  costPrice: number;
  sellingPrice: number;
  status: BatchStatus;
}

export const PurchasingPage: React.FC = () => {
  const { 
    purchaseOrders, suppliers, products, receiveStock, 
    addPurchaseOrder, formatCurrency, currentCurrency,
    batches, updateBatch, deleteBatch, updateBatchGroup, deleteBatchGroup, storageLocations,
    systemProfile, currentUser, toast, confirmDialog
  } = usePharmacy();
  const activeShopLocation = systemProfile?.branchName || currentUser?.branchName || 'Greenlife Central Branch (Victoria Island)';
  const [activeTab, setActiveTab] = useState<'orders' | 'batches'>('orders');
  const [showPOModal, setShowPOModal] = useState(false);
  const [showGRNModal, setShowGRNModal] = useState(false);
  const [updateMasterSellingPrice, setUpdateMasterSellingPrice] = useState(true);

  // Filters & selection
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [supplierFilter, setSupplierFilter] = useState<string>('ALL');
  const [selectedPOIds, setSelectedPOIds] = useState<string[]>([]);

  // Batches Registry State
  const [batchSearch, setBatchSearch] = useState('');
  const [batchStatusFilter, setBatchStatusFilter] = useState<string>('ALL');
  const [selectedBatchGroup, setSelectedBatchGroup] = useState<PurchaseBatchGroup | null>(null);
  const [editingBatchGroup, setEditingBatchGroup] = useState<PurchaseBatchGroup | null>(null);
  const [editBatchNumber, setEditBatchNumber] = useState('');
  const [editSupplierId, setEditSupplierId] = useState('');
  const [editStorageLocation, setEditStorageLocation] = useState('');
  const [isCustomEditStorageLocation, setIsCustomEditStorageLocation] = useState(false);
  const [editDeliveryNote, setEditDeliveryNote] = useState('');
  const [editReceivedDate, setEditReceivedDate] = useState('');
  const [editBatchItems, setEditBatchItems] = useState<EditableBatchItem[]>([]);
  const [deletedBatchItemIds, setDeletedBatchItemIds] = useState<string[]>([]);

  // Multi-line PO Item
  interface POLineItem {
    id: string;
    productId: string;
    orderUnitType: 'PACK' | 'BASE';
    orderedQty: number;
    unitCost: number;
  }

  // Multi-product GRN Item
  interface GRNLineItem {
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
  }

  // Auto batch number generator for GRN
  const generateAutoGRNBatch = (prodName?: string) => {
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

  // PO State
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [expectedDate, setExpectedDate] = useState('2026-09-30');
  const [poNotes, setPoNotes] = useState('Standard replenishment order. Requires Certificate of Analysis (CoA) with minimum 18 months remaining shelf-life.');
  const [poLines, setPoLines] = useState<POLineItem[]>([]);

  // Open PO modal with prefilled lines if empty
  const handleOpenPOModal = () => {
    if (poLines.length === 0 && products.length > 0) {
      const p1 = products[0];
      const p2 = products[1] || products[0];

      const p1Pack = p1.packagingTiers?.find(t => t.tierType === 'PACK');
      const p1Mult = p1Pack?.multiplier || 10;
      const p1HasPack = !!p1Pack;
      const p1Cost = p1Pack?.costPrice || Number(((p1.unitCost || 18.00) * p1Mult).toFixed(2));

      const p2Pack = p2.packagingTiers?.find(t => t.tierType === 'PACK');
      const p2Mult = p2Pack?.multiplier || 10;
      const p2HasPack = !!p2Pack;
      const p2Cost = p2Pack?.costPrice || Number(((p2.unitCost || 25.00) * p2Mult).toFixed(2));

      setPoLines([
        {
          id: 'po_line_1',
          productId: p1.id,
          orderUnitType: (p1HasPack ? 'PACK' : 'BASE') as 'PACK' | 'BASE',
          orderedQty: p1HasPack ? 10 : 100,
          unitCost: p1HasPack ? p1Cost : (p1.unitCost || 18.00)
        },
        ...(products.length > 1 ? [
          {
            id: 'po_line_2',
            productId: p2.id,
            orderUnitType: (p2HasPack ? 'PACK' : 'BASE') as 'PACK' | 'BASE',
            orderedQty: p2HasPack ? 5 : 50,
            unitCost: p2HasPack ? p2Cost : (p2.unitCost || 25.00)
          }
        ] : [])
      ]);
    }
    setShowPOModal(true);
  };

  const handleAddPOLine = () => {
    const prod = products[poLines.length % products.length] || products[0];
    const packTier = prod?.packagingTiers?.find(t => t.tierType === 'PACK');
    const mult = packTier?.multiplier || 10;
    const hasPack = !!packTier;
    const packCost = packTier?.costPrice || Number(((prod?.unitCost || 18.00) * mult).toFixed(2));

    setPoLines(prev => [
      ...prev,
      {
        id: `po_line_${Date.now()}_${Math.random()}`,
        productId: prod?.id || '',
        orderUnitType: (hasPack ? 'PACK' : 'BASE') as 'PACK' | 'BASE',
        orderedQty: hasPack ? 5 : 50,
        unitCost: hasPack ? packCost : (prod?.unitCost || 18.00)
      }
    ]);
  };

  const handleRemovePOLine = (id: string) => {
    setPoLines(prev => prev.filter(l => l.id !== id));
  };

  const handleUpdatePOLine = (id: string, field: keyof POLineItem, value: any) => {
    setPoLines(prev => prev.map(l => {
      if (l.id !== id) return l;
      if (field === 'productId') {
        const p = products.find(prod => prod.id === value);
        const packTier = p?.packagingTiers?.find(t => t.tierType === 'PACK');
        const mult = packTier?.multiplier || 10;
        const hasPack = !!packTier;
        const packCost = packTier?.costPrice || Number(((p?.unitCost || 18.00) * mult).toFixed(2));
        return {
          ...l,
          productId: value,
          orderUnitType: (hasPack ? 'PACK' : 'BASE') as 'PACK' | 'BASE',
          orderedQty: hasPack ? 5 : 50,
          unitCost: hasPack ? packCost : (p ? p.unitCost : l.unitCost)
        };
      }
      if (field === 'orderUnitType') {
        const p = products.find(prod => prod.id === l.productId);
        const packTier = p?.packagingTiers?.find(t => t.tierType === 'PACK');
        const mult = packTier?.multiplier || 10;
        if (value === 'PACK') {
          const packCost = packTier?.costPrice || Number((l.unitCost * mult).toFixed(2));
          return {
            ...l,
            orderUnitType: 'PACK',
            orderedQty: Math.max(1, Math.round(l.orderedQty / mult)),
            unitCost: packCost
          };
        } else {
          const baseCost = Number((l.unitCost / mult).toFixed(2));
          return {
            ...l,
            orderUnitType: 'BASE',
            orderedQty: l.orderedQty * mult,
            unitCost: baseCost > 0 ? baseCost : (p?.unitCost || 1.00)
          };
        }
      }
      return { ...l, [field]: value };
    }));
  };

  // GRN State
  const [grnSupplierId, setGrnSupplierId] = useState(suppliers[0]?.id || '');
  const [grnNumber, setGrnNumber] = useState(`GRN-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [grnBatchNumber, setGrnBatchNumber] = useState(`BAT-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [grnDeliveryNote, setGrnDeliveryNote] = useState('WAYBILL-2026-9814');
  const [grnBayLocation, setGrnBayLocation] = useState(activeShopLocation);
  const [grnItems, setGrnItems] = useState<GRNLineItem[]>([]);

  useEffect(() => {
    if (activeShopLocation) {
      setGrnBayLocation(activeShopLocation);
    }
  }, [activeShopLocation]);

  const handleMasterBatchChange = (newBatch: string) => {
    setGrnBatchNumber(newBatch);
    setGrnItems(prev => prev.map(i => ({ ...i, batchNumber: newBatch })));
  };

  // Group batches into Batches of Purchase (by batchNumber)
  const purchaseBatchGroups = useMemo(() => {
    const map = new Map<string, PurchaseBatchGroup>();

    batches.forEach(b => {
      const key = b.batchNumber || b.id;
      if (!map.has(key)) {
        map.set(key, {
          batchNumber: b.batchNumber,
          grnNumber: b.grnNumber || 'N/A',
          deliveryNote: b.deliveryNote || '',
          supplierId: b.supplierId || '',
          supplierName: b.supplierName || 'General Supplier',
          storageLocation: b.storageLocation || 'Dispensary Shelf',
          receivedDate: b.receivedDate || '',
          items: [],
          totalProductsCount: 0,
          totalRemainingStock: 0,
          totalInitialStock: 0,
          totalCostValue: 0,
          totalRetailValue: 0,
          earliestExpiryDate: b.expiryDate || '',
          status: b.status
        });
      }

      const grp = map.get(key)!;
      grp.items.push(b);
      grp.totalProductsCount += 1;
      const rem = b.remainingStock ?? b.quantityOnHand ?? 0;
      const init = b.initialStock ?? b.quantityOnHand ?? 0;
      const cost = b.costPrice ?? b.unitCost ?? 0;
      const sell = b.sellingPrice ?? 0;
      grp.totalRemainingStock += rem;
      grp.totalInitialStock += init;
      grp.totalCostValue += rem * cost;
      grp.totalRetailValue += rem * sell;

      if (b.expiryDate && (!grp.earliestExpiryDate || new Date(b.expiryDate) < new Date(grp.earliestExpiryDate))) {
        grp.earliestExpiryDate = b.expiryDate;
      }
    });

    map.forEach(grp => {
      const allDepleted = grp.items.every(i => i.status === 'DEPLETED' || (i.remainingStock ?? 0) <= 0);
      const anyExpired = grp.items.some(i => i.status === 'EXPIRED' || (i.expiryDate && new Date(i.expiryDate) < new Date()));
      const anyQuarantined = grp.items.some(i => i.status === 'QUARANTINED');
      const anyNearExpiry = grp.items.some(i => {
        if (!i.expiryDate) return false;
        const days = Math.ceil((new Date(i.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        return days > 0 && days <= 90;
      });

      if (allDepleted) grp.status = 'DEPLETED';
      else if (anyQuarantined) grp.status = 'QUARANTINED';
      else if (anyExpired) grp.status = 'EXPIRED';
      else if (anyNearExpiry) grp.status = 'NEAR_EXPIRY';
      else grp.status = 'ACTIVE';
    });

    return Array.from(map.values());
  }, [batches]);

  const filteredBatchGroups = useMemo(() => {
    return purchaseBatchGroups.filter(bg => {
      const q = batchSearch.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        bg.batchNumber.toLowerCase().includes(q) ||
        bg.grnNumber.toLowerCase().includes(q) ||
        bg.deliveryNote.toLowerCase().includes(q) ||
        bg.supplierName.toLowerCase().includes(q) ||
        bg.storageLocation.toLowerCase().includes(q) ||
        bg.items.some(item => item.productName.toLowerCase().includes(q));
      if (!matchesSearch) return false;

      if (batchStatusFilter === 'ALL') return true;
      return bg.status === batchStatusFilter;
    });
  }, [purchaseBatchGroups, batchSearch, batchStatusFilter]);

  const {
    currentPage: batchGroupsPage,
    setCurrentPage: setBatchGroupsPage,
    paginatedItems: paginatedBatchGroups,
  } = usePagination(filteredBatchGroups, 10, [batchSearch, batchStatusFilter]);

  const handleOpenViewBatchGroup = (group: PurchaseBatchGroup) => {
    setSelectedBatchGroup(group);
  };

  const handleOpenEditBatchGroup = (group: PurchaseBatchGroup) => {
    setEditingBatchGroup(group);
    setEditBatchNumber(group.batchNumber);
    setEditSupplierId(group.supplierId);

    // Set Storage Location by default to the current active shop name (Shop / Active Branch Location Name * Live on Receipts, Invoices & TopBar)
    const initialLocation = group.storageLocation && group.storageLocation !== 'Dispensary Shelf'
      ? group.storageLocation
      : activeShopLocation;
    setEditStorageLocation(initialLocation);

    // Check if initialLocation is custom
    const isStandard = initialLocation === activeShopLocation || (storageLocations || []).some(l => l.name === initialLocation);
    setIsCustomEditStorageLocation(!isStandard);

    setEditDeliveryNote(group.deliveryNote || '');

    // Always set date by default to Inward Received Date (or today if empty/unassigned), while allowing room to change
    const initialReceivedDate = group.receivedDate || new Date().toISOString().slice(0, 10);
    setEditReceivedDate(initialReceivedDate);

    setEditBatchItems(group.items.map(item => {
      // Find live batch in batches context to always pickup the most accurate remaining physical stock
      const liveBatch = batches.find(b => b.id === item.id);
      const remaining = liveBatch?.remainingStock ?? liveBatch?.quantityOnHand ?? liveBatch?.availableQuantity ?? item.remainingStock ?? item.quantityOnHand ?? item.availableQuantity ?? 0;
      const initial = liveBatch?.initialStock ?? item.initialStock ?? remaining;
      return {
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        mfgDate: item.mfgDate || item.manufacturingDate || liveBatch?.manufacturingDate || '',
        expiryDate: item.expiryDate || liveBatch?.expiryDate || '',
        remainingStock: remaining,
        initialStock: initial,
        costPrice: item.costPrice ?? item.unitCost ?? liveBatch?.unitCost ?? 0,
        sellingPrice: item.sellingPrice ?? liveBatch?.sellingPrice ?? 0,
        status: item.status || liveBatch?.status || 'ACTIVE'
      };
    }));
  };

  const handleAddProductToEditBatch = () => {
    const defaultProd = products[0];
    const today = new Date();
    const mfg = new Date(today.getFullYear(), today.getMonth() - 2, 1).toISOString().slice(0, 10);
    const exp = new Date(today.getFullYear() + 2, today.getMonth() + 4, 28).toISOString().slice(0, 10);
    setEditBatchItems(prev => [
      ...prev,
      {
        id: `batch_new_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        productId: defaultProd ? defaultProd.id : '',
        productName: defaultProd ? defaultProd.brandName : 'Product',
        mfgDate: mfg,
        expiryDate: exp,
        remainingStock: 50,
        initialStock: 50,
        costPrice: defaultProd ? defaultProd.unitCost : 10,
        sellingPrice: defaultProd ? defaultProd.sellingPrice : 15,
        status: 'ACTIVE'
      }
    ]);
  };

  const handleRemoveItemFromEditBatch = (index: number) => {
    if (editBatchItems.length <= 1) {
      toast.warning('A batch of purchase must contain at least one product line. If you wish to remove the whole batch, use the Delete option.', 'Batch Item Required');
      return;
    }
    const itemToRemove = editBatchItems[index];
    if (itemToRemove.id && !itemToRemove.id.startsWith('batch_new_')) {
      setDeletedBatchItemIds(prev => [...prev, itemToRemove.id]);
    }
    setEditBatchItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateEditBatchItem = (index: number, field: string, value: any) => {
    setEditBatchItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      if (field === 'productId') {
        const p = products.find(prod => prod.id === value);
        return {
          ...item,
          productId: value,
          productName: p ? p.brandName : item.productName,
          costPrice: p ? p.unitCost : item.costPrice,
          sellingPrice: p ? p.sellingPrice : item.sellingPrice
        };
      }
      return { ...item, [field]: value };
    }));
  };

  const handleSaveBatchGroupEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatchGroup) return;
    if (!editBatchNumber.trim()) {
      toast.warning('Please provide a valid Batch / Lot #.', 'Batch Code Required');
      return;
    }
    if (editBatchItems.length === 0) {
      toast.warning('Batch must have at least one product formulation.', 'Formulation Required');
      return;
    }

    const selSup = suppliers.find(s => s.id === editSupplierId);

    updateBatchGroup(
      editingBatchGroup.batchNumber,
      {
        batchNumber: editBatchNumber.trim(),
        storageLocation: editStorageLocation,
        supplierId: editSupplierId,
        supplierName: selSup?.name || editingBatchGroup.supplierName,
        deliveryNote: editDeliveryNote,
        receivedDate: editReceivedDate
      },
      editBatchItems,
      deletedBatchItemIds
    );

    toast.success(`Batch "${editBatchNumber}" updated successfully!`, 'Batch Updated');
    setEditingBatchGroup(null);
  };

  const handleDeleteBatchGroup = async (batchNumber: string, count: number) => {
    const confirmed = await confirmDialog({
      title: 'Delete Batch of Purchase',
      message: `Are you sure you want to permanently delete Batch "${batchNumber}" containing ${count} product line(s)?`,
      description: 'This will adjust stock levels accordingly and cannot be undone.',
      confirmText: 'Delete Batch',
      variant: 'danger'
    });
    if (confirmed) {
      deleteBatchGroup(batchNumber);
      toast.success(`Batch "${batchNumber}" deleted successfully.`, 'Batch Deleted');
    }
  };

  // Open GRN modal with prefilled lines if empty
  const handleOpenGRNModal = () => {
    setGrnNumber(`GRN-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    const unifiedBatch = generateAutoGRNBatch('BAT');
    setGrnBatchNumber(unifiedBatch);

    // Always set Receiving Bay / Storage Location by default to the active shop name (Shop / Active Branch Location Name * Live on Receipts, Invoices & TopBar)
    setGrnBayLocation(activeShopLocation);
    if (products.length > 0) {
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

      setGrnItems([
        {
          id: 'grn_item_1',
          productId: p1.id,
          batchNumber: unifiedBatch,
          mfgDate: mfg,
          expDate: exp,
          intakeUnitType: (p1HasPack ? 'PACK' : 'BASE') as 'PACK' | 'BASE',
          packQty: p1HasPack ? 10 : 1,
          packCost: p1PackCost,
          packSellingPrice: p1PackSelling,
          qty: p1HasPack ? 10 * p1Mult : 100,
          unitCost: p1.unitCost || 18.00,
          sellingPrice: p1.sellingPrice || 30.00
        },
        ...(products.length > 1 ? [{
          id: 'grn_item_2',
          productId: p2.id,
          batchNumber: unifiedBatch,
          mfgDate: mfg,
          expDate: exp,
          intakeUnitType: (p2HasPack ? 'PACK' : 'BASE') as 'PACK' | 'BASE',
          packQty: p2HasPack ? 5 : 1,
          packCost: p2PackCost,
          packSellingPrice: p2PackSelling,
          qty: p2HasPack ? 5 * p2Mult : 50,
          unitCost: p2.unitCost || 25.00,
          sellingPrice: p2.sellingPrice || 40.00
        }] : [])
      ]);
    }
    setShowGRNModal(true);
  };

  const handleAddGRNItem = () => {
    const today = new Date();
    const mfg = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().slice(0, 10);
    const exp = new Date(today.getFullYear() + 2, today.getMonth() + 3, 28).toISOString().slice(0, 10);
    const prod = products[grnItems.length % products.length] || products[0];
    
    // Automatically assign the intake's unified batch ID to all newly added products
    const targetBatch = grnBatchNumber || (grnItems[0]?.batchNumber) || generateAutoGRNBatch('BAT');

    const packTier = prod?.packagingTiers?.find(t => t.tierType === 'PACK');
    const mult = packTier?.multiplier || 10;
    const hasPack = !!packTier;
    const packCost = packTier?.costPrice || Number(((prod?.unitCost || 18.00) * mult).toFixed(2));
    const packSelling = packTier?.sellingPrice || Number(((prod?.sellingPrice || 30.00) * mult).toFixed(2));

    setGrnItems(prev => [
      ...prev,
      {
        id: `grn_item_${Date.now()}_${Math.random()}`,
        productId: prod?.id || '',
        batchNumber: targetBatch,
        mfgDate: mfg,
        expDate: exp,
        intakeUnitType: (hasPack ? 'PACK' : 'BASE') as 'PACK' | 'BASE',
        packQty: hasPack ? 5 : 1,
        packCost: packCost,
        packSellingPrice: packSelling,
        qty: hasPack ? 5 * mult : 50,
        unitCost: prod?.unitCost || 18.00,
        sellingPrice: prod?.sellingPrice || 30.00
      }
    ]);
  };

  const handleRemoveGRNItem = (id: string) => {
    setGrnItems(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdateGRNItem = (id: string, field: keyof GRNLineItem, value: any) => {
    setGrnItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      if (field === 'productId') {
        const prod = products.find(p => p.id === value);
        const packTier = prod?.packagingTiers?.find(t => t.tierType === 'PACK');
        const mult = packTier?.multiplier || 10;
        const hasPack = !!packTier;
        const packCost = packTier?.costPrice || Number(((prod?.unitCost || 18.00) * mult).toFixed(2));
        const packSelling = packTier?.sellingPrice || Number(((prod?.sellingPrice || 30.00) * mult).toFixed(2));
        return {
          ...i,
          productId: value,
          intakeUnitType: (hasPack ? 'PACK' : 'BASE') as 'PACK' | 'BASE',
          packQty: hasPack ? 5 : 1,
          packCost: packCost,
          packSellingPrice: packSelling,
          qty: hasPack ? 5 * mult : 50,
          unitCost: prod ? prod.unitCost : i.unitCost,
          sellingPrice: prod ? prod.sellingPrice : i.sellingPrice
        };
      }
      if (field === 'intakeUnitType') {
        const prod = products.find(p => p.id === i.productId);
        const packTier = prod?.packagingTiers?.find(t => t.tierType === 'PACK');
        const mult = packTier?.multiplier || 10;
        if (value === 'PACK') {
          const pCost = i.packCost || Number((i.unitCost * mult).toFixed(2));
          const pSell = i.packSellingPrice || Number((i.sellingPrice * mult).toFixed(2));
          const pQty = i.packQty > 0 ? i.packQty : Math.max(1, Math.round(i.qty / mult));
          return {
            ...i,
            intakeUnitType: 'PACK',
            packQty: pQty,
            packCost: pCost,
            packSellingPrice: pSell,
            qty: pQty * mult,
            unitCost: mult > 0 ? Number((pCost / mult).toFixed(2)) : i.unitCost,
            sellingPrice: mult > 0 ? Number((pSell / mult).toFixed(2)) : i.sellingPrice
          };
        } else {
          return {
            ...i,
            intakeUnitType: 'BASE'
          };
        }
      }
      if (field === 'packQty') {
        const num = Math.max(0, parseInt(value) || 0);
        const prod = products.find(p => p.id === i.productId);
        const mult = prod?.packagingTiers?.find(t => t.tierType === 'PACK')?.multiplier || 10;
        return { ...i, packQty: num, qty: num * mult };
      }
      if (field === 'packCost') {
        const cost = Math.max(0, parseFloat(value) || 0);
        const prod = products.find(p => p.id === i.productId);
        const mult = prod?.packagingTiers?.find(t => t.tierType === 'PACK')?.multiplier || 10;
        return { ...i, packCost: cost, unitCost: mult > 0 ? Number((cost / mult).toFixed(2)) : cost };
      }
      if (field === 'packSellingPrice') {
        const sell = Math.max(0, parseFloat(value) || 0);
        const prod = products.find(p => p.id === i.productId);
        const mult = prod?.packagingTiers?.find(t => t.tierType === 'PACK')?.multiplier || 10;
        return { ...i, packSellingPrice: sell, sellingPrice: mult > 0 ? Number((sell / mult).toFixed(2)) : sell };
      }
      if (field === 'qty') {
        const num = Math.max(0, parseInt(value) || 0);
        return { ...i, qty: num };
      }
      if (field === 'unitCost') {
        const cost = Math.max(0, parseFloat(value) || 0);
        return { ...i, unitCost: cost };
      }
      if (field === 'sellingPrice') {
        const sell = Math.max(0, parseFloat(value) || 0);
        return { ...i, sellingPrice: sell };
      }
      return { ...i, [field]: value };
    }));
  };

  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch = 
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || po.status === statusFilter;
    const matchesSupplier = supplierFilter === 'ALL' || po.supplierId === supplierFilter;
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  const {
    currentPage: poPage,
    setCurrentPage: setPoPage,
    paginatedItems: paginatedPOs,
  } = usePagination(filteredPOs, 10, [searchTerm, statusFilter, supplierFilter]);

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
    toast.success(`Authorized approval for ${selectedPOIds.length} purchase orders.`, 'POs Approved');
    setSelectedPOIds([]);
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (poLines.length === 0) {
      toast.warning('Please add at least one medicine item to the purchase order.', 'Order Line Required');
      return;
    }
    for (let i = 0; i < poLines.length; i++) {
      const line = poLines[i];
      if (!line.productId) {
        toast.warning(`Please select a medicine formulation on row #${i + 1}.`, 'Formulation Required');
        return;
      }
      if (!line.orderedQty || line.orderedQty <= 0) {
        toast.warning(`Please enter a valid order quantity on row #${i + 1}.`, 'Invalid Quantity');
        return;
      }
    }

    const sup = suppliers.find(s => s.id === supplierId);
    const items = poLines.map(line => {
      const p = products.find(prod => prod.id === line.productId);
      const mult = p?.packagingTiers?.find(t => t.tierType === 'PACK')?.multiplier || 10;
      const isPack = line.orderUnitType === 'PACK';
      const baseQty = isPack ? (line.orderedQty * mult) : line.orderedQty;
      const baseUnitCost = isPack ? Number((line.unitCost / mult).toFixed(2)) : line.unitCost;
      return {
        productId: line.productId,
        productName: p ? `${p.brandName}${isPack ? ` (${line.orderedQty} Packs)` : ''}` : 'Product',
        orderedQty: baseQty,
        receivedQty: 0,
        unitCost: baseUnitCost,
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

    toast.success(`Purchase Order successfully generated for ${items.length} product lines!`, 'PO Created');
    setShowPOModal(false);
  };

  const handleCommitGRN = (e: React.FormEvent) => {
    e.preventDefault();
    if (grnItems.length === 0) {
      toast.warning('Please add at least one delivered product line to receive.', 'Line Item Required');
      return;
    }
    for (let i = 0; i < grnItems.length; i++) {
      const item = grnItems[i];
      if (!item.productId) {
        toast.warning(`Please select a medicine formulation on row #${i + 1}.`, 'Formulation Required');
        return;
      }
      if (!item.batchNumber.trim()) {
        toast.warning(`Please specify a manufacturer batch / lot # on row #${i + 1}.`, 'Batch Required');
        return;
      }
      if (!item.qty || item.qty <= 0) {
        toast.warning(`Please enter a valid received quantity on row #${i + 1}.`, 'Invalid Quantity');
        return;
      }
    }

    const selSup = suppliers.find(s => s.id === grnSupplierId);
    receiveStock(grnNumber, grnItems.map(item => {
      const prod = products.find(p => p.id === item.productId);
      let packagingTiers = updateMasterSellingPrice ? prod?.packagingTiers : undefined;
      if (updateMasterSellingPrice && item.intakeUnitType === 'PACK' && packagingTiers) {
        packagingTiers = packagingTiers.map(t => {
          if (t.tierType === 'PACK') {
            return { ...t, costPrice: item.packCost, sellingPrice: item.packSellingPrice };
          }
          return t;
        });
      }
      return {
        productId: item.productId,
        batchNumber: item.batchNumber,
        mfgDate: item.mfgDate,
        expDate: item.expDate,
        qty: item.qty,
        unitCost: item.unitCost,
        sellingPrice: item.sellingPrice,
        packagingTiers,
        updateMasterSellingPrice
      };
    }), {
      supplierId: grnSupplierId,
      supplierName: selSup?.name || 'Wholesale Supplier',
      storageLocation: grnBayLocation,
      deliveryNote: grnDeliveryNote
    });

    toast.success(`Goods Receipt ${grnNumber} committed for ${grnItems.length} products! Physical batches and inventory balances updated.`, 'GRN Intake Recorded');
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

        <div className="flex flex-wrap items-center gap-2">
          {/* Main Module Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              id="tab-purchase-orders"
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'orders'
                  ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Purchase Orders</span>
              <span className="ml-1 px-1.5 py-0.2 bg-slate-200 dark:bg-slate-700 rounded-full text-[10px]">
                {purchaseOrders.length}
              </span>
            </button>
            <button
              id="tab-batches-registry"
              onClick={() => setActiveTab('batches')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'batches'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Boxes className="w-3.5 h-3.5 text-teal-600" />
              <span>Batches & Lot Registry</span>
              <span className="ml-1 px-1.5 py-0.2 bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 rounded-full text-[10px] font-bold">
                {purchaseBatchGroups.length}
              </span>
            </button>
          </div>

          <button
            onClick={handleOpenGRNModal}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 transition"
          >
            <PackageCheck className="w-4 h-4" />
            <span>Receive Goods (GRN)</span>
          </button>
          <button
            onClick={handleOpenPOModal}
            className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 flex items-center space-x-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Order</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PURCHASE ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Educational Guidance: Procurement Workflow from PO to GRN & Margin Risk Validation */}
          <WorkflowGuideNotice
            title="Procurement Guide: Purchase Orders, Delivery Verification, Batch Intake & Margin Validation"
            tag="Procurement Lifecycle"
            badge="4-Pillar Protocol"
            icon={BookOpen}
            summary="Standard pharmaceutical protocol bridging external supplier purchasing with dispensary inventory accounting, FEFO quality compliance, and cost-margin risk protection."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
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
                  <span className="font-bold text-xs text-amber-900 dark:text-amber-300">Supplier Delivery Verification</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Verify waybill/delivery note against physical cartons. Inspect container integrity, seals, and cold-chain compliance.
                </p>
                <div className="text-[10px] bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 p-1.5 rounded font-mono">
                  Check cold-chain temperature (2°C–8°C) and match physical count with waybill.
                </div>
              </div>

              <div className="p-3 bg-white/90 dark:bg-slate-900/80 rounded-xl border border-teal-100 dark:border-teal-900/50 space-y-1">
                <div className="flex items-center space-x-1.5">
                  <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-[11px]">3</span>
                  <span className="font-bold text-xs text-teal-900 dark:text-teal-300">Batch Intake (GRN)</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Log manufacturer <strong>Batch Number</strong>, <strong>Expiry Date</strong> for FEFO rotation, and assign storage bay to active branch shop.
                </p>
                <div className="text-[10px] bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 p-1.5 rounded font-mono">
                  Batch <strong>BAT-2026-981</strong>, Exp <strong>2028-03-01</strong>, Bay: Active Branch Shop.
                </div>
              </div>

              <div className="p-3 bg-white/90 dark:bg-slate-900/80 rounded-xl border border-emerald-100 dark:border-emerald-900/50 space-y-1">
                <div className="flex items-center space-x-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-[11px]">4</span>
                  <span className="font-bold text-xs text-emerald-900 dark:text-emerald-300">Cost-Margin Risk Validation</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Audit unit purchase cost vs. dispensary selling price. Protect profit margins and block loss-making pricing before shelf release.
                </p>
                <div className="text-[10px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 p-1.5 rounded font-mono">
                  Cost GH₵18 $\to$ Sell GH₵30: <strong>40.0% Margin (+GH₵12 profit)</strong>.
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
                placeholder="Search PO number, supplier, or items..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
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

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="APPROVED">Approved</option>
                <option value="RECEIVED">Received</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
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
                    paginatedPOs.map((po, index) => {
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
                              <span className="font-mono text-[11px] text-slate-400">
                                {(poPage - 1) * 10 + index + 1}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 font-mono font-bold text-brand-600">
                            {po.poNumber}
                          </td>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">
                            {po.supplierName}
                          </td>
                          <td className="p-3 text-slate-500">
                            {po.createdAt}
                          </td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">
                            {po.expectedDate}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400 font-semibold">
                              {po.items.length} items
                            </span>
                          </td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            {formatCurrency(po.totalAmount)}
                          </td>
                          <td className="p-3">
                            {po.approvalStatus === 'APPROVED' ? (
                              <span className="inline-flex items-center text-emerald-600 text-[11px] font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                Authorized
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-amber-600 text-[11px] font-semibold">
                                <Clock className="w-3.5 h-3.5 mr-1" />
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              po.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                              po.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                              po.status === 'APPROVED' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                              po.status === 'PARTIALLY_RECEIVED' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                              po.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                              'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {po.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={poPage}
              totalItems={filteredPOs.length}
              pageSize={10}
              onPageChange={setPoPage}
              itemName="purchase orders"
            />
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
        </div>
      )}

      {/* TAB 2: BATCHES & LOT REGISTRY */}
      {activeTab === 'batches' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-teal-50/70 dark:bg-teal-950/30 rounded-xl border border-teal-200 dark:border-teal-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <Boxes className="w-5 h-5 text-teal-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                  Manufacturer Batches & Lot Traceability Registry (FEFO Expiry Control)
                </h3>
                <p className="text-[11px] text-teal-800 dark:text-teal-300/80">
                  Every Goods Received Note (GRN) intake creates physical lot entries. Batches are automatically decremented during dispensing based on First-Expired, First-Out (FEFO).
                </p>
              </div>
            </div>
            <button
              onClick={handleOpenGRNModal}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow whitespace-nowrap self-end sm:self-auto flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Receive New Batch (GRN)</span>
            </button>
          </div>

          {/* Educational Guidance for Batches, Intake Origin & Margin Risk */}
          <FieldGuideNotice
            label="Understanding Batches, Intake Origin & Cost-Margin Risk"
            title="Batch Intake & Cost-Margin Risk Validation Guide"
            variant="brand"
          >
            <div className="space-y-2 text-xs">
              <p>
                <strong>Batch Intake &amp; Traceability:</strong> In GreenLife, when a supplier delivery arrives, the <em>Goods Received Note (GRN)</em> creates physical lot entries with auto-generated or supplier lot numbers, expiry dates, and intake storage bays.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-[11px]">
                <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 space-y-1">
                  <strong className="text-teal-900 dark:text-teal-200 block font-bold">1. Multi-Product Intake</strong>
                  <span>A single delivery batch can contain multiple product formulations. Each formulation maintains its own <strong>Received Qty</strong> and <strong>Remaining Stock</strong> on shelf.</span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 space-y-1">
                  <strong className="text-emerald-900 dark:text-emerald-200 block font-bold">2. Cost-Margin Risk Protection</strong>
                  <span>Every batch calculates <em>Margin %</em> and <em>Cash Profit per Unit</em>. If buy price is greater than selling price, a critical risk alert is triggered to prevent loss.</span>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 space-y-1">
                  <strong className="text-amber-900 dark:text-amber-200 block font-bold">3. FEFO Expiry Safeguard</strong>
                  <span>Batches with earliest expiry dates are prioritized automatically at point-of-sale to prevent expired medicine wastage.</span>
                </div>
              </div>
            </div>
          </FieldGuideNotice>

          {/* Batch KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-teal-200 dark:border-teal-800/60 shadow-sm">
              <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wider block">Total Batches of Purchase</span>
              <p className="text-xl font-extrabold text-teal-700 dark:text-teal-400 mt-1">{purchaseBatchGroups.length}</p>
              <span className="text-[10px] text-slate-400">{batches.length} total product lines</span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800/60 shadow-sm">
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">Active Batches</span>
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {purchaseBatchGroups.filter(b => b.status === 'ACTIVE').length}
              </p>
              <span className="text-[10px] text-emerald-600 font-medium">Eligible for dispensing</span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800/60 shadow-sm">
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">Expiring Soon (&lt; 90 Days)</span>
              <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                {purchaseBatchGroups.filter(b => b.status === 'NEAR_EXPIRY').length}
              </p>
              <span className="text-[10px] text-amber-600 font-medium">Requires priority rotation</span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-800/60 shadow-sm">
              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">Quarantined / Expired / Depleted</span>
              <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                {purchaseBatchGroups.filter(b => b.status === 'QUARANTINED' || b.status === 'EXPIRED' || b.status === 'DEPLETED').length}
              </p>
              <span className="text-[10px] text-rose-500 font-medium">Locked or depleted</span>
            </div>
          </div>

          {/* Batch Search & Status Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                id="batch-search-input"
                value={batchSearch}
                onChange={e => setBatchSearch(e.target.value)}
                placeholder="Search batch #, product formulation, supplier, or GRN..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                id="batch-status-filter"
                value={batchStatusFilter}
                onChange={e => setBatchStatusFilter(e.target.value)}
                className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Batch Statuses</option>
                <option value="ACTIVE">Active (Commercial)</option>
                <option value="NEAR_EXPIRY">Near Expiry (&lt; 90 Days)</option>
                <option value="QUARANTINED">Quarantined</option>
                <option value="EXPIRED">Expired</option>
                <option value="DEPLETED">Depleted (0 Units)</option>
              </select>
            </div>
          </div>

          {/* Batches Table (Grouped by Batch of Purchase) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800 select-none">
                  <tr>
                    <th className="p-3">Batch / Lot #</th>
                    <th className="p-3">Supplier &amp; Location</th>
                    <th className="p-3">Products in Batch</th>
                    <th className="p-3">Stock Units (Remaining / Received)</th>
                    <th className="p-3">Earliest Expiry (FEFO)</th>
                    <th className="p-3 text-right">Valuation &amp; Margin</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredBatchGroups.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        <Boxes className="w-8 h-8 mx-auto mb-2 opacity-30 text-teal-500" />
                        <p className="font-semibold text-xs">No batches found matching the specified criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedBatchGroups.map(bg => {
                      const daysLeft = Math.ceil((new Date(bg.earliestExpiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                      const isExpired = daysLeft <= 0;
                      const isNearExpiry = daysLeft > 0 && daysLeft <= 90;
                      const fillPercent = bg.totalInitialStock > 0 
                        ? Math.min(100, Math.round((bg.totalRemainingStock / bg.totalInitialStock) * 100)) 
                        : 0;

                      return (
                        <tr key={bg.batchNumber} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                          <td className="p-3">
                            <div className="flex items-center space-x-1.5">
                              <Barcode className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                              <span className="font-mono font-bold text-teal-700 dark:text-teal-400 text-xs">
                                {bg.batchNumber}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 space-y-0.5">
                              <div>GRN: <span className="font-mono text-slate-600 dark:text-slate-300">{bg.grnNumber}</span></div>
                              {bg.deliveryNote && <div>WB: <span className="font-mono text-slate-500">{bg.deliveryNote}</span></div>}
                              {bg.receivedDate && <div>Recv: <span>{bg.receivedDate}</span></div>}
                            </div>
                          </td>

                          <td className="p-3">
                            <span className="font-bold text-slate-900 dark:text-white block">{bg.supplierName}</span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-2.5 h-2.5 text-slate-400" />
                              {bg.storageLocation}
                            </span>
                          </td>

                          <td className="p-3">
                            <div className="space-y-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                <Layers className="w-3 h-3 mr-1" />
                                {bg.totalProductsCount} {bg.totalProductsCount === 1 ? 'Product' : 'Products'}
                              </span>
                              <div className="flex flex-col gap-0.5 max-w-[220px]">
                                {bg.items.slice(0, 2).map((item, idx) => (
                                  <span key={idx} className="text-[11px] text-slate-700 dark:text-slate-300 truncate" title={item.productName}>
                                    • {item.productName} <span className="text-slate-400 font-mono">({item.remainingStock})</span>
                                  </span>
                                ))}
                                {bg.items.length > 2 && (
                                  <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                                    +{bg.items.length - 2} more product(s)...
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="p-3">
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold">
                                <span className={bg.totalRemainingStock <= 20 ? 'text-rose-600 font-bold' : 'text-slate-900 dark:text-white'}>
                                  {bg.totalRemainingStock.toLocaleString()} units
                                </span>
                                <span className="text-slate-400 text-[10px]">of {bg.totalInitialStock.toLocaleString()} recv</span>
                              </div>
                              <div className="w-28 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    fillPercent <= 20 ? 'bg-rose-500' : fillPercent <= 50 ? 'bg-amber-500' : 'bg-teal-500'
                                  }`} 
                                  style={{ width: `${fillPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="p-3">
                            <div className="flex items-center space-x-1.5">
                              <span className={`font-mono text-xs font-bold ${
                                isExpired ? 'text-rose-600' : isNearExpiry ? 'text-amber-600' : 'text-slate-900 dark:text-white'
                              }`}>
                                {bg.earliestExpiryDate}
                              </span>
                            </div>
                            <span className={`text-[10px] font-medium block mt-0.5 ${
                              isExpired ? 'text-rose-600 font-bold' : isNearExpiry ? 'text-amber-600' : 'text-slate-400'
                            }`}>
                              {isExpired ? 'Expired' : `${daysLeft} days left`}
                            </span>
                          </td>

                          <td className="p-3 text-right">
                            <div className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                              {formatCurrency(bg.totalCostValue)}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Ret: {formatCurrency(bg.totalRetailValue)}
                            </div>
                            {(() => {
                              const profit = bg.totalRetailValue - bg.totalCostValue;
                              const margin = bg.totalRetailValue > 0 ? (profit / bg.totalRetailValue) * 100 : 0;
                              const isLoss = profit < 0;
                              return (
                                <div className={`text-[10px] font-mono font-bold mt-0.5 ${
                                  isLoss 
                                    ? 'text-rose-600 dark:text-rose-400' 
                                    : margin >= 25 
                                    ? 'text-emerald-600 dark:text-emerald-400' 
                                    : 'text-amber-600 dark:text-amber-400'
                                }`}>
                                  {isLoss ? '⚠️ Loss ' : ''}{margin.toFixed(1)}% ({profit >= 0 ? '+' : ''}{formatCurrency(profit)})
                                </div>
                              );
                            })()}
                          </td>

                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              bg.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                              bg.status === 'QUARANTINED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                              bg.status === 'DEPLETED' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' :
                              'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}>
                              {bg.status}
                            </span>
                          </td>

                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                type="button"
                                onClick={() => handleOpenViewBatchGroup(bg)}
                                className="p-1.5 text-slate-600 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg transition"
                                title="View batch details & all products"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditBatchGroup(bg)}
                                className="p-1.5 text-slate-600 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-lg transition"
                                title="Edit batch & manage product items"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBatchGroup(bg.batchNumber, bg.totalProductsCount)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                                title="Remove entire batch of purchase"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={batchGroupsPage}
              totalItems={filteredBatchGroups.length}
              pageSize={10}
              onPageChange={setBatchGroupsPage}
              itemName="batches of purchase"
            />
          </div>
        </div>
      )}

      {/* MODAL 1: Create Purchase Order (Wide Landscape Workbench) */}
      {showPOModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <form 
            onSubmit={handleCreatePO} 
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-7xl w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[95vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-shrink-0">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-brand-600" />
                  <span>Raise Purchase Order (PO) — Multi-Product Requisition</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Generate formal wholesale procurement orders for accredited suppliers with multiple formulary medicines.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowPOModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* In-Modal Guidance Banner */}
            <div className="bg-brand-50/70 dark:bg-brand-950/40 p-3 rounded-xl border border-brand-100 dark:border-brand-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs flex-shrink-0">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <div className="text-slate-700 dark:text-slate-300">
                  <strong className="text-brand-900 dark:text-brand-300">Dispensary Formulary Item:</strong> Approved medicine listed in the pharmacy's active product master catalogue. Enter the desired <strong>Order Quantity</strong> for each product row.
                </div>
              </div>
              <span className="text-[11px] font-semibold text-brand-700 dark:text-brand-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-800 shadow-sm flex-shrink-0">
                Multi-Product PO Mode
              </span>
            </div>

            {/* PO Master Details (Supplier, Delivery Date, Delivery Notes) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex-shrink-0">
              <div>
                <label className="font-semibold block mb-1 text-slate-800 dark:text-slate-200">
                  Pharmaceutical Supplier <span className="text-rose-500">*</span>
                </label>
                <select
                  value={supplierId}
                  onChange={e => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 font-semibold focus:ring-2 focus:ring-brand-500 border-slate-300 dark:border-slate-600"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code}) — Credit: {s.paymentTermsDays} Days</option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Accredited wholesale pharmaceutical distributor</span>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-800 dark:text-slate-200">
                  Expected Delivery Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={expectedDate}
                    onChange={e => setExpectedDate(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border rounded-lg bg-white dark:bg-slate-800 font-bold focus:ring-2 focus:ring-brand-500 border-slate-300 dark:border-slate-600"
                  />
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Estimated warehouse / pharmacy arrival</span>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-800 dark:text-slate-200">
                  Quality & Delivery Specifications
                </label>
                <input
                  type="text"
                  value={poNotes}
                  onChange={e => setPoNotes(e.target.value)}
                  placeholder="e.g. Min 18m shelf-life CoA required, cold chain 2°C-8°C..."
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 border-slate-300 dark:border-slate-600 text-xs"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Special instructions for distributor dispatch</span>
              </div>
            </div>

            {/* Products Table */}
            <div className="flex-1 overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700 rounded-xl">
              <div className="bg-slate-100 dark:bg-slate-800/90 px-3 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                  <Boxes className="w-4 h-4 text-brand-600" />
                  <span>Order Line Items ({poLines.length} Products)</span>
                </span>
                <button
                  type="button"
                  onClick={handleAddPOLine}
                  className="px-2.5 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Product</span>
                </button>
              </div>

              <div className="overflow-x-auto overflow-y-auto max-h-[42vh] flex-1">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                    <tr className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      <th className="p-2.5 text-center w-10">#</th>
                      <th className="p-2.5 min-w-[240px]">Medicine Formulation / Product (From Catalogue) <span className="text-rose-500">*</span></th>
                      <th className="p-2.5 w-24 text-center">Stock on Hand</th>
                      <th className="p-2.5 min-w-[120px] text-center">Order Unit</th>
                      <th className="p-2.5 w-32 text-center">Order Quantity <span className="text-rose-500">*</span></th>
                      <th className="p-2.5 w-32 text-right">Wholesale Cost ({currentCurrency.symbol}) <span className="text-rose-500">*</span></th>
                      <th className="p-2.5 w-32 text-right">Line Total ({currentCurrency.symbol})</th>
                      <th className="p-2.5 min-w-[130px] text-right">Catalogue Retail & Margin</th>
                      <th className="p-2.5 text-center w-14">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {poLines.map((line, idx) => {
                      const matchedProduct = products.find(p => p.id === line.productId);
                      const packTier = matchedProduct?.packagingTiers?.find(t => t.tierType === 'PACK');
                      const packMultiplier = packTier?.multiplier || 10;
                      const hasPack = !!packTier;
                      const isPackMode = line.orderUnitType === 'PACK';
                      const lineTotal = (line.orderedQty || 0) * (line.unitCost || 0);

                      const baseCost = isPackMode ? (line.unitCost / packMultiplier) : line.unitCost;
                      const baseSell = matchedProduct?.sellingPrice || 0;
                      const profitPerUnit = baseSell - baseCost;
                      const lineMargin = baseSell > 0 ? (profitPerUnit / baseSell) * 100 : 0;
                      const isNegativeMargin = profitPerUnit < 0;

                      return (
                        <tr key={line.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="p-2.5 text-center font-mono text-slate-400 font-bold">
                            {idx + 1}
                          </td>
                          <td className="p-2.5">
                            <select
                              value={line.productId}
                              onChange={e => handleUpdatePOLine(line.id, 'productId', e.target.value)}
                              className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-semibold focus:ring-2 focus:ring-brand-500 border-slate-300 dark:border-slate-600 text-xs"
                            >
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.brandName} ({p.genericName}) — {p.dosageForm}
                                </option>
                              ))}
                            </select>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">
                              SKU: {matchedProduct?.sku || 'N/A'} | Category: {matchedProduct?.categoryName || 'Prescription'}
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                              {matchedProduct?.totalQuantity ?? 0} {matchedProduct?.baseUnit || 'units'}
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            {hasPack ? (
                              <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                <button
                                  type="button"
                                  onClick={() => handleUpdatePOLine(line.id, 'orderUnitType', 'PACK')}
                                  className={`px-2 py-1 rounded text-[10px] font-bold transition flex items-center space-x-1 ${
                                    isPackMode
                                      ? 'bg-brand-600 text-white shadow-sm'
                                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                  }`}
                                  title={`Order by Pack/Box of ${packMultiplier}`}
                                >
                                  <span>📦 Pack ({packMultiplier})</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdatePOLine(line.id, 'orderUnitType', 'BASE')}
                                  className={`px-2 py-1 rounded text-[10px] font-bold transition flex items-center space-x-1 ${
                                    !isPackMode
                                      ? 'bg-brand-600 text-white shadow-sm'
                                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                  }`}
                                  title={`Order by loose ${matchedProduct?.baseUnit || 'units'}`}
                                >
                                  <span>💊 {matchedProduct?.baseUnit || 'Loose'}</span>
                                </button>
                              </div>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-semibold border border-slate-200 dark:border-slate-700">
                                💊 {matchedProduct?.baseUnit || 'Base Unit'}
                              </span>
                            )}
                          </td>
                          <td className="p-2.5">
                            <div className="flex items-center justify-center">
                              <input
                                type="number"
                                min="1"
                                required
                                value={line.orderedQty}
                                onChange={e => handleUpdatePOLine(line.id, 'orderedQty', parseInt(e.target.value) || 0)}
                                className="w-28 px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-mono font-bold text-center focus:ring-2 focus:ring-brand-500 border-slate-300 dark:border-slate-600 text-xs text-brand-600"
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 text-center block mt-0.5 font-medium">
                              {isPackMode 
                                ? `= ${(line.orderedQty * packMultiplier).toLocaleString()} ${matchedProduct?.baseUnit || 'tabs'}` 
                                : `${matchedProduct?.baseUnit || 'units'}`}
                            </span>
                          </td>
                          <td className="p-2.5 text-right">
                            <div className="flex items-center justify-end">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                value={line.unitCost}
                                onChange={e => handleUpdatePOLine(line.id, 'unitCost', parseFloat(e.target.value) || 0)}
                                className="w-28 px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-mono font-bold text-right focus:ring-2 focus:ring-brand-500 border-slate-300 dark:border-slate-600 text-xs"
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                              {isPackMode 
                                ? `(${formatCurrency(line.unitCost / packMultiplier)} / ${matchedProduct?.baseUnit || 'tab'})` 
                                : `Per ${matchedProduct?.baseUnit || 'unit'}`}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatCurrency(lineTotal)}
                          </td>
                          <td className="p-2.5 text-right font-mono text-xs">
                            <div className="text-slate-800 dark:text-slate-200 font-semibold">
                              {formatCurrency(baseSell)} <span className="text-[10px] text-slate-400">/{matchedProduct?.baseUnit || 'tab'}</span>
                            </div>
                            <div className={`text-[10px] font-bold mt-0.5 ${
                              isNegativeMargin 
                                ? 'text-rose-600 dark:text-rose-400' 
                                : lineMargin >= 25 
                                ? 'text-emerald-600 dark:text-emerald-400' 
                                : 'text-amber-600 dark:text-amber-400'
                            }`}>
                              {isNegativeMargin ? '⚠️ Loss: Cost > Retail' : `${lineMargin.toFixed(1)}% Projected Margin`}
                            </div>
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              disabled={poLines.length <= 1}
                              onClick={() => handleRemovePOLine(line.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-30 disabled:hover:bg-transparent"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PO Modal Footer / Summary */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
              <div className="flex flex-wrap items-center gap-3">
                <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
                  <span className="text-slate-500">Products:</span>{' '}
                  <strong className="text-slate-900 dark:text-white font-mono">{poLines.length}</strong>
                </div>
                <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
                  <span className="text-slate-500">Total Units:</span>{' '}
                  <strong className="text-brand-600 font-mono">
                    {poLines.reduce((acc, l) => acc + (l.orderedQty || 0), 0).toLocaleString()}
                  </strong>
                </div>
                <div className="px-3 py-1.5 bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-900 rounded-lg text-xs">
                  <span className="text-brand-700 dark:text-brand-300 font-medium">Order Total:</span>{' '}
                  <strong className="text-brand-900 dark:text-brand-100 font-bold font-mono text-sm ml-1">
                    {formatCurrency(poLines.reduce((acc, l) => acc + ((l.orderedQty || 0) * (l.unitCost || 0)), 0))}
                  </strong>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPOModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-1.5"
                >
                  <Truck className="w-4 h-4" />
                  <span>Submit Purchase Order ({poLines.length} Products)</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: Goods Received Note (GRN Intake) (Wide Landscape Workbench) */}
      {showGRNModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <form 
            onSubmit={handleCommitGRN} 
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-7xl w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[95vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-shrink-0">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                  <PackageCheck className="w-5 h-5 text-emerald-600" />
                  <span>Receive Goods Note (GRN Intake) — Multi-Product Intake Workbench</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Log incoming delivery shipments, auto-generate batch lot codes, assign FEFO expiry dates, and audit unit profit margins.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowGRNModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* In-Modal Guidance Banner */}
            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs flex-shrink-0">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div className="text-slate-700 dark:text-slate-300">
                  <strong className="text-emerald-900 dark:text-emerald-300">FEFO Stock Rotation & Margins:</strong> Batch numbers are auto-generated for traceability. Live margins display <strong>Unit Cost (Valuation)</strong> vs <strong>Unit Selling (Retail)</strong> to protect dispensary profitability.
                </div>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 shadow-sm flex-shrink-0">
                Multi-Product Intake Active
              </span>
            </div>

            {/* GRN Top Bar (Supplier, Audit Reference, Unified Batch, Receiving Bay, Delivery Note) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex-shrink-0">
              <div>
                <label className="font-semibold block mb-1 text-slate-800 dark:text-slate-200">
                  Wholesale Supplier <span className="text-rose-500">*</span>
                </label>
                <select
                  id="grn-supplier-select"
                  value={grnSupplierId}
                  onChange={e => setGrnSupplierId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 text-xs"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) — Net {s.paymentTermsDays || 30} Days
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Delivering distributor vendor</span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200">
                    GRN Audit Reference <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setGrnNumber(`GRN-2026-${Math.floor(1000 + Math.random() * 9000)}`)}
                    className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center space-x-0.5"
                    title="Generate new GRN Reference"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Auto-Gen</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={grnNumber}
                  onChange={e => setGrnNumber(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 font-mono font-bold text-emerald-700 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 text-xs"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Internal receipt voucher ID</span>
              </div>

              {/* UNIFIED BATCH / LOT # FOR ALL PRODUCTS IN THIS INTAKE */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-2.5 rounded-xl border-2 border-emerald-400 dark:border-emerald-600">
                <div className="flex justify-between items-center mb-1">
                  <label className="font-extrabold text-emerald-950 dark:text-emerald-200 text-xs flex items-center space-x-1">
                    <Barcode className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Batch / Lot # *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleMasterBatchChange(generateAutoGRNBatch('BAT'))}
                    className="text-[10px] text-emerald-700 dark:text-emerald-300 hover:underline font-bold flex items-center space-x-0.5"
                    title="Generate new unified batch code for all products"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Auto-Gen</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  id="grn-unified-batch-input"
                  value={grnBatchNumber}
                  onChange={e => handleMasterBatchChange(e.target.value)}
                  placeholder="e.g. BAT-2026-981"
                  className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-900 font-mono font-bold text-emerald-800 dark:text-emerald-200 focus:ring-2 focus:ring-emerald-500 border-emerald-300 dark:border-emerald-700 text-xs shadow-inner"
                />
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5 block font-semibold">
                  Auto-assigned to all products
                </span>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-800 dark:text-slate-200">
                  Receiving Bay / Storage Location <span className="text-rose-500">*</span>
                </label>
                <select
                  id="grn-bay-location-select"
                  value={grnBayLocation}
                  onChange={e => setGrnBayLocation(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 text-xs"
                >
                  <option value={activeShopLocation}>🏪 {activeShopLocation} (Current Active Shop / Branch)</option>
                  {(storageLocations || [])
                    .filter(loc => loc.name !== activeShopLocation)
                    .map(loc => (
                      <option key={loc.id} value={loc.name}>
                        {loc.name} ({loc.type})
                      </option>
                    ))}
                  {(!storageLocations || storageLocations.length === 0) && (
                    <option value="Main Dispensary Inward Receiving Bay">Main Dispensary Inward Receiving Bay</option>
                  )}
                </select>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 block font-medium">
                  Default: Active Branch ({activeShopLocation})
                </span>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-800 dark:text-slate-200">
                  Supplier Delivery Note / Waybill #
                </label>
                <input
                  type="text"
                  value={grnDeliveryNote}
                  onChange={e => setGrnDeliveryNote(e.target.value)}
                  placeholder="e.g. WAYBILL-2026-9814"
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 text-xs"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block truncate" title="Driver's physical transport dispatch invoice for delivery cross-auditing">
                  Driver's dispatch invoice
                </span>
              </div>
            </div>

            {/* GRN Products Table */}
            <div className="flex-1 overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700 rounded-xl">
              <div className="bg-slate-100 dark:bg-slate-800/90 px-3 py-2 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                  <PackageCheck className="w-4 h-4 text-emerald-600" />
                  <span>Received Inventory Lines ({grnItems.length} Products)</span>
                </span>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Auto-Assigned Batch: <strong className="font-mono">{grnBatchNumber}</strong></span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAddGRNItem}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Product</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto overflow-y-auto max-h-[44vh] flex-1">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                    <tr className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      <th className="p-2 text-center w-8">#</th>
                      <th className="p-2 min-w-[200px]">Medicine Name / Product <span className="text-rose-500">*</span></th>
                      <th className="p-2 min-w-[150px]">Batch / Lot # <span className="text-rose-500">*</span></th>
                      <th className="p-2 min-w-[130px] text-center">Intake Unit</th>
                      <th className="p-2 w-28">Mfg Date</th>
                      <th className="p-2 w-32">Expiry Date <span className="text-rose-500">*</span></th>
                      <th className="p-2 w-32 text-center">Received Qty <span className="text-rose-500">*</span></th>
                      <th className="p-2 w-32 text-right">Cost Price ({currentCurrency.symbol}) <span className="text-rose-500">*</span></th>
                      <th className="p-2 w-32 text-right">Selling Price ({currentCurrency.symbol}) <span className="text-rose-500">*</span></th>
                      <th className="p-2 min-w-[160px] text-center">Profit Margin & Markup</th>
                      <th className="p-2 w-28 text-right">Valuation</th>
                      <th className="p-2 text-center w-12">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {grnItems.map((item, idx) => {
                      const matchedProduct = products.find(p => p.id === item.productId);
                      const packTier = matchedProduct?.packagingTiers?.find(t => t.tierType === 'PACK');
                      const packMultiplier = packTier?.multiplier || 10;
                      const hasPack = !!packTier;
                      const isPackMode = item.intakeUnitType === 'PACK';

                      const profit = (item.sellingPrice || 0) - (item.unitCost || 0);
                      const marginPercent = item.sellingPrice > 0 ? (profit / item.sellingPrice) * 100 : 0;
                      const markupPercent = item.unitCost > 0 ? (profit / item.unitCost) * 100 : 0;
                      const lineValuation = (item.qty || 0) * (item.unitCost || 0);

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="p-2 text-center font-mono text-slate-400 font-bold">
                            {idx + 1}
                          </td>
                          <td className="p-2">
                            <select
                              value={item.productId}
                              onChange={e => handleUpdateGRNItem(item.id, 'productId', e.target.value)}
                              className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 text-xs"
                            >
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.brandName} ({p.genericName})
                                </option>
                              ))}
                            </select>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">
                              Dosage: {matchedProduct?.dosageForm || 'Oral'}
                            </span>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center space-x-1">
                              <input
                                type="text"
                                required
                                value={item.batchNumber}
                                onChange={e => handleUpdateGRNItem(item.id, 'batchNumber', e.target.value)}
                                className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-mono font-bold focus:ring-2 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateGRNItem(item.id, 'batchNumber', generateAutoGRNBatch(matchedProduct?.brandName))}
                                title="Re-roll Batch Lot Code"
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-brand-600"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 block">
                              ✓ Auto-Generated Lot
                            </span>
                          </td>

                          {/* Intake Unit Mode Selector */}
                          <td className="p-2 text-center">
                            {hasPack ? (
                              <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateGRNItem(item.id, 'intakeUnitType', 'PACK')}
                                  className={`px-2 py-1 rounded text-[10px] font-bold transition flex items-center space-x-1 ${
                                    isPackMode
                                      ? 'bg-brand-600 text-white shadow-sm'
                                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                  }`}
                                  title={`Receive by Pack/Box of ${packMultiplier}`}
                                >
                                  <span>📦 Pack ({packMultiplier})</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateGRNItem(item.id, 'intakeUnitType', 'BASE')}
                                  className={`px-2 py-1 rounded text-[10px] font-bold transition flex items-center space-x-1 ${
                                    !isPackMode
                                      ? 'bg-brand-600 text-white shadow-sm'
                                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                  }`}
                                  title={`Receive by loose ${matchedProduct?.baseUnit || 'units'}`}
                                >
                                  <span>💊 {matchedProduct?.baseUnit || 'Loose'}</span>
                                </button>
                              </div>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-semibold border border-slate-200 dark:border-slate-700">
                                💊 {matchedProduct?.baseUnit || 'Base Unit'}
                              </span>
                            )}
                          </td>

                          <td className="p-2">
                            <input
                              type="date"
                              value={item.mfgDate}
                              onChange={e => handleUpdateGRNItem(item.id, 'mfgDate', e.target.value)}
                              className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 text-xs"
                            />
                            <span className="text-[10px] text-slate-400 mt-0.5 block">Mfg</span>
                          </td>
                          <td className="p-2">
                            <input
                              type="date"
                              required
                              value={item.expDate}
                              onChange={e => handleUpdateGRNItem(item.id, 'expDate', e.target.value)}
                              className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-bold text-brand-600 focus:ring-2 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 text-xs"
                            />
                            <span className="text-[10px] text-brand-600 font-medium mt-0.5 block">FEFO Key</span>
                          </td>
                          <td className="p-2">
                            {isPackMode ? (
                              <div>
                                <input
                                  type="number"
                                  min="1"
                                  required
                                  value={item.packQty}
                                  onChange={e => handleUpdateGRNItem(item.id, 'packQty', e.target.value)}
                                  className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-mono font-bold text-center focus:ring-2 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 text-xs text-emerald-600"
                                  placeholder="Boxes"
                                />
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5 text-center truncate">
                                  = {item.qty.toLocaleString()} {matchedProduct?.baseUnit || 'tabs'}
                                </span>
                              </div>
                            ) : (
                              <div>
                                <input
                                  type="number"
                                  min="1"
                                  required
                                  value={item.qty}
                                  onChange={e => handleUpdateGRNItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                                  className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-mono font-bold text-center focus:ring-2 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 text-xs text-emerald-600"
                                  placeholder="Loose units"
                                />
                                <span className="text-[10px] text-slate-400 text-center block mt-0.5">
                                  {matchedProduct?.baseUnit || 'units'}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="p-2 text-right">
                            {isPackMode ? (
                              <div>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  required
                                  value={item.packCost}
                                  onChange={e => handleUpdateGRNItem(item.id, 'packCost', e.target.value)}
                                  className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-mono font-bold text-right focus:ring-2 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 text-xs"
                                  placeholder="Cost / Pack"
                                />
                                <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                                  {formatCurrency(item.unitCost)} / {matchedProduct?.baseUnit || 'tab'}
                                </span>
                              </div>
                            ) : (
                              <div>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  required
                                  value={item.unitCost}
                                  onChange={e => handleUpdateGRNItem(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                                  className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-mono font-bold text-right focus:ring-2 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 text-xs"
                                  placeholder="Cost / Unit"
                                />
                                <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                                  Per {matchedProduct?.baseUnit || 'unit'}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="p-2 text-right">
                            {isPackMode ? (
                              <div>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  required
                                  value={item.packSellingPrice}
                                  onChange={e => handleUpdateGRNItem(item.id, 'packSellingPrice', e.target.value)}
                                  className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-mono font-bold text-right focus:ring-2 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 text-xs text-brand-600"
                                  placeholder="Sell / Pack"
                                />
                                <span className="text-[10px] text-brand-600/80 font-medium block mt-0.5 truncate">
                                  {formatCurrency(item.sellingPrice)} / {matchedProduct?.baseUnit || 'tab'}
                                </span>
                              </div>
                            ) : (
                              <div>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  required
                                  value={item.sellingPrice}
                                  onChange={e => handleUpdateGRNItem(item.id, 'sellingPrice', parseFloat(e.target.value) || 0)}
                                  className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-mono font-bold text-right focus:ring-2 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 text-xs text-brand-600"
                                  placeholder="Sell / Unit"
                                />
                                <span className="text-[10px] text-brand-600/80 font-medium block mt-0.5 truncate">
                                  Per {matchedProduct?.baseUnit || 'unit'}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="p-2 text-center">
                            <div className="space-y-1">
                              <div className="flex items-center justify-center space-x-1.5 font-mono text-[11px]">
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  +{formatCurrency(profit)}
                                </span>
                                <span className="text-slate-400">|</span>
                                <span className="font-bold text-brand-600">
                                  {marginPercent.toFixed(1)}% mgn
                                </span>
                              </div>
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                marginPercent < 0 
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' 
                                  : marginPercent < 20 
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' 
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}>
                                {marginPercent < 0 ? '⚠️ Loss' : marginPercent < 20 ? '⚠️ Low (<20%)' : '✓ Healthy (≥20%)'}
                              </span>
                            </div>
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatCurrency(lineValuation)}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              disabled={grnItems.length <= 1}
                              onClick={() => handleRemoveGRNItem(item.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-30 disabled:hover:bg-transparent"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* GRN Modal Footer / Summary */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
                  <span className="text-slate-500">Products:</span>{' '}
                  <strong className="text-slate-900 dark:text-white font-mono">{grnItems.length}</strong>
                </div>
                <div className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
                  <span className="text-slate-500">Total Units:</span>{' '}
                  <strong className="text-emerald-600 font-mono">
                    {grnItems.reduce((acc, i) => acc + (i.qty || 0), 0).toLocaleString()}
                  </strong>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs">
                    <span className="text-slate-500 font-medium">Invoice Cost:</span>{' '}
                    <strong className="text-slate-800 dark:text-slate-200 font-bold font-mono text-sm ml-1">
                      {formatCurrency(grnItems.reduce((acc, i) => acc + ((i.qty || 0) * (i.unitCost || 0)), 0))}
                    </strong>
                  </div>
                  <div className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 rounded-lg text-xs">
                    <span className="text-emerald-700 dark:text-emerald-300 font-medium">Retail Value:</span>{' '}
                    <strong className="text-emerald-900 dark:text-emerald-100 font-bold font-mono text-sm ml-1">
                      {formatCurrency(grnItems.reduce((acc, i) => acc + ((i.qty || 0) * (i.sellingPrice || 0)), 0))}
                    </strong>
                  </div>

                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 select-none hover:bg-slate-200/70 dark:hover:bg-slate-750 transition" title="When checked, retail selling prices and pack definitions in the catalogue will be updated to reflect this shipment. When unchecked, only the received batch ledger and wholesale cost are recorded without altering master shelf prices.">
                    <input
                      type="checkbox"
                      checked={updateMasterSellingPrice}
                      onChange={e => setUpdateMasterSellingPrice(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Update Master Catalogue Shelf Prices & Tiers</span>
                  </label>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setShowGRNModal(false)}
                    className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-1.5"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>Commit Goods Receipt & Post to Shelf ({grnItems.length} Products)</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: VIEW BATCH OF PURCHASE DOSSIER (ALL PRODUCTS) */}
      {selectedBatchGroup && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-5xl w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400">
                  <Barcode className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">Batch Lot Traceability Dossier</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedBatchGroup.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      selectedBatchGroup.status === 'NEAR_EXPIRY' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                      selectedBatchGroup.status === 'QUARANTINED' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                      selectedBatchGroup.status === 'EXPIRED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {selectedBatchGroup.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Batch # <strong className="text-slate-900 dark:text-white font-bold">{selectedBatchGroup.batchNumber}</strong> — Purchase Intake Master
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedBatchGroup(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Batch Level Metadata Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs flex-shrink-0">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Supplier & Origin</span>
                <p className="font-bold text-slate-800 dark:text-white truncate">{selectedBatchGroup.supplierName}</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate">Location: {selectedBatchGroup.storageLocation}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Intake Reference</span>
                <p className="font-mono font-bold text-slate-800 dark:text-white truncate">{selectedBatchGroup.grnNumber}</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate">Waybill: {selectedBatchGroup.deliveryNote || 'N/A'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Received & Expiry</span>
                <p className="font-bold text-slate-800 dark:text-white">Rec: {selectedBatchGroup.receivedDate || 'N/A'}</p>
                <p className="text-teal-600 dark:text-teal-400 font-semibold text-[11px] truncate">
                  Earliest Exp: {selectedBatchGroup.earliestExpiryDate || 'N/A'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Batch Inventory</span>
                <p className="font-bold text-sm text-teal-600 dark:text-teal-400">
                  {selectedBatchGroup.totalRemainingStock.toLocaleString()} <span className="text-xs text-slate-400 font-normal">rem / {selectedBatchGroup.totalInitialStock.toLocaleString()} received</span>
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  {selectedBatchGroup.totalProductsCount} Distinct Formulation(s)
                </p>
              </div>
            </div>

            {/* Financial Valuation Banner */}
            <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 flex flex-wrap items-center justify-between gap-3 text-xs flex-shrink-0">
              <div className="flex items-center space-x-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Total Batch Cost Value</span>
                  <strong className="text-slate-900 dark:text-white font-bold font-mono text-sm">{formatCurrency(selectedBatchGroup.totalCostValue)}</strong>
                </div>
                <div className="h-7 w-[1px] bg-emerald-200 dark:bg-emerald-800" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Total Batch Retail Value</span>
                  <strong className="text-emerald-700 dark:text-emerald-300 font-bold font-mono text-sm">{formatCurrency(selectedBatchGroup.totalRetailValue)}</strong>
                </div>
                <div className="h-7 w-[1px] bg-emerald-200 dark:bg-emerald-800" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Projected Gross Profit</span>
                  <strong className="text-teal-700 dark:text-teal-300 font-bold font-mono text-sm">
                    {formatCurrency(selectedBatchGroup.totalRetailValue - selectedBatchGroup.totalCostValue)}
                  </strong>
                </div>
              </div>
              <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 shadow-sm">
                FEFO Commercial Lot Inspection
              </div>
            </div>

            {/* Products Table */}
            <div className="flex-1 overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700 rounded-xl min-h-[220px]">
              <div className="bg-slate-100 dark:bg-slate-800/90 px-3 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                  <Package className="w-4 h-4 text-teal-600" />
                  <span>Formulations & Products In This Batch ({selectedBatchGroup.items.length})</span>
                </span>
                <span className="text-[10px] text-slate-500">
                  Individual product line allocations under Batch #{selectedBatchGroup.batchNumber}
                </span>
              </div>

              <div className="overflow-y-auto flex-1 p-0">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5 w-8 text-center">#</th>
                      <th className="p-2.5">Medicine Name</th>
                      <th className="p-2.5">Mfg Date</th>
                      <th className="p-2.5">Expiry Date</th>
                      <th className="p-2.5 text-right">Stock (Rem / Recv)</th>
                      <th className="p-2.5 text-right">Buy Price</th>
                      <th className="p-2.5 text-right">Sell Price</th>
                      <th className="p-2.5 text-right">Total Value</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {selectedBatchGroup.items.map((item, idx) => {
                      const daysLeft = item.expiryDate 
                        ? Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
                        : 0;
                      const isExpired = daysLeft <= 0;
                      const isNearExpiry = daysLeft > 0 && daysLeft <= 90;
                      const rem = item.remainingStock ?? item.quantityOnHand ?? 0;
                      const init = item.initialStock ?? item.quantityOnHand ?? 0;
                      const cost = item.costPrice ?? item.unitCost ?? 0;
                      const sell = item.sellingPrice ?? 0;

                      return (
                        <tr key={item.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                          <td className="p-2.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="p-2.5">
                            <div className="font-bold text-slate-900 dark:text-white">{item.productName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">ID: {item.productId}</div>
                          </td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                            {item.mfgDate || item.manufacturingDate || 'N/A'}
                          </td>
                          <td className="p-2.5">
                            <div className={`font-mono font-bold ${
                              isExpired ? 'text-rose-600' : isNearExpiry ? 'text-amber-600' : 'text-slate-800 dark:text-slate-200'
                            }`}>
                              {item.expiryDate}
                            </div>
                            <span className={`text-[10px] font-semibold ${
                              isExpired ? 'text-rose-600' : isNearExpiry ? 'text-amber-600' : 'text-teal-600 dark:text-teal-400'
                            }`}>
                              {isExpired ? 'EXPIRED' : `${daysLeft} days left`}
                            </span>
                          </td>
                          <td className="p-2.5 text-right">
                            <div className="font-bold font-mono text-teal-600 dark:text-teal-400">
                              {rem.toLocaleString()} <span className="text-slate-400 text-[10px] font-normal">rem / {init.toLocaleString()} recv</span>
                            </div>
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-700 dark:text-slate-300">
                            {formatCurrency(cost)}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatCurrency(sell)}
                          </td>
                          <td className="p-2.5 text-right">
                            <div className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(rem * sell)}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Cost: {formatCurrency(rem * cost)}
                            </div>
                          </td>
                          <td className="p-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                              item.status === 'NEAR_EXPIRY' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                              item.status === 'QUARANTINED' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                              item.status === 'EXPIRED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                              'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
              <div className="text-xs text-slate-500">
                Batch Registry Reference: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{selectedBatchGroup.batchNumber}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const grp = selectedBatchGroup;
                    setSelectedBatchGroup(null);
                    handleOpenEditBatchGroup(grp);
                  }}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow flex items-center space-x-1.5 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Batch of Purchase</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBatchGroup(null)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-700"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT BATCH OF PURCHASE (MULTI-PRODUCT WORKBENCH) */}
      {editingBatchGroup && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <form 
            onSubmit={handleSaveBatchGroupEdit} 
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-6xl w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[95vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-brand-100 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400">
                  <Edit3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                    <span>Edit Batch of Purchase</span>
                    <span className="font-mono text-brand-600 dark:text-brand-400 text-xs px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950 border border-brand-200 dark:border-brand-800">
                      {editingBatchGroup.batchNumber}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update batch identification, intake origin, and manage all medication formulation line items received under this batch.
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingBatchGroup(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Batch Master Info Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex-shrink-0">
              <div>
                <label className="font-semibold block mb-1 text-slate-800 dark:text-slate-200">
                  Batch / Lot # <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editBatchNumber}
                  onChange={e => setEditBatchNumber(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 font-mono font-bold focus:ring-2 focus:ring-brand-500 border-slate-300 dark:border-slate-600"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-800 dark:text-slate-200">
                  Origin Supplier <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editSupplierId}
                  onChange={e => setEditSupplierId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 font-semibold focus:ring-2 focus:ring-brand-500 border-slate-300 dark:border-slate-600"
                >
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200">
                    Storage Location <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isCustomEditStorageLocation;
                      setIsCustomEditStorageLocation(next);
                      if (next && editStorageLocation === activeShopLocation) {
                        setEditStorageLocation('');
                      } else if (!next && !editStorageLocation) {
                        setEditStorageLocation(activeShopLocation);
                      }
                    }}
                    className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                  >
                    {isCustomEditStorageLocation ? 'Select preset' : '+ Custom room/bay'}
                  </button>
                </div>

                {isCustomEditStorageLocation ? (
                  <div className="space-y-1">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Room 102, Cold Storage 2, Shelf B..."
                      value={editStorageLocation}
                      onChange={e => setEditStorageLocation(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 font-semibold focus:ring-2 focus:ring-brand-500 border-slate-300 dark:border-slate-600 text-xs"
                    />
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Custom room or intake location</span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditStorageLocation(activeShopLocation);
                          setIsCustomEditStorageLocation(false);
                        }}
                        className="text-brand-600 hover:underline cursor-pointer font-medium"
                      >
                        Reset to Active Shop
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <select
                      value={editStorageLocation}
                      onChange={e => {
                        if (e.target.value === '__custom__') {
                          setIsCustomEditStorageLocation(true);
                          setEditStorageLocation('');
                        } else {
                          setEditStorageLocation(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 font-semibold focus:ring-2 focus:ring-brand-500 border-slate-300 dark:border-slate-600 text-xs truncate"
                    >
                      <option value={activeShopLocation}>
                        🏪 {activeShopLocation} (Active Shop / Branch)
                      </option>
                      {storageLocations
                        .filter(loc => loc.name !== activeShopLocation)
                        .map(loc => (
                          <option key={loc.id} value={loc.name}>
                            {loc.name} {loc.type ? `(${loc.type})` : ''}
                          </option>
                        ))}
                      <option value="__custom__">➕ Other / Custom Room Location...</option>
                    </select>
                    <span className="text-[10px] text-slate-400 mt-0.5 block truncate" title={`Active shop: ${activeShopLocation}`}>
                      Default: <strong className="text-slate-600 dark:text-slate-300">{activeShopLocation}</strong>
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-800 dark:text-slate-200">
                  Waybill / Delivery #
                </label>
                <input
                  type="text"
                  value={editDeliveryNote}
                  onChange={e => setEditDeliveryNote(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 font-mono text-xs focus:ring-2 focus:ring-brand-500 border-slate-300 dark:border-slate-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200">
                    Inward Received Date
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditReceivedDate(new Date().toISOString().slice(0, 10))}
                    className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                    title="Set to today's date"
                  >
                    Today
                  </button>
                </div>
                <input
                  type="date"
                  value={editReceivedDate}
                  onChange={e => setEditReceivedDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 font-bold focus:ring-2 focus:ring-brand-500 border-slate-300 dark:border-slate-600 text-xs"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Defaults to intake date; change if received earlier
                </span>
              </div>
            </div>

            {/* Products Table */}
            <div className="flex-1 overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700 rounded-xl min-h-[260px]">
              <div className="bg-slate-100 dark:bg-slate-800/90 px-3 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                  <Boxes className="w-4 h-4 text-brand-600" />
                  <span>Items In This Batch ({editBatchItems.length} Products)</span>
                </span>
                <button
                  type="button"
                  onClick={handleAddProductToEditBatch}
                  className="px-2.5 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product to Batch</span>
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-0">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2 w-8 text-center">#</th>
                      <th className="p-2 min-w-[190px]">Medicine Name *</th>
                      <th className="p-2 min-w-[125px]">Mfg Date</th>
                      <th className="p-2 min-w-[130px]">Expiry Date *</th>
                      <th className="p-2 min-w-[90px] text-right" title="Live physical quantity currently remaining on shelf">Remaining Qty *</th>
                      <th className="p-2 min-w-[95px] text-right" title="Quantity originally received from supplier into inventory">Received Qty *</th>
                      <th className="p-2 min-w-[95px] text-right">Buy Price ({currentCurrency.symbol}) *</th>
                      <th className="p-2 min-w-[95px] text-right">Sell Price ({currentCurrency.symbol}) *</th>
                      <th className="p-2 min-w-[110px] text-right">Margin / Profit</th>
                      <th className="p-2 min-w-[120px]">Status *</th>
                      <th className="p-2 w-10 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {editBatchItems.map((item, idx) => {
                      const cost = Number(item.costPrice) || 0;
                      const sell = Number(item.sellingPrice) || 0;
                      const profitUnit = sell - cost;
                      const marginPct = sell > 0 ? (profitUnit / sell) * 100 : 0;
                      const isNegative = profitUnit < 0;

                      return (
                        <tr key={item.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                          <td className="p-2 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                          <td className="p-2">
                            <select
                              value={item.productId}
                              onChange={e => handleUpdateEditBatchItem(idx, 'productId', e.target.value)}
                              className="w-full p-1.5 border rounded-lg bg-white dark:bg-slate-800 font-semibold text-xs border-slate-300 dark:border-slate-600 focus:ring-1 focus:ring-brand-500"
                            >
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.brandName} ({p.dosageForm || 'Form'})</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="date"
                              value={item.mfgDate}
                              onChange={e => handleUpdateEditBatchItem(idx, 'mfgDate', e.target.value)}
                              className="w-full p-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs font-mono border-slate-300 dark:border-slate-600"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="date"
                              required
                              value={item.expiryDate}
                              onChange={e => handleUpdateEditBatchItem(idx, 'expiryDate', e.target.value)}
                              className="w-full p-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs font-mono font-bold border-slate-300 dark:border-slate-600"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              min="0"
                              required
                              title="Remaining Stock on shelf"
                              value={item.remainingStock}
                              onChange={e => handleUpdateEditBatchItem(idx, 'remainingStock', parseInt(e.target.value) || 0)}
                              className="w-20 p-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs font-mono font-bold text-right border-slate-300 dark:border-slate-600 text-teal-600"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              min="0"
                              required
                              title="Received Quantity (original inward intake)"
                              value={item.initialStock}
                              onChange={e => handleUpdateEditBatchItem(idx, 'initialStock', parseInt(e.target.value) || 0)}
                              className="w-20 p-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs font-mono text-right border-slate-300 dark:border-slate-600"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              required
                              value={item.costPrice}
                              onChange={e => handleUpdateEditBatchItem(idx, 'costPrice', parseFloat(e.target.value) || 0)}
                              className="w-20 p-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs font-mono text-right border-slate-300 dark:border-slate-600"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              required
                              value={item.sellingPrice}
                              onChange={e => handleUpdateEditBatchItem(idx, 'sellingPrice', parseFloat(e.target.value) || 0)}
                              className="w-20 p-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs font-mono font-bold text-right border-slate-300 dark:border-slate-600 text-emerald-600"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <div className={`font-mono text-xs font-bold ${
                              isNegative
                                ? 'text-rose-600 dark:text-rose-400'
                                : marginPct >= 25
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}>
                              {marginPct.toFixed(1)}%
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {profitUnit >= 0 ? '+' : ''}{formatCurrency(profitUnit)}
                            </div>
                          </td>
                          <td className="p-2">
                            <select
                              value={item.status}
                              onChange={e => handleUpdateEditBatchItem(idx, 'status', e.target.value)}
                              className="w-full p-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs font-semibold border-slate-300 dark:border-slate-600"
                            >
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="NEAR_EXPIRY">NEAR_EXPIRY</option>
                              <option value="QUARANTINED">QUARANTINED</option>
                              <option value="EXPIRED">EXPIRED</option>
                              <option value="DEPLETED">DEPLETED</option>
                            </select>
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemFromEditBatch(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                              title="Remove product line"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Summary Bar & Action Buttons */}
            {(() => {
              const totalRemainingUnits = editBatchItems.reduce((acc, i) => acc + (Number(i.remainingStock) || 0), 0);
              const totalCostVal = editBatchItems.reduce((acc, i) => acc + ((Number(i.remainingStock) || 0) * (Number(i.costPrice) || 0)), 0);
              const totalRetailVal = editBatchItems.reduce((acc, i) => acc + ((Number(i.remainingStock) || 0) * (Number(i.sellingPrice) || 0)), 0);
              const totalProfit = totalRetailVal - totalCostVal;
              const overallMargin = totalRetailVal > 0 ? (totalProfit / totalRetailVal) * 100 : 0;

              return (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <div className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <span className="text-slate-500">Products:</span>{' '}
                      <strong className="text-slate-900 dark:text-white font-bold">{editBatchItems.length}</strong>
                    </div>
                    <div className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <span className="text-slate-500">Total Units:</span>{' '}
                      <strong className="text-teal-600 dark:text-teal-400 font-bold font-mono">
                        {totalRemainingUnits.toLocaleString()}
                      </strong>
                    </div>
                    <div className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <span className="text-slate-500">Cost:</span>{' '}
                      <strong className="text-slate-700 dark:text-slate-300 font-bold font-mono">
                        {formatCurrency(totalCostVal)}
                      </strong>
                    </div>
                    <div className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 rounded-lg">
                      <span className="text-emerald-700 dark:text-emerald-300 font-medium">Retail Valuation:</span>{' '}
                      <strong className="text-emerald-900 dark:text-emerald-100 font-bold font-mono">
                        {formatCurrency(totalRetailVal)}
                      </strong>
                    </div>
                    <div className={`px-2.5 py-1.5 rounded-lg border font-mono ${
                      totalProfit >= 0
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-200'
                        : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200'
                    }`}>
                      <span className="text-slate-500 mr-1 font-sans">Margin:</span>
                      <strong className="font-bold">{overallMargin.toFixed(1)}%</strong>
                      <span className="text-[10px] ml-1 opacity-80">({totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)})</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditingBatchGroup(null)}
                      className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Batch Changes</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </form>
        </div>
      )}
    </div>
  );
};
