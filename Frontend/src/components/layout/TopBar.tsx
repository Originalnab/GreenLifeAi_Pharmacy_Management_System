import React, { useState } from 'react';
import { 
  ShieldCheck, Moon, Sun, Bell, UserCheck, 
  Store, CheckCircle2, ChevronDown, DollarSign, Coins
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { supportedCurrencies } from '../../data/mock/units';

export const TopBar: React.FC = () => {
  const { 
    currentUser, 
    switchUser, 
    users, 
    activeShift, 
    isDarkMode, 
    toggleDarkMode, 
    approvals,
    currentCurrency,
    setCurrency,
    formatCurrency,
    operatingMode 
  } = usePharmacy();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  const pendingApprovalsCount = approvals.filter(a => a.status === 'PENDING').length;

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm transition-colors">
      {/* Left: Branding & Branch */}
      <div className="flex items-center space-x-3 md:space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-clinical-600 flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/20">
            <span className="font-mono text-lg">G+</span>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-base">Greenlife<span className="text-brand-600 dark:text-brand-400">AI</span></span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 rounded">v1.0-rc</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Pharmacy Management System</p>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

        {/* Branch pill */}
        <div className="hidden lg:flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/70 px-3 py-1 rounded-full text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <Store className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span className="truncate max-w-[200px]">{currentUser.branchName}</span>
        </div>

        {/* Demo Mode Pill */}
        {operatingMode === 'DEMO' && (
          <div className="hidden sm:flex items-center space-x-1.5 bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 px-2.5 py-1 rounded-full text-[10px] font-extrabold border border-amber-300 dark:border-amber-700 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>TRAINING SANDBOX</span>
          </div>
        )}
      </div>

      {/* Right: Service Status, Shift, Role Switcher, Currency, Dark Mode, Profile */}
      <div className="flex items-center space-x-2 md:space-x-3">
        {/* Local Services Online Pill */}
        <div className="hidden xl:flex items-center space-x-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full text-[11px] font-medium border border-emerald-200 dark:border-emerald-800/60">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Local Stack: Ready (PostgreSQL 16)</span>
        </div>

        {/* Active Shift Indicator */}
        {activeShift ? (
          <div className="hidden md:flex items-center space-x-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-lg text-xs font-semibold border border-blue-200 dark:border-blue-800">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Shift: {activeShift.shiftNumber} (Float: {formatCurrency(activeShift.openingFloat)})</span>
          </div>
        ) : (
          <div className="hidden md:flex items-center space-x-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-lg text-xs font-semibold border border-amber-200 dark:border-amber-800">
            <span>No Active Shift</span>
          </div>
        )}

        {/* Role Switcher Demo Button */}
        <div className="relative">
          <button
            id="role-switcher-btn"
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center space-x-1.5 bg-brand-50 dark:bg-brand-950/50 hover:bg-brand-100 dark:hover:bg-brand-900/60 text-brand-800 dark:text-brand-300 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-brand-200 dark:border-brand-800 transition shadow-sm"
            title="Switch staff role for testing RBAC"
          >
            <UserCheck className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span className="font-bold">{currentUser.role}</span>
            <ChevronDown className="w-3 h-3 text-brand-600" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Demo Role Switcher (RBAC)</p>
                <p className="text-[11px] text-slate-500">Test UI permission gating in real-time</p>
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u);
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/80 transition ${
                      currentUser.id === u.id ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-bold' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{u.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{u.role}</p>
                    </div>
                    {currentUser.id === u.id && <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
            title="Approval notifications"
          >
            <Bell className="w-4 h-4" />
            {pendingApprovalsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
            )}
          </button>

          {showNotificationMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-white">Pending Work Queue</span>
                <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-full font-bold">
                  {pendingApprovalsCount} pending
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs py-1 max-h-60 overflow-y-auto">
                {approvals.filter(a => a.status === 'PENDING').map(a => (
                  <div key={a.id} className="py-2">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{a.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{a.details}</p>
                    <p className="text-[10px] text-brand-600 dark:text-brand-400 mt-1 font-medium">By {a.requestedBy} • {a.requestedAt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Currency Switcher Pill Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
            className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 transition shadow-sm"
            title="Switch Operating Currency"
          >
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-mono">{currentCurrency.code} ({currentCurrency.symbol})</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showCurrencyDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-1 border-b border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Currency</p>
              </div>
              <div className="py-1">
                {supportedCurrencies.map((curr: any) => (
                  <button
                    key={curr.code}
                    onClick={() => {
                      setCurrency(curr.code);
                      setShowCurrencyDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/80 transition ${
                      currentCurrency.code === curr.code ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-bold' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold w-6">{curr.symbol}</span>
                      <span>{curr.name}</span>
                    </div>
                    {currentCurrency.code === curr.code && <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title={isDarkMode ? "Switch to Light Theme" : "Switch to Dark Theme"}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* User Badge */}
        <div className="flex items-center space-x-2 pl-1 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-clinical-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">{currentUser.name}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{currentUser.licenseNumber || currentUser.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
