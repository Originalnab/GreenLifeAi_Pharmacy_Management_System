import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, Moon, Sun, Bell, UserCheck, 
  Store, CheckCircle2, ChevronDown, DollarSign, Coins,
  LogOut, Lock, User as UserIcon, ShieldAlert, Star, Shield, Sparkles
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { supportedCurrencies } from '../../data/mock/units';
import { UserProfileModal } from '../common/UserProfileModal';
import { getUserAssignedRoles, getUserPrimaryRole, RoleType } from '../../types';

export const TopBar: React.FC = () => {
  const { 
    currentUser, 
    switchUser,
    switchActiveRole,
    users, 
    activeShift, 
    isDarkMode, 
    toggleDarkMode, 
    approvals,
    currentCurrency,
    setCurrency,
    formatCurrency,
    operatingMode,
    setOperatingMode,
    systemProfile,
    logout,
    lockScreen,
    dismissPasswordResetNotice,
    confirmDialog
  } = usePharmacy();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState<'profile' | 'avatar' | 'security' | 'access'>('profile');
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setShowRoleDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSuperAdmin = 
    currentUser.role === 'Super Admin' || 
    currentUser.username?.toLowerCase() === 'admink19' || 
    currentUser.username === 'superadmin' || 
    currentUser.primaryRole === 'Super Admin' ||
    (Array.isArray(currentUser.assignedRoles) && currentUser.assignedRoles.includes('Super Admin'));

  const pendingApprovalsCount = approvals.filter(a => a.status === 'PENDING').length;

  return (
    <>
      {/* Password Reset Notice Security Banner */}
      {currentUser.passwordResetNotice && !currentUser.passwordResetNotice.acknowledged && (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 md:px-6 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-md relative z-40 border-b border-amber-500/50 animate-in slide-in-from-top duration-200">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <span className="font-extrabold uppercase tracking-wider text-[10px] bg-white/20 px-1.5 py-0.5 rounded mr-1.5">
                Security Alert
              </span>
              <span>
                Your password was recently reset by Administrator <strong>{currentUser.passwordResetNotice.resetBy}</strong> on {new Date(currentUser.passwordResetNotice.resetAt).toLocaleString()}.
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0 ml-auto">
            <button
              type="button"
              onClick={() => {
                setProfileInitialTab('security');
                setShowProfileModal(true);
              }}
              className="px-3 py-1 bg-white text-amber-950 font-bold text-xs rounded-lg shadow hover:bg-amber-50 transition cursor-pointer"
            >
              Update Password Now
            </button>
            <button
              type="button"
              onClick={() => dismissPasswordResetNotice(currentUser.id)}
              className="px-2.5 py-1 text-white/90 hover:text-white hover:bg-white/15 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

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
        <div 
          className="hidden lg:flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/70 px-3 py-1 rounded-full text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm"
          title={`Active Operating Branch / Shop: ${systemProfile.branchName || currentUser.branchName}`}
        >
          <Store className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span className="truncate max-w-[240px] font-semibold">{systemProfile.branchName || currentUser.branchName}</span>
        </div>

        {/* Operating Mode: Interactive for Super Admin only; Read-only for other staff */}
        {isSuperAdmin ? (
          <button
            type="button"
            onClick={() => setOperatingMode(operatingMode === 'PRODUCTION' ? 'DEMO' : 'PRODUCTION')}
            className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border transition cursor-pointer shadow-sm ${
              operatingMode === 'DEMO'
                ? 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                : 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
            }`}
            title={`Operating Environment: ${operatingMode === 'DEMO' ? 'Training & Demo Simulation (Mock Data)' : 'Live Production Database'}. Click to toggle.`}
          >
            <span className={`w-2 h-2 rounded-full ${operatingMode === 'DEMO' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span>{operatingMode === 'DEMO' ? '⚡ DEMO SANDBOX' : '● LIVE PRODUCTION'}</span>
          </button>
        ) : (
          <div
            className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border shadow-sm select-none cursor-default ${
              operatingMode === 'DEMO'
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
            }`}
            title={`Operating Environment: ${operatingMode === 'DEMO' ? 'Training & Demo Sandbox (Simulated Data)' : 'Live Production Database'}. (Environment switching is restricted to Super Administrator)`}
          >
            <span className={`w-2 h-2 rounded-full ${operatingMode === 'DEMO' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span>{operatingMode === 'DEMO' ? '⚡ DEMO SANDBOX' : '● LIVE PRODUCTION'}</span>
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

        {/* Header Role Display & Multi-Role Switcher */}
        {(() => {
          const assignedRoles = getUserAssignedRoles(currentUser);
          const primaryRole = getUserPrimaryRole(currentUser);
          const hasMultipleRoles = assignedRoles.length > 1;
          const isSuperAdmin = currentUser.role === 'Super Admin' || assignedRoles.includes('Super Admin');
          const isDemoMode = operatingMode === 'DEMO';

          // Single-Role User (and not superadmin in demo mode): Show fixed, clean role badge (no switching)
          if (!hasMultipleRoles && !(isSuperAdmin && isDemoMode)) {
            return (
              <div 
                className="flex items-center space-x-1.5 bg-brand-50 dark:bg-brand-950/50 text-brand-800 dark:text-brand-300 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-brand-200 dark:border-brand-800 select-none shadow-sm"
                title={`Active Role: ${currentUser.role}`}
              >
                <UserCheck className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span className="font-bold">{currentUser.role}</span>
              </div>
            );
          }

          // Multi-Role User or Super Admin in Demo: Show interactive assigned-roles dropdown
          return (
            <div className="relative" ref={roleDropdownRef}>
              <button
                id="role-switcher-btn"
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center space-x-1.5 bg-brand-50 dark:bg-brand-950/50 hover:bg-brand-100 dark:hover:bg-brand-900/60 text-brand-800 dark:text-brand-300 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-brand-200 dark:border-brand-800 transition shadow-sm"
                title="Switch active session role"
              >
                <UserCheck className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span className="font-bold">{currentUser.role}</span>
                {hasMultipleRoles && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-brand-200/80 dark:bg-brand-900 text-brand-800 dark:text-brand-300 font-extrabold">
                    {assignedRoles.length}
                  </span>
                )}
                <ChevronDown className="w-3 h-3 text-brand-600" />
              </button>

              {showRoleDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Your Assigned Roles</p>
                    <p className="text-[10px] text-slate-500">Switch your active session role in real-time</p>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto py-1">
                    {assignedRoles.map((role) => {
                      const isActive = currentUser.role === role;
                      const isPrimary = primaryRole === role;
                      return (
                        <button
                          key={role}
                          onClick={() => {
                            switchActiveRole(role);
                            setShowRoleDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/80 transition ${
                            isActive
                              ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-bold'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">{role}</span>
                            {isPrimary && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                PRIMARY
                              </span>
                            )}
                          </div>
                          {isActive && <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

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

        {/* Interactive User Profile & Sign Out Dropdown */}
        <div className="relative pl-1 border-l border-slate-200 dark:border-slate-800" ref={userDropdownRef}>
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left cursor-pointer"
            title="User Account & Session Controls"
          >
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover shadow-sm shrink-0 border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-clinical-500 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
            )}
            <div className="hidden lg:block text-left">
              <div className="flex items-center space-x-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">{currentUser.name}</p>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{currentUser.licenseNumber || currentUser.role}</p>
            </div>
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
              {/* User Identity Header */}
              <div className="flex items-start space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-xl object-cover shadow-md shrink-0 border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">
                    {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                  <div className="flex items-center space-x-1.5 mt-1.5">
                    <span className="text-[10px] bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
                      {currentUser.role}
                    </span>
                    {currentUser.licenseNumber && (
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono">
                        {currentUser.licenseNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Branch / Terminal Context */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-[11px] space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Operating Branch:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                    {systemProfile?.branchName || currentUser.branchName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Cash Register Shift:</span>
                  {activeShift?.status === 'OPEN' ? (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      <span>Shift Open</span>
                    </span>
                  ) : (
                    <span className="text-slate-400">No Shift Open</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-1 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserDropdown(false);
                    setProfileInitialTab('profile');
                    setShowProfileModal(true);
                  }}
                  className="w-full px-3 py-2 text-left rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center space-x-2 transition cursor-pointer"
                >
                  <UserIcon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>My Profile & Security</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowUserDropdown(false);
                    lockScreen();
                  }}
                  className="w-full px-3 py-2 text-left rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center space-x-2 transition cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span>Lock Terminal Screen</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setShowUserDropdown(false);
                    if (activeShift?.status === 'OPEN') {
                      const confirmSignOut = await confirmDialog({
                        title: 'Active Cashier Register Shift',
                        message: 'You currently have an active open cashier register shift. Are you sure you want to sign out?',
                        description: 'Your shift will remain open in the register until you or a supervisor formally reconciles and closes it.',
                        confirmText: 'Sign Out Anyway',
                        variant: 'warning'
                      });
                      if (!confirmSignOut) return;
                    }
                    logout();
                  }}
                  className="w-full px-3 py-2 text-left rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center space-x-2 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Pharmacy Suite</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

    {/* User Profile & Security Modal */}
    <UserProfileModal
      isOpen={showProfileModal}
      onClose={() => setShowProfileModal(false)}
      initialTab={profileInitialTab}
    />
  </>
  );
};
