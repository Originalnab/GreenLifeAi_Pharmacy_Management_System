import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Barcode, ShoppingCart, Trash2, Plus, Minus, 
  CreditCard, Banknote, ArrowRightLeft, UserCheck, 
  FileText, CheckCircle2, Printer, X, ShieldAlert,
  Save, RotateCcw, ChevronDown
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { CartItem, Product, PaymentTender, Sale, Customer } from '../../types';

export const PointOfSalePage: React.FC = () => {
  const { 
    products, batches, customers, currentUser, 
    processSale, formatCurrency, currentCurrency,
    systemProfile, printerConfig, operatingMode 
  } = usePharmacy();

  // Search & Scanner
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(customers[2]); // Walk-in by default
  const [discountPercent, setDiscountPercent] = useState<number>(0);

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
  const [creditAmount, setCreditAmount] = useState<string>('');
  const [cardRef, setCardRef] = useState<string>('');

  // Receipt Modal
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Held Carts
  const [heldCart, setHeldCart] = useState<CartItem[] | null>(null);

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
      alert(`No active non-quarantined batches available for ${product.brandName}.`);
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
        alert(`Cannot add more: only ${fefoBatch.availableQuantity} base units available in batch ${fefoBatch.batchNumber}.`);
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
      alert(`Max available stock in this batch is ${item.availableStock} base units (${Math.floor(item.availableStock / item.unitMultiplier)} ${item.selectedUnitName}s)`);
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
    alert('Cart held in memory. Press "Resume Held Cart" to restore.');
  };

  const resumeCart = () => {
    if (heldCart) {
      setCart(heldCart);
      setHeldCart(null);
    }
  };

  const initiateCheckout = () => {
    if (cart.length === 0) return;

    if (hasPrescriptionDrugs && !isPrescriptionVerified) {
      setPrescriptionData(prev => ({
        ...prev,
        patientName: selectedCustomer.name !== 'Walk-in Retail Customer' ? selectedCustomer.name : ''
      }));
      setShowPrescriptionModal(true);
      return;
    }

    setCashTendered(grandTotal.toFixed(2));
    setCardAmount('');
    setTransferAmount('');
    setCreditAmount('');
    setShowTenderModal(true);
  };

  const confirmPrescription = () => {
    if (!prescriptionData.prescriberName || !prescriptionData.prescriberLicense || !prescriptionData.patientName) {
      alert('Please fill out all required prescriber and patient credentials.');
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
    const credit = parseFloat(creditAmount) || 0;

    const totalTendered = cash + card + transfer + credit;

    if (totalTendered < grandTotal) {
      alert(`Insufficient tender amount. Required: ${formatCurrency(grandTotal)}, Tendered: ${formatCurrency(totalTendered)}`);
      return;
    }

    if (credit > 0) {
      const customerLimit = selectedCustomer.creditLimit;
      const newBalance = selectedCustomer.currentBalance + credit;
      if (newBalance > customerLimit && customerLimit > 0) {
        alert(`Credit limit exceeded! Customer credit limit is ${formatCurrency(customerLimit)}, current balance ${formatCurrency(selectedCustomer.currentBalance)}.`);
        return;
      }
    }

    const changeDue = cash > 0 ? Math.max(0, totalTendered - grandTotal) : 0;

    const tenders: PaymentTender[] = [];
    if (cash > 0) tenders.push({ method: 'CASH', amount: cash });
    if (card > 0) tenders.push({ method: 'CARD', amount: card, reference: cardRef || 'POS-CARD' });
    if (transfer > 0) tenders.push({ method: 'TRANSFER', amount: transfer, reference: 'BANK-TRANSFER' });
    if (credit > 0) tenders.push({ method: 'CREDIT', amount: credit, reference: `CREDIT-${selectedCustomer.id}` });

    const newSale = processSale({
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      items: cart,
      subtotal,
      discountTotal: discountAmount,
      taxTotal: vatAmount,
      total: grandTotal,
      payments: tenders,
      changeDue,
      hasPrescriptionDrugs,
      prescription: hasPrescriptionDrugs ? prescriptionData : undefined,
      status: 'COMPLETED'
    });

    setCompletedSale(newSale);
    setShowTenderModal(false);
    setShowReceiptModal(true);
    setCart([]);
    setIsPrescriptionVerified(false);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-4">
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
              value={selectedCustomer.id}
              onChange={e => {
                const found = customers.find(c => c.id === e.target.value);
                if (found) setSelectedCustomer(found);
              }}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none w-full"
            >
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

        {/* Prescription Verification Banner */}
        {hasPrescriptionDrugs && (
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
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={holdCart}
              disabled={cart.length === 0}
              className="py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center space-x-1 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Hold (F8)</span>
            </button>
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="py-2 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 text-slate-600 dark:text-slate-400 font-semibold rounded-xl text-xs transition disabled:opacity-50"
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
            </div>

            {/* Change Due calculation */}
            {parseFloat(cashTendered) > 0 && (
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl flex justify-between items-center text-xs font-bold">
                <span>Change Due to Customer:</span>
                <span className="text-base text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(Math.max(0, (parseFloat(cashTendered) || 0) + (parseFloat(cardAmount) || 0) + (parseFloat(transferAmount) || 0) + (parseFloat(creditAmount) || 0) - grandTotal))}
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
              <h3 className="font-bold text-xs text-slate-800">
                {printerConfig.paperSize} Thermal Receipt {operatingMode === 'DEMO' && '(Demo Sandbox)'}
              </h3>
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

              <div className="text-center space-y-0.5">
                <p className="font-bold text-sm uppercase">{systemProfile.tradeName}</p>
                <p className="text-[10px]">{systemProfile.address}</p>
                <p className="text-[10px]">Tel: {systemProfile.phone}</p>
                <p className="text-[9px] font-bold">Premises Lic: {systemProfile.premisesLicense}</p>
                <p className="text-[8px] text-slate-500 italic">{printerConfig.headerNote}</p>
              </div>

              <div className="border-t border-b border-dashed border-black py-1 text-[10px] space-y-0.5">
                <div className="flex justify-between">
                  <span>Receipt: {completedSale.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date: {completedSale.createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier: {completedSale.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer: {completedSale.customerName}</span>
                </div>
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
                <div className="flex justify-between">
                  <span>VAT ({systemProfile.defaultVatPercent}%):</span>
                  <span>{formatCurrency(completedSale.taxTotal)}</span>
                </div>
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
                <p className="text-[9px] leading-tight">{printerConfig.footerPolicy}</p>
                <div className="h-6 bg-slate-100 flex items-center justify-center font-mono text-[9px] tracking-widest border border-slate-300 mt-1">
                  *{completedSale.receiptNumber}*
                </div>
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
    </div>
  );
};
