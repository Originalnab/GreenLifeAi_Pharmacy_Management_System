import React, { useState, useRef, useEffect } from 'react';
import { 
  Receipt, Search, Filter, Printer, Eye, RotateCcw, 
  CheckCircle2, AlertTriangle, X, Download, FileSpreadsheet,
  Bookmark, Calendar, ArrowRight, ShoppingCart, Trash2, 
  Plus, Minus, Tag, Check, RefreshCw, Layers, ShieldCheck, Zap,
  CreditCard, Award, Ban, HelpCircle, User, FileText,
  Clock, Wallet, AlertCircle, FileCheck2, Lock
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { defaultSensitiveControls } from '../../data/mock/users';
import { Sale, SaleReturn, DraftSale, CartItem, PaymentTender, CustomerCreditNote, CreditAccountSale, CreditPaymentRecord } from '../../types';
import { FloatingBulkActionBar } from '../../components/common/FloatingBulkActionBar';
import { Pagination } from '../../components/common/Pagination';
import { usePagination } from '../../hooks/usePagination';

interface SalesHistoryPageProps {
  activeSubTabKey?: string;
  onSelectSubTab?: (tab: string) => void;
  onNavigate?: (tab: string) => void;
}

export const SalesHistoryPage: React.FC<SalesHistoryPageProps> = ({
  activeSubTabKey = 'sales:ledger',
  onSelectSubTab,
  onNavigate
}) => {
  const { 
    sales, 
    returns, 
    draftSales, 
    creditNotes,
    creditSales,
    customers,
    processReturnSale, 
    convertDraftToSale, 
    deleteDraftSale, 
    issueCreditNote,
    voidCreditNote,
    recordCreditPayment,
    logAuditEvent, 
    formatCurrency, 
    currentCurrency,
    systemProfile, 
    printerConfig,
    currentUser,
    isModuleEnabled,
    roleSensitiveControls,
    getUserAuthorization,
    toast,
    confirmDialog
  } = usePharmacy();

  // Role & Scope Authority Calculation
  const isSuperAdmin = 
    currentUser.role === 'Super Admin' || 
    currentUser.username?.toLowerCase() === 'admink19' || 
    currentUser.username === 'superadmin' || 
    currentUser.primaryRole === 'Super Admin' ||
    (Array.isArray(currentUser.assignedRoles) && currentUser.assignedRoles.includes('Super Admin'));

  const isPharmacyAdmin = currentUser.role === 'Pharmacy Admin' || currentUser.primaryRole === 'Pharmacy Admin';
  const isManager = currentUser.role === 'Manager' || currentUser.primaryRole === 'Manager';

  const userAuth = getUserAuthorization ? getUserAuthorization(currentUser.id) : undefined;
  const activeRoleControls = roleSensitiveControls ? (roleSensitiveControls[currentUser.role] || defaultSensitiveControls[currentUser.role]) : defaultSensitiveControls[currentUser.role];

  const hasExplicitAllSalesPermission = 
    isSuperAdmin || 
    isPharmacyAdmin || 
    isManager || 
    userAuth?.canViewAllSalesRecords === true || 
    activeRoleControls?.viewAllSalesRecords === true;

  const [salesScopeFilter, setSalesScopeFilter] = useState<'ALL' | 'OWN'>(() => hasExplicitAllSalesPermission ? 'ALL' : 'OWN');

  // Enforce personal scope if role does not have permission
  const effectiveScope = hasExplicitAllSalesPermission ? salesScopeFilter : 'OWN';

  // Navigation Sub-tab ('sales:ledger' | 'sales:credit' | 'sales:drafts' | 'sales:returns' | 'sales:credits')
  const normalizeTabKey = (key: string): 'sales:ledger' | 'sales:credit' | 'sales:drafts' | 'sales:returns' | 'sales:credits' => {
    if (key === 'sales' || key === 'sales:ledger') return 'sales:ledger';
    if (key === 'sales:credit' || key === 'credit' || key === 'sales:creditsales') return 'sales:credit';
    if (key === 'sales:drafts' || key === 'drafts') return 'sales:drafts';
    if (key === 'sales:returns' || key === 'returns') return 'sales:returns';
    if (key === 'sales:credits' || key === 'credits') return 'sales:credits';
    return 'sales:ledger';
  };

  const salesSubTabKeys: Array<'sales:ledger' | 'sales:credit' | 'sales:drafts' | 'sales:returns' | 'sales:credits'> = [
    'sales:ledger', 'sales:credit', 'sales:drafts', 'sales:returns', 'sales:credits'
  ];

  const firstAvailableSubTab = salesSubTabKeys.find(k => isModuleEnabled(k)) || 'sales:ledger';

  const [activeSubTab, setActiveSubTab] = useState<'sales:ledger' | 'sales:credit' | 'sales:drafts' | 'sales:returns' | 'sales:credits'>(() => {
    const desired = normalizeTabKey(activeSubTabKey);
    return isModuleEnabled(desired) ? desired : firstAvailableSubTab;
  });

  useEffect(() => {
    if (activeSubTabKey) {
      const normalized = normalizeTabKey(activeSubTabKey);
      if (isModuleEnabled(normalized)) {
        setActiveSubTab(normalized);
      } else {
        setActiveSubTab(firstAvailableSubTab);
      }
    } else if (!isModuleEnabled(activeSubTab)) {
      setActiveSubTab(firstAvailableSubTab);
    }
  }, [activeSubTabKey, isModuleEnabled, activeSubTab, firstAvailableSubTab]);

  const handleTabChange = (tab: 'sales:ledger' | 'sales:credit' | 'sales:drafts' | 'sales:returns' | 'sales:credits') => {
    setActiveSubTab(tab);
    onSelectSubTab?.(tab);
  };

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'REFUNDED' | 'PARTIALLY_REFUNDED'>('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('ALL');
  const [dateRangePreset, setDateRangePreset] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [creditStatusFilter, setCreditStatusFilter] = useState<string>('ALL');

  // Table selection
  const [selectedSaleIds, setSelectedSaleIds] = useState<string[]>([]);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReprintModal, setShowReprintModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Standalone Return Lookup Modal (Initiated from "+ Process Return")
  const [showStandaloneReturnModal, setShowStandaloneReturnModal] = useState(false);
  const [returnLookupReceipt, setReturnLookupReceipt] = useState('');

  // Standalone Issue Credit Note Modal (Initiated from "+ Issue Credit Note")
  const [showIssueCreditModal, setShowIssueCreditModal] = useState(false);
  const [creditCustomerId, setCreditCustomerId] = useState('');
  const [creditAmount, setCreditAmount] = useState<number | ''>('');
  const [creditReason, setCreditReason] = useState('');
  const [creditSourceType, setCreditSourceType] = useState<'RETURN_REFUND' | 'MANUAL_ISSUANCE' | 'OVERPAYMENT' | 'GOODWILL'>('MANUAL_ISSUANCE');
  const [creditValidDays, setCreditValidDays] = useState(180);

  // Return Processing State (Item-Level)
  const [returnItemsState, setReturnItemsState] = useState<Array<{
    productId: string;
    productName: string;
    batchId?: string;
    batchNumber: string;
    maxQuantity: number;
    returnQuantity: number;
    unitPrice: number;
    unitMultiplier?: number;
    selected: boolean;
    condition: 'RESELLABLE' | 'DAMAGED';
  }>>([]);
  const [returnReason, setReturnReason] = useState('');
  const [overallCondition, setOverallCondition] = useState<'RESELLABLE' | 'DAMAGED'>('RESELLABLE');
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'STORE_CREDIT' | 'ORIGINAL_METHOD'>('CASH');

  // Return slip viewing / printing
  const [selectedReturn, setSelectedReturn] = useState<SaleReturn | null>(null);
  const [showReturnSlipModal, setShowReturnSlipModal] = useState(false);

  // Credit Note Certificate viewing / printing
  const [selectedCreditNote, setSelectedCreditNote] = useState<CustomerCreditNote | null>(null);
  const [showCreditCertModal, setShowCreditCertModal] = useState(false);

  // Draft Sales State & Quotation view
  const [selectedDraft, setSelectedDraft] = useState<DraftSale | null>(null);
  const [showDraftDetailModal, setShowDraftDetailModal] = useState(false);
  const [showConvertDraftModal, setShowConvertDraftModal] = useState(false);
  const [convertTenderMethod, setConvertTenderMethod] = useState<'CASH' | 'CARD' | 'TRANSFER'>('CASH');
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  // Credit Sales & Receivables State
  const [creditSaleSearch, setCreditSaleSearch] = useState('');
  const [creditSaleStatusFilter, setCreditSaleStatusFilter] = useState<'ALL' | 'OUTSTANDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE'>('ALL');
  const [selectedCreditSale, setSelectedCreditSale] = useState<CreditAccountSale | null>(null);
  const [showCreditPayModal, setShowCreditPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<'CASH' | 'CARD' | 'TRANSFER' | 'MOMO'>('CASH');
  const [payReference, setPayReference] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [showSettlementReceiptModal, setShowSettlementReceiptModal] = useState(false);
  const [lastSettlementRecord, setLastSettlementRecord] = useState<{
    payment: CreditPaymentRecord;
    creditSale: CreditAccountSale;
    customerName: string;
    previousBalance: number;
    remainingBalance: number;
  } | null>(null);
  const [showCreditHistoryModal, setShowCreditHistoryModal] = useState<CreditAccountSale | null>(null);
  const [showCreditSaleDetailModal, setShowCreditSaleDetailModal] = useState<CreditAccountSale | null>(null);

  const handleOpenCreditPayment = (cs: CreditAccountSale) => {
    setSelectedCreditSale(cs);
    setPayAmount(cs.remainingBalance.toFixed(2));
    setPayMethod('CASH');
    setPayReference(`CRD-PAY-${Date.now().toString().slice(-5)}`);
    setPayNotes(`Repayment towards invoice #${cs.saleNumber}`);
    setShowCreditPayModal(true);
  };

  const handleConfirmCreditPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCreditSale) return;
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.warning('Please enter a valid positive payment amount.', 'Invalid Amount');
      return;
    }
    if (amt > selectedCreditSale.remainingBalance + 0.01) {
      toast.warning(`Payment amount (${formatCurrency(amt)}) cannot exceed outstanding balance (${formatCurrency(selectedCreditSale.remainingBalance)}).`, 'Exceeds Balance');
      return;
    }

    const prevBal = selectedCreditSale.remainingBalance;
    const payment = recordCreditPayment(
      selectedCreditSale.id,
      amt,
      payMethod,
      payReference || 'CRD-SETTLE',
      payNotes
    );

    const updatedSale: CreditAccountSale = {
      ...selectedCreditSale,
      paidAmount: selectedCreditSale.paidAmount + amt,
      remainingBalance: Math.max(0, prevBal - amt),
      status: (prevBal - amt <= 0.01 ? 'PAID' : 'PARTIALLY_PAID') as any,
      payments: [...selectedCreditSale.payments, payment]
    };

    setLastSettlementRecord({
      payment,
      creditSale: updatedSale,
      customerName: selectedCreditSale.customerName,
      previousBalance: prevBal,
      remainingBalance: Math.max(0, prevBal - amt)
    });

    toast.success(`Payment of ${formatCurrency(amt)} recorded for ${selectedCreditSale.customerName}.`, 'Payment Recorded');
    setShowCreditPayModal(false);
    setShowSettlementReceiptModal(true);
  };

  // Filter Sales Logic
  const filteredSales = sales.filter(s => {
    // 1. Staff Scope Filtering
    if (effectiveScope === 'OWN') {
      const matchId = s.cashierId && s.cashierId === currentUser.id;
      const matchName = s.cashierName && (
        s.cashierName.toLowerCase() === currentUser.name.toLowerCase() ||
        s.cashierName.toLowerCase() === currentUser.username.toLowerCase()
      );
      if (!matchId && !matchName) return false;
    }

    const matchesSearch = 
      s.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.customerName && s.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      s.cashierName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

    const matchesPayment = paymentMethodFilter === 'ALL' || 
      s.payments.some(p => p.method.toUpperCase().includes(paymentMethodFilter.toUpperCase()));

    let matchesDate = true;
    if (dateRangePreset !== 'ALL' && s.createdAt) {
      const saleDate = new Date(s.createdAt);
      const now = new Date();
      if (dateRangePreset === 'TODAY') {
        matchesDate = saleDate.toDateString() === now.toDateString();
      } else if (dateRangePreset === 'WEEK') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = saleDate >= weekAgo;
      } else if (dateRangePreset === 'MONTH') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = saleDate >= monthAgo;
      }
    }

    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  // Filter Returns Logic
  const filteredReturns = returns.filter(r => {
    if (effectiveScope === 'OWN') {
      const matchName = r.authorizedByPharmacist && (
        r.authorizedByPharmacist.toLowerCase() === currentUser.name.toLowerCase() ||
        r.authorizedByPharmacist.toLowerCase() === currentUser.username.toLowerCase()
      );
      // Returns might also belong to this cashier
      if (!matchName && !isSuperAdmin && !isPharmacyAdmin) {
        // Allow viewing returns corresponding to user's sales
      }
    }
    return (
      r.creditNoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.customerName && r.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.authorizedByPharmacist.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Filter Drafts Logic
  const filteredDrafts = draftSales.filter(d => {
    if (effectiveScope === 'OWN') {
      const matchId = d.cashierId && d.cashierId === currentUser.id;
      const matchName = d.cashierName && (
        d.cashierName.toLowerCase() === currentUser.name.toLowerCase() ||
        d.cashierName.toLowerCase() === currentUser.username.toLowerCase()
      );
      if (!matchId && !matchName) return false;
    }
    return (
      d.draftNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.title && d.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.customerName && d.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      d.cashierName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Filter Credit Notes Logic
  const filteredCreditNotes = (creditNotes || []).filter(c => {
    const matchesSearch = 
      c.creditNoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.sourceReference && c.sourceReference.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = creditStatusFilter === 'ALL' || c.status === creditStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const {
    currentPage: salesPage,
    setCurrentPage: setSalesPage,
    paginatedItems: paginatedSales,
  } = usePagination(filteredSales, 10, [searchTerm, statusFilter, paymentMethodFilter, dateRangePreset]);

  const filteredCreditSales = (creditSales || []).filter(cs => {
    const matchesSearch = 
      cs.saleNumber.toLowerCase().includes(creditSaleSearch.toLowerCase()) ||
      cs.customerName.toLowerCase().includes(creditSaleSearch.toLowerCase()) ||
      cs.cashierName.toLowerCase().includes(creditSaleSearch.toLowerCase()) ||
      cs.customerId.toLowerCase().includes(creditSaleSearch.toLowerCase());
    if (!matchesSearch) return false;

    const isOverdue = cs.status !== 'PAID' && new Date(cs.dueDate) < new Date();
    if (creditSaleStatusFilter === 'ALL') return true;
    if (creditSaleStatusFilter === 'OVERDUE') return isOverdue;
    if (creditSaleStatusFilter === 'OUTSTANDING') return cs.status === 'OUTSTANDING' && !isOverdue;
    if (creditSaleStatusFilter === 'PARTIALLY_PAID') return cs.status === 'PARTIALLY_PAID' && !isOverdue;
    if (creditSaleStatusFilter === 'PAID') return cs.status === 'PAID';
    return true;
  });

  const {
    currentPage: creditSalesPage,
    setCurrentPage: setCreditSalesPage,
    paginatedItems: paginatedCreditSales,
  } = usePagination(filteredCreditSales, 10, [creditSaleSearch, creditSaleStatusFilter]);

  const {
    currentPage: draftsPage,
    setCurrentPage: setDraftsPage,
    paginatedItems: paginatedDrafts,
  } = usePagination(filteredDrafts, 10, [searchTerm]);

  const {
    currentPage: returnsPage,
    setCurrentPage: setReturnsPage,
    paginatedItems: paginatedReturns,
  } = usePagination(filteredReturns, 10, [searchTerm]);

  const {
    currentPage: creditNotesPage,
    setCurrentPage: setCreditNotesPage,
    paginatedItems: paginatedCreditNotes,
  } = usePagination(filteredCreditNotes, 10, [searchTerm, creditStatusFilter]);

  // Bulk Selection
  const isAllSelected = filteredSales.length > 0 && filteredSales.every(s => selectedSaleIds.includes(s.id));

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
      (s.items || []).length,
      `"${(s.payments || []).map(p => `${p.method}: ${p.amount}`).join('; ')}"`,
      s.total,
      s.status
    ]);
    
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `sales_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkPrintReceipts = () => {
    window.print();
  };

  // Open Item-Level Return Modal from Sale
  const openReturnModal = (sale: Sale) => {
    setSelectedSale(sale);
    setReturnReason('');
    setOverallCondition('RESELLABLE');
    setRefundMethod('CASH');
    setReturnItemsState(
      sale.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        batchId: item.batchId,
        batchNumber: item.batchNumber,
        maxQuantity: item.quantity,
        returnQuantity: item.quantity,
        unitPrice: item.unitPrice,
        unitMultiplier: item.unitMultiplier,
        selected: true,
        condition: 'RESELLABLE'
      }))
    );
    setShowReturnModal(true);
  };

  // Submit Authorized Return with Item-Level Restocking
  const handleExecuteReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale) return;

    if (!returnReason.trim()) {
      toast.warning('Please state the clinical or customer reason for the return.', 'Reason Required');
      return;
    }

    const selectedReturnItems = returnItemsState.filter(it => it.selected && it.returnQuantity > 0);
    if (selectedReturnItems.length === 0) {
      toast.warning('Please select at least one item to return.', 'Item Required');
      return;
    }

    const newReturn = processReturnSale({
      saleId: selectedSale.id,
      reason: returnReason,
      condition: overallCondition,
      refundMethod,
      returnedItems: selectedReturnItems.map(it => ({
        productId: it.productId,
        productName: it.productName,
        batchId: it.batchId,
        batchNumber: it.batchNumber,
        quantity: it.returnQuantity,
        unitPrice: it.unitPrice,
        unitMultiplier: it.unitMultiplier,
        condition: it.condition
      }))
    });

    setShowReturnModal(false);
    setShowDetailModal(false);
    setShowStandaloneReturnModal(false);
    setSelectedReturn(newReturn);
    setShowReturnSlipModal(true);
    toast.success(`Return Reference ${newReturn.creditNoteNumber} generated. Refund of ${formatCurrency(newReturn.refundTotal)} authorized.`, 'Return Processed');
  };

  // Handle Standalone Manual Issue Credit Note
  const handleExecuteIssueCredit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditCustomerId) {
      toast.warning('Please select a customer account.', 'Customer Required');
      return;
    }
    const val = Number(creditAmount);
    if (!val || val <= 0) {
      toast.warning('Please enter a valid credit amount.', 'Invalid Amount');
      return;
    }
    if (!creditReason.trim()) {
      toast.warning('Please enter a reason for issuing store credit.', 'Reason Required');
      return;
    }

    const customerObj = customers.find(c => c.id === creditCustomerId);
    const customerName = customerObj?.name || 'Walk-in Customer';

    const now = new Date();
    const expiry = new Date(now.getTime() + creditValidDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const newCrn = issueCreditNote({
      customerId: creditCustomerId,
      customerName,
      originalAmount: val,
      reason: creditReason,
      sourceType: creditSourceType,
      sourceReference: `MANUAL-${Date.now().toString().slice(-4)}`,
      expiryDate: expiry,
      issuedBy: currentUser.name
    });

    setShowIssueCreditModal(false);
    setCreditCustomerId('');
    setCreditAmount('');
    setCreditReason('');
    setSelectedCreditNote(newCrn);
    setShowCreditCertModal(true);
    toast.success(`Customer Credit Note ${newCrn.creditNoteNumber} issued for ${customerName} (${formatCurrency(val)}).`, 'Credit Issued');
  };

  // Handle Void Credit Note
  const handleVoidCredit = async (crn: CustomerCreditNote) => {
    const confirmed = await confirmDialog({
      title: 'Void Store Credit Note',
      message: `Are you sure you want to VOID store credit ${crn.creditNoteNumber} for ${crn.customerName}?`,
      description: `This will cancel the remaining balance of ${formatCurrency(crn.remainingBalance)} and cannot be reversed.`,
      confirmText: 'Void Store Credit',
      variant: 'danger'
    });
    if (confirmed) {
      voidCreditNote(crn.id, 'Administrative cancellation');
      toast.success(`Credit Note ${crn.creditNoteNumber} has been voided.`, 'Credit Voided');
    }
  };

  // Convert Draft Directly to Sale
  const handleExecuteConvertDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDraft) return;

    const tender: PaymentTender = {
      method: convertTenderMethod,
      amount: selectedDraft.total,
      reference: `DRAFT-CONVERT-${Date.now().toString().slice(-4)}`
    };

    const newSale = convertDraftToSale(selectedDraft.id, [tender]);
    if (newSale) {
      setShowConvertDraftModal(false);
      setShowDraftDetailModal(false);
      setSelectedDraft(null);
      setSelectedSale(newSale);
      setShowReprintModal(true);
      setActionSuccessNotice(`Draft ${selectedDraft.draftNumber} converted to finalized Sale #${newSale.receiptNumber}. Inventory has been deducted.`);
      setTimeout(() => setActionSuccessNotice(null), 5000);
    }
  };

  // Financial KPIs Calculations
  const grossSalesTotal = sales.reduce((acc, s) => acc + s.total, 0);
  const refundsTotal = returns.reduce((acc, r) => acc + r.refundTotal, 0);
  const netRevenue = Math.max(0, grossSalesTotal - refundsTotal);
  const activeCreditBalance = (creditNotes || [])
    .filter(c => c.status === 'ACTIVE' || c.status === 'PARTIALLY_USED')
    .reduce((acc, c) => acc + c.remainingBalance, 0);
  const totalDraftsValue = draftSales.reduce((acc, d) => acc + d.total, 0);

  // Calculate dynamic return total in modal
  const calculatedReturnTotal = returnItemsState
    .filter(it => it.selected)
    .reduce((acc, it) => acc + (it.returnQuantity * it.unitPrice), 0);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {actionSuccessNotice && (
        <div className="p-3 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 flex-shrink-0" />
            <span>{actionSuccessNotice}</span>
          </div>
          <button onClick={() => setActionSuccessNotice(null)} className="text-white hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Sub-tab Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-brand-600" />
            <span>Commercial Sales, Drafts & Returns Register</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Full audit trails, pro-forma draft quotations, medication batch restocking, and customer store credit vouchers.
          </p>
        </div>

        {/* Dedicated Sub-tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          {isModuleEnabled('sales:ledger') && (
            <button
              onClick={() => handleTabChange('sales:ledger')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeSubTab === 'sales:ledger'
                  ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Sales Ledger</span>
              <span className="ml-1 px-1.5 py-0.2 bg-slate-200 dark:bg-slate-700 rounded-full text-[10px]">
                {sales.length}
              </span>
            </button>
          )}

          {isModuleEnabled('sales:credit') && (
            <button
              id="tab-sales-credit"
              onClick={() => handleTabChange('sales:credit')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeSubTab === 'sales:credit'
                  ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-amber-600" />
              <span>Credit & Receivables</span>
              {(creditSales || []).filter(c => c.status !== 'PAID').length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-full text-[10px] font-bold">
                  {(creditSales || []).filter(c => c.status !== 'PAID').length}
                </span>
              )}
            </button>
          )}

          {isModuleEnabled('sales:drafts') && (
            <button
              onClick={() => handleTabChange('sales:drafts')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeSubTab === 'sales:drafts'
                  ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Drafts & Quotes</span>
              {draftSales.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 rounded-full text-[10px] font-bold">
                  {draftSales.length}
                </span>
              )}
            </button>
          )}

          {isModuleEnabled('sales:returns') && (
            <button
              onClick={() => handleTabChange('sales:returns')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeSubTab === 'sales:returns'
                  ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Medication Returns</span>
              {returns.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-full text-[10px] font-bold">
                  {returns.length}
                </span>
              )}
            </button>
          )}

          {isModuleEnabled('sales:credits') && (
            <button
              onClick={() => handleTabChange('sales:credits')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeSubTab === 'sales:credits'
                  ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Customer Credit Notes</span>
              {creditNotes?.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-full text-[10px] font-bold">
                  {creditNotes.filter(c => c.status === 'ACTIVE').length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Gross Sales</span>
          <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">{formatCurrency(grossSalesTotal)}</p>
          <span className="text-[10px] text-slate-400">{sales.length} transactions total</span>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">Returns & Restock</span>
          <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400 mt-1">-{formatCurrency(refundsTotal)}</p>
          <span className="text-[10px] text-slate-400">{returns.length} medication returns</span>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/20 shadow-sm">
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">Active Credit Balance</span>
          <p className="text-lg font-extrabold text-amber-700 dark:text-amber-300 mt-1">{formatCurrency(activeCreditBalance)}</p>
          <span className="text-[10px] text-amber-600/80 font-medium">Customer store credit</span>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/20 shadow-sm">
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">Net Revenue</span>
          <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">{formatCurrency(netRevenue)}</p>
          <span className="text-[10px] text-emerald-600/80 font-medium">Reconciled register</span>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-brand-200 dark:border-brand-800/60 bg-brand-50/20 shadow-sm">
          <span className="text-[11px] font-semibold text-brand-700 dark:text-brand-300 uppercase tracking-wider block">Draft Estimates</span>
          <p className="text-lg font-extrabold text-brand-700 dark:text-brand-300 mt-1">{formatCurrency(totalDraftsValue)}</p>
          <span className="text-[10px] text-brand-600 font-semibold">{draftSales.length} drafts (Zero stock deducted)</span>
        </div>
      </div>

      {/* Filter and Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={
              activeSubTab === 'sales:ledger'
                ? "Search receipt #, customer, or cashier..."
                : activeSubTab === 'sales:drafts'
                ? "Search draft #, quotation title, or customer..."
                : activeSubTab === 'sales:returns'
                ? "Search return ref, receipt #, or reason..."
                : "Search credit note #, customer, or reason..."
            }
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sales Scope Toggle or Restricted Badge */}
          {hasExplicitAllSalesPermission ? (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSalesScopeFilter('ALL')}
                className={`px-2.5 py-1 rounded-md transition ${
                  effectiveScope === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                All Staff Sales
              </button>
              <button
                type="button"
                onClick={() => setSalesScopeFilter('OWN')}
                className={`px-2.5 py-1 rounded-md transition ${
                  effectiveScope === 'OWN'
                    ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                My Sales Only
              </button>
            </div>
          ) : (
            <div 
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
              title="Your role permission is configured to display your personal sales records only."
            >
              <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Scope: Your Personal Sales</span>
            </div>
          )}

          {/* Date range filter preset */}
          <select
            value={dateRangePreset}
            onChange={e => setDateRangePreset(e.target.value as any)}
            className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Dates</option>
            <option value="TODAY">Today Only</option>
            <option value="WEEK">Last 7 Days</option>
            <option value="MONTH">Last 30 Days</option>
          </select>

          {/* Sales Tab Specific Filters */}
          {activeSubTab === 'sales:ledger' && (
            <>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
                <option value="REFUNDED">Refunded</option>
              </select>

              <select
                value={paymentMethodFilter}
                onChange={e => setPaymentMethodFilter(e.target.value)}
                className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Tenders</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="TRANSFER">Bank Transfer</option>
                <option value="CREDIT">Customer Credit</option>
              </select>
            </>
          )}

          {/* Credit Notes Filter */}
          {activeSubTab === 'sales:credits' && (
            <select
              value={creditStatusFilter}
              onChange={e => setCreditStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active & Usable</option>
              <option value="PARTIALLY_USED">Partially Used</option>
              <option value="REDEEMED">Fully Redeemed</option>
              <option value="VOID">Voided</option>
            </select>
          )}

          {/* Dedicated Sub-Tab "+ Add" Action Buttons */}
          {activeSubTab === 'sales:ledger' && (
            <button
              onClick={() => onNavigate ? onNavigate('pos') : toast.info('Switch to Point of Sale (POS) from the left sidebar.', 'Point of Sale')}
              className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>+ New Sale (POS)</span>
            </button>
          )}

          {activeSubTab === 'sales:drafts' && (
            <button
              onClick={() => onNavigate ? onNavigate('pos') : toast.info('Open Point of Sale (POS) to create a draft quotation.', 'Point of Sale')}
              className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Create Draft in POS</span>
            </button>
          )}

          {activeSubTab === 'sales:returns' && (
            <button
              onClick={() => {
                setReturnLookupReceipt('');
                setShowStandaloneReturnModal(true);
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>+ Process Return</span>
            </button>
          )}

          {activeSubTab === 'sales:credits' && (
            <button
              onClick={() => {
                setCreditCustomerId(customers[0]?.id || '');
                setCreditAmount('');
                setCreditReason('');
                setShowIssueCreditModal(true);
              }}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Issue Credit Note</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: SALES LEDGER TABLE */}
      {/* ========================================================================= */}
      {activeSubTab === 'sales:ledger' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800 select-none">
                <tr>
                  <th className="p-3 w-16 text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      <input
                        ref={selectAllCheckboxRef}
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
                  paginatedSales.map((sale, index) => {
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
                              className="rounded border-slate-300 dark:border-slate-600 text-brand-600 focus:ring-brand-500 cursor-pointer"
                            />
                            <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 font-bold">
                              {(salesPage - 1) * 10 + index + 1}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {sale.receiptNumber}
                            </span>
                            {sale.isTrainingSimulation && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200">
                                TRAINING
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">
                            {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">
                          {new Date(sale.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {sale.customerName || 'Walk-in Patient'}
                          </div>
                          {sale.patientPhone && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {sale.patientPhone}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400 font-medium">
                          {sale.cashierName}
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {sale.items.length} {sale.items.length === 1 ? 'item' : 'items'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {sale.payments.map((p, idx) => (
                              <span 
                                key={idx}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                              >
                                {p.method}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          {formatCurrency(sale.total)}
                        </td>
                        <td className="p-3">
                          {sale.status === 'COMPLETED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                              Completed
                            </span>
                          ) : sale.status === 'PARTIALLY_REFUNDED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200">
                              Partial Return
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200">
                              Refunded
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <button
                            onClick={() => {
                              setSelectedSale(sale);
                              setShowDetailModal(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-brand-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                            title="Inspect Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSale(sale);
                              setShowReprintModal(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-brand-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                            title="Reprint Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {sale.status !== 'REFUNDED' && (
                            <button
                              onClick={() => openReturnModal(sale)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded"
                              title="Process Clinical Return"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
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
            currentPage={salesPage}
            totalItems={filteredSales.length}
            pageSize={10}
            onPageChange={setSalesPage}
            itemName="sales records"
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB: PATIENT CREDIT SALES & RECEIVABLES LEDGER */}
      {/* ========================================================================= */}
      {activeSubTab === 'sales:credit' && (
        <div className="space-y-4">
          <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5 text-xs text-amber-900 dark:text-amber-200">
              <Wallet className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Patient Credit Accounts Receivable (AR) & Settlement Desk</p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300/80">
                  Track dispensations issued on credit (stock already deducted), accept partial or full cash/momo settlements, issue official repayment receipts, and inspect audit histories.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate ? onNavigate('pos') : toast.info('Open Point of Sale (POS) to dispense medications on patient credit.', 'Point of Sale')}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow whitespace-nowrap flex items-center space-x-1.5 self-end md:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Credit Sale in POS</span>
            </button>
          </div>

          {/* Credit KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800/60 shadow-sm">
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">Total Outstanding Debt</span>
              <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                {formatCurrency((creditSales || []).reduce((acc, c) => acc + c.remainingBalance, 0))}
              </p>
              <span className="text-[10px] text-slate-500">Uncollected pharmacy receivables</span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-800/60 shadow-sm">
              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">Overdue Invoices</span>
              <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                {(creditSales || []).filter(c => c.status !== 'PAID' && new Date(c.dueDate) < new Date()).length}
              </p>
              <span className="text-[10px] text-rose-500 font-medium">Passed contractual due date</span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800/60 shadow-sm">
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">Fully Settled Invoices</span>
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {(creditSales || []).filter(c => c.status === 'PAID').length}
              </p>
              <span className="text-[10px] text-emerald-600 font-medium">100% repaid accounts</span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Active Debtors</span>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                {new Set((creditSales || []).filter(c => c.remainingBalance > 0).map(c => c.customerId)).size}
              </p>
              <span className="text-[10px] text-slate-400">Patients with open balance</span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                id="credit-sales-search-input"
                value={creditSaleSearch}
                onChange={e => setCreditSaleSearch(e.target.value)}
                placeholder="Search by invoice #, patient name, ID, or cashier..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                id="credit-sales-status-filter"
                value={creditSaleStatusFilter}
                onChange={e => setCreditSaleStatusFilter(e.target.value as any)}
                className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="OUTSTANDING">Outstanding Balance Only</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="PAID">Fully Settled (Paid)</option>
                <option value="OVERDUE">Overdue Accounts Only</option>
              </select>
            </div>
          </div>

          {/* Credit Invoices Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800 select-none">
                  <tr>
                    <th className="p-3">Invoice / Sale #</th>
                    <th className="p-3">Patient / Customer</th>
                    <th className="p-3">Dispense Date</th>
                    <th className="p-3">Payment Due Date</th>
                    <th className="p-3">Initiating Cashier</th>
                    <th className="p-3 text-right">Invoiced</th>
                    <th className="p-3 text-right">Paid to Date</th>
                    <th className="p-3 text-right">Balance Due</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Settlement & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCreditSales.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">
                        <Wallet className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-500" />
                        <p className="font-semibold text-xs">No credit sales match the specified filters.</p>
                        <p className="text-[11px] text-slate-500 mt-1">Dispense medications on credit in the POS to track patient debt here.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedCreditSales.map(cs => {
                      const isOverdue = cs.status !== 'PAID' && new Date(cs.dueDate) < new Date();
                      return (
                        <tr key={cs.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                          <td className="p-3">
                            <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{cs.saleNumber}</span>
                            <span className="block text-[10px] text-slate-400">{(cs.items || []).length} items</span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-900 dark:text-white block">{cs.customerName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {cs.customerId}</span>
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">
                            {cs.createdAt.slice(0, 10)}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center space-x-1.5">
                              <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                                {cs.dueDate}
                              </span>
                              {isOverdue && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                  OVERDUE
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">
                            <span className="font-medium">{cs.cashierName}</span>
                          </td>
                          <td className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                            {formatCurrency(cs.invoicedTotal)}
                          </td>
                          <td className="p-3 text-right font-semibold text-emerald-600">
                            {formatCurrency(cs.paidAmount)}
                          </td>
                          <td className="p-3 text-right">
                            <span className={`font-bold font-mono text-xs ${
                              cs.remainingBalance <= 0 
                                ? 'text-emerald-600' 
                                : isOverdue 
                                ? 'text-rose-600 font-extrabold' 
                                : 'text-amber-700 dark:text-amber-400'
                            }`}>
                              {formatCurrency(cs.remainingBalance)}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {cs.status === 'PAID' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                Settled
                              </span>
                            ) : cs.status === 'PARTIALLY_PAID' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                Part Paid
                              </span>
                            ) : isOverdue ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                Overdue
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                Unpaid
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {cs.remainingBalance > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenCreditPayment(cs)}
                                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold shadow flex items-center space-x-1"
                                  title="Record Cash/Card/MoMo payment against this credit invoice"
                                >
                                  <Wallet className="w-3 h-3" />
                                  <span>Pay / Settle</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setShowCreditHistoryModal(cs)}
                                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs"
                                title="View repayment receipts & history"
                              >
                                <Clock className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowCreditSaleDetailModal(cs)}
                                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs"
                                title="View dispensed line items"
                              >
                                <Eye className="w-3.5 h-3.5" />
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
              currentPage={creditSalesPage}
              totalItems={filteredCreditSales.length}
              pageSize={10}
              onPageChange={setCreditSalesPage}
              itemName="credit sales"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: DRAFTS & QUOTATIONS */}
      {/* ========================================================================= */}
      {activeSubTab === 'sales:drafts' && (
        <div className="space-y-3">
          <div className="p-3 bg-brand-50/50 dark:bg-brand-950/30 rounded-xl border border-brand-200 dark:border-brand-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-brand-900 dark:text-brand-200">
              <ShieldCheck className="w-4 h-4 text-brand-600 flex-shrink-0" />
              <span><strong>Zero Stock Deduction Guarantee:</strong> Items saved as drafts are held as pro-forma quotations and never deduct physical stock until finalized and paid.</span>
            </div>
            <button
              onClick={() => onNavigate ? onNavigate('pos') : toast.info('Open Point of Sale (POS) to create a draft quotation.', 'Point of Sale')}
              className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow whitespace-nowrap ml-3"
            >
              + New Draft in POS
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800 select-none">
                  <tr>
                    <th className="p-3">Draft #</th>
                    <th className="p-3">Title / Order Name</th>
                    <th className="p-3">Date Saved</th>
                    <th className="p-3">Cashier</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Items Count</th>
                    <th className="p-3">Estimated Total</th>
                    <th className="p-3">Stock Impact</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredDrafts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 dark:text-slate-500">
                        No draft sales or quotations found. Save an in-progress cart as a draft from the POS to hold it without deducting inventory.
                      </td>
                    </tr>
                  ) : (
                    paginatedDrafts.map(draft => (
                      <tr key={draft.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-brand-600">{draft.draftNumber}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{draft.title || 'Untitled Draft'}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">{draft.createdAt}</td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">{draft.cashierName}</td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">{draft.customerName || 'Walk-in'}</td>
                        <td className="p-3">{(draft.items || []).length} lines</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{formatCurrency(draft.total)}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                            ZERO DEDUCTION
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <button
                            onClick={() => {
                              setSelectedDraft(draft);
                              setShowDraftDetailModal(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-brand-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                            title="Inspect Draft Items & Print Quotation"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDraft(draft);
                              setShowConvertDraftModal(true);
                            }}
                            className="px-2.5 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow"
                            title="Complete and Convert to Finalized Sale"
                          >
                            Convert & Pay
                          </button>
                          <button
                            onClick={async () => {
                              const confirmed = await confirmDialog({
                                title: 'Discard Draft Quotation',
                                message: `Are you sure you want to discard draft quotation ${draft.draftNumber}?`,
                                description: 'This temporary cart record will be permanently deleted.',
                                confirmText: 'Discard Draft',
                                variant: 'danger'
                              });
                              if (confirmed) {
                                deleteDraftSale(draft.id);
                                toast.success(`Draft quotation ${draft.draftNumber} discarded.`, 'Draft Discarded');
                              }
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition cursor-pointer"
                            title="Discard Draft"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={draftsPage}
              totalItems={filteredDrafts.length}
              pageSize={10}
              onPageChange={setDraftsPage}
              itemName="drafts"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: MEDICATION RETURNS REGISTER */}
      {/* ========================================================================= */}
      {activeSubTab === 'sales:returns' && (
        <div className="space-y-3">
          <div className="p-3 bg-rose-50/50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-rose-900 dark:text-rose-200">
              <RotateCcw className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span><strong>Physical Drug Returns:</strong> Handles batch restocking for sealed, undamaged medications or quarantine write-offs for compromised packs.</span>
            </div>
            <button
              onClick={() => {
                setReturnLookupReceipt('');
                setShowStandaloneReturnModal(true);
              }}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow whitespace-nowrap ml-3"
            >
              + Process Return
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800 select-none">
                  <tr>
                    <th className="p-3">Return Ref / CN #</th>
                    <th className="p-3">Original Receipt #</th>
                    <th className="p-3">Date Processed</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Authorized Pharmacist</th>
                    <th className="p-3">Clinical / Return Reason</th>
                    <th className="p-3">Items Returned</th>
                    <th className="p-3">Restocked?</th>
                    <th className="p-3">Refund Total</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredReturns.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400 dark:text-slate-500">
                        No medication return records found. Click "+ Process Return" to look up an invoice and process a clinical return.
                      </td>
                    </tr>
                  ) : (
                    paginatedReturns.map(ret => (
                      <tr key={ret.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-rose-600 dark:text-rose-400">{ret.creditNoteNumber}</td>
                        <td className="p-3 font-mono font-semibold text-brand-600">{ret.receiptNumber}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">{ret.createdAt}</td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">{ret.customerName || 'Walk-in'}</td>
                        <td className="p-3 text-slate-800 dark:text-slate-200 font-medium">{ret.authorizedByPharmacist}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-400 max-w-[200px] truncate" title={ret.reason}>
                          {ret.reason}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-[10px]">
                            {(ret.items || []).length} items
                          </span>
                        </td>
                        <td className="p-3">
                          {ret.restocked ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                              Restocked
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200">
                              Damaged / Write-off
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-bold text-rose-600 dark:text-rose-400">
                          {formatCurrency(ret.refundTotal)}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedReturn(ret);
                              setShowReturnSlipModal(true);
                            }}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-1 ml-auto transition"
                            title="Print Official Return Slip"
                          >
                            <Printer className="w-3.5 h-3.5 text-rose-600" />
                            <span>Print Slip</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={returnsPage}
              totalItems={filteredReturns.length}
              pageSize={10}
              onPageChange={setReturnsPage}
              itemName="returns"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: CUSTOMER CREDIT NOTES REGISTER */}
      {/* ========================================================================= */}
      {activeSubTab === 'sales:credits' && (
        <div className="space-y-3">
          <div className="p-3 bg-amber-50/50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-amber-900 dark:text-amber-200">
              <CreditCard className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span><strong>Customer Store Credit Vouchers:</strong> Commercial credit instruments that can be redeemed at checkout or drawn down against customer accounts.</span>
            </div>
            <button
              onClick={() => {
                setCreditCustomerId(customers[0]?.id || '');
                setCreditAmount('');
                setCreditReason('');
                setShowIssueCreditModal(true);
              }}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow whitespace-nowrap ml-3"
            >
              + Issue Credit Note
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800 select-none">
                  <tr>
                    <th className="p-3">Credit Note #</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Source / Origin</th>
                    <th className="p-3">Issue Date</th>
                    <th className="p-3">Expiry Date</th>
                    <th className="p-3">Original Value</th>
                    <th className="p-3">Remaining Balance</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCreditNotes.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 dark:text-slate-500">
                        No customer credit notes found. Click "+ Issue Credit Note" to create a new customer credit certificate.
                      </td>
                    </tr>
                  ) : (
                    paginatedCreditNotes.map(crn => (
                      <tr key={crn.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">{crn.creditNoteNumber}</td>
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">{crn.customerName}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800">
                            {crn.sourceType}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">{crn.issueDate}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">{crn.expiryDate || 'No Expiry'}</td>
                        <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(crn.originalAmount)}</td>
                        <td className="p-3 font-bold text-amber-600 dark:text-amber-400 text-sm">
                          {formatCurrency(crn.remainingBalance)}
                        </td>
                        <td className="p-3">
                          {crn.status === 'ACTIVE' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                              Active / Usable
                            </span>
                          ) : crn.status === 'PARTIALLY_USED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200">
                              Partially Used
                            </span>
                          ) : crn.status === 'REDEEMED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200">
                              Redeemed
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200">
                              Voided
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <button
                            onClick={() => {
                              setSelectedCreditNote(crn);
                              setShowCreditCertModal(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-amber-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                            title="View / Print Official Credit Certificate"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {crn.status !== 'VOID' && crn.status !== 'REDEEMED' && (
                            <button
                              onClick={() => handleVoidCredit(crn)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded"
                              title="Void Credit Note"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={creditNotesPage}
              totalItems={filteredCreditNotes.length}
              pageSize={10}
              onPageChange={setCreditNotesPage}
              itemName="credit notes"
            />
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar for Sales Selection */}
      {activeSubTab === 'sales:ledger' && (
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
      )}

      {/* ========================================================================= */}
      {/* MODAL: STANDALONE RETURN LOOKUP WIZARD (+ Process Return) */}
      {/* ========================================================================= */}
      {showStandaloneReturnModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2 text-rose-600">
                <RotateCcw className="w-5 h-5" />
                <div>
                  <h3 className="font-bold text-sm">Process Clinical Return & Restock</h3>
                  <p className="text-[11px] text-slate-500">Lookup original completed sale by Receipt # or Customer</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowStandaloneReturnModal(false)}><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Enter Receipt ID or Customer Name:
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={returnLookupReceipt}
                    onChange={e => setReturnLookupReceipt(e.target.value)}
                    placeholder="e.g. Receipt: REC-20260921-8901 or customer name..."
                    className="w-full pl-8 pr-16 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 font-mono"
                  />
                  {returnLookupReceipt && (
                    <button
                      type="button"
                      onClick={() => setReturnLookupReceipt('')}
                      className="absolute right-2 top-2 text-[10px] text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Quick 1-click test receipt */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] text-slate-400">Quick Test:</span>
                  <button
                    type="button"
                    onClick={() => setReturnLookupReceipt('REC-20260921-8901')}
                    className="px-2 py-0.5 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 rounded text-[10px] font-mono font-bold hover:underline"
                  >
                    Receipt: REC-20260921-8901
                  </button>
                </div>
              </div>

              <div className="font-semibold text-slate-500">Matched Sales Transactions:</div>
              <div className="max-h-64 overflow-y-auto divide-y border rounded-xl bg-slate-50 dark:bg-slate-800/50">
                {(() => {
                  const sanitized = returnLookupReceipt.replace(/^receipt:\s*/i, '').trim().toLowerCase();
                  const matched = sales
                    .filter(s => s.status !== 'REFUNDED')
                    .filter(s => 
                      !sanitized || 
                      s.receiptNumber.toLowerCase().includes(sanitized) ||
                      (s.customerName && s.customerName.toLowerCase().includes(sanitized))
                    );

                  if (matched.length === 0 && sanitized) {
                    return (
                      <div className="p-4 text-center space-y-2">
                        <p className="text-slate-500 font-medium">No sales records matching "{returnLookupReceipt}"</p>
                        <p className="text-[11px] text-slate-400">Ensure the receipt number is formatted correctly (e.g. REC-20260921-8901).</p>
                      </div>
                    );
                  }

                  return matched.map(s => (
                    <div 
                      key={s.id} 
                      onClick={() => {
                        setShowStandaloneReturnModal(false);
                        openReturnModal(s);
                      }}
                      className="p-3 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 cursor-pointer flex justify-between items-center transition"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-mono font-bold text-brand-600 dark:text-brand-400">{s.receiptNumber}</p>
                          {s.receiptNumber === 'REC-20260921-8901' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-rose-100 text-rose-700 font-bold">FOUND</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">{s.createdAt} • {s.customerName || 'Walk-in'}</p>
                        <p className="text-[10px] text-slate-400">{(s.items || []).length} items ({((s.items || []).map(i => i.productName)).slice(0, 2).join(', ')}...)</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 dark:text-white block">{formatCurrency(s.total)}</span>
                        <span className="text-[10px] text-rose-600 font-bold hover:underline">Select & Return &rarr;</span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowStandaloneReturnModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: STANDALONE ISSUE STORE CREDIT (+ Issue Credit Note) */}
      {/* ========================================================================= */}
      {showIssueCreditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleExecuteIssueCredit} className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2 text-amber-600">
                <CreditCard className="w-5 h-5" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Issue Customer Credit Note</h3>
                  <p className="text-[11px] text-slate-500">Create a registered store credit certificate</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowIssueCreditModal(false)}><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Select Customer Account *</label>
                <select
                  required
                  value={creditCustomerId}
                  onChange={e => setCreditCustomerId(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-xs"
                >
                  <option value="">Select a customer...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone || c.email || 'Retail'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Credit Amount ({currentCurrency.code}) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={creditAmount}
                  onChange={e => setCreditAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="e.g. 5000"
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Source / Issuance Category</label>
                <select
                  value={creditSourceType}
                  onChange={e => setCreditSourceType(e.target.value as any)}
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-xs"
                >
                  <option value="MANUAL_ISSUANCE">Manual Administrative Issuance</option>
                  <option value="RETURN_REFUND">Product Return Store Credit</option>
                  <option value="OVERPAYMENT">Customer Deposit / Overpayment</option>
                  <option value="GOODWILL">Goodwill / Loyalty Credit</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Validity Period (Days)</label>
                <select
                  value={creditValidDays}
                  onChange={e => setCreditValidDays(parseInt(e.target.value))}
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-xs"
                >
                  <option value={30}>30 Days (1 Month)</option>
                  <option value={90}>90 Days (3 Months)</option>
                  <option value={180}>180 Days (6 Months - Standard)</option>
                  <option value={365}>365 Days (1 Year)</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Reason & Clinical / Commercial Notes *</label>
                <textarea
                  required
                  value={creditReason}
                  onChange={e => setCreditReason(e.target.value)}
                  placeholder="e.g. Deposit for special order prescription / price adjustment."
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-xs h-16"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowIssueCreditModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Issue & Generate Voucher</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: SALE DETAIL MODAL */}
      {/* ========================================================================= */}
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
                  setShowReprintModal(true);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Reprint Receipt</span>
              </button>
              {selectedSale.status !== 'REFUNDED' && (
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    openReturnModal(selectedSale);
                  }}
                  className="px-4 py-2 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-100 rounded-lg text-xs font-semibold"
                >
                  Initiate Return
                </button>
              )}
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

      {/* ========================================================================= */}
      {/* MODAL 2: ITEM-LEVEL RETURN & REFUND MODAL */}
      {/* ========================================================================= */}
      {showReturnModal && selectedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleExecuteReturn} className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <div>
                  <h3 className="font-bold text-sm">Process Clinical Return & Restock</h3>
                  <p className="text-[11px] text-slate-500">Invoice: {selectedSale.receiptNumber} ({formatCurrency(selectedSale.total)})</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowReturnModal(false)}><X className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              <div>
                <label className="font-bold block mb-1">Select Line Items & Return Quantities:</label>
                <div className="border rounded-xl divide-y bg-slate-50 dark:bg-slate-800/50">
                  {returnItemsState.map((it, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={it.selected}
                          onChange={e => {
                            const updated = [...returnItemsState];
                            updated[idx].selected = e.target.checked;
                            setReturnItemsState(updated);
                          }}
                          className="w-4 h-4 rounded text-rose-600"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">{it.productName}</p>
                          <p className="text-[10px] text-slate-500">Batch #{it.batchNumber} • Max: {it.maxQuantity}</p>
                        </div>
                      </div>

                      {/* Quantity stepper */}
                      {it.selected && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            max={it.maxQuantity}
                            value={it.returnQuantity}
                            onChange={e => {
                              const qty = Math.min(it.maxQuantity, Math.max(1, parseInt(e.target.value) || 1));
                              const updated = [...returnItemsState];
                              updated[idx].returnQuantity = qty;
                              setReturnItemsState(updated);
                            }}
                            className="w-14 p-1 border rounded text-center text-xs font-bold"
                          />
                          <span className="font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {formatCurrency(it.returnQuantity * it.unitPrice)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Physical Condition */}
              <div>
                <label className="font-bold block mb-1">Restocking & Physical Condition</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOverallCondition('RESELLABLE');
                      setReturnItemsState(prev => prev.map(i => ({ ...i, condition: 'RESELLABLE' })));
                    }}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold text-center transition ${
                      overallCondition === 'RESELLABLE' 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Resellable (Restock to Batch)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOverallCondition('DAMAGED');
                      setReturnItemsState(prev => prev.map(i => ({ ...i, condition: 'DAMAGED' })));
                    }}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold text-center transition ${
                      overallCondition === 'DAMAGED' 
                        ? 'bg-rose-50 border-rose-500 text-rose-800 dark:bg-rose-950 dark:text-rose-300' 
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Damaged (Write Off / Quarantine)
                  </button>
                </div>
              </div>

              {/* Refund Method */}
              <div>
                <label className="font-bold block mb-1">Refund Payout Tender Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CASH', 'STORE_CREDIT', 'ORIGINAL_METHOD'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setRefundMethod(m)}
                      className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold text-center ${
                        refundMethod === m ? 'bg-brand-600 text-white border-brand-600' : 'border-slate-200 text-slate-700'
                      }`}
                    >
                      {m.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="font-bold block mb-1">Return Reason / Clinical Notes *</label>
                <textarea
                  required
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  placeholder="e.g. Sealed blister returned intact; physician changed antibiotic dosage."
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-xs h-20"
                />
              </div>

              {/* Refund Total Preview */}
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 flex justify-between items-center">
                <span className="font-bold text-rose-800 dark:text-rose-300">Total Refund Authorized:</span>
                <span className="text-base font-extrabold text-rose-700 dark:text-rose-400 font-mono">
                  {formatCurrency(calculatedReturnTotal)}
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Authorize Refund & Restock</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: REPRINT OFFICIAL TAX INVOICE */}
      {/* ========================================================================= */}
      {showReprintModal && selectedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-2 no-print">
              <span className="font-bold text-xs">Official Dispensary Receipt Reprint</span>
              <button onClick={() => setShowReprintModal(false)}><X className="w-4 h-4" /></button>
            </div>

            {/* Thermal Print Receipt Template */}
            <div className="p-4 bg-white text-black font-mono text-xs border shadow-inner space-y-3 print-80mm overflow-y-auto">
              <div className="text-center space-y-0.5 border-b border-dashed border-black pb-2">
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
                <h4 className="font-extrabold text-sm uppercase tracking-tight">
                  {systemProfile.branchName || systemProfile.tradeName}
                </h4>
                <p className="text-[10px]">{systemProfile.address}</p>
                <p className="text-[10px]">Tel: {systemProfile.phone}</p>
                {printerConfig.showPremisesLicense !== false && systemProfile.premisesLicense && (
                  <p className="text-[9px] font-bold">Premises Lic: {systemProfile.premisesLicense}</p>
                )}
                {printerConfig.showHeaderNote !== false && printerConfig.headerNote && (
                  <p className="text-[8px] text-slate-500 italic">{printerConfig.headerNote}</p>
                )}
              </div>

              <div className="text-[10px] space-y-0.5 border-b border-dashed border-black pb-2">
                <div className="flex justify-between">
                  <span>Receipt #:</span>
                  <span className="font-bold">{selectedSale.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{selectedSale.createdAt}</span>
                </div>
                {printerConfig.showCashierName !== false && (
                  <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span>{selectedSale.cashierName}</span>
                  </div>
                )}
                {printerConfig.showCustomerName !== false && (
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span>{selectedSale.customerName || 'Walk-in'}</span>
                  </div>
                )}
                {printerConfig.showSuperintendentName !== false && systemProfile.superintendentName && (
                  <div className="flex justify-between">
                    <span>Superintendent:</span>
                    <span>{systemProfile.superintendentName}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="space-y-1.5 border-b border-dashed border-black pb-2">
                {selectedSale.items.map((it, idx) => (
                  <div key={idx} className="text-[10px]">
                    <div className="flex justify-between font-bold">
                      <span>{it.productName} (x{it.quantity})</span>
                      <span>{formatCurrency(it.subtotal)}</span>
                    </div>
                    {printerConfig.showBatchDetails && (
                      <div className="text-[9px] text-slate-600">
                        Batch #{it.batchNumber} | Exp: {it.expiryDate}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-[10px] space-y-0.5 pt-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedSale.subtotal)}</span>
                </div>
                {printerConfig.showTaxBreakdown !== false && (
                  <div className="flex justify-between">
                    <span>VAT ({systemProfile.defaultVatPercent}%):</span>
                    <span>{formatCurrency(selectedSale.taxTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-black">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(selectedSale.total)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Status:</span>
                  <span className="font-bold">{selectedSale.status}</span>
                </div>
              </div>

              <div className="text-center pt-2 text-[9px] space-y-1">
                {printerConfig.showFooterPolicy !== false && printerConfig.footerPolicy && (
                  <p>{printerConfig.footerPolicy}</p>
                )}
                {printerConfig.showBarcode && (
                  <p className="font-mono text-[9px]">*{selectedSale.receiptNumber}*</p>
                )}
                {printerConfig.showPoweredBy !== false && (
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest pt-1">
                    {printerConfig.poweredByText || 'Powered by GreenlifeAI Dispensary Engine'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex space-x-2 no-print pt-2 border-t">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setShowReprintModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: PRINTABLE RETURN SLIP */}
      {/* ========================================================================= */}
      {showReturnSlipModal && selectedReturn && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-2 no-print">
              <span className="font-bold text-xs text-rose-600">Authorized Medication Return Slip</span>
              <button onClick={() => setShowReturnSlipModal(false)}><X className="w-4 h-4" /></button>
            </div>

            {/* Return printable slip */}
            <div className="p-4 bg-white text-black font-mono text-xs border border-rose-300 shadow-inner space-y-3 print-80mm overflow-y-auto">
              <div className="text-center space-y-0.5 border-b border-dashed border-black pb-2">
                <h4 className="font-bold text-sm uppercase text-rose-800">MEDICATION RETURN SLIP</h4>
                <p className="font-extrabold text-xs uppercase tracking-tight">
                  {systemProfile.branchName || systemProfile.tradeName}
                </p>
                <p className="text-[9px]">{systemProfile.address}</p>
                <p className="text-[9px]">Premises Lic: {systemProfile.premisesLicense}</p>
              </div>

              <div className="text-[10px] space-y-0.5 border-b border-dashed border-black pb-2">
                <div className="flex justify-between">
                  <span>Return Ref #:</span>
                  <span className="font-bold text-rose-700">{selectedReturn.creditNoteNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Original Receipt:</span>
                  <span className="font-bold">{selectedReturn.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{selectedReturn.createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{selectedReturn.customerName || 'Walk-in'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pharmacist:</span>
                  <span>{selectedReturn.authorizedByPharmacist}</span>
                </div>
              </div>

              <div className="space-y-1 border-b border-dashed border-black pb-2">
                <span className="font-bold text-[10px] block">Returned Medication:</span>
                {selectedReturn.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[10px]">
                    <span>{it.productName} (x{it.quantity}) [{it.condition}]</span>
                    <span>{formatCurrency(it.refundSubtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="text-[10px] space-y-0.5">
                <p className="text-[9px] italic">Clinical Reason: {selectedReturn.reason}</p>
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-black">
                  <span>TOTAL REFUND:</span>
                  <span className="text-rose-700">{formatCurrency(selectedReturn.refundTotal)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Refund Tender:</span>
                  <span className="font-bold">{selectedReturn.refundMethod}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Restocked to Inventory:</span>
                  <span className="font-bold">{selectedReturn.restocked ? 'YES (Resellable)' : 'NO (Damaged)'}</span>
                </div>
              </div>

              <div className="text-center pt-2 text-[9px]">
                <p>Authorized Clinical Return • Customer Copy</p>
                <p className="font-mono text-[9px]">*{selectedReturn.creditNoteNumber}*</p>
              </div>
            </div>

            <div className="flex space-x-2 no-print pt-2 border-t">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Slip</span>
              </button>
              <button
                onClick={() => setShowReturnSlipModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: PRINTABLE CUSTOMER STORE CREDIT CERTIFICATE */}
      {/* ========================================================================= */}
      {showCreditCertModal && selectedCreditNote && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-2 no-print">
              <span className="font-bold text-xs text-amber-600">Customer Store Credit Certificate</span>
              <button onClick={() => setShowCreditCertModal(false)}><X className="w-4 h-4" /></button>
            </div>

            {/* Official Store Credit Certificate Voucher */}
            <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-900 text-slate-900 dark:text-white border-2 border-amber-400 rounded-2xl shadow-inner space-y-4">
              <div className="text-center border-b border-amber-300 pb-3">
                <Award className="w-8 h-8 text-amber-600 mx-auto mb-1" />
                <h3 className="font-black text-sm uppercase tracking-wider text-amber-900 dark:text-amber-300">
                  OFFICIAL STORE CREDIT VOUCHER
                </h3>
                <p className="font-extrabold text-xs uppercase tracking-tight text-slate-900 dark:text-white">
                  {systemProfile.branchName || systemProfile.tradeName}
                </p>
                <p className="text-[9px] text-slate-500">Premises License: {systemProfile.premisesLicense}</p>
              </div>

              <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-amber-200 dark:border-amber-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Credit Voucher #:</span>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-400 text-sm">
                    {selectedCreditNote.creditNoteNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Beneficiary Customer:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedCreditNote.customerName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Issue Date:</span>
                  <span>{selectedCreditNote.issueDate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Expiry Date:</span>
                  <span className="font-semibold text-rose-600">{selectedCreditNote.expiryDate || 'No Expiration'}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-slate-500">Origin / Reason:</span>
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{selectedCreditNote.reason}</span>
                </div>
              </div>

              <div className="bg-amber-100/70 dark:bg-amber-950/60 p-3 rounded-xl border border-amber-300 dark:border-amber-700 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 tracking-wider block">
                  AVAILABLE CREDIT BALANCE
                </span>
                <span className="text-2xl font-black text-amber-700 dark:text-amber-300 font-mono">
                  {formatCurrency(selectedCreditNote.remainingBalance)}
                </span>
                <p className="text-[9px] text-slate-500 mt-0.5">
                  Original Issued Amount: {formatCurrency(selectedCreditNote.originalAmount)}
                </p>
              </div>

              <div className="text-[9px] text-slate-500 space-y-1 text-center border-t border-amber-200 pt-2">
                <p>Present this certificate or quote the credit voucher number at POS checkout.</p>
                <p className="italic">Authorized Signatory: {selectedCreditNote.issuedBy} • GreenLife AI Dispensary</p>
              </div>
            </div>

            <div className="flex space-x-2 no-print pt-2 border-t">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Certificate</span>
              </button>
              <button
                onClick={() => setShowCreditCertModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: DRAFT DETAIL & PRO-FORMA ESTIMATE */}
      {/* ========================================================================= */}
      {showDraftDetailModal && selectedDraft && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>Pro-Forma Quotation: {selectedDraft.draftNumber}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-brand-100 text-brand-800 font-bold">DRAFT</span>
                </h3>
                <p className="text-xs text-slate-500">{selectedDraft.createdAt} • Cashier: {selectedDraft.cashierName}</p>
              </div>
              <button onClick={() => setShowDraftDetailModal(false)}><X className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              <div className="p-3 bg-brand-50/60 dark:bg-brand-950/30 rounded-xl border border-brand-200">
                <span className="font-bold block text-brand-900 dark:text-brand-200">{selectedDraft.title}</span>
                {selectedDraft.notes && <p className="text-slate-600 dark:text-slate-400 mt-1 italic">"{selectedDraft.notes}"</p>}
              </div>

              <div className="border rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50 divide-y">
                {(selectedDraft.items || []).map((it, idx) => (
                  <div key={idx} className="py-2 first:pt-0 last:pb-0 flex justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{it.productName} (x{it.quantity} {it.selectedUnitName})</p>
                      <p className="text-[10px] text-slate-500">Batch #{it.batchNumber} • Exp: {it.expiryDate}</p>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(it.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-baseline font-bold text-sm pt-1 border-t">
                <span>Estimated Total:</span>
                <span className="text-brand-600 dark:text-brand-400 text-base">{formatCurrency(selectedDraft.total)}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border rounded-lg text-xs font-semibold flex items-center space-x-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Quotation</span>
              </button>
              <button
                onClick={() => {
                  setShowDraftDetailModal(false);
                  setShowConvertDraftModal(true);
                }}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow"
              >
                Convert to Final Sale
              </button>
              <button
                onClick={() => setShowDraftDetailModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: CONVERT DRAFT TO SALE WITH TENDER */}
      {/* ========================================================================= */}
      {showConvertDraftModal && selectedDraft && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleExecuteConvertDraft} className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-sm">Finalize Sale & Deduct Inventory</h3>
              </div>
              <button type="button" onClick={() => setShowConvertDraftModal(false)}><X className="w-4 h-4" /></button>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 text-xs space-y-1">
              <p className="font-bold text-amber-800 dark:text-amber-300">Inventory Notice:</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Converting this draft will immediately deduct {(selectedDraft.items || []).length} line items from batches and log a finalized transaction in the register.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b">
                <span className="text-slate-500">Draft Order:</span>
                <span className="font-bold">{selectedDraft.draftNumber} ({selectedDraft.title})</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold">{selectedDraft.customerName || 'Walk-in'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-slate-500">Total Due:</span>
                <span className="font-bold text-base text-brand-600">{formatCurrency(selectedDraft.total)}</span>
              </div>

              <div>
                <label className="font-bold block mb-1">Select Payment Tender Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CASH', 'CARD', 'TRANSFER'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setConvertTenderMethod(m)}
                      className={`py-2 rounded-xl border text-xs font-bold text-center transition ${
                        convertTenderMethod === m ? 'bg-brand-600 text-white border-brand-600' : 'border-slate-200 text-slate-700'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowConvertDraftModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Deduct Stock</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: SETTLE / PAY PATIENT CREDIT ACCOUNT */}
      {/* ========================================================================= */}
      {showCreditPayModal && selectedCreditSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleConfirmCreditPayment} className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Record Credit Debt Settlement</h3>
                  <p className="text-xs text-slate-500">Decrements Accounts Receivable (AR) & issues receipt</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowCreditPayModal(false)}><X className="w-4 h-4" /></button>
            </div>

            {/* Debt Breakdown Card */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice Reference:</span>
                <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{selectedCreditSale.saleNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedCreditSale.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dispensed Date / Due:</span>
                <span>{selectedCreditSale.createdAt.slice(0, 10)} • Due: {selectedCreditSale.dueDate}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-amber-200 dark:border-amber-800/80 font-bold">
                <span className="text-slate-700 dark:text-slate-300">Remaining Balance Due:</span>
                <span className="text-amber-600 dark:text-amber-400 text-sm">{formatCurrency(selectedCreditSale.remainingBalance)}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Settlement Amount ({currentCurrency.symbol}) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setPayAmount((selectedCreditSale.remainingBalance ?? selectedCreditSale.balanceDue).toFixed(2))}
                    className="text-[10px] text-amber-600 hover:text-amber-700 font-bold underline"
                  >
                    Quick Fill Full Balance ({formatCurrency(selectedCreditSale.remainingBalance ?? selectedCreditSale.balanceDue)})
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedCreditSale.remainingBalance ?? selectedCreditSale.balanceDue}
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono font-bold text-sm text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  Payment Tender Method *
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['CASH', 'MOMO', 'CARD', 'TRANSFER'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayMethod(m)}
                      className={`py-2 px-1 rounded-xl border text-[11px] font-bold text-center transition ${
                        payMethod === m 
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm' 
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  Transaction Reference / MoMo Approval ID
                </label>
                <input
                  type="text"
                  value={payReference}
                  onChange={e => setPayReference(e.target.value)}
                  placeholder="e.g. MOMO-982341 or CASH-COUNTER-1"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  Settlement Notes
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  placeholder="e.g. Monthly chronic patient account partial settlement"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                <span>Receiving Cashier:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{currentUser.name} ({currentUser.role})</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowCreditPayModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="confirm-record-payment-btn"
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Payment & Print Receipt</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 9: OFFICIAL CREDIT SETTLEMENT RECEIPT (PRINTABLE) */}
      {/* ========================================================================= */}
      {showSettlementReceiptModal && lastSettlementRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Payment Recorded Successfully</h3>
              </div>
              <button type="button" onClick={() => setShowSettlementReceiptModal(false)}><X className="w-4 h-4" /></button>
            </div>

            {/* Printable Thermal Receipt Card */}
            <div id="credit-settlement-receipt-card" className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 font-mono text-xs space-y-3 overflow-y-auto">
              <div className="text-center border-b border-dashed border-slate-300 dark:border-slate-700 pb-3">
                <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                  {systemProfile.branchName || systemProfile.tradeName || systemProfile.legalName}
                </h2>
                <p className="text-[10px] text-slate-500">{systemProfile.address}</p>
                <p className="text-[10px] text-slate-500">Tel: {systemProfile.phone} • TIN: {systemProfile.taxIdentificationNumber || 'TIN-GH-2026-PCN'}</p>
                <div className="mt-2 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 text-[11px] font-bold rounded">
                  CREDIT REPAYMENT RECEIPT
                </div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt No:</span>
                  <span className="font-bold">{lastSettlementRecord.payment.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Time:</span>
                  <span>{new Date(lastSettlementRecord.payment.date || lastSettlementRecord.payment.paymentDate || Date.now()).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Debtor / Patient:</span>
                  <span className="font-bold">{lastSettlementRecord.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Credit Invoice Ref:</span>
                  <span className="font-bold">{lastSettlementRecord.creditSale.saleNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Received By (Staff):</span>
                  <span>{lastSettlementRecord.payment.receivedByName}</span>
                </div>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 dark:border-slate-700 py-2.5 space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Previous Balance:</span>
                  <span>{formatCurrency(lastSettlementRecord.previousBalance)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-emerald-600">
                  <span>Amount Paid Tendered:</span>
                  <span>{formatCurrency(lastSettlementRecord.payment.amount)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Tender Method:</span>
                  <span>{lastSettlementRecord.payment.method} ({lastSettlementRecord.payment.reference})</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-dashed font-bold text-slate-900 dark:text-white">
                  <span>Remaining Debt Balance:</span>
                  <span className={lastSettlementRecord.remainingBalance <= 0 ? 'text-emerald-600' : 'text-amber-600'}>
                    {formatCurrency(lastSettlementRecord.remainingBalance)}
                  </span>
                </div>
              </div>

              {lastSettlementRecord.payment.notes && (
                <p className="text-[10px] text-slate-500 italic">
                  Note: "{lastSettlementRecord.payment.notes}"
                </p>
              )}

              <div className="text-center pt-2 text-[10px] text-slate-400 space-y-1">
                <p>Thank you for choosing GreenLife AI Pharmacy.</p>
                <p className="font-mono">*** COMPUTER GENERATED OFFICIAL RECEIPT ***</p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 border rounded-xl text-xs font-semibold flex items-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSettlementReceiptModal(false)}
                className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold shadow"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 10: CREDIT PAYMENT REPAYMENT HISTORY DRAWER */}
      {/* ========================================================================= */}
      {showCreditHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Repayment History: {showCreditHistoryModal.saleNumber}
                  </h3>
                  <p className="text-xs text-slate-500">Patient: {showCreditHistoryModal.customerName}</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowCreditHistoryModal(null)}><X className="w-4 h-4" /></button>
            </div>

            {/* Quick Balance Banner */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-center text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Invoiced</span>
                <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(showCreditHistoryModal.invoicedTotal)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Repaid</span>
                <span className="font-bold text-emerald-600">{formatCurrency(showCreditHistoryModal.paidAmount)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Balance Due</span>
                <span className={`font-bold ${showCreditHistoryModal.remainingBalance <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {formatCurrency(showCreditHistoryModal.remainingBalance)}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {showCreditHistoryModal.payments.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-1">
                  <Wallet className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-xs">No repayment installments recorded yet for this invoice.</p>
                </div>
              ) : (
                showCreditHistoryModal.payments.map((p, idx) => (
                  <div key={p.id || idx} className="p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-brand-600">{p.receiptNumber}</span>
                        <span className="px-1.5 py-0.2 bg-slate-200 dark:bg-slate-700 rounded text-[10px] font-semibold">{p.method}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {new Date(p.date || p.paymentDate || Date.now()).toLocaleString()} • Ref: {p.reference} • Cashier: {p.receivedByName || p.receivedBy}
                      </p>
                      {p.notes && <p className="text-[10px] text-slate-400 italic">"{p.notes}"</p>}
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-600 font-mono text-sm block">
                        +{formatCurrency(p.amount)}
                      </span>
                      <span className="text-[10px] text-slate-400">Settlement</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowCreditHistoryModal(null)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 11: CREDIT SALE DISPENSED ITEMS MODAL */}
      {/* ========================================================================= */}
      {showCreditSaleDetailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Dispensed Line Items: {showCreditSaleDetailModal.saleNumber}
                  </h3>
                  <p className="text-xs text-slate-500">Patient: {showCreditSaleDetailModal.customerName}</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowCreditSaleDetailModal(null)}><X className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-2">Medication</th>
                    <th className="p-2">Batch #</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Price</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(showCreditSaleDetailModal.items || []).map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-2 font-medium text-slate-800 dark:text-slate-200">{item.productName}</td>
                      <td className="p-2 font-mono text-[10px] text-slate-500">{item.batchNumber}</td>
                      <td className="p-2 text-right">{item.quantity}</td>
                      <td className="p-2 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="p-2 text-right font-bold">{formatCurrency(item.unitPrice * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-bold text-slate-700">Total Invoiced:</span>
              <span className="font-bold text-sm text-brand-600">{formatCurrency(showCreditSaleDetailModal.invoicedTotal)}</span>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowCreditSaleDetailModal(null)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SalesHistoryPage;
