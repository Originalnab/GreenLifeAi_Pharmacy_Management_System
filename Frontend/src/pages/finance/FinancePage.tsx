import React, { useState, useRef } from 'react';
import { 
  Wallet, DollarSign, Receipt, Building2, 
  CheckCircle2, AlertTriangle, Plus, X, ArrowUpRight, Search, FileSpreadsheet 
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { FloatingBulkActionBar } from '../../components/common/FloatingBulkActionBar';

export const FinancePage: React.FC = () => {
  const { 
    activeShift, shifts, openShift, closeShift, 
    expenses, addExpense, loans, recordLoanPayment, 
    currentUser, formatCurrency, currentCurrency 
  } = usePharmacy();
  const [activeTab, setActiveTab] = useState<'shifts' | 'expenses' | 'loans'>('shifts');

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

  // Expense modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expCategory, setExpCategory] = useState<'Rent' | 'Utilities' | 'Salaries' | 'Logistics' | 'Licenses' | 'Petty Cash' | 'Maintenance'>('Utilities');
  const [expAmount, setExpAmount] = useState('');
  const [expPayee, setExpPayee] = useState('');
  const [expNotes, setExpNotes] = useState('');

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = 
      exp.referenceNumber.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      exp.payee.toLowerCase().includes(expenseSearch.toLowerCase());
    const matchesCategory = expenseCategoryFilter === 'ALL' || exp.category === expenseCategoryFilter;
    return matchesSearch && matchesCategory;
  });

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

  // Handle Add Expense
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    addExpense({
      category: expCategory,
      amount: parseFloat(expAmount) || 0,
      expenseDate: new Date().toISOString().split('T')[0],
      payee: expPayee,
      paymentMethod: 'TRANSFER',
      referenceNumber: `EXP-${Date.now().toString().slice(-6)}`,
      notes: expNotes,
      approvedBy: currentUser.name
    });
    setShowExpenseModal(false);
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
                  {shifts.map((s, index) => {
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
                              {index + 1}
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
                <option value="ALL">All Categories</option>
                <option value="Rent">Rent</option>
                <option value="Utilities">Utilities</option>
                <option value="Salaries">Salaries</option>
                <option value="Logistics">Logistics</option>
                <option value="Licenses">Licenses</option>
                <option value="Petty Cash">Petty Cash</option>
                <option value="Maintenance">Maintenance</option>
              </select>

              <button
                onClick={() => setShowExpenseModal(true)}
                className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1"
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No expenses recorded matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp, index) => {
                      const isSelected = selectedExpenseIds.includes(exp.id);
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
                                {index + 1}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 font-mono font-bold text-brand-600">{exp.referenceNumber}</td>
                          <td className="p-3 text-slate-500">{exp.expenseDate}</td>
                          <td className="p-3 font-semibold">{exp.category}</td>
                          <td className="p-3">{exp.payee}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{formatCurrency(exp.amount)}</td>
                          <td className="p-3">{exp.paymentMethod}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">{exp.approvedBy}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
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
          {loans.map(loan => (
            <div key={loan.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row justify-between md:items-center border-b pb-3 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-brand-600" />
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">{loan.lenderName}</h3>
                  </div>
                  <p className="text-xs text-slate-500">Ref: {loan.facilityReference} • Annual Rate: {loan.annualInterestRate}% • Term: {loan.termMonths} Months</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Remaining Principal Balance</span>
                  <span className="text-lg font-extrabold text-brand-600 dark:text-brand-400">
                    {formatCurrency(loan.outstandingBalance)}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex justify-between text-xs text-slate-500 pb-1 font-semibold">
                  <span>Repaid: {formatCurrency(loan.totalPaid)}</span>
                  <span>Total Repayable: {formatCurrency(loan.totalRepayable)}</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${(loan.totalPaid / loan.totalRepayable) * 100}%` }}
                    className="h-full bg-gradient-to-r from-brand-500 to-clinical-500 rounded-full"
                  />
                </div>
              </div>

              {/* Installments Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-semibold text-slate-600 dark:text-slate-400">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Due Date</th>
                      <th className="p-2.5">Principal ({currentCurrency.symbol})</th>
                      <th className="p-2.5">Interest ({currentCurrency.symbol})</th>
                      <th className="p-2.5">Total Due ({currentCurrency.symbol})</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loan.schedule.map(inst => (
                      <tr key={inst.installmentNumber}>
                        <td className="p-2.5 font-bold">{inst.installmentNumber}</td>
                        <td className="p-2.5 font-medium">{inst.dueDate}</td>
                        <td className="p-2.5 font-mono">{formatCurrency(inst.principalDue)}</td>
                        <td className="p-2.5 font-mono">{formatCurrency(inst.interestDue)}</td>
                        <td className="p-2.5 font-bold font-mono">{formatCurrency(inst.totalDue)}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inst.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {inst.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-right">
                          {inst.status === 'PENDING' && (
                            <button
                              onClick={() => {
                                recordLoanPayment(loan.id, inst.installmentNumber);
                                alert(`Installment #${inst.installmentNumber} payment recorded! Outstanding principal updated.`);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shadow-sm"
                            >
                              Pay Now
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
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

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddExpense} className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border space-y-4">
            <h3 className="font-bold text-sm">Record Operating Expense</h3>
            <div className="text-xs space-y-2">
              <div>
                <label className="font-semibold block mb-1">Category</label>
                <select
                  value={expCategory}
                  onChange={e => setExpCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800"
                >
                  <option value="Utilities">Utilities (Power / Water)</option>
                  <option value="Logistics">Logistics & Cold Transport</option>
                  <option value="Rent">Rent & Facilities</option>
                  <option value="Licenses">Regulatory Licenses (PCN)</option>
                  <option value="Petty Cash">Petty Cash & Supplies</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Amount ({currentCurrency.symbol}) *</label>
                <input
                  type="number"
                  required
                  value={expAmount}
                  onChange={e => setExpAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-bold bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Payee / Vendor *</label>
                <input
                  type="text"
                  required
                  value={expPayee}
                  onChange={e => setExpPayee(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Notes</label>
                <textarea
                  value={expNotes}
                  onChange={e => setExpNotes(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 h-16"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button type="button" onClick={() => setShowExpenseModal(false)} className="px-3 py-1.5 border rounded-lg text-xs">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-bold shadow">
                Save Expense
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
