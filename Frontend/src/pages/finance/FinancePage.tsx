import React, { useState, useRef, useMemo } from 'react';
import { 
  Wallet, DollarSign, Receipt, Building2, 
  CheckCircle2, AlertTriangle, Plus, X, ArrowUpRight, Search, FileSpreadsheet,
  Smartphone, CreditCard, Banknote, Edit3, Trash2, Tag, Check, RefreshCw, Layers, FileText,
  Eye, Calendar, Percent, Clock
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Expense, BusinessLoan, LoanAmortizationSchedule } from '../../types';
import { FloatingBulkActionBar } from '../../components/common/FloatingBulkActionBar';
import { Pagination } from '../../components/common/Pagination';
import { usePagination } from '../../hooks/usePagination';

export const FinancePage: React.FC = () => {
  const { 
    activeShift, shifts, openShift, closeShift, 
    expenses, addExpense, updateExpense, deleteExpense, 
    loans, recordLoanPayment, addLoan, updateLoan, deleteLoan,
    addLoanInstallment, updateLoanInstallment, deleteLoanInstallment,
    currentUser, formatCurrency, currentCurrency,
    toast, confirmDialog
  } = usePharmacy();
  const [activeTab, setActiveTab] = useState<'shifts' | 'expenses' | 'loans'>('shifts');

  // Expense categories (customizable)
  const [customCategories, setCustomCategories] = useState<string[]>([
    'Utilities', 'Logistics', 'Rent', 'Salaries', 'Licenses', 'Petty Cash',
    'Maintenance', 'Marketing', 'Insurance', 'Packaging & Supplies',
    'IT & Software', 'Cleaning & Sanitation'
  ]);
  const [showAddCategoryInput, setShowAddCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Unified list of categories including those from existing expenses
  const allCategories = useMemo(() => {
    const set = new Set<string>(customCategories);
    expenses.forEach(e => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set);
  }, [customCategories, expenses]);

  // Expense search & filter
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('ALL');

  // Multi-row selection
  const [selectedShiftIds, setSelectedShiftIds] = useState<string[]>([]);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);

  // Shift modals
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [openingFloatInput, setOpeningFloatInput] = useState('25000');

  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [countedCashInput, setCountedCashInput] = useState('');
  const [varianceReasonInput, setVarianceReasonInput] = useState('');

  // Expense modal & form state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expCategory, setExpCategory] = useState<string>('Utilities');
  const [expAmount, setExpAmount] = useState('');
  const [expPayee, setExpPayee] = useState('');
  const [expPaymentMethod, setExpPaymentMethod] = useState<'CASH' | 'MOMO' | 'TRANSFER' | 'CARD' | 'CHEQUE'>('CASH');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expRefNumber, setExpRefNumber] = useState('');
  const [expNotes, setExpNotes] = useState('');

  // Loan Facility modal & form state
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [loanLenderName, setLoanLenderName] = useState('');
  const [loanFacilityRef, setLoanFacilityRef] = useState('');
  const [loanPrincipal, setLoanPrincipal] = useState('500000');
  const [loanInterestRate, setLoanInterestRate] = useState('14.5');
  const [loanTermMonths, setLoanTermMonths] = useState('12');
  const [loanStartDate, setLoanStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Installment modal & form state
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [installmentLoanId, setInstallmentLoanId] = useState<string | null>(null);
  const [editingInstallmentNumber, setEditingInstallmentNumber] = useState<number | null>(null);
  const [instNumber, setInstNumber] = useState<number>(1);
  const [instDueDate, setInstDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [instPrincipal, setInstPrincipal] = useState('');
  const [instInterest, setInstInterest] = useState('');
  const [instTotalDue, setInstTotalDue] = useState('');
  const [instStatus, setInstStatus] = useState<'PAID' | 'PENDING' | 'OVERDUE'>('PENDING');
  const [instPaidAmount, setInstPaidAmount] = useState('');
  const [instPaidDate, setInstPaidDate] = useState('');

  // View Installment Details
  const [viewingInstallment, setViewingInstallment] = useState<{ loan: BusinessLoan; installment: LoanAmortizationSchedule } | null>(null);

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = 
      exp.referenceNumber.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      exp.payee.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      (exp.paymentMethod && exp.paymentMethod.toLowerCase().includes(expenseSearch.toLowerCase()));
    const matchesCategory = expenseCategoryFilter === 'ALL' || exp.category === expenseCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Pagination
  const {
    currentPage: shiftsPage,
    setCurrentPage: setShiftsPage,
    paginatedItems: paginatedShifts
  } = usePagination(shifts, 10);

  const {
    currentPage: expensesPage,
    setCurrentPage: setExpensesPage,
    paginatedItems: paginatedExpenses
  } = usePagination(filteredExpenses, 10, [expenseSearch, expenseCategoryFilter]);

  const {
    currentPage: loansPage,
    setCurrentPage: setLoansPage,
    paginatedItems: paginatedLoans
  } = usePagination(loans, 10);

  // Shifts selection
  const isAllShiftsSelected = shifts.length > 0 && shifts.every(s => selectedShiftIds.includes(s.id));
  const isSomeShiftsSelected = shifts.some(s => selectedShiftIds.includes(s.id)) && !isAllShiftsSelected;

  const toggleSelectAllShifts = () => {
    if (isAllShiftsSelected) {
      setSelectedShiftIds([]);
    } else {
      setSelectedShiftIds(shifts.map(s => s.id));
    }
  };

  const toggleSelectShift = (id: string) => {
    setSelectedShiftIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Expenses selection
  const isAllExpensesSelected = filteredExpenses.length > 0 && filteredExpenses.every(e => selectedExpenseIds.includes(e.id));
  const isSomeExpensesSelected = filteredExpenses.some(e => selectedExpenseIds.includes(e.id)) && !isAllExpensesSelected;

  const toggleSelectAllExpenses = () => {
    if (isAllExpensesSelected) {
      setSelectedExpenseIds([]);
    } else {
      setSelectedExpenseIds(filteredExpenses.map(e => e.id));
    }
  };

  const toggleSelectExpense = (id: string) => {
    setSelectedExpenseIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleExportExpensesCSV = () => {
    const targets = expenses.filter(e => selectedExpenseIds.includes(e.id));
    if (targets.length === 0) return;
    const headers = ['Reference #', 'Date', 'Category', 'Payee / Vendor', 'Amount', 'Payment Mode', 'Approved By'];
    const rows = targets.map(e => [
      `"${e.referenceNumber}"`,
      `"${e.expenseDate}"`,
      `"${e.category}"`,
      `"${e.payee}"`,
      e.amount,
      `"${e.paymentMethod}"`,
      `"${e.approvedBy}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `expenses_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  // Handle Open Shift
  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    openShift(parseFloat(openingFloatInput) || 0);
    setShowOpenShiftModal(false);
  };

  // Handle Close Shift
  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    const counted = parseFloat(countedCashInput) || 0;
    closeShift(counted, varianceReasonInput);
    setShowCloseShiftModal(false);
  };

  // Open Add Expense modal
  const handleOpenAddExpense = () => {
    setEditingExpenseId(null);
    setExpCategory('Utilities');
    setExpAmount('');
    setExpPayee('');
    setExpPaymentMethod('CASH');
    setExpDate(new Date().toISOString().split('T')[0]);
    setExpRefNumber(`EXP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`);
    setExpNotes('');
    setShowAddCategoryInput(false);
    setNewCategoryName('');
    setShowExpenseModal(true);
  };

  // Open Edit Expense modal
  const handleOpenEditExpense = (exp: Expense) => {
    setEditingExpenseId(exp.id);
    setExpCategory(exp.category);
    setExpAmount(String(exp.amount));
    setExpPayee(exp.payee);
    setExpPaymentMethod((exp.paymentMethod as any) || 'CASH');
    setExpDate(exp.expenseDate || new Date().toISOString().split('T')[0]);
    setExpRefNumber(exp.referenceNumber);
    setExpNotes(exp.notes || '');
    setShowAddCategoryInput(false);
    setNewCategoryName('');
    setShowExpenseModal(true);
  };

  // Save Expense (Create or Update)
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expAmount) || 0;
    if (amt <= 0) {
      toast.warning('Please enter a valid expense amount greater than 0.', 'Amount Required');
      return;
    }
    if (!expPayee.trim()) {
      toast.warning('Please enter a payee or vendor name.', 'Payee Required');
      return;
    }

    if (editingExpenseId) {
      updateExpense(editingExpenseId, {
        category: expCategory,
        amount: amt,
        expenseDate: expDate,
        payee: expPayee.trim(),
        paymentMethod: expPaymentMethod,
        referenceNumber: expRefNumber.trim() || `EXP-${Date.now().toString().slice(-6)}`,
        notes: expNotes
      });
    } else {
      addExpense({
        category: expCategory,
        amount: amt,
        expenseDate: expDate,
        payee: expPayee.trim(),
        paymentMethod: expPaymentMethod,
        referenceNumber: expRefNumber.trim() || `EXP-${Date.now().toString().slice(-6)}`,
        notes: expNotes,
        approvedBy: currentUser.name
      });
      toast.success('Expense voucher recorded successfully!', 'Expense Saved');
    }
    setShowExpenseModal(false);
  };

  // Delete Expense
  const handleDeleteExpense = async (id: string, ref: string) => {
    const confirmed = await confirmDialog({
      title: 'Delete Expense Voucher',
      message: `Are you sure you want to permanently delete expense voucher "${ref}"?`,
      description: 'This will remove the disbursement record from accounting ledgers.',
      confirmText: 'Delete Voucher',
      variant: 'danger'
    });
    if (confirmed) {
      deleteExpense(id);
      setSelectedExpenseIds(prev => prev.filter(item => item !== id));
      toast.success(`Expense voucher "${ref}" deleted successfully.`, 'Expense Deleted');
    }
  };

  // Add custom category
  const handleCreateCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const name = newCategoryName.trim();
    if (!customCategories.includes(name)) {
      setCustomCategories(prev => [...prev, name]);
    }
    setExpCategory(name);
    setNewCategoryName('');
    setShowAddCategoryInput(false);
  };

  // --- LOAN & INSTALLMENT HANDLERS ---
  const handleOpenAddLoan = () => {
    setEditingLoanId(null);
    setLoanLenderName('');
    setLoanFacilityRef(`FAC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setLoanPrincipal('15000000');
    setLoanInterestRate('14.5');
    setLoanTermMonths('12');
    setLoanStartDate(new Date().toISOString().split('T')[0]);
    setShowLoanModal(true);
  };

  const handleOpenEditLoan = (loan: BusinessLoan) => {
    setEditingLoanId(loan.id);
    setLoanLenderName(loan.lenderName);
    setLoanFacilityRef(loan.facilityReference);
    setLoanPrincipal(String(loan.principalAmount));
    setLoanInterestRate(String(loan.annualInterestRate));
    setLoanTermMonths(String(loan.termMonths));
    setLoanStartDate(loan.startDate);
    setShowLoanModal(true);
  };

  const handleSaveLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const principal = parseFloat(loanPrincipal) || 0;
    const rate = parseFloat(loanInterestRate) || 0;
    const term = parseInt(loanTermMonths, 10) || 12;

    if (!loanLenderName.trim()) {
      toast.warning('Please enter lender or facility name.', 'Lender Required');
      return;
    }
    if (principal <= 0) {
      toast.warning('Principal amount must be greater than 0.', 'Principal Required');
      return;
    }

    if (editingLoanId) {
      updateLoan(editingLoanId, {
        lenderName: loanLenderName.trim(),
        facilityReference: loanFacilityRef.trim(),
        principalAmount: principal,
        annualInterestRate: rate,
        termMonths: term,
        startDate: loanStartDate
      });
    } else {
      const monthlyRate = (rate / 100) / 12;
      let monthlyPmt = 0;
      if (monthlyRate > 0) {
        monthlyPmt = (principal * monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
      } else {
        monthlyPmt = principal / term;
      }
      monthlyPmt = Math.round(monthlyPmt * 100) / 100;

      let remaining = principal;
      const start = new Date(loanStartDate);
      const schedule: LoanAmortizationSchedule[] = [];

      for (let i = 1; i <= term; i++) {
        const dueDateObj = new Date(start);
        dueDateObj.setMonth(dueDateObj.getMonth() + i);
        const dueDate = dueDateObj.toISOString().split('T')[0];

        const interestDue = Math.round(remaining * monthlyRate * 100) / 100;
        let principalDue = Math.round((monthlyPmt - interestDue) * 100) / 100;
        if (i === term) {
          principalDue = remaining;
          monthlyPmt = principalDue + interestDue;
        }
        remaining = Math.max(0, remaining - principalDue);

        schedule.push({
          installmentNumber: i,
          dueDate,
          principalDue,
          interestDue,
          totalDue: Math.round((principalDue + interestDue) * 100) / 100,
          paidAmount: 0,
          status: 'PENDING'
        });
      }

      const totalRepayable = schedule.reduce((sum, s) => sum + s.totalDue, 0);

      addLoan({
        lenderName: loanLenderName.trim(),
        facilityReference: loanFacilityRef.trim() || `FAC-${Date.now().toString().slice(-6)}`,
        principalAmount: principal,
        annualInterestRate: rate,
        termMonths: term,
        startDate: loanStartDate,
        maturityDate: schedule[schedule.length - 1]?.dueDate || loanStartDate,
        monthlyInstallment: monthlyPmt,
        totalRepayable,
        totalPaid: 0,
        outstandingBalance: totalRepayable,
        status: 'ACTIVE',
        schedule
      });
    }
    setShowLoanModal(false);
  };

  const handleDeleteLoan = async (loanId: string, lenderName: string) => {
    const confirmed = await confirmDialog({
      title: 'Delete Loan Facility',
      message: `Are you sure you want to permanently delete the loan facility "${lenderName}" and all associated installment schedules?`,
      description: 'This will purge all remaining amortization entries for this lender.',
      confirmText: 'Delete Loan Facility',
      variant: 'danger'
    });
    if (confirmed) {
      deleteLoan(loanId);
      toast.success(`Loan facility "${lenderName}" deleted successfully.`, 'Facility Deleted');
    }
  };

  const handleOpenAddInstallment = (loan: BusinessLoan) => {
    setInstallmentLoanId(loan.id);
    setEditingInstallmentNumber(null);
    const nextNum = loan.schedule.length > 0 ? Math.max(...loan.schedule.map(s => s.installmentNumber)) + 1 : 1;
    setInstNumber(nextNum);
    
    let nextDate = new Date().toISOString().split('T')[0];
    if (loan.schedule.length > 0) {
      const last = loan.schedule[loan.schedule.length - 1];
      const d = new Date(last.dueDate);
      d.setMonth(d.getMonth() + 1);
      nextDate = d.toISOString().split('T')[0];
    }
    setInstDueDate(nextDate);

    const estTotal = loan.monthlyInstallment || (loan.principalAmount / (loan.termMonths || 12));
    setInstTotalDue(estTotal.toFixed(2));
    setInstStatus('PENDING');
    setInstPaidAmount('');
    setInstPaidDate('');
    setShowInstallmentModal(true);
  };

  const handleOpenEditInstallment = (loan: BusinessLoan, inst: LoanAmortizationSchedule) => {
    setInstallmentLoanId(loan.id);
    setEditingInstallmentNumber(inst.installmentNumber);
    setInstNumber(inst.installmentNumber);
    setInstDueDate(inst.dueDate);
    setInstPrincipal(String(inst.principalDue));
    setInstInterest(String(inst.interestDue));
    setInstTotalDue(String(inst.totalDue));
    setInstStatus(inst.status);
    setInstPaidAmount(String(inst.paidAmount || inst.totalDue));
    setInstPaidDate(inst.paidDate || new Date().toISOString().split('T')[0]);
    setShowInstallmentModal(true);
  };

  const handleSaveInstallment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!installmentLoanId) return;

    const total = parseFloat(instTotalDue) || 0;
    if (total <= 0) {
      toast.warning('Total due amount must be greater than 0.', 'Invalid Installment Amount');
      return;
    }
    const payload: Omit<LoanAmortizationSchedule, 'id'> = {
      installmentNumber: instNumber,
      dueDate: instDueDate,
      principalDue: total * 0.85,
      interestDue: total * 0.15,
      totalDue: total,
      status: instStatus,
      paidAmount: instStatus === 'PAID' ? (parseFloat(instPaidAmount) || total) : 0,
      paidDate: instStatus === 'PAID' ? (instPaidDate || new Date().toISOString().split('T')[0]) : undefined
    };

    if (editingInstallmentNumber !== null) {
      updateLoanInstallment(installmentLoanId, editingInstallmentNumber, payload);
      toast.success(`Installment #${instNumber} updated.`, 'Installment Saved');
    } else {
      addLoanInstallment(installmentLoanId, payload);
      toast.success(`Installment #${instNumber} added to amortization schedule.`, 'Installment Added');
    }

    setShowInstallmentModal(false);
  };

  const handleDeleteInstallment = async (loanId: string, instNum: number) => {
    const confirmed = await confirmDialog({
      title: 'Remove Installment',
      message: `Are you sure you want to remove Installment #${instNum}?`,
      description: 'This will adjust remaining amortization schedules.',
      confirmText: 'Remove Installment',
      variant: 'danger'
    });
    if (confirmed) {
      deleteLoanInstallment(loanId, instNum);
      toast.success(`Installment #${instNum} removed.`, 'Installment Removed');
    }
  };

  const handleMarkInstallmentPaidFromView = (loanId: string, instNum: number) => {
    recordLoanPayment(loanId, instNum);
    toast.success(`Installment #${instNum} recorded as paid.`, 'Payment Recorded');
    if (viewingInstallment) {
      setViewingInstallment({
        ...viewingInstallment,
        installment: {
          ...viewingInstallment.installment,
          status: 'PAID',
          paidAmount: viewingInstallment.installment.totalDue,
          paidDate: new Date().toISOString().split('T')[0]
        }
      });
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Wallet className="w-5 h-5 text-brand-600" />
            <span>Financial Operations, Shifts & Business Loans</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cashier shift reconciliation, petty cash disbursements, and bank facility loan schedules.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('shifts')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'shifts' ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Cashier Shifts
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'expenses' ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Operating Expenses
          </button>
          <button
            onClick={() => setActiveTab('loans')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'loans' ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Business Loans & Facilities
          </button>
        </div>
      </div>

      {/* TAB 1: SHIFTS */}
      {activeTab === 'shifts' && (
        <div className="space-y-4">
          {/* Active Shift Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  {activeShift ? 'Shift In Progress' : 'No Shift Currently Open'}
                </span>
              </div>
              <h3 className="text-xl font-extrabold mt-1">
                {activeShift ? activeShift.shiftNumber : 'Register Closed'}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {activeShift 
                  ? `Cashier: ${activeShift.cashierName} • Started: ${activeShift.startTime} • Float: ${formatCurrency(activeShift.openingFloat)}` 
                  : 'Start a cashier shift to begin logging retail sales transactions.'}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {!activeShift ? (
                <button
                  onClick={() => setShowOpenShiftModal(true)}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow transition"
                >
                  Open New Shift
                </button>
              ) : (
                <button
                  onClick={() => {
                    setCountedCashInput(activeShift.expectedCash.toString());
                    setShowCloseShiftModal(true);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow transition"
                >
                  End Shift & Blind Count
                </button>
              )}
            </div>
          </div>

          {/* Historical Shifts Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 font-bold text-xs">
              Shift Reconciliation History
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-semibold text-slate-600 dark:text-slate-400 select-none">
                  <tr>
                    <th className="p-3 w-16 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <input
                          ref={el => {
                            if (el) el.indeterminate = isSomeShiftsSelected;
                          }}
                          type="checkbox"
                          checked={isAllShiftsSelected}
                          onChange={toggleSelectAllShifts}
                          className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                          title="Select All"
                        />
                        <span className="font-mono text-[11px] text-slate-400">#</span>
                      </div>
                    </th>
                    <th className="p-3">Shift #</th>
                    <th className="p-3">Cashier</th>
                    <th className="p-3">Opening Float</th>
                    <th className="p-3">Cash Sales</th>
                    <th className="p-3">Card / Transfer</th>
                    <th className="p-3">Expected Cash</th>
                    <th className="p-3">Counted Cash</th>
                    <th className="p-3">Variance</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedShifts.map((s, index) => {
                    const isSelected = selectedShiftIds.includes(s.id);
                    return (
                      <tr 
                        key={s.id}
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
                              onChange={() => toggleSelectShift(s.id)}
                              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                            />
                            <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 w-5 text-right">
                              {(shiftsPage - 1) * 10 + index + 1}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold text-brand-600">{s.shiftNumber}</td>
                        <td className="p-3 font-semibold">{s.cashierName}</td>
                        <td className="p-3 font-mono">{formatCurrency(s.openingFloat)}</td>
                        <td className="p-3 font-mono">{formatCurrency(s.cashSales)}</td>
                        <td className="p-3 font-mono">{formatCurrency(s.cardSales + s.transferSales)}</td>
                        <td className="p-3 font-mono font-bold">{formatCurrency(s.expectedCash)}</td>
                        <td className="p-3 font-mono font-bold">
                          {s.countedCash !== undefined ? formatCurrency(s.countedCash) : '-'}
                        </td>
                        <td className="p-3 font-bold font-mono">
                          {s.variance !== undefined ? (
                            s.variance === 0 ? <span className="text-emerald-600">{formatCurrency(0)}</span> : <span className="text-rose-600">{formatCurrency(s.variance)}</span>
                          ) : '-'}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.status === 'OPEN' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={shiftsPage}
              totalItems={shifts.length}
              pageSize={10}
              onPageChange={setShiftsPage}
            />
          </div>
        </div>
      )}

      {/* TAB 2: EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={expenseSearch}
                onChange={e => setExpenseSearch(e.target.value)}
                placeholder="Search expense ref, payee..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={expenseCategoryFilter}
                onChange={e => setExpenseCategoryFilter(e.target.value)}
                className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Categories ({allCategories.length})</option>
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <button
                onClick={handleOpenAddExpense}
                className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Expense</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-semibold text-slate-600 dark:text-slate-400 select-none">
                  <tr>
                    <th className="p-3 w-16 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <input
                          ref={el => {
                            if (el) el.indeterminate = isSomeExpensesSelected;
                          }}
                          type="checkbox"
                          checked={isAllExpensesSelected}
                          onChange={toggleSelectAllExpenses}
                          className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                          title="Select All"
                        />
                        <span className="font-mono text-[11px] text-slate-400">#</span>
                      </div>
                    </th>
                    <th className="p-3">Reference #</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Payee / Vendor</th>
                    <th className="p-3">Amount ({currentCurrency.symbol})</th>
                    <th className="p-3">Payment Mode</th>
                    <th className="p-3">Approved By</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        No expenses recorded matching criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedExpenses.map((exp, index) => {
                      const isSelected = selectedExpenseIds.includes(exp.id);
                      const paymentMethod = (exp.paymentMethod || 'CASH').toUpperCase();
                      
                      return (
                        <tr 
                          key={exp.id}
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
                                onChange={() => toggleSelectExpense(exp.id)}
                                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                              />
                              <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 w-5 text-right">
                                {(expensesPage - 1) * 10 + index + 1}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 font-mono font-bold text-brand-600 dark:text-brand-400">{exp.referenceNumber}</td>
                          <td className="p-3 text-slate-500 dark:text-slate-400">{exp.expenseDate}</td>
                          <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-medium border border-slate-200/60 dark:border-slate-700/60">
                              {exp.category}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{exp.payee}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white font-mono">{formatCurrency(exp.amount)}</td>
                          <td className="p-3">
                            {paymentMethod === 'MOMO' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                                <Smartphone className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                <span>MoMo</span>
                              </span>
                            )}
                            {paymentMethod === 'TRANSFER' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                                <Building2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                <span>Bank Transfer</span>
                              </span>
                            )}
                            {paymentMethod === 'CARD' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                                <CreditCard className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                <span>Card / POS</span>
                              </span>
                            )}
                            {paymentMethod === 'CHEQUE' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                                <FileText className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                                <span>Cheque</span>
                              </span>
                            )}
                            {paymentMethod !== 'MOMO' && paymentMethod !== 'TRANSFER' && paymentMethod !== 'CARD' && paymentMethod !== 'CHEQUE' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                                <Banknote className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span>Cash</span>
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">{exp.approvedBy}</td>
                          <td className="p-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => handleOpenEditExpense(exp)}
                                title="Edit Expense"
                                className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(exp.id, exp.referenceNumber)}
                                title="Delete Expense"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
              currentPage={expensesPage}
              totalItems={filteredExpenses.length}
              pageSize={10}
              onPageChange={setExpensesPage}
            />
          </div>

          <FloatingBulkActionBar
            selectedCount={selectedExpenseIds.length}
            totalCount={filteredExpenses.length}
            onClearSelection={() => setSelectedExpenseIds([])}
            actions={[
              {
                label: 'Export Expenses CSV',
                icon: FileSpreadsheet,
                onClick: handleExportExpensesCSV,
                variant: 'secondary'
              }
            ]}
          />
        </div>
      )}

      {/* TAB 3: BUSINESS LOANS */}
      {activeTab === 'loans' && (
        <div className="space-y-4">
          {/* Summary & Controls Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-brand-600" />
                <span>Business Loans & Credit Facilities</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track commercial bank financing, repayment schedules, interest allocations, and installment records.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleOpenAddLoan}
                className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ New Loan Facility</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Active Debt Balance</span>
              <span className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">
                {formatCurrency(loans.reduce((acc, l) => acc + (l.status === 'ACTIVE' ? l.outstandingBalance : 0), 0))}
              </span>
            </div>
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Principal Repaid</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {formatCurrency(loans.reduce((acc, l) => acc + l.totalPaid, 0))}
              </span>
            </div>
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Active Bank Facilities</span>
              <span className="text-lg font-black text-brand-600 dark:text-brand-400">
                {loans.filter(l => l.status === 'ACTIVE').length} Active
              </span>
            </div>
          </div>

          {loans.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No active business loan facilities registered.</p>
              <button
                onClick={handleOpenAddLoan}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Register Your First Facility
              </button>
            </div>
          ) : (
            paginatedLoans.map(loan => {
              const repayPercent = loan.totalRepayable > 0 
                ? Math.min(100, Math.round((loan.totalPaid / loan.totalRepayable) * 100))
                : 0;

              return (
                <div key={loan.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  {/* Facility Header */}
                  <div className="flex flex-col md:flex-row justify-between md:items-center border-b border-slate-100 dark:border-slate-800 pb-3 gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-brand-600 shrink-0" />
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">{loan.lenderName}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          loan.status === 'PAID_OFF'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}>
                          {loan.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Ref: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{loan.facilityReference}</span> • Annual Rate: {loan.annualInterestRate}% • Term: {loan.termMonths} Months • Started: {loan.startDate}
                      </p>
                    </div>

                    <div className="flex items-center justify-between md:justify-end space-x-4">
                      <div className="text-right">
                        <span className="text-[11px] text-slate-500 block">Remaining Principal Balance</span>
                        <span className="text-lg font-black text-brand-600 dark:text-brand-400 font-mono">
                          {formatCurrency(loan.outstandingBalance)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 pl-3 border-l border-slate-200 dark:border-slate-700">
                        <button
                          onClick={() => handleOpenAddInstallment(loan)}
                          className="px-2.5 py-1.5 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/40 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 rounded-lg text-xs font-bold flex items-center space-x-1 transition"
                          title="Add Installment Record"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Installment</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditLoan(loan)}
                          className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title="Edit Facility Details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLoan(loan.id, loan.lenderName)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                          title="Delete Facility"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 pb-1.5 font-semibold">
                      <span>Repaid: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(loan.totalPaid)}</strong> ({repayPercent}%)</span>
                      <span>Total Repayable: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(loan.totalRepayable)}</strong></span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${repayPercent}%` }}
                        className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Installments Table */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/70 uppercase font-semibold text-slate-600 dark:text-slate-400">
                          <tr>
                            <th className="p-2.5 w-12 text-center">#</th>
                            <th className="p-2.5">Due Date</th>
                            <th className="p-2.5">Principal ({currentCurrency.symbol})</th>
                            <th className="p-2.5">Interest ({currentCurrency.symbol})</th>
                            <th className="p-2.5">Total Due ({currentCurrency.symbol})</th>
                            <th className="p-2.5">Status</th>
                            <th className="p-2.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {loan.schedule.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-6 text-center text-slate-400">
                                No installment records found. Click "+ Installment" to add the first record.
                              </td>
                            </tr>
                          ) : (
                            loan.schedule.map(inst => (
                              <tr 
                                key={inst.installmentNumber}
                                className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                              >
                                <td className="p-2.5 font-bold text-center text-slate-500 dark:text-slate-400">
                                  {inst.installmentNumber}
                                </td>
                                <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">
                                  {inst.dueDate}
                                </td>
                                <td className="p-2.5 font-mono text-slate-700 dark:text-slate-300">
                                  {formatCurrency(inst.principalDue)}
                                </td>
                                <td className="p-2.5 font-mono text-slate-700 dark:text-slate-300">
                                  {formatCurrency(inst.interestDue)}
                                </td>
                                <td className="p-2.5 font-bold font-mono text-slate-900 dark:text-white">
                                  {formatCurrency(inst.totalDue)}
                                </td>
                                <td className="p-2.5">
                                  {inst.status === 'PAID' && (
                                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                      <span>PAID</span>
                                    </span>
                                  )}
                                  {inst.status === 'PENDING' && (
                                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                      <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                      <span>PENDING</span>
                                    </span>
                                  )}
                                  {inst.status === 'OVERDUE' && (
                                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                      <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                      <span>OVERDUE</span>
                                    </span>
                                  )}
                                </td>
                                <td className="p-2.5 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end space-x-1.5">
                                    {inst.status !== 'PAID' && (
                                      <button
                                        onClick={() => {
                                          recordLoanPayment(loan.id, inst.installmentNumber);
                                          toast.success(`Installment #${inst.installmentNumber} payment recorded! Outstanding principal updated.`, 'Payment Recorded');
                                        }}
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shadow-sm transition"
                                      >
                                        Pay Now
                                      </button>
                                    )}

                                    <button
                                      onClick={() => setViewingInstallment({ loan, installment: inst })}
                                      title="View Installment Voucher"
                                      className="p-1 text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() => handleOpenEditInstallment(loan, inst)}
                                      title="Edit Installment Record"
                                      className="p-1 text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() => handleDeleteInstallment(loan.id, inst.installmentNumber)}
                                      title="Delete Installment"
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {loans.length > 0 && (
            <Pagination
              currentPage={loansPage}
              totalItems={loans.length}
              pageSize={10}
              onPageChange={setLoansPage}
            />
          )}
        </div>
      )}

      {/* Open Shift Modal */}
      {showOpenShiftModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleOpenShift} className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border space-y-4">
            <h3 className="font-bold text-sm">Open Cashier Register Shift</h3>
            <div className="text-xs">
              <label className="font-semibold block mb-1">Declared Opening Float Cash ({currentCurrency.symbol})</label>
              <input
                type="number"
                value={openingFloatInput}
                onChange={e => setOpeningFloatInput(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-base font-bold bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button type="button" onClick={() => setShowOpenShiftModal(false)} className="px-3 py-1.5 border rounded-lg text-xs">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-bold">
                Confirm & Open
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Close Shift Modal */}
      {showCloseShiftModal && activeShift && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCloseShift} className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border space-y-4">
            <h3 className="font-bold text-sm">Shift Blind Count & Close</h3>
            <div className="text-xs space-y-3">
              <div>
                <label className="font-semibold block mb-1">Physical Counted Cash in Drawer ({currentCurrency.symbol}) *</label>
                <input
                  type="number"
                  value={countedCashInput}
                  onChange={e => setCountedCashInput(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-base font-bold bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Variance Explanation Note</label>
                <textarea
                  value={varianceReasonInput}
                  onChange={e => setVarianceReasonInput(e.target.value)}
                  placeholder="e.g. Small denomination change shortage rounded..."
                  className="w-full p-2 border rounded-lg text-xs bg-slate-50 dark:bg-slate-800 h-16"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button type="button" onClick={() => setShowCloseShiftModal(false)} className="px-3 py-1.5 border rounded-lg text-xs">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold shadow">
                Reconcile & Close
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add / Edit Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form 
            onSubmit={handleSaveExpense} 
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-8"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-400">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {editingExpenseId ? 'Edit Operating Expense Voucher' : 'Record Operating Expense'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Log operational disbursements, vendor payments, or petty cash.
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowExpenseModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-3.5">
              {/* Category selector + Custom Category Adder */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Expense Category *
                  </label>
                  {!showAddCategoryInput && (
                    <button
                      type="button"
                      onClick={() => setShowAddCategoryInput(true)}
                      className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Custom Category</span>
                    </button>
                  )}
                </div>

                {showAddCategoryInput ? (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-brand-200 dark:border-brand-900/60 space-y-2 mb-2">
                    <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Add a new custom expense category:
                    </p>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        autoFocus
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        placeholder="e.g. Generator Fuel, Audit Fees, Internet..."
                        className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateCustomCategory(e);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleCreateCustomCategory}
                        className="px-2.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-sm"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddCategoryInput(false);
                          setNewCategoryName('');
                        }}
                        className="px-2 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs hover:bg-slate-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <select
                    value={expCategory}
                    onChange={e => setExpCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    {allCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Payment Mode Selector */}
              <div>
                <label className="font-semibold block mb-1.5 text-slate-700 dark:text-slate-300">
                  Payment Mode / Channel *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setExpPaymentMethod('CASH')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      expPaymentMethod === 'CASH'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpPaymentMethod('MOMO')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      expPaymentMethod === 'MOMO'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-700 dark:text-amber-300 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Mobile Money</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpPaymentMethod('TRANSFER')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      expPaymentMethod === 'TRANSFER'
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Bank Transfer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpPaymentMethod('CARD')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      expPaymentMethod === 'CARD'
                        ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-700 dark:text-purple-300 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span>Card / POS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpPaymentMethod('CHEQUE')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      expPaymentMethod === 'CHEQUE'
                        ? 'bg-slate-100 dark:bg-slate-800 border-slate-500 text-slate-900 dark:text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0" />
                    <span>Bank Cheque</span>
                  </button>
                </div>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Amount ({currentCurrency.symbol}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={expAmount}
                    onChange={e => setExpAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-bold font-mono text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={e => setExpDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Payee / Vendor & Reference Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Payee / Vendor / Beneficiary *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ECG Power, CalBank, Landlord..."
                    value={expPayee}
                    onChange={e => setExpPayee(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Voucher / Reference #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. EXP-202609-001"
                    value={expRefNumber}
                    onChange={e => setExpRefNumber(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Notes / Purpose / Breakdown
                </label>
                <textarea
                  value={expNotes}
                  onChange={e => setExpNotes(e.target.value)}
                  placeholder="Additional details, invoice number, or breakdown of expenses..."
                  className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 h-16 focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button 
                type="button" 
                onClick={() => setShowExpenseModal(false)} 
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all"
              >
                {editingExpenseId ? 'Update Expense Voucher' : 'Save Expense Voucher'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loan Facility Modal */}
      {showLoanModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form 
            onSubmit={handleSaveLoan} 
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-8"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {editingLoanId ? 'Edit Loan Facility' : 'Register New Business Loan Facility'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Commercial bank debt, equipment financing, or credit facility.
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowLoanModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Lender / Financial Institution Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Access Bank Plc (Commercial Pharmacy SME Facility)"
                  value={loanLenderName}
                  onChange={e => setLoanLenderName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Facility Reference / Agreement # *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ABL-SME-2026-9042"
                  value={loanFacilityRef}
                  onChange={e => setLoanFacilityRef(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Principal Amount ({currentCurrency.symbol}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={loanPrincipal}
                    onChange={e => setLoanPrincipal(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-bold font-mono text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Annual Interest Rate (%) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={loanInterestRate}
                    onChange={e => setLoanInterestRate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-bold font-mono text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Term (Months) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={loanTermMonths}
                    onChange={e => setLoanTermMonths(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Facility Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={loanStartDate}
                    onChange={e => setLoanStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              {!editingLoanId && (
                <div className="p-3 bg-brand-50/70 dark:bg-brand-950/40 rounded-xl border border-brand-200 dark:border-brand-900/60 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <p className="font-bold text-brand-700 dark:text-brand-300">
                    Automatic Amortization Schedule:
                  </p>
                  <p>
                    Saving will auto-generate {loanTermMonths || 12} monthly installment records with calculated principal and interest breakdown. You can inspect and edit each installment individually at any time.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button 
                type="button" 
                onClick={() => setShowLoanModal(false)} 
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-md transition-all"
              >
                {editingLoanId ? 'Update Loan Facility' : 'Create Loan Facility'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Installment Record Modal */}
      {showInstallmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form 
            onSubmit={handleSaveInstallment} 
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-8"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {editingInstallmentNumber !== null ? `Edit Installment Record #${instNumber}` : 'Add Installment Record'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Schedule due date, principal, interest, and payment status.
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowInstallmentModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Installment # *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={instNumber}
                    onChange={e => setInstNumber(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 border rounded-lg font-bold font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={instDueDate}
                    onChange={e => setInstDueDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Principal ({currentCurrency.symbol}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={instPrincipal}
                    onChange={e => {
                      const p = e.target.value;
                      setInstPrincipal(p);
                      const pNum = parseFloat(p) || 0;
                      const iNum = parseFloat(instInterest) || 0;
                      setInstTotalDue(String(Math.round((pNum + iNum) * 100) / 100));
                    }}
                    className="w-full px-3 py-2 border rounded-lg font-mono font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Interest ({currentCurrency.symbol}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={instInterest}
                    onChange={e => {
                      const i = e.target.value;
                      setInstInterest(i);
                      const pNum = parseFloat(instPrincipal) || 0;
                      const iNum = parseFloat(i) || 0;
                      setInstTotalDue(String(Math.round((pNum + iNum) * 100) / 100));
                    }}
                    className="w-full px-3 py-2 border rounded-lg font-mono font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Total Due ({currentCurrency.symbol}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={instTotalDue}
                  onChange={e => setInstTotalDue(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono font-bold text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Status Selector */}
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Payment Status *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setInstStatus('PENDING')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                      instStatus === 'PENDING'
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-700 dark:text-amber-300 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    PENDING
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setInstStatus('PAID');
                      if (!instPaidAmount || instPaidAmount === '0') {
                        setInstPaidAmount(instTotalDue);
                      }
                      if (!instPaidDate) {
                        setInstPaidDate(new Date().toISOString().split('T')[0]);
                      }
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                      instStatus === 'PAID'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    PAID
                  </button>

                  <button
                    type="button"
                    onClick={() => setInstStatus('OVERDUE')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                      instStatus === 'OVERDUE'
                        ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    OVERDUE
                  </button>
                </div>
              </div>

              {instStatus === 'PAID' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                      Paid Amount ({currentCurrency.symbol}) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={instPaidAmount}
                      onChange={e => setInstPaidAmount(e.target.value)}
                      className="w-full px-2.5 py-1.5 border rounded-lg font-mono font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                      Date Paid *
                    </label>
                    <input
                      type="date"
                      value={instPaidDate}
                      onChange={e => setInstPaidDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button 
                type="button" 
                onClick={() => setShowInstallmentModal(false)} 
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-md transition-all"
              >
                {editingInstallmentNumber !== null ? 'Update Installment' : 'Save Installment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Installment Voucher Modal */}
      {viewingInstallment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-400">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Installment #{viewingInstallment.installment.installmentNumber} Voucher
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {viewingInstallment.loan.lenderName}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setViewingInstallment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <div>
                  <span className="text-[11px] text-slate-500 block">Facility Ref</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{viewingInstallment.loan.facilityReference}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Status</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    viewingInstallment.installment.status === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : viewingInstallment.installment.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                  }`}>
                    {viewingInstallment.installment.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <span className="text-[11px] text-slate-500 block">Due Date</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{viewingInstallment.installment.dueDate}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <span className="text-[11px] text-slate-500 block">Paid Date</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    {viewingInstallment.installment.paidDate || 'Not yet paid'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Principal Allocation:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatCurrency(viewingInstallment.installment.principalDue)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Interest Allocation:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatCurrency(viewingInstallment.installment.interestDue)}
                  </span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between items-center text-sm font-black">
                  <span className="text-slate-900 dark:text-white">Total Installment Due:</span>
                  <span className="font-mono text-brand-600 dark:text-brand-400">
                    {formatCurrency(viewingInstallment.installment.totalDue)}
                  </span>
                </div>
                {viewingInstallment.installment.status === 'PAID' && (
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <span>Amount Paid:</span>
                    <span className="font-mono">{formatCurrency(viewingInstallment.installment.paidAmount || viewingInstallment.installment.totalDue)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                {viewingInstallment.installment.status !== 'PAID' && (
                  <button
                    onClick={() => handleMarkInstallmentPaidFromView(viewingInstallment.loan.id, viewingInstallment.installment.installmentNumber)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
                  >
                    Pay Now
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const l = viewingInstallment.loan;
                    const inst = viewingInstallment.installment;
                    setViewingInstallment(null);
                    handleOpenEditInstallment(l, inst);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  Edit Record
                </button>
                <button
                  onClick={() => setViewingInstallment(null)}
                  className="px-4 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-bold shadow"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
