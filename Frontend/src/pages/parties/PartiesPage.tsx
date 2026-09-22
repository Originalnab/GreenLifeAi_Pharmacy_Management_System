import React, { useState, useRef } from 'react';
import { 
  Users, Truck, Phone, Mail, MapPin, CreditCard, 
  AlertCircle, ShieldCheck, Search, Plus, X, LayoutGrid, Table, FileSpreadsheet, Send,
  RefreshCw, UserPlus, HeartPulse, Tag, ShieldAlert, Building2, CheckCircle2
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { FloatingBulkActionBar } from '../../components/common/FloatingBulkActionBar';
import { Pagination } from '../../components/common/Pagination';
import { usePagination } from '../../hooks/usePagination';

export const PartiesPage: React.FC = () => {
  const { customers, suppliers, formatCurrency, addCustomer, addSupplier, toast } = usePharmacy();
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<'ALL' | 'WITH_BALANCE' | 'ZERO_BALANCE'>('ALL');
  
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);

  // Modals state
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);

  // Auto ID generators
  const generateCustomerId = () => `CUST-2026-${Math.floor(100 + Math.random() * 900)}`;
  const generateSupplierCode = (name?: string) => {
    let prefix = 'SUP';
    if (name) {
      const clean = name.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 4);
      if (clean.length >= 3) prefix = clean;
    }
    return `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
  };

  // Add Customer Form State
  const [custForm, setCustForm] = useState({
    id: generateCustomerId(),
    name: '',
    phone: '',
    email: '',
    address: '',
    dateOfBirth: '1990-01-01',
    creditLimit: '1000',
    currentBalance: '0',
    allergiesText: '',
    chronicText: ''
  });

  // Add Supplier Form State
  const [supForm, setSupForm] = useState({
    code: generateSupplierCode(),
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    paymentTermsDays: 30,
    outstandingBalance: 0.00
  });

  const handleOpenAddCustomer = () => {
    setCustForm({
      id: generateCustomerId(),
      name: '',
      phone: '',
      email: '',
      address: '',
      dateOfBirth: '1990-01-01',
      creditLimit: '1000',
      currentBalance: '0',
      allergiesText: '',
      chronicText: ''
    });
    setShowAddCustomerModal(true);
  };

  const handleOpenAddSupplier = () => {
    setSupForm({
      code: generateSupplierCode(),
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      paymentTermsDays: 30,
      outstandingBalance: 0.00
    });
    setShowAddSupplierModal(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custForm.name.trim() || !custForm.phone.trim()) {
      toast.warning('Please enter customer full name and phone number.', 'Required Fields');
      return;
    }

    const allergies = custForm.allergiesText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const chronicConditions = custForm.chronicText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    addCustomer({
      id: custForm.id,
      name: custForm.name.trim(),
      phone: custForm.phone.trim(),
      email: custForm.email.trim() || undefined,
      address: custForm.address.trim() || undefined,
      dateOfBirth: custForm.dateOfBirth,
      creditLimit: Number(custForm.creditLimit) || 0,
      currentBalance: Number(custForm.currentBalance) || 0,
      allergies,
      chronicConditions,
      receivablesAgeing: {
        current: Number(custForm.currentBalance) || 0,
        days30: 0,
        days60: 0,
        days90Plus: 0
      },
      totalPurchases: 0
    });

    toast.success(`Customer ${custForm.name} registered successfully with ID ${custForm.id}!`, 'Customer Registered');
    setShowAddCustomerModal(false);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supForm.name.trim() || !supForm.phone.trim()) {
      toast.warning('Please enter supplier company name and phone number.', 'Required Fields');
      return;
    }

    addSupplier({
      id: `sup_${Date.now()}`,
      code: supForm.code.trim().toUpperCase(),
      name: supForm.name.trim(),
      contactPerson: supForm.contactPerson.trim() || 'Purchasing Contact',
      phone: supForm.phone.trim(),
      email: supForm.email.trim() || 'vendor@pharma.com',
      address: supForm.address.trim() || 'Industrial Estate, Hub',
      paymentTermsDays: Number(supForm.paymentTermsDays) || 30,
      outstandingBalance: Number(supForm.outstandingBalance) || 0,
      status: 'ACTIVE'
    });

    toast.success(`Supplier ${supForm.name} registered with Code ${supForm.code}!`, 'Supplier Registered');
    setShowAddSupplierModal(false);
  };


  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm);
    const matchesBalance = 
      balanceFilter === 'ALL' ||
      (balanceFilter === 'WITH_BALANCE' && c.currentBalance > 0) ||
      (balanceFilter === 'ZERO_BALANCE' && c.currentBalance === 0);
    return matchesSearch && matchesBalance;
  });

  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBalance = 
      balanceFilter === 'ALL' ||
      (balanceFilter === 'WITH_BALANCE' && s.outstandingBalance > 0) ||
      (balanceFilter === 'ZERO_BALANCE' && s.outstandingBalance === 0);
    return matchesSearch && matchesBalance;
  });

  const {
    currentPage: customersPage,
    setCurrentPage: setCustomersPage,
    paginatedItems: paginatedCustomers,
  } = usePagination(filteredCustomers, 10, [searchTerm, balanceFilter]);

  const {
    currentPage: suppliersPage,
    setCurrentPage: setSuppliersPage,
    paginatedItems: paginatedSuppliers,
  } = usePagination(filteredSuppliers, 10, [searchTerm, balanceFilter]);

  // Customer selection
  const isAllCustomersSelected = filteredCustomers.length > 0 && filteredCustomers.every(c => selectedCustomerIds.includes(c.id));
  const isSomeCustomersSelected = filteredCustomers.some(c => selectedCustomerIds.includes(c.id)) && !isAllCustomersSelected;

  const toggleSelectAllCustomers = () => {
    if (isAllCustomersSelected) {
      setSelectedCustomerIds([]);
    } else {
      setSelectedCustomerIds(filteredCustomers.map(c => c.id));
    }
  };

  const toggleSelectCustomer = (id: string) => {
    setSelectedCustomerIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Supplier selection
  const isAllSuppliersSelected = filteredSuppliers.length > 0 && filteredSuppliers.every(s => selectedSupplierIds.includes(s.id));
  const isSomeSuppliersSelected = filteredSuppliers.some(s => selectedSupplierIds.includes(s.id)) && !isAllSuppliersSelected;

  const toggleSelectAllSuppliers = () => {
    if (isAllSuppliersSelected) {
      setSelectedSupplierIds([]);
    } else {
      setSelectedSupplierIds(filteredSuppliers.map(s => s.id));
    }
  };

  const toggleSelectSupplier = (id: string) => {
    setSelectedSupplierIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleExportCustomersCSV = () => {
    const targets = customers.filter(c => selectedCustomerIds.includes(c.id));
    if (targets.length === 0) return;
    const headers = ['Name', 'Phone', 'Credit Limit', 'Current AR Balance', 'Allergies', 'Chronic Conditions'];
    const rows = targets.map(c => [
      `"${c.name}"`,
      `"${c.phone}"`,
      c.creditLimit,
      c.currentBalance,
      `"${c.allergies?.join('; ') || 'None'}"`,
      `"${c.chronicConditions?.join('; ') || 'None'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `customers_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleExportSuppliersCSV = () => {
    const targets = suppliers.filter(s => selectedSupplierIds.includes(s.id));
    if (targets.length === 0) return;
    const headers = ['Name', 'Code', 'Contact Person', 'Phone', 'Address', 'Terms (Days)', 'AP Outstanding Balance', 'Status'];
    const rows = targets.map(s => [
      `"${s.name}"`,
      `"${s.code}"`,
      `"${s.contactPerson}"`,
      `"${s.phone}"`,
      `"${s.address}"`,
      s.paymentTermsDays,
      s.outstandingBalance,
      s.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `suppliers_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-brand-600" />
            <span>Customers, Patient Profiles & Suppliers</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Credit limits, receivables ageing (AR), chronic allergy warnings, and supplier accounts payable (AP).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'customers' ? (
            <button
              onClick={handleOpenAddCustomer}
              className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center space-x-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add Patient / Customer</span>
            </button>
          ) : (
            <button
              onClick={handleOpenAddSupplier}
              className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center space-x-1.5"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>+ Add Supplier / Distributor</span>
            </button>
          )}

          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'customers' ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-sm font-bold' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Patients & Customers ({customers.length})
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'suppliers' ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-sm font-bold' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Suppliers & Distributors ({suppliers.length})
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          {/* Balance Filter */}
          <select
            value={balanceFilter}
            onChange={e => setBalanceFilter(e.target.value as any)}
            className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Balances</option>
            <option value="WITH_BALANCE">Has Outstanding Balance</option>
            <option value="ZERO_BALANCE">Zero Balance (Cleared)</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-white dark:bg-slate-900 shadow text-brand-600' : 'text-slate-400'}`}
              title="Table View"
            >
              <Table className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded ${viewMode === 'cards' ? 'bg-white dark:bg-slate-900 shadow text-brand-600' : 'text-slate-400'}`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* CUSTOMERS TAB */}
      {activeTab === 'customers' && (
        viewMode === 'table' ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800 select-none">
                  <tr>
                    <th className="p-3 w-16 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <input
                          ref={el => {
                            if (el) el.indeterminate = isSomeCustomersSelected;
                          }}
                          type="checkbox"
                          checked={isAllCustomersSelected}
                          onChange={toggleSelectAllCustomers}
                          className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                          title="Select All"
                        />
                        <span className="font-mono text-[11px] text-slate-400">#</span>
                      </div>
                    </th>
                    <th className="p-3">Patient / Customer Name</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Account Type</th>
                    <th className="p-3">Credit Limit</th>
                    <th className="p-3">Current Balance (AR)</th>
                    <th className="p-3">Clinical Flags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No customer records matching criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedCustomers.map((cust, index) => {
                      const isSelected = selectedCustomerIds.includes(cust.id);
                      return (
                        <tr 
                          key={cust.id}
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
                                onChange={() => toggleSelectCustomer(cust.id)}
                                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                              />
                              <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 w-5 text-right">
                                {(customersPage - 1) * 10 + index + 1}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{cust.name}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-300 font-mono">{cust.phone}</td>
                          <td className="p-3">
                            {cust.creditLimit > 0 ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                Credit Approved
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800">
                                Retail Cash
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono">{cust.creditLimit > 0 ? formatCurrency(cust.creditLimit) : '—'}</td>
                          <td className={`p-3 font-mono font-bold ${cust.currentBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
                            {formatCurrency(cust.currentBalance)}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {cust.allergies && cust.allergies.length > 0 && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 font-semibold">
                                  Allergy: {cust.allergies.join(', ')}
                                </span>
                              )}
                              {cust.chronicConditions && cust.chronicConditions.length > 0 && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200">
                                  {cust.chronicConditions.join(', ')}
                                </span>
                              )}
                              {!cust.allergies?.length && !cust.chronicConditions?.length && (
                                <span className="text-slate-400 text-[11px]">None recorded</span>
                              )}
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
              currentPage={customersPage}
              totalItems={filteredCustomers.length}
              pageSize={10}
              onPageChange={setCustomersPage}
              itemName="customers"
            />

            {/* Bulk Actions for Customers */}
            <FloatingBulkActionBar
              selectedCount={selectedCustomerIds.length}
              totalCount={filteredCustomers.length}
              onClearSelection={() => setSelectedCustomerIds([])}
              actions={[
                {
                  label: 'Export CSV',
                  icon: FileSpreadsheet,
                  onClick: handleExportCustomersCSV,
                  variant: 'secondary'
                }
              ]}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginatedCustomers.map(cust => (
                <div key={cust.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{cust.name}</h4>
                      <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{cust.phone}</span>
                      </p>
                    </div>
                    {cust.creditLimit > 0 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        Credit Approved
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800">
                        Retail Cash
                      </span>
                    )}
                  </div>

                  {(cust.allergies || cust.chronicConditions) && (
                    <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-900 dark:text-amber-300 text-[11px] space-y-1">
                      {cust.allergies && cust.allergies.length > 0 && (
                        <p><span className="font-bold text-rose-600">Allergies:</span> {cust.allergies.join(', ')}</p>
                      )}
                      {cust.chronicConditions && cust.chronicConditions.length > 0 && (
                        <p><span className="font-bold">Chronic:</span> {cust.chronicConditions.join(', ')}</p>
                      )}
                    </div>
                  )}

                  {cust.creditLimit > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Credit Limit:</span>
                        <span className="font-bold">{formatCurrency(cust.creditLimit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Current Balance (AR):</span>
                        <span className="font-bold text-rose-600">{formatCurrency(cust.currentBalance)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                        <span>Current: {formatCurrency(cust.receivablesAgeing.current)}</span>
                        <span>30+ Days: {formatCurrency(cust.receivablesAgeing.days30)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <Pagination
                currentPage={customersPage}
                totalItems={filteredCustomers.length}
                pageSize={10}
                onPageChange={setCustomersPage}
                itemName="customers"
              />
            </div>
          </div>
        )
      )}

      {/* SUPPLIERS TAB */}
      {activeTab === 'suppliers' && (
        viewMode === 'table' ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800 select-none">
                  <tr>
                    <th className="p-3 w-16 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <input
                          ref={el => {
                            if (el) el.indeterminate = isSomeSuppliersSelected;
                          }}
                          type="checkbox"
                          checked={isAllSuppliersSelected}
                          onChange={toggleSelectAllSuppliers}
                          className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                          title="Select All"
                        />
                        <span className="font-mono text-[11px] text-slate-400">#</span>
                      </div>
                    </th>
                    <th className="p-3">Supplier Name</th>
                    <th className="p-3">Code</th>
                    <th className="p-3">Contact Person</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Payment Terms</th>
                    <th className="p-3">AP Outstanding Balance</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No supplier records matching criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedSuppliers.map((sup, index) => {
                      const isSelected = selectedSupplierIds.includes(sup.id);
                      return (
                        <tr 
                          key={sup.id}
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
                                onChange={() => toggleSelectSupplier(sup.id)}
                                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                              />
                              <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 w-5 text-right">
                                {(suppliersPage - 1) * 10 + index + 1}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{sup.name}</td>
                          <td className="p-3 font-mono font-bold text-brand-600">{sup.code}</td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">{sup.contactPerson}</td>
                          <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{sup.phone}</td>
                          <td className="p-3 font-medium">{sup.paymentTermsDays} Days Net</td>
                          <td className="p-3 font-mono font-bold text-rose-600 dark:text-rose-400">
                            {formatCurrency(sup.outstandingBalance)}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              {sup.status}
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
              currentPage={suppliersPage}
              totalItems={filteredSuppliers.length}
              pageSize={10}
              onPageChange={setSuppliersPage}
              itemName="suppliers"
            />

            <FloatingBulkActionBar
              selectedCount={selectedSupplierIds.length}
              totalCount={filteredSuppliers.length}
              onClearSelection={() => setSelectedSupplierIds([])}
              actions={[
                {
                  label: 'Export Suppliers CSV',
                  icon: FileSpreadsheet,
                  onClick: handleExportSuppliersCSV,
                  variant: 'secondary'
                }
              ]}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedSuppliers.map(sup => (
                <div key={sup.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{sup.name}</h4>
                      <span className="text-xs font-mono font-bold text-brand-600">{sup.code}</span>
                      <p className="text-xs text-slate-500 mt-1">{sup.address}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {sup.status}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block">Contact:</span>
                      <span className="font-semibold">{sup.contactPerson}</span>
                      <span className="text-[11px] text-slate-400 block">{sup.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Payment Terms:</span>
                      <span className="font-semibold">{sup.paymentTermsDays} Days Net</span>
                      <span className="text-[11px] text-rose-600 font-bold block">
                        AP: {formatCurrency(sup.outstandingBalance)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <Pagination
                currentPage={suppliersPage}
                totalItems={filteredSuppliers.length}
                pageSize={10}
                onPageChange={setSuppliersPage}
                itemName="suppliers"
              />
            </div>
          </div>
        )
      )}
      {/* MODAL 1: ADD PATIENT / CUSTOMER */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveCustomer} className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                  <UserPlus className="w-5 h-5 text-brand-600" />
                  <span>Register Patient / Customer Profile</span>
                </h3>
                <p className="text-xs text-slate-500">Create patient clinical file, credit limit facility, and allergy safety registry</p>
              </div>
              <button type="button" onClick={() => setShowAddCustomerModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* ID & Full Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Customer ID <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="text"
                      required
                      value={custForm.id}
                      onChange={e => setCustForm({ ...custForm, id: e.target.value })}
                      className="w-full px-2.5 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-mono font-bold text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setCustForm({ ...custForm, id: generateCustomerId() })}
                      title="Re-roll ID"
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">✓ Auto-Generated ID</span>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Full Patient / Customer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Kwame Mensah / Madam Grace Kufuor"
                    value={custForm.name}
                    onChange={e => setCustForm({ ...custForm, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 font-bold focus:ring-2 focus:ring-brand-500 text-xs"
                  />
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +233 24 123 4567 / 0244123456"
                    value={custForm.phone}
                    onChange={e => setCustForm({ ...custForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-brand-500 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="patient@gmail.com"
                    value={custForm.email}
                    onChange={e => setCustForm({ ...custForm, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 text-xs"
                  />
                </div>
              </div>

              {/* Address & Date of Birth */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Physical Address / Community
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. House 14, East Legon, Accra"
                    value={custForm.address}
                    onChange={e => setCustForm({ ...custForm, address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={custForm.dateOfBirth}
                    onChange={e => setCustForm({ ...custForm, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 text-xs font-medium"
                  />
                </div>
              </div>

              {/* Credit Limit & Initial Balance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-brand-50/60 dark:bg-brand-950/30 rounded-xl border border-brand-100 dark:border-brand-900/50">
                <div>
                  <label className="font-semibold block mb-1 text-brand-900 dark:text-brand-200">
                    Credit Limit Facility (GH₵)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={custForm.creditLimit}
                    onChange={e => setCustForm({ ...custForm, creditLimit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 font-bold font-mono text-brand-700 dark:text-brand-300 text-xs"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Max allowable credit purchase at POS</span>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-brand-900 dark:text-brand-200">
                    Opening AR Debt Balance (GH₵)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={custForm.currentBalance}
                    onChange={e => setCustForm({ ...custForm, currentBalance: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 font-bold font-mono text-slate-800 dark:text-white text-xs"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Existing balance owed before onboarding</span>
                </div>
              </div>

              {/* Drug Allergies */}
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Drug Allergy Warnings (Comma-separated)</span>
                  <span className="text-[10px] text-rose-500 font-bold flex items-center space-x-1">
                    <ShieldAlert className="w-3 h-3" />
                    <span>Clinical Alert Tagging</span>
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Sulfa drugs, Aspirin, Codeine"
                  value={custForm.allergiesText}
                  onChange={e => setCustForm({ ...custForm, allergiesText: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 text-xs"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {['Penicillin', 'Sulfa drugs', 'Aspirin', 'Cephalosporins'].map(allergy => (
                    <button
                      key={allergy}
                      type="button"
                      onClick={() => {
                        const current = custForm.allergiesText ? custForm.allergiesText.split(',').map(s => s.trim()) : [];
                        if (!current.includes(allergy)) {
                          setCustForm({ ...custForm, allergiesText: [...current, allergy].join(', ') });
                        }
                      }}
                      className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded text-[10px] font-semibold border border-rose-200 dark:border-rose-900"
                    >
                      + {allergy}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chronic Conditions */}
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Chronic Medical Conditions (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hypertension, Type 2 Diabetes, Asthma, Sickle Cell"
                  value={custForm.chronicText}
                  onChange={e => setCustForm({ ...custForm, chronicText: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 text-xs"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {['Hypertension', 'Type 2 Diabetes', 'Asthma', 'Glaucoma'].map(cond => (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => {
                        const current = custForm.chronicText ? custForm.chronicText.split(',').map(s => s.trim()) : [];
                        if (!current.includes(cond)) {
                          setCustForm({ ...custForm, chronicText: [...current, cond].join(', ') });
                        }
                      }}
                      className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded text-[10px] font-semibold border border-blue-200 dark:border-blue-900"
                    >
                      + {cond}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Patient Profile</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: ADD SUPPLIER / DISTRIBUTOR */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveSupplier} className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-brand-600" />
                  <span>Register Pharmaceutical Supplier Vendor</span>
                </h3>
                <p className="text-xs text-slate-500">Accredit authorized wholesale distributors, credit terms, and accounts payable</p>
              </div>
              <button type="button" onClick={() => setShowAddSupplierModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Code & Company Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Supplier Code <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="text"
                      required
                      value={supForm.code}
                      onChange={e => setSupForm({ ...supForm, code: e.target.value.toUpperCase() })}
                      className="w-full px-2.5 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-mono font-bold text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setSupForm({ ...supForm, code: generateSupplierCode(supForm.name) })}
                      title="Re-roll Code"
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">✓ Auto-Generated Code</span>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Company / Distributor Enterprise Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MegaCare Pharmaceuticals Ltd"
                    value={supForm.name}
                    onChange={e => {
                      const name = e.target.value;
                      setSupForm({ ...supForm, name });
                    }}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 font-bold focus:ring-2 focus:ring-brand-500 text-xs"
                  />
                </div>
              </div>

              {/* Contact Person & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Primary Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mr. Ernest Kwarteng"
                    value={supForm.contactPerson}
                    onChange={e => setSupForm({ ...supForm, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-brand-500 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+233 30 223 8810"
                    value={supForm.phone}
                    onChange={e => setSupForm({ ...supForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-brand-500 text-xs"
                  />
                </div>
              </div>

              {/* Email & Physical Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Dispatch Email
                  </label>
                  <input
                    type="email"
                    placeholder="orders@megacare.com"
                    value={supForm.email}
                    onChange={e => setSupForm({ ...supForm, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Warehouse Address / Depot
                  </label>
                  <input
                    type="text"
                    placeholder="Industrial Area, Spintex Road, Accra"
                    value={supForm.address}
                    onChange={e => setSupForm({ ...supForm, address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 text-xs"
                  />
                </div>
              </div>

              {/* Payment Terms & AP Balance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="font-semibold block mb-1 text-slate-800 dark:text-slate-200">
                    Agreed Payment Terms (Days Net) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={supForm.paymentTermsDays}
                    onChange={e => setSupForm({ ...supForm, paymentTermsDays: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 font-bold text-xs"
                  >
                    <option value={7}>7 Days (Weekly Settlement)</option>
                    <option value={14}>14 Days (Bi-weekly Settlement)</option>
                    <option value={30}>30 Days (Standard Net Terms)</option>
                    <option value={45}>45 Days (Extended Net Terms)</option>
                    <option value={60}>60 Days (Wholesale Consignment)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-800 dark:text-slate-200">
                    Opening AP Outstanding Balance (GH₵)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={supForm.outstandingBalance}
                    onChange={e => setSupForm({ ...supForm, outstandingBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 font-bold font-mono text-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Existing debt owed to supplier</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowAddSupplierModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Supplier Vendor</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
