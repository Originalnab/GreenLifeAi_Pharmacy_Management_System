import React, { useState, useRef } from 'react';
import { 
  Users, Truck, Phone, Mail, MapPin, CreditCard, 
  AlertCircle, ShieldCheck, Search, Plus, X, LayoutGrid, Table, FileSpreadsheet, Send 
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { FloatingBulkActionBar } from '../../components/common/FloatingBulkActionBar';

export const PartiesPage: React.FC = () => {
  const { customers, suppliers, formatCurrency } = usePharmacy();
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<'ALL' | 'WITH_BALANCE' | 'ZERO_BALANCE'>('ALL');
  
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);

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

        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'customers' ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Patients & Customers ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'suppliers' ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Suppliers & Distributors ({suppliers.length})
          </button>
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
                    filteredCustomers.map((cust, index) => {
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
                                {index + 1}
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCustomers.map(cust => (
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
                    filteredSuppliers.map((sup, index) => {
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
                                {index + 1}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSuppliers.map(sup => (
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
        )
      )}
    </div>
  );
};
