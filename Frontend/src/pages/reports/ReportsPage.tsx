import React, { useState, useMemo } from 'react';
import { 
  BarChart3, FileSpreadsheet, Printer, TrendingUp, DollarSign, 
  Package, AlertCircle, ShieldAlert, Boxes, Users, Truck, 
  Building2, CreditCard, Layers, ArrowUpRight, CheckCircle2, 
  FileText, Activity
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { ReportFilterBar, ReportFilterState } from './components/ReportFilterBar';
import { ReportPrintView } from './components/ReportPrintView';
import { downloadCSV, isDateWithinPeriod } from './utils/reportFilters';

// Sub-Tab Components
import { SalesSummaryReportTab } from './tabs/SalesSummaryReportTab';
import { StockValuationReportTab } from './tabs/StockValuationReportTab';
import { ProfitAndLossReportTab } from './tabs/ProfitAndLossReportTab';
import { PomRegisterReportTab } from './tabs/PomRegisterReportTab';
import { StocksReportTab } from './tabs/StocksReportTab';
import { SalesLedgerReportTab } from './tabs/SalesLedgerReportTab';
import { PurchasesReportTab } from './tabs/PurchasesReportTab';
import { SuppliersReportTab } from './tabs/SuppliersReportTab';
import { CreditsReportTab } from './tabs/CreditsReportTab';
import { LoansReportTab } from './tabs/LoansReportTab';
import { CustomersReportTab } from './tabs/CustomersReportTab';
import { UsersReportTab } from './tabs/UsersReportTab';

export type ReportTabId = 
  | 'sales_summary'
  | 'stock_valuation'
  | 'profit_loss'
  | 'pom_register'
  | 'stocks_expiry'
  | 'sales_shifts'
  | 'procurement_grn'
  | 'supplier_ap'
  | 'customer_ar'
  | 'loans_facilities'
  | 'customers_patients'
  | 'staff_users';

interface TabMeta {
  id: ReportTabId;
  label: string;
  category: 'Financial & Regulatory' | 'Operations & Ledgers';
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const REPORT_TABS: TabMeta[] = [
  // Group A: Financial & Regulatory
  { 
    id: 'sales_summary', 
    label: 'Sales & Revenue Summary', 
    category: 'Financial & Regulatory', 
    icon: TrendingUp,
    description: 'Realized gross sales, payment tender distribution, and transaction audit'
  },
  { 
    id: 'stock_valuation', 
    label: 'Stock Valuation & Margins', 
    category: 'Financial & Regulatory', 
    icon: Boxes,
    description: 'Inventory asset value at cost vs retail and weighted margin breakdown'
  },
  { 
    id: 'profit_loss', 
    label: 'P&L & Operating Expenses', 
    category: 'Financial & Regulatory', 
    icon: DollarSign,
    description: 'Net operating surplus, COGS reconciliation, and OPEX category disbursements'
  },
  { 
    id: 'pom_register', 
    label: 'POM & Controlled Drugs', 
    category: 'Financial & Regulatory', 
    icon: ShieldAlert,
    description: 'Official poison register, doctor licenses, and supervising pharmacist sign-offs'
  },

  // Group B: Operations & Domain Ledgers
  { 
    id: 'stocks_expiry', 
    label: 'Stocks & Batch Expiry', 
    category: 'Operations & Ledgers', 
    icon: Package,
    description: 'FEFO shelf-life runway, critical expiry buckets, and physical batch tracking'
  },
  { 
    id: 'sales_shifts', 
    label: 'Sales & Cashier Shifts', 
    category: 'Operations & Ledgers', 
    icon: Activity,
    description: 'Cash drawer balancing, cashier shift logs, and cash overages / shortages'
  },
  { 
    id: 'procurement_grn', 
    label: 'Procurement & GRN', 
    category: 'Operations & Ledgers', 
    icon: Truck,
    description: 'Purchase orders raised, supplier fulfillment rate, and pending deliveries'
  },
  { 
    id: 'supplier_ap', 
    label: 'Supplier AP Payables', 
    category: 'Operations & Ledgers', 
    icon: Building2,
    description: 'Distributor outstanding balances, credit terms, and accounts payable'
  },
  { 
    id: 'customer_ar', 
    label: 'Customer AR Credits', 
    category: 'Operations & Ledgers', 
    icon: CreditCard,
    description: 'Patient credit sales, 30/60/90+ day aging buckets, and debt recovery'
  },
  { 
    id: 'loans_facilities', 
    label: 'Loans & Facilities', 
    category: 'Operations & Ledgers', 
    icon: Layers,
    description: 'Disbursed business financing, interest liabilities, and amortization progress'
  },
  { 
    id: 'customers_patients', 
    label: 'Customers / Patients', 
    category: 'Operations & Ledgers', 
    icon: Users,
    description: 'Patient lifetime value, chronic care management, and spending tiers'
  },
  { 
    id: 'staff_users', 
    label: 'Staff & Users Audit', 
    category: 'Operations & Ledgers', 
    icon: FileText,
    description: 'Staff directory, role authorizations, cashier accounts, and security audit trail'
  },
];

export const ReportsPage: React.FC = () => {
  const { 
    sales, products, batches, expenses, loans, 
    suppliers, customers, shifts, purchaseOrders, 
    creditSales, users, formatCurrency, systemProfile 
  } = usePharmacy();

  const [activeTab, setActiveTab] = useState<ReportTabId>('sales_summary');
  const [filterState, setFilterState] = useState<ReportFilterState>({
    period: 'THIS_MONTH',
    searchQuery: '',
    viewMode: 'summary',
  });

  const activeTabMeta = useMemo(() => {
    return REPORT_TABS.find(t => t.id === activeTab) || REPORT_TABS[0];
  }, [activeTab]);

  // Generate dynamic CSV dataset & print view dataset for active tab
  const printAndCsvDataset = useMemo(() => {
    let title = activeTabMeta.label;
    let subtitle = activeTabMeta.description;
    let dateLabel = filterState.period.replace('_', ' ');
    if (filterState.period === 'CUSTOM' && filterState.startDate) {
      dateLabel = `${filterState.startDate} to ${filterState.endDate || 'Now'}`;
    }

    let summaryStats: Array<{ label: string; value: string }> = [];
    let tableHeaders: string[] = [];
    let tableRows: Array<Array<string | number>> = [];

    switch (activeTab) {
      case 'sales_summary': {
        const filtered = sales.filter(s => isDateWithinPeriod(s.createdAt, filterState.period, filterState.startDate, filterState.endDate));
        const total = filtered.reduce((acc, s) => acc + s.total, 0);
        summaryStats = [
          { label: 'Realized Revenue', value: formatCurrency(total) },
          { label: 'Total Receipts', value: `${filtered.length}` },
          { label: 'Avg Basket', value: formatCurrency(filtered.length > 0 ? total / filtered.length : 0) }
        ];
        tableHeaders = ['Receipt #', 'Date', 'Cashier', 'Customer', 'Tender', 'Total'];
        tableRows = filtered.map(s => [
          s.receiptNumber,
          new Date(s.createdAt).toLocaleDateString(),
          s.cashierName || 'Cashier',
          s.customerName || 'Walk-in',
          s.payments?.[0]?.method || (s as any).paymentTender || 'CASH',
          formatCurrency(s.total)
        ]);
        break;
      }
      case 'stock_valuation': {
        const costVal = batches.reduce((acc, b) => acc + ((b.costPrice ?? b.unitCost ?? 0) * (b.remainingStock ?? b.quantityOnHand ?? 0)), 0);
        const retailVal = batches.reduce((acc, b) => acc + ((b.sellingPrice ?? 0) * (b.remainingStock ?? b.quantityOnHand ?? 0)), 0);
        summaryStats = [
          { label: 'Asset Cost Value', value: formatCurrency(costVal) },
          { label: 'Retail Value', value: formatCurrency(retailVal) },
          { label: 'Unrealized Margin', value: formatCurrency(retailVal - costVal) }
        ];
        tableHeaders = ['Product Name', 'Category', 'Available Stock', 'Cost Price', 'Selling Price', 'Cost Value', 'Retail Value'];
        tableRows = products.map(p => {
          const pBatches = batches.filter(b => b.productId === p.id);
          const qty = pBatches.reduce((acc, b) => acc + (b.remainingStock ?? b.quantityOnHand ?? 0), 0);
          const cVal = qty * p.unitCost;
          const rVal = qty * p.sellingPrice;
          return [
            p.brandName,
            p.categoryName || 'General',
            qty,
            formatCurrency(p.unitCost),
            formatCurrency(p.sellingPrice),
            formatCurrency(cVal),
            formatCurrency(rVal)
          ];
        });
        break;
      }
      case 'profit_loss': {
        const filteredSales = sales.filter(s => isDateWithinPeriod(s.createdAt, filterState.period, filterState.startDate, filterState.endDate));
        const filteredExp = expenses.filter(e => isDateWithinPeriod(e.expenseDate, filterState.period, filterState.startDate, filterState.endDate));
        const rev = filteredSales.reduce((acc, s) => acc + s.total, 0);
        const exp = filteredExp.reduce((acc, e) => acc + e.amount, 0);
        summaryStats = [
          { label: 'Gross Revenue', value: formatCurrency(rev) },
          { label: 'Total OPEX', value: formatCurrency(exp) },
          { label: 'Net Income', value: formatCurrency(rev - exp) }
        ];
        tableHeaders = ['Voucher Date', 'Reference', 'Category', 'Payee', 'Method', 'Approved By', 'Amount'];
        tableRows = filteredExp.map(e => [
          new Date(e.expenseDate).toLocaleDateString(),
          e.referenceNumber || e.id,
          e.category,
          e.payee,
          e.paymentMethod,
          e.approvedBy,
          formatCurrency(e.amount)
        ]);
        break;
      }
      case 'pom_register': {
        const filtered = sales.filter(s => (s.hasPrescriptionDrugs || s.items?.some(i => i.isPrescriptionRequired) || s.prescription) && isDateWithinPeriod(s.createdAt, filterState.period, filterState.startDate, filterState.endDate));
        summaryStats = [
          { label: 'POM Prescriptions', value: `${filtered.length}` },
          { label: 'Supervising Pharmacist', value: systemProfile.superintendentName || 'Registered Pharmacist' },
          { label: 'Premises License', value: systemProfile.premisesLicense || 'PCN-APPROVED' }
        ];
        tableHeaders = ['Rx Ref', 'Date', 'Patient Name', 'Prescriber Doctor', 'License #', 'Hospital', 'Total Amount'];
        tableRows = filtered.map(s => [
          s.receiptNumber,
          new Date(s.createdAt).toLocaleDateString(),
          s.prescription?.patientName || s.customerName || 'Walk-in Patient',
          s.prescription?.prescriberName || 'Direct Dispensation',
          s.prescription?.prescriberLicense || 'LIC-EXEMPT',
          s.prescription?.hospitalClinic || 'Dispensary Outpatient',
          formatCurrency(s.total)
        ]);
        break;
      }
      case 'stocks_expiry': {
        tableHeaders = ['Batch #', 'Product', 'Expiry Date', 'Remaining Qty', 'Unit Cost', 'Location', 'Status'];
        tableRows = batches.map(b => [
          b.batchNumber,
          b.productName,
          new Date(b.expiryDate).toLocaleDateString(),
          b.remainingStock ?? b.quantityOnHand ?? 0,
          formatCurrency(b.costPrice ?? b.unitCost ?? 0),
          b.storageLocation || 'Main Shelf',
          b.status
        ]);
        break;
      }
      case 'sales_shifts': {
        const filtered = shifts.filter(s => isDateWithinPeriod(s.startTime, filterState.period, filterState.startDate, filterState.endDate));
        tableHeaders = ['Shift #', 'Cashier', 'Float', 'Cash Sales', 'Expected Cash', 'Counted Cash', 'Variance', 'Status'];
        tableRows = filtered.map(s => [
          s.shiftNumber,
          s.cashierName,
          formatCurrency(s.openingFloat || 0),
          formatCurrency(s.cashSales || 0),
          formatCurrency(s.expectedCash || 0),
          formatCurrency(s.countedCash ?? s.expectedCash ?? 0),
          formatCurrency(s.variance || 0),
          s.status
        ]);
        break;
      }
      case 'procurement_grn': {
        const filtered = purchaseOrders.filter(po => isDateWithinPeriod(po.createdAt, filterState.period, filterState.startDate, filterState.endDate));
        tableHeaders = ['PO Number', 'Supplier', 'Created Date', 'Items Qty', 'Approval', 'PO Status', 'Total Amount'];
        tableRows = filtered.map(po => [
          po.poNumber,
          po.supplierName,
          new Date(po.createdAt).toLocaleDateString(),
          po.items?.length || 0,
          po.approvalStatus || 'APPROVED',
          po.status,
          formatCurrency(po.totalAmount)
        ]);
        break;
      }
      case 'supplier_ap': {
        tableHeaders = ['Vendor Name', 'Code', 'Contact Person', 'Phone', 'Terms (Days)', 'Status', 'Outstanding AP'];
        tableRows = suppliers.map(s => [
          s.name,
          s.code,
          s.contactPerson,
          s.phone,
          s.paymentTermsDays || 30,
          s.status,
          formatCurrency(s.outstandingBalance)
        ]);
        break;
      }
      case 'customer_ar': {
        tableHeaders = ['Invoice #', 'Customer Name', 'Sale Date', 'Due Date', 'Total Amount', 'Paid', 'Balance Due', 'Status'];
        tableRows = creditSales.map(cs => [
          cs.invoiceNumber || cs.saleNumber,
          cs.customerName,
          new Date(cs.saleDate || cs.createdAt).toLocaleDateString(),
          new Date(cs.dueDate).toLocaleDateString(),
          formatCurrency(cs.totalAmount || cs.invoicedTotal || 0),
          formatCurrency(cs.paidAmount || 0),
          formatCurrency(cs.remainingBalance ?? cs.balanceDue ?? 0),
          cs.status
        ]);
        break;
      }
      case 'loans_facilities': {
        tableHeaders = ['Lender Name', 'Facility Ref', 'Principal', 'Interest Rate', 'Term', 'Monthly Due', 'Paid', 'Outstanding'];
        tableRows = loans.map(l => [
          l.lenderName,
          l.facilityReference,
          formatCurrency(l.principalAmount),
          `${l.annualInterestRate}%`,
          `${l.termMonths} Mos`,
          formatCurrency(l.monthlyInstallment),
          formatCurrency(l.totalPaid),
          formatCurrency(l.outstandingBalance)
        ]);
        break;
      }
      case 'customers_patients': {
        tableHeaders = ['Patient Name', 'Phone', 'Email', 'Chronic Profile', 'Credit Limit', 'Current Debt', 'Lifetime Spend'];
        tableRows = customers.map(c => [
          c.name,
          c.phone,
          c.email || 'N/A',
          c.chronicConditions?.join(', ') || 'General',
          formatCurrency(c.creditLimit || 0),
          formatCurrency(c.currentBalance || 0),
          formatCurrency(c.totalPurchases || 0)
        ]);
        break;
      }
      case 'staff_users': {
        tableHeaders = ['Staff Name', 'Username', 'Role', 'Branch', 'Email', 'License #', 'Status'];
        tableRows = users.map(u => [
          u.name,
          `@${u.username}`,
          u.role,
          u.branchName || 'Main Dispensary',
          u.email,
          u.licenseNumber || '—',
          u.active ? 'ACTIVE' : 'SUSPENDED'
        ]);
        break;
      }
      default:
        break;
    }

    return { title, subtitle, dateLabel, summaryStats, tableHeaders, tableRows };
  }, [activeTab, activeTabMeta, filterState, sales, products, batches, expenses, loans, suppliers, customers, shifts, purchaseOrders, creditSales, users, formatCurrency, systemProfile]);

  const handleExportCSV = () => {
    downloadCSV(
      `${activeTab}_report_${new Date().toISOString().slice(0, 10)}.csv`,
      printAndCsvDataset.tableHeaders,
      printAndCsvDataset.tableRows
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>Management Intelligence & Regulatory Analytics</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Authoritative clinical registries, asset valuation, P&L financial statements, and compliance audits
          </p>
        </div>

        {/* Global Action Badges */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>PCN / FDA Verified</span>
          </div>
        </div>
      </div>

      {/* Categorized Navigation Tabs */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Category A: Financial & Regulatory */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">
            Financials, Revenue & Regulatory Registers
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {REPORT_TABS.filter(t => t.category === 'Financial & Regulatory').map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                  activeTab === tab.id
                    ? 'bg-brand-50/80 border-brand-500 text-brand-900 dark:bg-brand-950/60 dark:border-brand-500 dark:text-brand-300 font-bold shadow-sm'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <tab.icon className={`w-4 h-4 mt-0.5 shrink-0 ${activeTab === tab.id ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
                <div className="min-w-0">
                  <span className="text-xs font-bold block truncate">{tab.label}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate font-normal">{tab.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Category B: Operations & Domain Ledgers */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">
            Operational Audits & Domain Ledgers
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2">
            {REPORT_TABS.filter(t => t.category === 'Operations & Ledgers').map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2 ${
                  activeTab === tab.id
                    ? 'bg-brand-50/80 border-brand-500 text-brand-900 dark:bg-brand-950/60 dark:border-brand-500 dark:text-brand-300 font-bold shadow-sm'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <tab.icon className={`w-4 h-4 mt-0.5 shrink-0 ${activeTab === tab.id ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
                <div className="min-w-0">
                  <span className="text-xs font-bold block truncate">{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modern Filter & View Mode Control Bar */}
      <ReportFilterBar
        filterState={filterState}
        onFilterChange={(updates) => setFilterState(prev => ({ ...prev, ...updates }))}
        onExportCSV={handleExportCSV}
        onPrint={handlePrint}
        title={activeTabMeta.label}
      />

      {/* Dynamic Tab Render */}
      <div className="bg-transparent">
        {activeTab === 'sales_summary' && <SalesSummaryReportTab filterState={filterState} />}
        {activeTab === 'stock_valuation' && <StockValuationReportTab filterState={filterState} />}
        {activeTab === 'profit_loss' && <ProfitAndLossReportTab filterState={filterState} />}
        {activeTab === 'pom_register' && <PomRegisterReportTab filterState={filterState} />}
        {activeTab === 'stocks_expiry' && <StocksReportTab filterState={filterState} />}
        {activeTab === 'sales_shifts' && <SalesLedgerReportTab filterState={filterState} />}
        {activeTab === 'procurement_grn' && <PurchasesReportTab filterState={filterState} />}
        {activeTab === 'supplier_ap' && <SuppliersReportTab filterState={filterState} />}
        {activeTab === 'customer_ar' && <CreditsReportTab filterState={filterState} />}
        {activeTab === 'loans_facilities' && <LoansReportTab filterState={filterState} />}
        {activeTab === 'customers_patients' && <CustomersReportTab filterState={filterState} />}
        {activeTab === 'staff_users' && <UsersReportTab filterState={filterState} />}
      </div>

      {/* Hidden Official Print Layout for Spooling & PDF Export */}
      <ReportPrintView
        reportTitle={printAndCsvDataset.title}
        reportSubtitle={printAndCsvDataset.subtitle}
        dateRangeLabel={printAndCsvDataset.dateLabel}
        summaryStats={printAndCsvDataset.summaryStats}
        tableHeaders={printAndCsvDataset.tableHeaders}
        tableRows={printAndCsvDataset.tableRows}
      />
    </div>
  );
};
