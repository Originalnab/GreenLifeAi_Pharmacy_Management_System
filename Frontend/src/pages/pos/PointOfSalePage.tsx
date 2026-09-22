import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Barcode, ShoppingCart, Trash2, Plus, Minus, 
  CreditCard, Banknote, ArrowRightLeft, UserCheck, 
  FileText, CheckCircle2, Printer, X, ShieldAlert,
  Save, RotateCcw, ChevronDown, Zap, Bookmark, FileSpreadsheet, Smartphone,
  Receipt, Clock, Copy, Check
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { CartItem, Product, PaymentTender, Sale, Customer, DraftSale } from '../../types';

const DEFAULT_WALK_IN_CUSTOMER: Customer = {
  id: 'walk_in',
  name: 'Walk-in Retail Customer',
  phone: '000-000-0000',
  email: 'walkin@greenlife.local',
  address: 'Counter Dispensary',
  creditLimit: 0,
  currentBalance: 0,
  totalPurchases: 0,
  receivablesAgeing: {
    current: 0,
    days30: 0,
    days60: 0,
    days90Plus: 0
  }
};

export const PointOfSalePage: React.FC = () => {
  const { 
    products, batches, customers, currentUser, sales,
    processSale, processCreditSale, formatCurrency, currentCurrency,
    systemProfile, printerConfig, operatingMode,
    draftSales, saveDraftSale, deleteDraftSale,
    toast, alertDialog
  } = usePharmacy();

  // Search & Scanner
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(() => {
    return (customers && customers.length > 0)
      ? (customers.find(c => c.id === 'cust_3' || c.name.toLowerCase().includes('walk-in')) || customers[0] || DEFAULT_WALK_IN_CUSTOMER)
      : DEFAULT_WALK_IN_CUSTOMER;
  });
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  const activeCustomer = selectedCustomer || DEFAULT_WALK_IN_CUSTOMER;

  useEffect(() => {
    if (!selectedCustomer || (customers.length > 0 && !customers.some(c => c.id === selectedCustomer.id) && selectedCustomer.id !== 'walk_in')) {
      const fallback = customers.find(c => c.id === 'cust_3' || c.name.toLowerCase().includes('walk-in')) || customers[0] || DEFAULT_WALK_IN_CUSTOMER;
      setSelectedCustomer(fallback);
    }
  }, [customers, selectedCustomer]);

  // Modals
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState({
    prescriberName: 'Dr. Kelechi Nnamdi',
    prescriberLicense: 'MDCN-44109',
    hospitalClinic: 'St. Nicholas Hospital',
    patientName: '',
    verifiedByPharmacistId: currentUser.id,
    verifiedByPharmacistName: currentUser.name,
    notes: 'Prescription verified in accordance with PCN standard dispensing guidelines.'
  });
  const [isPrescriptionVerified, setIsPrescriptionVerified] = useState(false);

  // Tender Modal
  const [showTenderModal, setShowTenderModal] = useState(false);
  const [cashTendered, setCashTendered] = useState<string>('');
  const [cardAmount, setCardAmount] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [momoAmount, setMomoAmount] = useState<string>('');
  const [momoNetwork, setMomoNetwork] = useState<'MTN MoMo' | 'Telecel Cash' | 'AT Money' | 'GhanaPay'>('MTN MoMo');
  const [momoRef, setMomoRef] = useState<string>('');
  const [creditAmount, setCreditAmount] = useState<string>('');
  const [cardRef, setCardRef] = useState<string>('');

  // Receipt Modal
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [isReprintMode, setIsReprintMode] = useState(false);

  // Receipt History Drawer State
  const [showReceiptHistoryDrawer, setShowReceiptHistoryDrawer] = useState(false);
  const [receiptSearchTerm, setReceiptSearchTerm] = useState('');
  const [receiptFilterTender, setReceiptFilterTender] = useState<string>('ALL');
  const [copiedReceiptId, setCopiedReceiptId] = useState<string | null>(null);

  const handleReprintReceipt = (sale: Sale) => {
    setCompletedSale(sale);
    setIsReprintMode(true);
    setShowReceiptHistoryDrawer(false);
    setShowReceiptModal(true);
  };

  const handleCopyReceiptNumber = (recNo: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(recNo);
    setCopiedReceiptId(recNo);
    setTimeout(() => setCopiedReceiptId(null), 2000);
  };

  // Held Carts & Drafts
  const [heldCart, setHeldCart] = useState<CartItem[] | null>(null);
  const [showSaveDraftModal, setShowSaveDraftModal] = useState(false);
  const [showDraftsDrawer, setShowDraftsDrawer] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftNotes, setDraftNotes] = useState('');
  const [draftToast, setDraftToast] = useState<string | null>(null);

  // Credit Sale Modal state
  const [showCreditSaleModal, setShowCreditSaleModal] = useState(false);
  const [creditCustomerId, setCreditCustomerId] = useState(customers[0]?.id || '');
  const [creditDueDate, setCreditDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [creditNotes, setCreditNotes] = useState('Approved outpatient credit dispensation on patient account.');
  const [overrideCreditLimit, setOverrideCreditLimit] = useState(false);

  // Keyboard Shortcuts (F2 search, F8 hold, F9 tender, Esc close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F9' && cart.length > 0) {
        e.preventDefault();
        initiateCheckout();
      } else if (e.key === 'Escape') {
        setShowTenderModal(false);
        setShowPrescriptionModal(false);
        setShowReceiptModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  // Cart calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxableAmount = subtotal - discountAmount;
  const vatAmount = taxableAmount * 0.075; // Standard 7.5%
  const grandTotal = taxableAmount + vatAmount;

  const hasPrescriptionDrugs = cart.some(i => i.isPrescriptionRequired);

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCat && p.availableQuantity > 0;
  });

  // Add product to cart with primary packaging tier & strict FEFO batch
  const addToCart = (product: Product) => {
    const productBatches = batches
      .filter(b => b.productId === product.id && b.status !== 'QUARANTINED' && b.status !== 'EXPIRED' && b.status !== 'DISPOSED' && b.availableQuantity > 0)
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

    if (productBatches.length === 0) {
      toast.warning(`No active non-quarantined batches available for ${product.brandName}.`, 'Out of Stock');
      return;
    }

    const fefoBatch = productBatches[0];

    // Pick preferred primary tier (Pack or first packaging tier)
    const defaultTier = product.packagingTiers?.[0] || {
      unitName: product.baseUnit || 'Piece',
      multiplier: 1,
      sellingPrice: product.sellingPrice,
      costPrice: product.unitCost,
      isBase: true
    };

    // Check if already in cart with exact same batch and unit
    const existingIndex = cart.findIndex(item => 
      item.productId === product.id && 
      item.batchId === fefoBatch.id &&
      item.selectedUnitName === defaultTier.unitName
    );

    if (existingIndex > -1) {
      const existing = cart[existingIndex];
      const neededBaseUnits = (existing.quantity + 1) * existing.unitMultiplier;
      if (neededBaseUnits > fefoBatch.availableQuantity) {
        toast.warning(`Cannot add more: only ${fefoBatch.availableQuantity} base units available in batch ${fefoBatch.batchNumber}.`, 'Batch Limit Reached');
        return;
      }
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setCart(updated);
    } else {
      const newItem: CartItem = {
        productId: product.id,
        productName: product.brandName,
        dosageForm: product.dosageForm,
        strength: product.strength,
        batchId: fefoBatch.id,
        batchNumber: fefoBatch.batchNumber,
        expiryDate: fefoBatch.expiryDate,
        selectedUnitName: defaultTier.unitName,
        unitMultiplier: defaultTier.multiplier,
        packagingTiers: product.packagingTiers,
        unitPrice: defaultTier.sellingPrice,
        quantity: 1,
        discountPercent: 0,
        subtotal: defaultTier.sellingPrice,
        isPrescriptionRequired: product.isPrescriptionRequired,
        availableStock: fefoBatch.availableQuantity,
        isFefoRecommended: true
      };
      setCart([...cart, newItem]);
    }
  };

  // Change Unit Tier on cart line (e.g. Pack -> Strip -> Piece)
  const changeCartItemUnit = (index: number, unitName: string) => {
    const updated = [...cart];
    const item = updated[index];
    const targetTier = item.packagingTiers?.find(t => t.unitName === unitName);
    if (!targetTier) return;

    item.selectedUnitName = targetTier.unitName;
    item.unitMultiplier = targetTier.multiplier;
    item.unitPrice = targetTier.sellingPrice;
    item.subtotal = item.quantity * item.unitPrice;
    setCart(updated);
  };

  const updateQuantity = (index: number, delta: number) => {
    const updated = [...cart];
    const item = updated[index];
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    const neededBaseUnits = newQty * item.unitMultiplier;
    if (neededBaseUnits > item.availableStock) {
      toast.warning(`Max available stock in this batch is ${item.availableStock} base units (${Math.floor(item.availableStock / item.unitMultiplier)} ${item.selectedUnitName}s)`, 'Stock Limit Exceeded');
      return;
    }
    item.quantity = newQty;
    item.subtotal = item.quantity * item.unitPrice;
    setCart(updated);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setIsPrescriptionVerified(false);
  };

  const holdCart = () => {
    if (cart.length === 0) return;
    setHeldCart(cart);
    setCart([]);
    toast.info('Cart held in memory. Click "Resume Held Cart" to restore.', 'Cart Suspended');
  };

  const resumeCart = () => {
    if (heldCart) {
      setCart(heldCart);
      setHeldCart(null);
    }
  };

  const isDoctorAuthRequired = systemProfile.requireDoctorAuthorization ?? true;

  const initiateCheckout = () => {
    if (cart.length === 0) return;

    // Strict clinical gating only if doctor authorization policy is enabled by Super Admin
    if (isDoctorAuthRequired && hasPrescriptionDrugs && !isPrescriptionVerified) {
      setPrescriptionData(prev => ({
        ...prev,
        patientName: activeCustomer.name !== 'Walk-in Retail Customer' ? activeCustomer.name : ''
      }));
      setShowPrescriptionModal(true);
      return;
    }

    setCashTendered(grandTotal.toFixed(2));
    setCardAmount('');
    setTransferAmount('');
    setMomoAmount('');
    setMomoRef('');
    setCreditAmount('');
    setShowTenderModal(true);
  };

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const saved = saveDraftSale({
      items: [...cart],
      subtotal,
      discountTotal: discountAmount,
      taxTotal: vatAmount,
      total: grandTotal,
      customerId: activeCustomer.id !== 'walk_in' ? activeCustomer.id : undefined,
      customerName: activeCustomer.name,
      hasPrescriptionDrugs,
      prescription: isPrescriptionVerified ? prescriptionData : undefined,
      title: draftTitle.trim() || `Draft Quote (${cart.length} items)`,
      notes: draftNotes.trim()
    });

    setShowSaveDraftModal(false);
    setDraftTitle('');
    setDraftNotes('');
    setCart([]);
    setIsPrescriptionVerified(false);
    setDraftToast(`Sale successfully saved as Draft #${saved.draftNumber}. Zero inventory deducted!`);
    setTimeout(() => setDraftToast(null), 4500);
  };

  const handleOpenCreditSale = () => {
    if (cart.length === 0) return;
    if (hasPrescriptionDrugs && isDoctorAuthRequired && !isPrescriptionVerified) {
      setPrescriptionData(prev => ({
        ...prev,
        patientName: activeCustomer.name !== 'Walk-in Retail Customer' ? activeCustomer.name : ''
      }));
      setShowPrescriptionModal(true);
      return;
    }
    const nonWalkin = customers.find(c => c.name !== 'Walk-in Retail Customer' && c.creditLimit > 0) || customers.find(c => c.name !== 'Walk-in Retail Customer');
    if (activeCustomer.name !== 'Walk-in Retail Customer') {
      setCreditCustomerId(activeCustomer.id);
    } else if (nonWalkin) {
      setCreditCustomerId(nonWalkin.id);
    }
    setOverrideCreditLimit(false);
    setShowCreditSaleModal(true);
  };

  const handleConfirmCreditSale = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === creditCustomerId);
    if (!cust) {
      toast.warning('Please select an active registered customer account for this credit sale.', 'Customer Required');
      return;
    }
    const availableCredit = Math.max(0, cust.creditLimit - cust.currentBalance);
    if (grandTotal > availableCredit && !overrideCreditLimit) {
      alertDialog({
        title: 'Credit Headroom Exceeded',
        message: `This credit purchase of ${formatCurrency(grandTotal)} exceeds ${cust.name}'s available credit headroom (${formatCurrency(availableCredit)}). Please check the Supervisor Authorization Override box to proceed.`,
        variant: 'warning'
      });
      return;
    }

    const sale = processCreditSale({
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      customerId: cust.id,
      customerName: cust.name,
      items: cart,
      subtotal,
      discountTotal: discountAmount,
      taxTotal: vatAmount,
      total: grandTotal,
      payments: [{ method: 'CREDIT', amount: grandTotal }],
      changeDue: 0,
      hasPrescriptionDrugs,
      prescription: isPrescriptionVerified ? prescriptionData : undefined,
      status: 'COMPLETED',
      dueDate: creditDueDate
    });

    setCompletedSale(sale);
    setShowCreditSaleModal(false);
    setShowReceiptModal(true);
    setCart([]);
    setDiscountPercent(0);
    setIsPrescriptionVerified(false);
    toast.success(`Credit invoice #${sale.receiptNumber} recorded for ${cust.name}.`, 'Credit Sale Processed');
  };

  const loadDraftIntoCart = (draft: DraftSale) => {
    setCart([...draft.items]);
    if (draft.customerId) {
      const foundCust = customers.find(c => c.id === draft.customerId);
      if (foundCust) setSelectedCustomer(foundCust);
    }
    if (draft.prescription) {
      setPrescriptionData(draft.prescription as any);
      setIsPrescriptionVerified(true);
    }
    setShowDraftsDrawer(false);
    setDraftToast(`Loaded Draft #${draft.draftNumber} into active cart. Inventory will be deducted upon final payment.`);
    setTimeout(() => setDraftToast(null), 4500);
  };

  const confirmPrescription = () => {
    if (!prescriptionData.prescriberName || !prescriptionData.prescriberLicense || !prescriptionData.patientName) {
      toast.warning('Please fill out all required prescriber and patient credentials.', 'Missing Credentials');
      return;
    }
    setIsPrescriptionVerified(true);
    setShowPrescriptionModal(false);
    setCashTendered(grandTotal.toFixed(2));
    setShowTenderModal(true);
  };

  // Complete split payment
  const completeTransaction = () => {
    const cash = parseFloat(cashTendered) || 0;
    const card = parseFloat(cardAmount) || 0;
    const transfer = parseFloat(transferAmount) || 0;
    const momo = parseFloat(momoAmount) || 0;
    const credit = parseFloat(creditAmount) || 0;

    const totalTendered = cash + card + transfer + momo + credit;

    if (Math.round(totalTendered * 100) < Math.round(grandTotal * 100)) {
      toast.warning(`Insufficient tender amount. Required: ${formatCurrency(grandTotal)}, Tendered: ${formatCurrency(totalTendered)}`, 'Incomplete Payment');
      return;
    }

    if (credit > 0) {
      const customerLimit = activeCustomer.creditLimit || 0;
      const newBalance = (activeCustomer.currentBalance || 0) + credit;
      if (newBalance > customerLimit && customerLimit > 0) {
        alertDialog({
          title: 'Credit Limit Exceeded',
          message: `Customer credit limit is ${formatCurrency(customerLimit)}, and current balance is ${formatCurrency(activeCustomer.currentBalance)}. Adding this balance exceeds their approved credit ceiling.`,
          variant: 'danger'
        });
        return;
      }
    }

    const changeDue = cash > 0 ? Math.max(0, totalTendered - grandTotal) : 0;

    const tenders: PaymentTender[] = [];
    if (cash > 0) tenders.push({ method: 'CASH', amount: cash });
    if (card > 0) tenders.push({ method: 'CARD', amount: card, reference: cardRef || 'POS-CARD' });
    if (transfer > 0) tenders.push({ method: 'TRANSFER', amount: transfer, reference: 'BANK-TRANSFER' });
    if (momo > 0) tenders.push({ method: 'MOMO', amount: momo, reference: `${momoNetwork}: ${momoRef || 'MM-APPROVED'}` });
    if (credit > 0) tenders.push({ method: 'CREDIT', amount: credit, reference: `CREDIT-${activeCustomer.id}` });

    const newSale = processSale({
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      customerId: activeCustomer.id,
      customerName: activeCustomer.name,
      items: cart,
      subtotal,
      discountTotal: discountAmount,
      taxTotal: vatAmount,
      total: grandTotal,
      payments: tenders,
      changeDue,
      hasPrescriptionDrugs,
      prescription: hasPrescriptionDrugs && isPrescriptionVerified ? prescriptionData : undefined,
      status: 'COMPLETED'
    });

    setIsReprintMode(false);
    setCompletedSale(newSale);
    setShowTenderModal(false);
    setShowReceiptModal(true);
    setCart([]);
    setIsPrescriptionVerified(false);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-4 relative">
      {/* Toast Notification for Drafts or Direct Sales */}
      {draftToast && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center space-x-2 border border-brand-500 animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{draftToast}</span>
        </div>
      )}

      {/* LEFT: Search & Product Selection Grid */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Search Bar & Shortcuts Header */}
        <div className="p-3 md:p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                ref={searchInputRef}
                id="pos-search-input"
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search medication by brand, generic, SKU, or scan barcode (F2)..."
                className="w-full pl-9 pr-24 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <button
                onClick={() => setSearchTerm('890123456003')}
                className="absolute right-1.5 top-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-brand-50 text-[10px] font-bold text-slate-600 dark:text-slate-300 rounded flex items-center space-x-1"
                title="Simulate Barcode Scanner Beep"
              >
                <Barcode className="w-3.5 h-3.5 text-brand-600" />
                <span>Scan Demo</span>
              </button>
            </div>

            {heldCart && (
              <button
                onClick={resumeCart}
                className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1 animate-pulse"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Resume ({heldCart.length})</span>
              </button>
            )}

            {/* Drafts Drawer Trigger */}
            <button
              type="button"
              id="pos-drafts-btn"
              onClick={() => setShowDraftsDrawer(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition whitespace-nowrap"
              title="View saved draft orders & estimates"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-brand-600" />
              <span>Drafts ({draftSales.length})</span>
            </button>

            {/* Receipt History & Reprint Drawer Trigger */}
            <button
              type="button"
              id="pos-receipt-history-btn"
              onClick={() => setShowReceiptHistoryDrawer(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition whitespace-nowrap"
              title="View completed sales receipt history & reprint receipts"
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
              <span>Receipts ({sales.length})</span>
            </button>

            {sales.length > 0 && (
              <button
                type="button"
                id="pos-reprint-last-btn"
                onClick={() => handleReprintReceipt(sales[0])}
                className="hidden sm:flex px-2.5 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold items-center space-x-1 transition whitespace-nowrap shadow-xs"
                title={`Quickly reprint last completed receipt (${sales[0]?.receiptNumber})`}
              >
                <Printer className="w-3.5 h-3.5 text-emerald-600" />
                <span>Reprint Last</span>
              </button>
            )}
          </div>

          {/* Quick Categories Bar */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition ${
                selectedCategory === 'ALL' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All Medications
            </button>
            <button
              onClick={() => setSelectedCategory('cat_antibiotics')}
              className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition ${
                selectedCategory === 'cat_antibiotics' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Antibiotics
            </button>
            <button
              onClick={() => setSelectedCategory('cat_antimalarials')}
              className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition ${
                selectedCategory === 'cat_antimalarials' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Antimalarials
            </button>
            <button
              onClick={() => setSelectedCategory('cat_analgesics')}
              className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition ${
                selectedCategory === 'cat_analgesics' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Analgesics
            </button>
          </div>
        </div>

        {/* Product Cards Catalog */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
          {filteredProducts.map(prod => {
            const primaryTier = prod.packagingTiers?.[0];
            return (
              <div
                key={prod.id}
                onClick={() => addToCart(prod)}
                className="group bg-white dark:bg-slate-800/80 hover:bg-brand-50/40 dark:hover:bg-brand-950/30 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:border-brand-500/50 shadow-sm cursor-pointer transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-[10px] font-bold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-1.5 py-0.5 rounded">
                      {prod.dosageForm}
                    </span>
                    {prod.isPrescriptionRequired && (
                      <span className="text-[9px] font-extrabold bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 px-1.5 py-0.5 rounded border border-violet-200" title="Prescription Required">
                        POM
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-1.5 group-hover:text-brand-600 dark:group-hover:text-brand-400 leading-snug">
                    {prod.brandName}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {prod.genericName} • {prod.strength}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {formatCurrency(primaryTier ? primaryTier.sellingPrice : prod.sellingPrice)}
                    </span>
                    {primaryTier && (
                      <span className="text-[9px] text-slate-400 block font-medium">/{primaryTier.unitName}</span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
                    {prod.availableQuantity} {prod.baseUnit}s
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: POS Register Cart with Unit Selector */}
      <div className="w-full lg:w-96 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Cart Header */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4 text-brand-600" />
              <span className="font-bold text-xs text-slate-900 dark:text-white">Dispensing Register</span>
            </div>
            <span className="text-[11px] bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-300 font-bold px-2 py-0.5 rounded-full">
              {cart.length} lines
            </span>
          </div>

          {/* Customer Selection */}
          <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={activeCustomer.id}
              onChange={e => {
                if (e.target.value === 'walk_in') {
                  setSelectedCustomer(DEFAULT_WALK_IN_CUSTOMER);
                  return;
                }
                const found = customers.find(c => c.id === e.target.value);
                if (found) setSelectedCustomer(found);
              }}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none w-full"
            >
              {(!customers || customers.length === 0 || !customers.some(c => c.id === 'walk_in')) && (
                <option value="walk_in" className="dark:bg-slate-900">
                  Walk-in Retail Customer
                </option>
              )}
              {customers.map(c => (
                <option key={c.id} value={c.id} className="dark:bg-slate-900">
                  {c.name} {c.creditLimit > 0 ? `(Bal: ${formatCurrency(c.currentBalance)})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-100 dark:divide-slate-800">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-12 space-y-2">
              <ShoppingCart className="w-8 h-8 opacity-30" />
              <p>Cart is empty. Click medication or scan barcode.</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={`${item.productId}_${item.batchId}_${item.selectedUnitName}`} className="pt-2 first:pt-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <p className="font-bold text-xs text-slate-900 dark:text-slate-100">{item.productName}</p>
                      {item.isPrescriptionRequired && (
                        <span className="text-[9px] bg-violet-100 text-violet-700 px-1 py-0.2 rounded font-bold">POM</span>
                      )}
                    </div>
                    {/* FEFO Batch Indicator */}
                    <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">{item.batchNumber}</span>
                      <span>Exp: {item.expiryDate}</span>
                      <span className="text-emerald-600 font-bold">FEFO</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => removeFromCart(idx)} 
                    className="text-slate-400 hover:text-rose-500 transition p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* UNIT SELECTOR & QUANTITY CONTROLS */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-1.5">
                    {/* Packaging Unit Selector */}
                    {item.packagingTiers && item.packagingTiers.length > 1 ? (
                      <select
                        value={item.selectedUnitName}
                        onChange={e => changeCartItemUnit(idx, e.target.value)}
                        className="px-2 py-1 rounded-lg text-[11px] font-bold border border-brand-300 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-950/40 text-brand-800 dark:text-brand-300 focus:outline-none"
                      >
                        {item.packagingTiers.map(t => (
                          <option key={t.unitName} value={t.unitName}>
                            {t.unitName} ({formatCurrency(t.sellingPrice)})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-500">
                        {item.selectedUnitName}
                      </span>
                    )}

                    {/* Quantity Stepper */}
                    <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                      <button 
                        onClick={() => updateQuantity(idx, -1)}
                        className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-bold text-slate-800 dark:text-slate-200 min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(idx, 1)}
                        className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Prescription Verification Banner - ONLY shown if Doctor Authorization is strictly required */}
        {hasPrescriptionDrugs && isDoctorAuthRequired && (
          <div className="p-2.5 bg-violet-50 dark:bg-violet-950/40 border-t border-violet-200 dark:border-violet-900 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5 text-violet-800 dark:text-violet-300 font-semibold">
              <ShieldAlert className="w-4 h-4 text-violet-600" />
              <span>{isPrescriptionVerified ? 'Prescription Verified' : 'Prescription Required'}</span>
            </div>
            <button
              onClick={() => setShowPrescriptionModal(true)}
              className="text-[11px] font-bold text-violet-700 dark:text-violet-400 hover:underline"
            >
              {isPrescriptionVerified ? 'Edit Rx' : 'Verify (Rx)'}
            </button>
          </div>
        )}

        {/* Cart Totals & Checkout Trigger */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2 text-xs">
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>

          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span>Discount (%)</span>
            <div className="flex items-center space-x-1">
              <input
                type="number"
                min="0"
                max="30"
                value={discountPercent}
                onChange={e => setDiscountPercent(Math.min(30, Math.max(0, parseFloat(e.target.value) || 0)))}
                className="w-12 px-1.5 py-0.5 text-right bg-white dark:bg-slate-800 border rounded text-xs"
              />
              <span>%</span>
            </div>
          </div>

          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>VAT (7.5%)</span>
            <span>{formatCurrency(vatAmount)}</span>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline font-bold text-sm">
            <span className="text-slate-800 dark:text-slate-100">Total Due</span>
            <span className="text-lg font-extrabold text-brand-600 dark:text-brand-400">
              {formatCurrency(grandTotal)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-1.5 pt-2">
            <button
              onClick={holdCart}
              disabled={cart.length === 0}
              className="py-2 px-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-[11px] flex items-center justify-center space-x-1 transition disabled:opacity-50"
              title="Hold cart temporarily in browser memory"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Hold (F8)</span>
            </button>
            <button
              type="button"
              id="pos-save-draft-btn"
              onClick={() => {
                setDraftTitle(`${activeCustomer.name} - ${cart.length} items`);
                setShowSaveDraftModal(true);
              }}
              disabled={cart.length === 0}
              className="py-2 px-1 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 font-semibold rounded-xl text-[11px] flex items-center justify-center space-x-1 transition disabled:opacity-50 border border-brand-200 dark:border-brand-800"
              title="Save as persistent draft quotation with ZERO stock deduction"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Draft</span>
            </button>
            <button
              type="button"
              id="pos-credit-sale-btn"
              onClick={handleOpenCreditSale}
              disabled={cart.length === 0}
              className="py-2 px-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold rounded-xl text-[11px] flex items-center justify-center space-x-1 transition disabled:opacity-50 border border-amber-200 dark:border-amber-800 shadow-sm"
              title="Dispense medicines on patient credit account (deducts stock, records AR debt)"
            >
              <CreditCard className="w-3.5 h-3.5 text-amber-600" />
              <span>Credit</span>
            </button>
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="py-2 px-1 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 text-slate-600 dark:text-slate-400 font-semibold rounded-xl text-[11px] transition disabled:opacity-50"
            >
              Cancel
            </button>
          </div>

          <button
            id="checkout-tender-btn"
            onClick={initiateCheckout}
            disabled={cart.length === 0}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 active:scale-[0.99] text-white font-bold rounded-xl text-sm shadow-md shadow-brand-600/25 flex items-center justify-center space-x-2 transition disabled:opacity-50"
          >
            <span>Tender Payment (F9)</span>
          </button>
        </div>
      </div>

      {/* MODAL 1: Prescription Verification Gating */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2 text-violet-700 dark:text-violet-400">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="font-bold text-sm">Prescription Sign-Off Required (POM)</h3>
              </div>
              <button onClick={() => setShowPrescriptionModal(false)}><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Patient Name *</label>
                <input
                  type="text"
                  value={prescriptionData.patientName}
                  onChange={e => setPrescriptionData({ ...prescriptionData, patientName: e.target.value })}
                  placeholder="Full patient name"
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Prescribing Doctor *</label>
                <input
                  type="text"
                  value={prescriptionData.prescriberName}
                  onChange={e => setPrescriptionData({ ...prescriptionData, prescriberName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Medical License Number *</label>
                <input
                  type="text"
                  value={prescriptionData.prescriberLicense}
                  onChange={e => setPrescriptionData({ ...prescriptionData, prescriberLicense: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                <p className="font-bold">Supervising Pharmacist Sign-Off</p>
                <p className="text-[11px]">{currentUser.name} ({currentUser.licenseNumber || 'Registered Pharmacist'})</p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button onClick={() => setShowPrescriptionModal(false)} className="px-4 py-2 border rounded-lg text-xs font-semibold">
                Cancel
              </button>
              <button onClick={confirmPrescription} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold shadow">
                Authorize & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Multi-Tender Split Payment Modal */}
      {showTenderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Multi-Tender Payment</h3>
                <p className="text-xs text-slate-500">Split payment across tender methods in {currentCurrency.name}</p>
              </div>
              <button onClick={() => setShowTenderModal(false)}><X className="w-4 h-4" /></button>
            </div>

            <div className="bg-brand-50 dark:bg-brand-950/60 p-3.5 rounded-xl border border-brand-200 dark:border-brand-800 flex justify-between items-center">
              <span className="text-xs font-bold text-brand-900 dark:text-brand-300">Total Payable:</span>
              <span className="text-xl font-extrabold text-brand-700 dark:text-brand-400">
                {formatCurrency(grandTotal)}
              </span>
            </div>

            {/* Split Tender Inputs */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-28 flex items-center space-x-1.5 font-bold text-slate-700 dark:text-slate-300">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>Cash ({currentCurrency.symbol})</span>
                </div>
                <input
                  type="number"
                  value={cashTendered}
                  onChange={e => setCashTendered(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-sm font-bold text-right"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="w-28 flex items-center space-x-1.5 font-bold text-slate-700 dark:text-slate-300">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>Card POS ({currentCurrency.symbol})</span>
                </div>
                <input
                  type="number"
                  value={cardAmount}
                  onChange={e => setCardAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-sm font-bold text-right"
                />
                <input
                  type="text"
                  value={cardRef}
                  onChange={e => setCardRef(e.target.value)}
                  placeholder="Terminal Ref #"
                  className="w-28 px-2 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-[11px]"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="w-28 flex items-center space-x-1.5 font-bold text-slate-700 dark:text-slate-300">
                  <ArrowRightLeft className="w-4 h-4 text-purple-600" />
                  <span>Transfer ({currentCurrency.symbol})</span>
                </div>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-sm font-bold text-right"
                />
              </div>

              {/* Mobile Money Row */}
              <div className="flex items-center gap-2">
                <div className="w-28 flex items-center space-x-1 font-bold text-amber-700 dark:text-amber-400 flex-shrink-0">
                  <Smartphone className="w-4 h-4 text-amber-600" />
                  <span>MoMo ({currentCurrency.symbol})</span>
                </div>
                <select
                  value={momoNetwork}
                  onChange={e => setMomoNetwork(e.target.value as any)}
                  className="w-28 px-2 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-[11px] font-bold text-amber-800 dark:text-amber-300 border-amber-300"
                >
                  <option value="MTN MoMo">MTN MoMo</option>
                  <option value="Telecel Cash">Telecel Cash</option>
                  <option value="AT Money">AT Money</option>
                  <option value="GhanaPay">GhanaPay</option>
                </select>
                <input
                  type="number"
                  value={momoAmount}
                  onChange={e => setMomoAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-sm font-bold text-right"
                />
                <input
                  type="text"
                  value={momoRef}
                  onChange={e => setMomoRef(e.target.value)}
                  placeholder="Txn ID / Ref"
                  className="w-28 px-2 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-[11px]"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="w-28 flex items-center space-x-1.5 font-bold text-slate-700 dark:text-slate-300">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span>Store Credit</span>
                </div>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={e => setCreditAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-sm font-bold text-right"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setCashTendered(grandTotal.toFixed(2));
                    setCardAmount('');
                    setTransferAmount('');
                    setMomoAmount('');
                    setCreditAmount('');
                  }}
                  className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 rounded-lg text-[10px] font-bold"
                >
                  Full Cash
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMomoAmount(grandTotal.toFixed(2));
                    setCashTendered('');
                    setCardAmount('');
                    setTransferAmount('');
                    setCreditAmount('');
                  }}
                  className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 rounded-lg text-[10px] font-bold"
                >
                  Full MoMo ({momoNetwork})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCardAmount(grandTotal.toFixed(2));
                    setCashTendered('');
                    setTransferAmount('');
                    setMomoAmount('');
                    setCreditAmount('');
                  }}
                  className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 rounded-lg text-[10px] font-bold"
                >
                  Full Card
                </button>
              </div>
            </div>

            {/* Change Due calculation */}
            {parseFloat(cashTendered) > 0 && (
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl flex justify-between items-center text-xs font-bold">
                <span>Change Due to Customer:</span>
                <span className="text-base text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(Math.max(0, (parseFloat(cashTendered) || 0) + (parseFloat(cardAmount) || 0) + (parseFloat(transferAmount) || 0) + (parseFloat(momoAmount) || 0) + (parseFloat(creditAmount) || 0) - grandTotal))}
                </span>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button onClick={() => setShowTenderModal(false)} className="px-4 py-2 border rounded-lg text-xs font-semibold">
                Back
              </button>
              <button
                id="confirm-checkout-btn"
                onClick={completeTransaction}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-md flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Sale & Print</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: 80mm Thermal Receipt Preview & Printing */}
      {showReceiptModal && completedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`bg-white rounded-2xl w-full p-4 shadow-2xl border space-y-3 max-h-[90vh] overflow-y-auto ${
            printerConfig.paperSize === '58mm' ? 'max-w-xs' : printerConfig.paperSize === 'A4' ? 'max-w-xl' : 'max-w-sm'
          }`}>
            <div className="flex items-center justify-between no-print border-b pb-2">
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-xs text-slate-800">
                  {printerConfig.paperSize} Thermal Receipt {operatingMode === 'DEMO' && '(Demo Sandbox)'}
                </h3>
                {isReprintMode && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-extrabold tracking-wider uppercase">
                    Reprint
                  </span>
                )}
              </div>
              <button onClick={() => setShowReceiptModal(false)}><X className="w-4 h-4" /></button>
            </div>

            {/* Printable Receipt Paper Simulation */}
            <div 
              id="printable-receipt" 
              className={`bg-white text-black p-3 font-mono text-[11px] leading-tight space-y-2 border border-dashed border-slate-300 ${
                printerConfig.paperSize === '58mm' ? 'print-58mm' : printerConfig.paperSize === 'A4' ? 'print-a4' : 'print-80mm'
              }`}
            >
              {/* Training Demo Watermark */}
              {operatingMode === 'DEMO' && (
                <div className="border border-dashed border-amber-600 text-amber-700 bg-amber-50 p-1 text-center font-bold text-[9px] mb-1 tracking-widest uppercase">
                  *** TRAINING & DEMO RECEIPT - NOT FOR SALE ***
                </div>
              )}

              {/* Duplicate / Reprint Banner */}
              {isReprintMode && (
                <div className="border border-dashed border-purple-600 text-purple-800 bg-purple-50 p-1 text-center font-bold text-[9px] mb-1 tracking-widest uppercase">
                  *** DUPLICATE / REPRINT RECEIPT COPY ***
                </div>
              )}

              <div className="text-center space-y-0.5">
                {printerConfig.showLogo && (
                  systemProfile.logoUrl ? (
                    <img
                      src={systemProfile.logoUrl}
                      alt="Dispensary Logo"
                      className="max-h-12 max-w-[140px] mx-auto object-contain mb-1"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-black text-white mx-auto flex items-center justify-center font-bold text-xs mb-1">
                      G+
                    </div>
                  )
                )}
                <p className="font-extrabold text-sm uppercase tracking-tight">
                  {systemProfile.branchName || systemProfile.tradeName}
                </p>
                <p className="text-[10px]">{systemProfile.address}</p>
                <p className="text-[10px]">Tel: {systemProfile.phone}</p>
                {printerConfig.showPremisesLicense !== false && systemProfile.premisesLicense && (
                  <p className="text-[9px] font-bold">Premises Lic: {systemProfile.premisesLicense}</p>
                )}
                {printerConfig.showHeaderNote !== false && printerConfig.headerNote && (
                  <p className="text-[8px] text-slate-500 italic">{printerConfig.headerNote}</p>
                )}
              </div>

              <div className="border-t border-b border-dashed border-black py-1 text-[10px] space-y-0.5">
                <div className="flex justify-between">
                  <span>Receipt: {completedSale.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date: {completedSale.createdAt}</span>
                </div>
                {printerConfig.showCashierName !== false && (
                  <div className="flex justify-between">
                    <span>Cashier: {completedSale.cashierName}</span>
                  </div>
                )}
                {printerConfig.showCustomerName !== false && (
                  <div className="flex justify-between">
                    <span>Customer: {completedSale.customerName}</span>
                  </div>
                )}
                {printerConfig.showSuperintendentName !== false && systemProfile.superintendentName && (
                  <div className="flex justify-between">
                    <span>Superintendent: {systemProfile.superintendentName}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="space-y-1 pt-1">
                {completedSale.items.map((item, i) => (
                  <div key={i} className="text-[10px]">
                    <div className="flex justify-between font-bold">
                      <span>{item.productName} ({item.quantity} {item.selectedUnitName})</span>
                      <span>{formatCurrency(item.subtotal)}</span>
                    </div>
                    {printerConfig.showBatchDetails && (
                      <div className="text-[9px] text-slate-600">
                        Batch: {item.batchNumber} | Exp: {item.expiryDate}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Breakdown */}
              <div className="border-t border-dashed border-black pt-1 text-[10px] space-y-0.5">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(completedSale.subtotal)}</span>
                </div>
                {completedSale.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>-{formatCurrency(completedSale.discountTotal)}</span>
                  </div>
                )}
                {printerConfig.showTaxBreakdown !== false && (
                  <div className="flex justify-between">
                    <span>VAT ({systemProfile.defaultVatPercent}%):</span>
                    <span>{formatCurrency(completedSale.taxTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-black">
                  <span>TOTAL PAID:</span>
                  <span>{formatCurrency(completedSale.total)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Change:</span>
                  <span>{formatCurrency(completedSale.changeDue)}</span>
                </div>
              </div>

              {/* Barcode & Safety footer */}
              <div className="text-center pt-2 space-y-1">
                {printerConfig.showFooterPolicy !== false && printerConfig.footerPolicy && (
                  <p className="text-[9px] leading-tight">{printerConfig.footerPolicy}</p>
                )}
                {printerConfig.showBarcode && (
                  <div className="h-6 bg-slate-100 flex items-center justify-center font-mono text-[9px] tracking-widest border border-slate-300 mt-1">
                    *{completedSale.receiptNumber}*
                  </div>
                )}
                {printerConfig.showPoweredBy !== false && (
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest pt-1">
                    {printerConfig.poweredByText || 'Powered by GreenlifeAI Dispensary Engine'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex space-x-2 no-print pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 3: Save as Draft */}
      {showSaveDraftModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveDraft} className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Save as Draft Quotation</h3>
                  <p className="text-xs text-slate-500">Hold order indefinitely without affecting inventory</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowSaveDraftModal(false)}><X className="w-4 h-4" /></button>
            </div>

            {/* Zero stock deduction alert notice */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs space-y-1">
              <p className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero Stock Deduction Guarantee</span>
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Drafts do not deduct any units from warehouse or retail batches. Stock is only deducted when payment is finalized.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Draft / Quotation Title *</label>
                <input
                  type="text"
                  required
                  value={draftTitle}
                  onChange={e => setDraftTitle(e.target.value)}
                  placeholder="e.g. Dr. Nnamdi Ward Dispensation, Mrs. Adeleke Quote"
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Customer / Clinical Notes</label>
                <textarea
                  value={draftNotes}
                  onChange={e => setDraftNotes(e.target.value)}
                  placeholder="e.g. Awaiting HMO approval or customer returning with POS debit card."
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs h-20"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500">Items: </span>
                  <span className="font-bold text-slate-800 dark:text-white">{cart.length} medications</span>
                </div>
                <div>
                  <span className="text-slate-500">Est. Total: </span>
                  <span className="font-bold text-brand-600 dark:text-brand-400">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowSaveDraftModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow flex items-center space-x-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save Draft (Keep Stock Intact)</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: Drafts & Quotations Drawer */}
      {showDraftsDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active Draft Sales & Quotations</h3>
                  <p className="text-xs text-slate-500">Uncommitted orders saved without stock deduction</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowDraftsDrawer(false)}><X className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {draftSales.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <FileSpreadsheet className="w-10 h-10 mx-auto opacity-30" />
                  <p className="text-xs">No active draft sales in register. Click "Draft" in POS cart to save one.</p>
                </div>
              ) : (
                draftSales.map(d => (
                  <div 
                    key={d.id} 
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-brand-600 text-xs">{d.draftNumber}</span>
                          <span className="font-bold text-slate-900 dark:text-white text-xs">{d.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {d.createdAt} • Customer: <strong className="text-slate-700 dark:text-slate-300">{d.customerName || 'Walk-in'}</strong> • Cashier: {d.cashierName}
                        </p>
                        {d.notes && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 italic mt-1 bg-white dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                            "{d.notes}"
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-white block">
                          {formatCurrency(d.total ?? d.subtotal ?? 0)}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold">Stock Untouched</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Line items: {d.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
                    </div>

                    <div className="flex justify-end items-center space-x-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <button
                        type="button"
                        onClick={() => deleteDraftSale(d.id)}
                        className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-semibold transition"
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        onClick={() => loadDraftIntoCart(d)}
                        className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow transition flex items-center space-x-1"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Load into POS Cart</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowDraftsDrawer(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4B: Completed Sales Receipts History & Reprint Drawer */}
      {showReceiptHistoryDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[88vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                    <span>Receipt History & Reprint Archive</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {sales.length} Receipts
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">View previous sales, customer tenders, item breakdowns, and reprint thermal receipts</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowReceiptHistoryDrawer(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={receiptSearchTerm}
                  onChange={e => setReceiptSearchTerm(e.target.value)}
                  placeholder="Search receipt # (e.g. REC-2026), customer, cashier..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Tender Type Filter */}
              <div className="flex items-center space-x-1 overflow-x-auto pb-0.5 text-xs">
                {['ALL', 'CASH', 'CARD', 'MOMO', 'TRANSFER', 'CREDIT'].map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setReceiptFilterTender(method)}
                    className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] whitespace-nowrap transition ${
                      receiptFilterTender === method
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Receipts List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {(() => {
                const filteredSales = sales.filter(s => {
                  const matchSearch = 
                    (s.receiptNumber || '').toLowerCase().includes(receiptSearchTerm.toLowerCase()) ||
                    (s.customerName || '').toLowerCase().includes(receiptSearchTerm.toLowerCase()) ||
                    (s.cashierName || '').toLowerCase().includes(receiptSearchTerm.toLowerCase()) ||
                    (s.createdAt || '').toLowerCase().includes(receiptSearchTerm.toLowerCase()) ||
                    (s.items || []).some(i => (i.productName || '').toLowerCase().includes(receiptSearchTerm.toLowerCase()));
                  
                  const matchTender = receiptFilterTender === 'ALL' || 
                    (s.payments || []).some(p => p.method === receiptFilterTender);

                  return matchSearch && matchTender;
                });

                if (filteredSales.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <Receipt className="w-10 h-10 mx-auto opacity-30" />
                      <p className="text-xs font-medium">No receipts found matching the filter criteria.</p>
                    </div>
                  );
                }

                return filteredSales.map(sale => (
                  <div
                    key={sale.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5 transition"
                  >
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-extrabold text-emerald-600 text-xs">
                            {sale.receiptNumber}
                          </span>
                          <button
                            type="button"
                            onClick={e => handleCopyReceiptNumber(sale.receiptNumber, e)}
                            className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                            title="Copy Receipt Number"
                          >
                            {copiedReceiptId === sale.receiptNumber ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            COMPLETED
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{sale.createdAt}</span>
                          <span>•</span>
                          <span>Customer: <strong className="text-slate-700 dark:text-slate-200">{sale.customerName || 'Walk-in'}</strong></span>
                          <span>•</span>
                          <span>Cashier: {sale.cashierName}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-extrabold text-sm sm:text-base text-slate-900 dark:text-white block">
                          {formatCurrency(sale.total)}
                        </span>
                        <div className="flex items-center justify-end space-x-1 text-[10px] text-slate-500">
                          <span>{(sale.items || []).length} item{(sale.items || []).length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>

                    {/* Line Items Summary */}
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800 space-y-1">
                      <div className="font-semibold text-slate-700 dark:text-slate-300 text-[10px] uppercase tracking-wider">
                        Dispensed Items:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5">
                        {(sale.items || []).map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px]">
                            <span className="truncate">• {it.productName} ({it.quantity} {it.selectedUnitName || 'Unit'})</span>
                            <span className="font-mono text-slate-500 dark:text-slate-400 ml-1">{formatCurrency(it.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tenders and Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex-wrap gap-2">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                        {(sale.payments || []).map((p, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.method === 'CASH' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                              p.method === 'CARD' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                              p.method === 'MOMO' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                              p.method === 'CREDIT' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                              'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            }`}
                          >
                            {p.method}: {formatCurrency(p.amount)}
                          </span>
                        ))}
                        {sale.changeDue > 0 && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            (Change: {formatCurrency(sale.changeDue)})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleReprintReceipt(sale)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center space-x-1.5"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Reprint Receipt</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-500 text-[11px]">
                Authorized cashiers can reprint historical thermal receipts at any time.
              </span>
              <button
                type="button"
                onClick={() => setShowReceiptHistoryDrawer(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Credit Sale Dispensing Modal */}
      {showCreditSaleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Dispense on Patient Credit Account</h3>
                  <p className="text-xs text-slate-500">Debits Accounts Receivable (AR) & deducts stock immediately</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowCreditSaleModal(false)}><X className="w-4 h-4" /></button>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-start space-x-2.5">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-semibold">Clinical & Financial Audit Trail</p>
                <p className="text-[11px] mt-0.5 opacity-90">
                  Medications will be physically deducted from FEFO batches. A credit sales ledger invoice tagged with cashier <strong>{currentUser.name}</strong> will be generated.
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmCreditSale} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Registered Patient / Customer Account *
                </label>
                <select
                  id="credit-patient-select"
                  value={creditCustomerId}
                  onChange={e => setCreditCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500"
                  required
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id}) — Credit Limit: {formatCurrency(c.creditLimit)} | Debt: {formatCurrency(c.currentBalance)}
                    </option>
                  ))}
                </select>
                {(() => {
                  const sel = customers.find(c => c.id === creditCustomerId);
                  if (!sel) return null;
                  const headroom = Math.max(0, sel.creditLimit - sel.currentBalance);
                  const isBreached = grandTotal > headroom;
                  return (
                    <div className="mt-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Authorized Limit:</span>
                        <span className="font-semibold">{formatCurrency(sel.creditLimit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Outstanding Debt:</span>
                        <span className="font-semibold text-rose-600">{formatCurrency(sel.currentBalance)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-bold">
                        <span>Available Headroom:</span>
                        <span className={headroom >= grandTotal ? 'text-emerald-600' : 'text-rose-600'}>
                          {formatCurrency(headroom)}
                        </span>
                      </div>
                      {isBreached && (
                        <p className="text-[11px] text-rose-600 font-semibold pt-1">
                          ⚠️ This order exceeds available limit by {formatCurrency(grandTotal - headroom)}.
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Repayment Due Date *
                  </label>
                  <input
                    type="date"
                    id="credit-due-date"
                    value={creditDueDate}
                    onChange={e => setCreditDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Initiating Dispenser
                  </label>
                  <input
                    type="text"
                    value={`${currentUser.name} (${currentUser.role})`}
                    disabled
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/50 border rounded-xl text-xs font-medium text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Credit Terms & Purpose Notes
                </label>
                <textarea
                  rows={2}
                  value={creditNotes}
                  onChange={e => setCreditNotes(e.target.value)}
                  placeholder="e.g. Monthly maintenance therapy prescription, billed to corporate employer account..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium"
                />
              </div>

              {(() => {
                const sel = customers.find(c => c.id === creditCustomerId);
                const headroom = sel ? Math.max(0, sel.creditLimit - sel.currentBalance) : 0;
                if (grandTotal > headroom) {
                  return (
                    <div className="flex items-center space-x-2 p-2 bg-rose-50 dark:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-900 text-xs">
                      <input
                        type="checkbox"
                        id="override-credit-limit-checkbox"
                        checked={overrideCreditLimit}
                        onChange={e => setOverrideCreditLimit(e.target.checked)}
                        className="rounded border-rose-400 text-rose-600 focus:ring-rose-500 h-4 w-4"
                      />
                      <label htmlFor="override-credit-limit-checkbox" className="text-[11px] text-rose-800 dark:text-rose-300 font-semibold cursor-pointer">
                        Supervisory Pharmacist Override (Approve above-limit credit dispensation)
                      </label>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500">Medications: </span>
                  <span className="font-bold text-slate-800 dark:text-white">{cart.length} line items</span>
                </div>
                <div>
                  <span className="text-slate-500">Credit Total: </span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreditSaleModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="confirm-credit-dispense-btn"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Credit Dispensation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
