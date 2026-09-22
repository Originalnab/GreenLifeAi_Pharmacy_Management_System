import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, DollarSign, Receipt, ShoppingCart, 
  Calendar, Filter, Clock, ChevronRight, User, 
  ArrowUpRight, ArrowDownRight, CreditCard, Smartphone,
  Banknote, RefreshCw, Eye, Printer, Package, Sparkles,
  Award, CheckCircle2, FileText, Search, Lock
} from 'lucide-react';
import { usePharmacy } from '../../../context/PharmacyContext';
import { defaultSensitiveControls } from '../../../data/mock/users';
import { Sale, CartItem } from '../../../types';

interface SalesPersonDashboardProps {
  onNavigate: (tab: string) => void;
}

type DateFilterPreset = 'today' | 'yesterday' | 'week' | 'month' | 'last30' | 'year' | 'custom';

export const SalesPersonDashboard: React.FC<SalesPersonDashboardProps> = ({ onNavigate }) => {
  const { 
    currentUser, 
    sales, 
    draftSales, 
    formatCurrency, 
    currentCurrency, 
    activeShift,
    products,
    roleSensitiveControls,
    getUserAuthorization
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

  const [salesScopeFilter, setSalesScopeFilter] = useState<'ALL' | 'OWN'>('OWN');
  const effectiveScope = hasExplicitAllSalesPermission ? salesScopeFilter : 'OWN';

  // Helper to extract readable payment tender methods
  const getSalePaymentSummary = (sale: Sale): string => {
    if (sale.payments && sale.payments.length > 0) {
      return sale.payments.map(p => p.method).join(', ');
    }
    return 'CASH';
  };

  // Date Filter State
  const [filterPreset, setFilterPreset] = useState<DateFilterPreset>('today');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Filter sales based on active scope
  const myAllSales = useMemo(() => {
    if (effectiveScope === 'ALL') {
      return sales;
    }
    return sales.filter(s => {
      const matchId = s.cashierId && s.cashierId === currentUser.id;
      const matchName = s.cashierName && (
        s.cashierName.toLowerCase() === currentUser.name.toLowerCase() ||
        s.cashierName.toLowerCase() === currentUser.username.toLowerCase()
      );
      return matchId || matchName;
    });
  }, [sales, currentUser, effectiveScope]);

  // Fallback: If no personal sales match this user yet, check if currentUser has role Sales Person or Cashier
  const effectiveSalesPool = myAllSales.length > 0 ? myAllSales : (effectiveScope === 'ALL' ? sales : []);

  // 2. Filter sales by selected date range
  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay() || 7;
    startOfWeek.setDate(startOfWeek.getDate() - day + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return effectiveSalesPool.filter(s => {
      if (!s.createdAt) return false;
      const sDate = new Date(s.createdAt);
      const sDateStr = s.createdAt.slice(0, 10);

      switch (filterPreset) {
        case 'today':
          return sDateStr === todayStr;
        case 'yesterday':
          return sDateStr === yesterdayStr;
        case 'week':
          return sDate >= startOfWeek;
        case 'month':
          return sDate >= startOfMonth;
        case 'last30':
          return sDate >= thirtyDaysAgo;
        case 'year':
          return sDate >= startOfYear;
        case 'custom':
          if (!customStartDate && !customEndDate) return true;
          if (customStartDate && sDateStr < customStartDate) return false;
          if (customEndDate && sDateStr > customEndDate) return false;
          return true;
        default:
          return true;
      }
    });
  }, [effectiveSalesPool, filterPreset, customStartDate, customEndDate]);

  // 3. Computed KPIs
  const totalRevenue = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + (s.total || 0), 0);
  }, [filteredSales]);

  const totalReceipts = filteredSales.length;

  const averageOrderValue = useMemo(() => {
    return totalReceipts > 0 ? totalRevenue / totalReceipts : 0;
  }, [totalRevenue, totalReceipts]);

  const totalUnitsSold = useMemo(() => {
    return filteredSales.reduce((acc, s) => {
      const itemsCount = (s.items || []).reduce((iAcc, item) => iAcc + (item.quantity || 0), 0);
      return acc + itemsCount;
    }, 0);
  }, [filteredSales]);

  // Active Drafts/Quotations
  const myDraftsCount = useMemo(() => {
    return draftSales.filter(d => 
      !d.cashierId || 
      d.cashierId === currentUser.id || 
      d.cashierName === currentUser.name
    ).length;
  }, [draftSales, currentUser]);

  // 4. Payment Methods Distribution
  const paymentBreakdown = useMemo(() => {
    const counts = { cash: 0, momo: 0, card: 0, credit: 0 };
    filteredSales.forEach(s => {
      const pm = getSalePaymentSummary(s).toLowerCase();
      const sTotal = s.total || 0;
      if (pm.includes('momo') || pm.includes('mobile') || pm.includes('mtn') || pm.includes('telecel') || pm.includes('at_money')) {
        counts.momo += sTotal;
      } else if (pm.includes('card') || pm.includes('pos') || pm.includes('visa')) {
        counts.card += sTotal;
      } else if (pm.includes('credit') || pm.includes('loan') || pm.includes('insurance')) {
        counts.credit += sTotal;
      } else {
        counts.cash += sTotal;
      }
    });
    return counts;
  }, [filteredSales]);

  // 5. Top Dispensed Medicines
  const topProducts = useMemo(() => {
    const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    filteredSales.forEach(s => {
      (s.items || []).forEach((item: CartItem) => {
        const pId = item.productId || item.productName;
        if (!productMap[pId]) {
          productMap[pId] = {
            name: item.productName,
            qty: 0,
            revenue: 0
          };
        }
        productMap[pId].qty += item.quantity || 0;
        productMap[pId].revenue += (item.quantity || 0) * (item.unitPrice || 0);
      });
    });

    return Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredSales]);

  // Filtered transactions for the ledger table
  const searchFilteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return filteredSales.slice(0, 10);
    const q = searchQuery.toLowerCase();
    return filteredSales.filter(s => 
      (s.receiptNumber && s.receiptNumber.toLowerCase().includes(q)) ||
      (s.customerName && s.customerName.toLowerCase().includes(q)) ||
      getSalePaymentSummary(s).toLowerCase().includes(q)
    ).slice(0, 15);
  }, [filteredSales, searchQuery]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Top Welcome & Operating Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 rounded-2xl p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          {currentUser.avatarUrl ? (
            <img 
              src={currentUser.avatarUrl} 
              alt={currentUser.name} 
              className="w-14 h-14 rounded-2xl object-cover border-2 border-white/30 shadow-md"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-xl border border-white/30 shadow-md">
              {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white border border-white/30 flex items-center space-x-1">
                <Award className="w-3 h-3" />
                <span>Sales Representative</span>
              </span>
              <span className="text-xs text-emerald-100 font-mono">
                @{currentUser.username}
              </span>
            </div>
            <h1 className="text-2xl font-black mt-1 tracking-tight">
              Welcome back, {currentUser.name.split(' ')[0]}!
            </h1>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              Personal Sales Performance, Checkout Velocity & Daily Revenue Dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('pos')}
            className="px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-black shadow-lg transition flex items-center space-x-2 transform active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Launch POS Counter</span>
          </button>
        </div>
      </div>

      {/* Date Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1.5">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Timeframe:</span>
          </span>

          {[
            { id: 'today', label: 'Today (Day)' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'last30', label: 'Last 30 Days' },
            { id: 'year', label: 'This Year' },
            { id: 'custom', label: 'Custom Range' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterPreset(tab.id as DateFilterPreset)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition select-none ${
                filterPreset === tab.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filterPreset === 'custom' && (
          <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in">
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-slate-400 font-medium">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="px-2 py-1 bg-white dark:bg-slate-900 rounded-lg border text-xs focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-slate-400 font-medium">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="px-2 py-1 bg-white dark:bg-slate-900 rounded-lg border text-xs focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2 flex-wrap gap-2">
          {/* Scope Switcher or Personal Scope Notice */}
          {hasExplicitAllSalesPermission ? (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSalesScopeFilter('OWN')}
                className={`px-3 py-1 rounded-lg transition ${
                  effectiveScope === 'OWN'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                My Sales
              </button>
              <button
                type="button"
                onClick={() => setSalesScopeFilter('ALL')}
                className={`px-3 py-1 rounded-lg transition ${
                  effectiveScope === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                All Staff
              </button>
            </div>
          ) : (
            <div 
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
              title="Dashboard metrics reflect your personal sales performance."
            >
              <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Scope: Personal Sales</span>
            </div>
          )}

          <div className="text-xs text-slate-500 flex items-center space-x-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">{filteredSales.length}</span> receipts
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Gross Sales */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-400 dark:hover:border-emerald-600 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Total Sales</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {formatCurrency(totalRevenue)}
            </h2>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center space-x-1">
              <span>✓ Generated in selected timeframe</span>
            </p>
          </div>
        </div>

        {/* Card 2: Receipts / Transactions */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-400 dark:hover:border-blue-600 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Orders</span>
            <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {totalReceipts.toLocaleString()} <span className="text-sm font-normal text-slate-400">receipts</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              {totalUnitsSold.toLocaleString()} total units dispensed
            </p>
          </div>
        </div>

        {/* Card 3: Average Order Value (AOV) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-purple-400 dark:hover:border-purple-600 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Basket (AOV)</span>
            <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {formatCurrency(averageOrderValue)}
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Average revenue per customer checkout
            </p>
          </div>
        </div>

        {/* Card 4: Draft Quotes */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-400 dark:hover:border-amber-600 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Quotes / Drafts</span>
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {myDraftsCount} <span className="text-sm font-normal text-slate-400">quotes</span>
            </h2>
            <button
              onClick={() => onNavigate('sales')}
              className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-semibold mt-1 flex items-center space-x-1"
            >
              <span>Resume active draft quotes</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

      {/* Middle Grid: Payment Breakdown & Top Selling Medicines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Payment Channels Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Payment Tender Channels</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">By Channel Total</span>
          </div>

          <div className="space-y-3">
            {/* Cash */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300">
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cash Desk</span>
                </span>
                <span className="font-mono text-slate-900 dark:text-white">{formatCurrency(paymentBreakdown.cash)}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all" 
                  style={{ width: `${totalRevenue > 0 ? (paymentBreakdown.cash / totalRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Mobile Money */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300">
                  <Smartphone className="w-3.5 h-3.5 text-amber-500" />
                  <span>Mobile Money (MoMo)</span>
                </span>
                <span className="font-mono text-slate-900 dark:text-white">{formatCurrency(paymentBreakdown.momo)}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all" 
                  style={{ width: `${totalRevenue > 0 ? (paymentBreakdown.momo / totalRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* POS Card */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300">
                  <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                  <span>POS Card / Visa / Master</span>
                </span>
                <span className="font-mono text-slate-900 dark:text-white">{formatCurrency(paymentBreakdown.card)}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all" 
                  style={{ width: `${totalRevenue > 0 ? (paymentBreakdown.card / totalRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Credit */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300">
                  <User className="w-3.5 h-3.5 text-purple-500" />
                  <span>Patient Credit Ledger</span>
                </span>
                <span className="font-mono text-slate-900 dark:text-white">{formatCurrency(paymentBreakdown.credit)}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-purple-500 h-full rounded-full transition-all" 
                  style={{ width: `${totalRevenue > 0 ? (paymentBreakdown.credit / totalRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
            Total tender settled: <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(totalRevenue)}</span>
          </div>
        </div>

        {/* Top Dispensed Products */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
              <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>My Top Dispensed Medicines</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Ranked by Revenue</span>
          </div>

          {topProducts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No product sales recorded in this period.
            </div>
          ) : (
            <div className="space-y-2.5">
              {topProducts.map((p, idx) => (
                <div 
                  key={idx} 
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-xs flex items-center justify-center font-mono">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{p.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{p.qty.toLocaleString()} units dispensed</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(p.revenue)}
                    </p>
                    <span className="text-[9px] text-slate-400">
                      {totalRevenue > 0 ? ((p.revenue / totalRevenue) * 100).toFixed(1) : 0}% of your total
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Recent Personal Transactions Ledger */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
              <Receipt className="w-4 h-4 text-brand-600" />
              <span>My Recent Counter Transactions</span>
            </h3>
            <p className="text-xs text-slate-500">Receipts generated by you in the selected timeframe</p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search receipt #, customer..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none w-56"
              />
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition"
            >
              View Full History →
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-semibold text-slate-600 dark:text-slate-400 text-[10px] select-none border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 w-10 text-center">#</th>
                <th className="p-3">Receipt / Invoice #</th>
                <th className="p-3">Customer / Patient</th>
                <th className="p-3 text-center">Items</th>
                <th className="p-3">Payment Channel</th>
                <th className="p-3 text-right">Total Amount</th>
                <th className="p-3">Date & Time</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {searchFilteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No matching sales transactions found for this timeframe.
                  </td>
                </tr>
              ) : (
                searchFilteredTransactions.map((sale, idx) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="p-3">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {sale.receiptNumber || `INV-${sale.id.slice(0, 8)}`}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {sale.customerName || 'Walk-in Patient'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {sale.items?.length || 0} item{(sale.items?.length || 0) === 1 ? '' : 's'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 uppercase">
                        {getSalePaymentSummary(sale)}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(sale.total || 0)}
                    </td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">
                      {new Date(sale.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => onNavigate('sales')}
                        className="p-1.5 text-brand-600 hover:text-brand-700 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-lg transition"
                        title="View / Reprint Invoice"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
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
};
