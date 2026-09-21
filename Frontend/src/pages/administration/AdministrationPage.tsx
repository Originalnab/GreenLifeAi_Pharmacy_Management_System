import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, ShieldCheck, Coins, Search, Plus, X, 
  CheckCircle2, FileSpreadsheet, Check, KeyRound, Lock, Unlock,
  Sliders, Eye, EyeOff, AlertTriangle, RotateCcw, BadgePercent,
  CheckCheck, Info, Shield, UserCheck, UserX, Layers, Sparkles, RefreshCw
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { defaultPermissions, defaultSensitiveControls } from '../../data/mock/users';
import { supportedCurrencies } from '../../data/mock/units';
import { 
  CustomRoleDefinition, ModuleName, PermissionAction, 
  PermissionMatrix, RoleSensitiveControls, UserAuthorization, RoleType 
} from '../../types';
import { FloatingBulkActionBar } from '../../components/common/FloatingBulkActionBar';
import { WorkflowGuideNotice } from '../../components/common/WorkflowGuideNotice';
import { FieldGuideNotice } from '../../components/common/FieldGuideNotice';

const MODULE_CONFIG: Array<{
  id: ModuleName;
  name: string;
  category: string;
  description: string;
}> = [
  { id: 'pos', name: 'Point of Sale (POS)', category: 'Dispensary', description: 'Counter checkout, barcode scanning, cart calculation, prescription dispensation & receipt printing' },
  { id: 'sales', name: 'Sales & Invoices', category: 'Commercial', description: 'Transaction history, receipt reprints, return-in processing, customer credit notes' },
  { id: 'catalogue', name: 'Product Formulary', category: 'Clinical & Formulary', description: 'Brand/generic drug registry, dosage forms, packaging tiers, and price margins' },
  { id: 'purchasing', name: 'Procurement & GRN', category: 'Supply Chain', description: 'Supplier purchase orders, physical inspection QA, and batch GRN receiving' },
  { id: 'inventory', name: 'Stocks & Batches', category: 'Supply Chain', description: 'FEFO expiry tracking, storage bins, batch quarantine, and disposal destruction' },
  { id: 'parties', name: 'Suppliers & Customers', category: 'Commercial', description: 'Distributor vendors, patient medical profiles, and clinic institutional accounts' },
  { id: 'finance', name: 'Finance & Expenses', category: 'Financial', description: 'Operating disbursements, expense ledgers, cash flow, and tax reporting' },
  { id: 'loans', name: 'Credit & Loans', category: 'Financial', description: 'Customer credit limits, wholesale vendor credit, and debt repayment schedules' },
  { id: 'reports', name: 'Reports & Analytics', category: 'Executive', description: 'Daily Z-reports, gross profit analysis, ABC stock valuation, and regulatory audits' },
  { id: 'administration', name: 'Administration & System', category: 'Governance', description: 'Premises license, superintendent registration, staff directory, and currency configs' },
  { id: 'audit', name: 'Audit Trail & Compliance', category: 'Governance', description: 'Tamper-evident system audit trail, actor logs, and technical diagnostics' },
];

const ACTION_CONFIG: Array<{
  id: PermissionAction;
  name: string;
  description: string;
}> = [
  { id: 'read', name: 'Read', description: 'Prerequisite for page visibility and list viewing' },
  { id: 'create', name: 'Create', description: 'Draft new records, orders, or transactions' },
  { id: 'update', name: 'Update', description: 'Edit uncommitted / pending draft records' },
  { id: 'delete', name: 'Delete', description: 'Delete drafts only (finalized records are locked)' },
  { id: 'approve', name: 'Approve', description: 'Authorize POs, refunds, adjustments, disposals' },
  { id: 'export', name: 'Export', description: 'Download CSV spreadsheets and printable PDFs' },
  { id: 'override', name: 'Override', description: 'Supervisor discounts, price overrides, unlocks' },
];

export const AdministrationPage: React.FC = () => {
  const { 
    users, 
    customRoles, 
    addCustomRole, 
    currentUser,
    currentCurrency,
    setCurrency,
    formatCurrency,
    systemProfile,
    updateSystemProfile,
    rolePermissions,
    roleSensitiveControls,
    userAuthorizations,
    updateRolePermissions,
    updateUserAuthorization,
    updateUserRole,
    updateUserStatus,
    revokeUserSessions,
    resetUserCredentials,
    getUserAuthorization
  } = usePharmacy();

  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'roles' | 'permissions' | 'settings'>('profile');

  // Dispensary Profile Form State
  const [profileForm, setProfileForm] = useState(systemProfile);
  const [profileSaved, setProfileSaved] = useState(false);

  // Staff Users Directory State
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Custom Role Builder State
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [financialLimit, setFinancialLimit] = useState('500000');

  // Permissions & Authorizations Tab State
  const [permSubTab, setPermSubTab] = useState<'matrix' | 'users'>('matrix');

  // RBAC Matrix State
  const [selectedRole, setSelectedRole] = useState<string>('Pharmacist');
  const [matrixState, setMatrixState] = useState<PermissionMatrix>(() => {
    return rolePermissions['Pharmacist'] || defaultPermissions['Pharmacist'];
  });
  const [sensitiveState, setSensitiveState] = useState<RoleSensitiveControls>(() => {
    return roleSensitiveControls['Pharmacist'] || defaultSensitiveControls['Pharmacist'] || {
      viewCost: true,
      viewProfit: true,
      viewAudit: false,
      manageSettings: false,
      protectedDiagnostics: false,
    };
  });
  const [roleSavedSuccess, setRoleSavedSuccess] = useState(false);

  // User Authorizations State
  const [selectedUserId, setSelectedUserId] = useState<string>(users[1]?.id || users[0]?.id || 'usr_002');
  const [userAuthForm, setUserAuthForm] = useState<UserAuthorization>(() => {
    return getUserAuthorization(users[1]?.id || users[0]?.id || 'usr_002');
  });
  const [userSavedSuccess, setUserSavedSuccess] = useState(false);
  const [userActionNotice, setUserActionNotice] = useState<string | null>(null);

  // Sync Matrix State when selectedRole changes
  useEffect(() => {
    if (rolePermissions[selectedRole]) {
      setMatrixState(JSON.parse(JSON.stringify(rolePermissions[selectedRole])));
    } else if (defaultPermissions[selectedRole]) {
      setMatrixState(JSON.parse(JSON.stringify(defaultPermissions[selectedRole])));
    }
    if (roleSensitiveControls[selectedRole]) {
      setSensitiveState({ ...roleSensitiveControls[selectedRole] });
    } else if (defaultSensitiveControls[selectedRole]) {
      setSensitiveState({ ...defaultSensitiveControls[selectedRole] });
    }
  }, [selectedRole, rolePermissions, roleSensitiveControls]);

  // Sync User Auth Form when selectedUserId changes
  useEffect(() => {
    if (selectedUserId) {
      setUserAuthForm({ ...getUserAuthorization(selectedUserId) });
    }
  }, [selectedUserId, userAuthorizations]);

  const allRoles: string[] = [
    'Super Admin',
    'Pharmacy Admin',
    'Manager',
    'Pharmacist',
    'Cashier',
    'Stock Officer',
    'Procurement Officer',
    'Accountant',
    'Auditor',
    ...customRoles.map(r => r.name)
  ];

  const handleToggleMatrixAction = (module: ModuleName, action: PermissionAction) => {
    if (selectedRole === 'Super Admin') return; // Super Admin has permanent full access
    setMatrixState(prev => {
      const currentMod = prev[module] || { create: false, read: false, update: false, delete: false, approve: false, export: false, override: false };
      const currentVal = !!currentMod[action];
      const newVal = !currentVal;

      // PRD rule: Read is the prerequisite for visibility. If read is unchecked, all actions in this module are unchecked.
      // If any other action is checked, read MUST be checked.
      const updatedMod = { ...currentMod, [action]: newVal };
      if (!newVal && action === 'read') {
        ACTION_CONFIG.forEach(a => { updatedMod[a.id] = false; });
      } else if (newVal && action !== 'read') {
        updatedMod.read = true;
      }

      return {
        ...prev,
        [module]: updatedMod
      };
    });
  };

  const handleToggleAllForModule = (module: ModuleName) => {
    if (selectedRole === 'Super Admin') return;
    const current = matrixState[module] || { create: false, read: false, update: false, delete: false, approve: false, export: false, override: false };
    const allTrue = ACTION_CONFIG.every(a => current[a.id]);
    const newState = !allTrue;
    setMatrixState(prev => ({
      ...prev,
      [module]: {
        create: newState,
        read: newState,
        update: newState,
        delete: newState,
        approve: newState,
        export: newState,
        override: newState,
      }
    }));
  };

  const handleToggleActionAcrossModules = (action: PermissionAction) => {
    if (selectedRole === 'Super Admin') return;
    const allHaveAction = MODULE_CONFIG.every(m => matrixState[m.id]?.[action]);
    const newState = !allHaveAction;
    setMatrixState(prev => {
      const updated = { ...prev };
      MODULE_CONFIG.forEach(m => {
        const currentMod = updated[m.id] ? { ...updated[m.id] } : { create: false, read: false, update: false, delete: false, approve: false, export: false, override: false };
        currentMod[action] = newState;
        if (newState && action !== 'read') {
          currentMod.read = true;
        } else if (!newState && action === 'read') {
          ACTION_CONFIG.forEach(a => { currentMod[a.id] = false; });
        }
        updated[m.id] = currentMod;
      });
      return updated;
    });
  };

  const applyPreset = (presetType: 'grant_all' | 'read_only' | 'reset_defaults') => {
    if (selectedRole === 'Super Admin') return;
    if (presetType === 'grant_all') {
      const all: any = {};
      MODULE_CONFIG.forEach(m => {
        all[m.id] = { create: true, read: true, update: true, delete: true, approve: true, export: true, override: true };
      });
      setMatrixState(all);
      setSensitiveState({
        viewCost: true,
        viewProfit: true,
        viewAudit: true,
        manageSettings: true,
        protectedDiagnostics: false
      });
    } else if (presetType === 'read_only') {
      const ro: any = {};
      MODULE_CONFIG.forEach(m => {
        ro[m.id] = { create: false, read: true, update: false, delete: false, approve: false, export: true, override: false };
      });
      setMatrixState(ro);
      setSensitiveState({
        viewCost: false,
        viewProfit: false,
        viewAudit: true,
        manageSettings: false,
        protectedDiagnostics: false
      });
    } else if (presetType === 'reset_defaults') {
      if (defaultPermissions[selectedRole]) {
        setMatrixState(JSON.parse(JSON.stringify(defaultPermissions[selectedRole])));
      }
      if (defaultSensitiveControls[selectedRole]) {
        setSensitiveState({ ...defaultSensitiveControls[selectedRole] });
      }
    }
  };

  const handleSaveRolePermissions = (e: React.FormEvent) => {
    e.preventDefault();
    updateRolePermissions(selectedRole, matrixState, sensitiveState);
    setRoleSavedSuccess(true);
    setTimeout(() => setRoleSavedSuccess(false), 3500);
  };

  const handleSaveUserAuth = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserAuthorization(selectedUserId, userAuthForm);
    setUserSavedSuccess(true);
    setTimeout(() => setUserSavedSuccess(false), 3500);
  };

  const handleUserRoleChange = (newRole: string) => {
    const success = updateUserRole(selectedUserId, newRole as RoleType);
    if (success) {
      setUserActionNotice(`Assigned role "${newRole}" to staff member.`);
      setTimeout(() => setUserActionNotice(null), 3500);
    }
  };

  const handleUserStatusToggle = () => {
    const targetUser = users.find(u => u.id === selectedUserId);
    if (!targetUser) return;
    const success = updateUserStatus(selectedUserId, !targetUser.active);
    if (success) {
      setUserActionNotice(`Account status updated to ${!targetUser.active ? 'ACTIVE' : 'DEACTIVATED'}.`);
      setTimeout(() => setUserActionNotice(null), 3500);
    }
  };

  const handleRevokeSessions = () => {
    const targetUser = users.find(u => u.id === selectedUserId);
    revokeUserSessions(selectedUserId);
    setUserActionNotice(`All active web and POS sessions revoked for ${targetUser?.name}.`);
    setTimeout(() => setUserActionNotice(null), 3500);
  };

  const handleResetCredentials = () => {
    const targetUser = users.find(u => u.id === selectedUserId);
    resetUserCredentials(selectedUserId);
    setUserActionNotice(`Credentials reset flag dispatched. ${targetUser?.name} must set a new password upon next login.`);
    setTimeout(() => setUserActionNotice(null), 3500);
  };

  const selectedUser = users.find(u => u.id === selectedUserId) || users[0];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemProfile(profileForm);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    const newRole: CustomRoleDefinition = {
      id: `crole_${Date.now()}`,
      name: newRoleName,
      description: newRoleDesc,
      baseRole: 'Cashier',
      financialLimit: parseFloat(financialLimit) || 0,
      permissions: defaultPermissions['Cashier'],
      sensitiveControls: defaultSensitiveControls['Cashier'],
    };

    addCustomRole(newRole);
    setShowRoleModal(false);
    setNewRoleName('');
    setNewRoleDesc('');
    alert(`Custom role "${newRole.name}" saved to RBAC registry.`);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                          (u.licenseNumber || '').toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const isAllUsersSelected = filteredUsers.length > 0 && filteredUsers.every(u => selectedUserIds.includes(u.id));
  const isSomeUsersSelected = filteredUsers.some(u => selectedUserIds.includes(u.id)) && !isAllUsersSelected;

  const toggleSelectAllUsers = () => {
    if (isAllUsersSelected) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    }
  };

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleExportUsersCSV = () => {
    const targets = users.filter(u => selectedUserIds.includes(u.id));
    if (targets.length === 0) return;
    const headers = ['Staff Name', 'Role', 'Email', 'License Number', 'Status'];
    const rows = targets.map(u => [
      `"${u.name}"`,
      u.role,
      `"${u.email}"`,
      `"${u.licenseNumber || '—'}"`,
      u.active ? 'Active' : 'Inactive'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `staff_directory_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-brand-600" />
            <span>Administration & System Profile</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dispensary premises accreditation, staff directory & RBAC authority, custom role definitions, permissions & authorizations, and multi-currency settings.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1 ${
              activeTab === 'profile' ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-sm font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Dispensary Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1 ${
              activeTab === 'users' ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-sm font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staff Directory</span>
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1 ${
              activeTab === 'roles' ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-sm font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Custom Roles</span>
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'permissions' ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-sm font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Permissions & Authorizations</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1 ${
              activeTab === 'settings' ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-sm font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Currency & Settings</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DISPENSARY SYSTEM PROFILE */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Dispensary Enterprise Profile & Regulatory Credentials</h3>
              <p className="text-xs text-slate-500">Official legal entity details, pharmacy premises registration, and superintendent pharmacist accreditation.</p>
            </div>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow flex items-center space-x-1.5 transition"
            >
              <Check className="w-4 h-4" />
              <span>Save System Profile</span>
            </button>
          </div>

          {profileSaved && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Dispensary profile successfully updated across all POS terminals and print templates.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold block mb-1">Pharmacy Legal Enterprise Name *</label>
              <input
                type="text"
                required
                value={profileForm.legalName}
                onChange={e => setProfileForm({ ...profileForm, legalName: e.target.value })}
                className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Trade / Storefront Brand Name</label>
              <input
                type="text"
                value={profileForm.tradeName}
                onChange={e => setProfileForm({ ...profileForm, tradeName: e.target.value })}
                className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Pharmacy Premises License # (PCN / FDA) *</label>
              <input
                type="text"
                required
                value={profileForm.premisesLicense}
                onChange={e => setProfileForm({ ...profileForm, premisesLicense: e.target.value })}
                className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono font-bold text-brand-600"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Superintendent Pharmacist Name & Honors</label>
              <input
                type="text"
                value={profileForm.superintendentName}
                onChange={e => setProfileForm({ ...profileForm, superintendentName: e.target.value })}
                className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Superintendent Annual License #</label>
              <input
                type="text"
                value={profileForm.superintendentLicense}
                onChange={e => setProfileForm({ ...profileForm, superintendentLicense: e.target.value })}
                className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Tax Identification Number (TIN / VAT #)</label>
              <input
                type="text"
                value={profileForm.taxIdentificationNumber}
                onChange={e => setProfileForm({ ...profileForm, taxIdentificationNumber: e.target.value })}
                className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Customer Care Phone Numbers</label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Official Dispensary Email</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-semibold block mb-1">Physical Dispensary Address</label>
              <input
                type="text"
                value={profileForm.address}
                onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">City / Municipality</label>
              <input
                type="text"
                value={profileForm.city}
                onChange={e => setProfileForm({ ...profileForm, city: e.target.value })}
                className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">State / Region & Country</label>
              <input
                type="text"
                value={profileForm.state}
                onChange={e => setProfileForm({ ...profileForm, state: e.target.value })}
                className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-semibold block mb-1">Receipt & Branding Tagline</label>
              <input
                type="text"
                value={profileForm.tagline}
                onChange={e => setProfileForm({ ...profileForm, tagline: e.target.value })}
                className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: STAFF USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Search staff name, email, license..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={userRoleFilter}
                onChange={e => setUserRoleFilter(e.target.value)}
                className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Roles</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Pharmacy Admin">Pharmacy Admin</option>
                <option value="Pharmacist">Pharmacist</option>
                <option value="Cashier">Cashier</option>
                <option value="Stock Officer">Stock Officer</option>
                <option value="Accountant">Accountant</option>
                <option value="Auditor">Auditor</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-semibold text-slate-600 dark:text-slate-400 select-none border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3 w-16 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <input
                          ref={el => {
                            if (el) el.indeterminate = isSomeUsersSelected;
                          }}
                          type="checkbox"
                          checked={isAllUsersSelected}
                          onChange={toggleSelectAllUsers}
                          className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                          title="Select All"
                        />
                        <span className="font-mono text-[11px] text-slate-400">#</span>
                      </div>
                    </th>
                    <th className="p-3">Staff Name</th>
                    <th className="p-3">System Role</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">PCN / Medical License</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No staff members found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u, index) => {
                      const isSelected = selectedUserIds.includes(u.id);
                      return (
                        <tr 
                          key={u.id}
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
                                onChange={() => toggleSelectUser(u.id)}
                                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                              />
                              <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 w-5 text-right">
                                {index + 1}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{u.name}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300">
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">{u.email}</td>
                          <td className="p-3 font-mono text-slate-500">{u.licenseNumber || '—'}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              u.active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {u.active ? 'Active' : 'Deactivated'}
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
              selectedCount={selectedUserIds.length}
              totalCount={filteredUsers.length}
              onClearSelection={() => setSelectedUserIds([])}
              actions={[
                {
                  label: 'Export Staff CSV',
                  icon: FileSpreadsheet,
                  onClick: handleExportUsersCSV,
                  variant: 'secondary'
                }
              ]}
            />
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOM ROLE BUILDER */}
      {activeTab === 'roles' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Custom Role Builder (Granular RBAC)</h3>
              <p className="text-xs text-slate-500">Define tailored staff privileges, action gates, and financial authorization ceilings.</p>
            </div>
            <button
              onClick={() => setShowRoleModal(true)}
              className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Role</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customRoles.map(role => (
              <div key={role.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{role.name}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                    Custom RBAC
                  </span>
                </div>
                <p className="text-slate-500 text-[11px]">{role.description}</p>
                <div className="pt-2 border-t flex justify-between font-medium">
                  <span>Financial Approval Limit:</span>
                  <span className="font-bold text-brand-600">{formatCurrency(role.financialLimit)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PERMISSIONS & STAFF AUTHORIZATIONS */}
      {activeTab === 'permissions' && (
        <div className="space-y-4">
          {/* Top Banner & Sub-View Switcher */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
                  <KeyRound className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Permissions, Authorizations & Staff Security Governance
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dual-layer security architecture: Role-Based Access Control (RBAC) baseline matrices paired with individual staff authorization thresholds (discounts, refunds, stock adjustments, expense ceilings, and 2FA).
                  </p>
                </div>
              </div>
            </div>

            {/* Sub-view toggle */}
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setPermSubTab('matrix')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                  permSubTab === 'matrix' ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-sm font-bold' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Role Permission Matrix</span>
              </button>
              <button
                type="button"
                onClick={() => setPermSubTab('users')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                  permSubTab === 'users' ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-sm font-bold' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>User Direct Authorizations</span>
              </button>
            </div>
          </div>

          {/* SUB-VIEW 1: ROLE PERMISSION MATRIX */}
          {permSubTab === 'matrix' && (
            <div className="space-y-4">
              {/* Role Selection & Quick Presets Toolbar */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Target Role:</label>
                    <select
                      value={selectedRole}
                      onChange={e => setSelectedRole(e.target.value)}
                      className="p-2 rounded-xl border border-brand-300 dark:border-brand-700 bg-brand-50/50 dark:bg-brand-950/40 font-bold text-brand-900 dark:text-brand-200"
                    >
                      {allRoles.map(roleName => (
                        <option key={roleName} value={roleName}>
                          {roleName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    selectedRole === 'Super Admin'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                      : customRoles.some(r => r.name === selectedRole)
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300'
                      : 'bg-brand-100 text-brand-800 dark:bg-brand-950/80 dark:text-brand-300'
                  }`}>
                    {selectedRole === 'Super Admin' ? 'System Protected (Unrestricted)' : customRoles.some(r => r.name === selectedRole) ? 'Custom User Defined Role' : 'Standard Predefined Role'}
                  </span>

                  <span className="text-slate-500 font-mono text-[11px]">
                    Assigned to {users.filter(u => u.role === selectedRole).length} active staff member(s)
                  </span>
                </div>

                {/* Quick Presets & Save */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-400 font-medium">Quick Presets:</span>
                  <button
                    type="button"
                    disabled={selectedRole === 'Super Admin'}
                    onClick={() => applyPreset('grant_all')}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold disabled:opacity-40"
                  >
                    Grant All
                  </button>
                  <button
                    type="button"
                    disabled={selectedRole === 'Super Admin'}
                    onClick={() => applyPreset('read_only')}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold disabled:opacity-40"
                  >
                    Read-Only Auditor
                  </button>
                  <button
                    type="button"
                    disabled={selectedRole === 'Super Admin'}
                    onClick={() => applyPreset('reset_defaults')}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center space-x-1 disabled:opacity-40"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Defaults</span>
                  </button>
                </div>
              </div>

              {/* Educational Rule Banner (Collapsible / Hoverable) */}
              <WorkflowGuideNotice
                title="Clinical Governance & Regulatory Audit Rules"
                subtitle="Read visibility rules, draft-only deletion, and compliance standards"
                badgeText="Compliance Standard"
                variant="blue"
              >
                <div className="space-y-1.5 text-xs text-blue-800 dark:text-blue-300">
                  <p className="leading-relaxed">
                    • <strong>Read Access is Mandatory for Visibility:</strong> Disabling Read on any module automatically suppresses navigation and revokes all sub-actions (Create, Update, Delete, Approve, Export).
                  </p>
                  <p className="leading-relaxed">
                    • <strong>Draft-Only Deletion:</strong> The <em>Delete</em> permission strictly applies to uncommitted draft transactions (e.g. unposted GRNs or draft POs). Completed sales, disbursed expenses, and confirmed batch intakes are locked and cannot be deleted, satisfying PCN and international pharmacy audit standards.
                  </p>
                </div>
              </WorkflowGuideNotice>

              {/* Success Banner */}
              {roleSavedSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Role permissions and sensitive controls updated for "{selectedRole}". Session authorization caches refreshed.</span>
                </div>
              )}

              {/* The RBAC Matrix Table */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3 min-w-[220px]">Module / Pharmacy Domain</th>
                        {ACTION_CONFIG.map(action => (
                          <th key={action.id} className="p-3 text-center min-w-[90px]">
                            <div className="flex flex-col items-center">
                              <span>{action.name}</span>
                              <button
                                type="button"
                                disabled={selectedRole === 'Super Admin'}
                                onClick={() => handleToggleActionAcrossModules(action.id)}
                                title={`Toggle "${action.name}" across all modules`}
                                className="text-[10px] text-brand-600 dark:text-brand-400 hover:underline font-normal mt-0.5 disabled:opacity-40"
                              >
                                Toggle All
                              </button>
                            </div>
                          </th>
                        ))}
                        <th className="p-3 text-center min-w-[80px]">Quick Row</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {MODULE_CONFIG.map(mod => {
                        const currentModPermissions = matrixState[mod.id] || {
                          create: false,
                          read: false,
                          update: false,
                          delete: false,
                          approve: false,
                          export: false,
                          override: false,
                        };
                        const allRowActionsActive = ACTION_CONFIG.every(a => currentModPermissions[a.id]);

                        return (
                          <tr 
                            key={mod.id} 
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
                          >
                            <td className="p-3">
                              <div className="space-y-0.5">
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-slate-900 dark:text-white">{mod.name}</span>
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                    {mod.category}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 leading-tight">
                                  {mod.description}
                                </p>
                              </div>
                            </td>

                            {ACTION_CONFIG.map(action => {
                              const isGranted = !!currentModPermissions[action.id];
                              const isReadDisabled = selectedRole === 'Super Admin';

                              return (
                                <td key={action.id} className="p-3 text-center">
                                  <label className="inline-flex items-center justify-center cursor-pointer p-1">
                                    <input
                                      type="checkbox"
                                      disabled={isReadDisabled}
                                      checked={selectedRole === 'Super Admin' ? true : isGranted}
                                      onChange={() => handleToggleMatrixAction(mod.id, action.id)}
                                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer disabled:cursor-not-allowed"
                                    />
                                  </label>
                                </td>
                              );
                            })}

                            <td className="p-3 text-center">
                              <button
                                type="button"
                                disabled={selectedRole === 'Super Admin'}
                                onClick={() => handleToggleAllForModule(mod.id)}
                                className={`px-2 py-1 rounded text-[10px] font-semibold transition disabled:opacity-40 ${
                                  allRowActionsActive
                                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-100'
                                    : 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 hover:bg-brand-100'
                                }`}
                              >
                                {allRowActionsActive ? 'Clear Row' : 'All Row'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sensitive Commercial & Governance Controls */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="border-b pb-2 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-brand-600" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Sensitive Commercial & Diagnostic Gates</h3>
                  </div>
                  <span className="text-[11px] text-slate-500">Applies to all staff members assigned to {selectedRole}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  {/* View Cost */}
                  <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 cursor-pointer hover:border-brand-300 transition">
                    <input
                      type="checkbox"
                      disabled={selectedRole === 'Super Admin'}
                      checked={selectedRole === 'Super Admin' ? true : sensitiveState.viewCost}
                      onChange={e => setSensitiveState({ ...sensitiveState, viewCost: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                    />
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1">
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>View Wholesale Cost Prices</span>
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Exposes purchase unit costs on catalogue cards, inventory ledgers, and GRN receipts. Usually hidden from junior dispensary cashiers.
                      </p>
                    </div>
                  </label>

                  {/* View Profit */}
                  <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 cursor-pointer hover:border-brand-300 transition">
                    <input
                      type="checkbox"
                      disabled={selectedRole === 'Super Admin'}
                      checked={selectedRole === 'Super Admin' ? true : sensitiveState.viewProfit}
                      onChange={e => setSensitiveState({ ...sensitiveState, viewProfit: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                    />
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1">
                        <BadgePercent className="w-3.5 h-3.5 text-slate-500" />
                        <span>View Gross Profit & Margin %</span>
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Shows product profit margins, live markup predictors, and commercial revenue breakdowns.
                      </p>
                    </div>
                  </label>

                  {/* View Audit */}
                  <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 cursor-pointer hover:border-brand-300 transition">
                    <input
                      type="checkbox"
                      disabled={selectedRole === 'Super Admin'}
                      checked={selectedRole === 'Super Admin' ? true : sensitiveState.viewAudit}
                      onChange={e => setSensitiveState({ ...sensitiveState, viewAudit: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                    />
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                        <span>View Immutable Audit Logs</span>
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Grants access to tamper-evident actor logs, IP addresses, credential changes, and system events.
                      </p>
                    </div>
                  </label>

                  {/* Manage Settings */}
                  <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 cursor-pointer hover:border-brand-300 transition">
                    <input
                      type="checkbox"
                      disabled={selectedRole === 'Super Admin'}
                      checked={selectedRole === 'Super Admin' ? true : sensitiveState.manageSettings}
                      onChange={e => setSensitiveState({ ...sensitiveState, manageSettings: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                    />
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Manage Dispensary System Settings</span>
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Allows editing premises license, superintendent credentials, active operating currency, and printer templates.
                      </p>
                    </div>
                  </label>

                  {/* Protected Diagnostics */}
                  <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 cursor-pointer hover:border-brand-300 transition">
                    <input
                      type="checkbox"
                      disabled={selectedRole === 'Super Admin'}
                      checked={selectedRole === 'Super Admin' ? true : sensitiveState.protectedDiagnostics}
                      onChange={e => setSensitiveState({ ...sensitiveState, protectedDiagnostics: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                    />
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1">
                        <Sliders className="w-3.5 h-3.5 text-slate-500" />
                        <span>Access Technical Health & Docker</span>
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Allows monitoring PostgreSQL, Redis, local Docker service status, and technical latency logs.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-[11px] text-slate-500">
                    Changes take effect immediately across all client sessions for this role.
                  </span>
                  <button
                    type="button"
                    disabled={selectedRole === 'Super Admin'}
                    onClick={handleSaveRolePermissions}
                    className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow flex items-center space-x-1.5 transition disabled:opacity-40"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Role Permissions Matrix</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: USER DIRECT AUTHORIZATIONS & LIMITS */}
          {permSubTab === 'users' && (
            <div className="space-y-4 text-xs">
              {/* Staff Member Selector Bar */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Select Staff Member:</label>
                  <select
                    value={selectedUserId}
                    onChange={e => setSelectedUserId(e.target.value)}
                    className="p-2.5 rounded-xl border border-brand-300 dark:border-brand-700 bg-brand-50/50 dark:bg-brand-950/40 font-bold text-brand-900 dark:text-brand-200 min-w-[260px]"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.role} ({u.active ? 'Active' : 'Inactive'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-slate-500 text-[11px]">Staff Account ID:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {selectedUser?.id}
                  </span>
                </div>
              </div>

              {/* Action Notification */}
              {userActionNotice && (
                <div className="p-3 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 font-semibold flex items-center space-x-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{userActionNotice}</span>
                </div>
              )}

              {/* Success Notification */}
              {userSavedSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Authorizations, financial ceilings, and security flags updated for {selectedUser?.name}.</span>
                </div>
              )}

              {/* User Overview Profile & Inline Role/Status Management */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 font-bold text-lg flex items-center justify-center border border-brand-200 dark:border-brand-800">
                      {selectedUser?.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                        <span>{selectedUser?.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          selectedUser?.active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {selectedUser?.active ? 'ACTIVE' : 'DEACTIVATED'}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {selectedUser?.email} • {selectedUser?.branchName}
                        {selectedUser?.licenseNumber && ` • PCN: ${selectedUser?.licenseNumber}`}
                      </p>
                    </div>
                  </div>

                  {/* Inline Role Changing & Account Status Controls */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-semibold text-slate-500">Assigned Role:</span>
                      <select
                        value={selectedUser?.role}
                        onChange={e => handleUserRoleChange(e.target.value)}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                      >
                        {allRoles.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleUserStatusToggle}
                      className={`px-3 py-2 rounded-xl font-bold flex items-center space-x-1.5 border transition ${
                        selectedUser?.active
                          ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300'
                      }`}
                    >
                      {selectedUser?.active ? (
                        <>
                          <UserX className="w-3.5 h-3.5" />
                          <span>Deactivate Account</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Activate Account</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Session & Credential Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">Session Management</span>
                      <span className="text-[11px] text-slate-500">
                        {userAuthForm.sessionsActive ?? 1} active session(s) detected across web and POS
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRevokeSessions}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold"
                    >
                      Revoke Sessions
                    </button>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">Password & Credentials</span>
                      <span className="text-[11px] text-slate-500">
                        Last changed: {userAuthForm.lastPasswordChange || '2026-09-01'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetCredentials}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold"
                    >
                      Reset Credentials
                    </button>
                  </div>
                </div>
              </div>

              {/* Financial Authorization Ceilings (Thresholds) Card */}
              <form onSubmit={handleSaveUserAuth} className="space-y-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="border-b pb-2 flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-brand-600" />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">Individual Financial Authorization Limits (Thresholds)</h3>
                      <p className="text-[11px] text-slate-500">
                        Transactional ceilings enforced directly at POS terminals, requisition gates, and journal disbursements.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Max POS Discount % */}
                    <div className="space-y-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold block text-slate-800 dark:text-slate-200">
                          Maximum POS Discount (%)
                        </label>
                        <FieldGuideNotice label="Read benchmarks & rules" variant="brand">
                          <p><strong>Clinical benchmark:</strong> Cashier: 5%, Pharmacist: 15%, Manager: 25%. Discounts beyond this % require supervisor PIN authorization.</p>
                        </FieldGuideNotice>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={userAuthForm.maxDiscountPercent}
                          onChange={e => setUserAuthForm({ ...userAuthForm, maxDiscountPercent: Math.max(0, Math.min(100, Number(e.target.value))) })}
                          className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 font-bold"
                        />
                        <span className="font-bold text-slate-500">%</span>
                      </div>
                    </div>

                    {/* Max Refund Limit */}
                    <div className="space-y-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold block text-slate-800 dark:text-slate-200">
                          Max Refund Limit ({currentCurrency.symbol})
                        </label>
                        <FieldGuideNotice label="Read benchmarks & rules" variant="brand">
                          <p><strong>Standard limits:</strong> Cashier: {formatCurrency(100)}, Pharmacist: {formatCurrency(500)}, Manager: {formatCurrency(2500)}. Counter returns above this require supervisor authorization.</p>
                        </FieldGuideNotice>
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={userAuthForm.maxRefundLimit}
                        onChange={e => setUserAuthForm({ ...userAuthForm, maxRefundLimit: Math.max(0, Number(e.target.value)) })}
                        className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 font-bold"
                      />
                    </div>

                    {/* Stock Adjustment Limit */}
                    <div className="space-y-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold block text-slate-800 dark:text-slate-200">
                          Stock Adjustment Limit ({currentCurrency.symbol})
                        </label>
                        <FieldGuideNotice label="Read benchmarks & rules" variant="brand">
                          <p><strong>Stock controls:</strong> Max inventory variance write-off value permitted without administrative board authorization (e.g. Stock Officer: {formatCurrency(5000)}, Manager: {formatCurrency(15000)}).</p>
                        </FieldGuideNotice>
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={userAuthForm.stockAdjustmentLimit}
                        onChange={e => setUserAuthForm({ ...userAuthForm, stockAdjustmentLimit: Math.max(0, Number(e.target.value)) })}
                        className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 font-bold"
                      />
                    </div>

                    {/* Expense Approval Limit */}
                    <div className="space-y-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold block text-slate-800 dark:text-slate-200">
                          Expense Sign-off Limit ({currentCurrency.symbol})
                        </label>
                        <FieldGuideNotice label="Read benchmarks & rules" variant="brand">
                          <p><strong>Operational expenses:</strong> Petty cash or utility disbursements allowed without Superintendent sign-off (e.g. Accountant: {formatCurrency(25000)}, Manager: {formatCurrency(30000)}).</p>
                        </FieldGuideNotice>
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={userAuthForm.expenseApprovalLimit}
                        onChange={e => setUserAuthForm({ ...userAuthForm, expenseApprovalLimit: Math.max(0, Number(e.target.value)) })}
                        className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 font-bold"
                      />
                    </div>

                    {/* PO Approval Limit */}
                    <div className="space-y-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold block text-slate-800 dark:text-slate-200">
                          PO Authorization Limit ({currentCurrency.symbol})
                        </label>
                        <FieldGuideNotice label="Read benchmarks & rules" variant="brand">
                          <p><strong>Supply chain procurement:</strong> Max supplier order this staff member can approve for dispatch to distributors (e.g. Procurement Officer: {formatCurrency(10000)}, Manager: {formatCurrency(75000)}).</p>
                        </FieldGuideNotice>
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={userAuthForm.poApprovalLimit}
                        onChange={e => setUserAuthForm({ ...userAuthForm, poApprovalLimit: Math.max(0, Number(e.target.value)) })}
                        className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Security, Price Overrides & Privacy Controls */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="border-b pb-2 flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-brand-600" />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">Security & Price Discretion Gates</h3>
                      <p className="text-[11px] text-slate-500">Fine-grained operational overrides tailored for this individual user.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Require 2FA */}
                    <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 cursor-pointer hover:border-brand-300 transition">
                      <input
                        type="checkbox"
                        checked={userAuthForm.requireTwoFactor}
                        onChange={e => setUserAuthForm({ ...userAuthForm, requireTwoFactor: e.target.checked })}
                        className="mt-0.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                      />
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1">
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Enforce Two-Factor Authentication</span>
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Mandatory TOTP authenticator code required on login. Recommended for all administrators, managers, and remote users.
                        </p>
                      </div>
                    </label>

                    {/* Override Selling Price */}
                    <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 cursor-pointer hover:border-brand-300 transition">
                      <input
                        type="checkbox"
                        checked={userAuthForm.canOverridePrice}
                        onChange={e => setUserAuthForm({ ...userAuthForm, canOverridePrice: e.target.checked })}
                        className="mt-0.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                      />
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1">
                          <Coins className="w-3.5 h-3.5 text-slate-500" />
                          <span>Allow POS Selling Price Overrides</span>
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Permits manually adjusting item dispensing price on counter checkout without supervisor approval.
                        </p>
                      </div>
                    </label>

                    {/* View Cost Prices */}
                    <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 cursor-pointer hover:border-brand-300 transition">
                      <input
                        type="checkbox"
                        checked={userAuthForm.canViewCostPrices}
                        onChange={e => setUserAuthForm({ ...userAuthForm, canViewCostPrices: e.target.checked })}
                        className="mt-0.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                      />
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1">
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Allow Viewing Cost & Margins</span>
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Directly overrides role setting to reveal wholesale acquisition costs and gross margins to this user.
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => setUserAuthForm(getUserAuthorization(selectedUserId))}
                      className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
                    >
                      Reset Form Changes
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow flex items-center space-x-1.5 transition"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save User Authorizations & Thresholds</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SETTINGS & CURRENCY CONFIGURATION */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Currency Configuration Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
            <div className="border-b pb-2 flex items-center space-x-2">
              <Coins className="w-4 h-4 text-brand-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active System Currency</h3>
            </div>
            
            <p className="text-slate-500">
              Select the active operating currency. Point of Sale checkout receipts, Catalogue packaging tiers, Wholesale Purchase GRNs, and Financial Ledgers will instantly format to this currency across all terminals.
            </p>

            <div className="space-y-3">
              <div>
                <label className="font-semibold block mb-1">Operating Currency</label>
                <select
                  value={currentCurrency.code}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-brand-300 dark:border-brand-700 bg-brand-50/50 dark:bg-brand-950/30 font-bold text-brand-900 dark:text-brand-200"
                >
                  {supportedCurrencies.map((curr: any) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.code} ({curr.symbol}) — {curr.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Currency Preview Card */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>Selected Currency Symbol:</span>
                  <span className="font-bold font-mono text-sm text-brand-600">{currentCurrency.symbol}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>Sample Amount (1,250.50):</span>
                  <span className="font-bold font-mono text-base text-slate-900 dark:text-white">{formatCurrency(1250.50)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>Currency Code:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{currentCurrency.code}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Primary currency is set to Ghanaian Cedi (GH₵) with immediate hot-swap to NGN, USD, GBP, EUR, and KES.</span>
              </div>
            </div>
          </div>

          {/* Operational Governance Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
            <div className="border-b pb-2 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Security & Operational Governance</h3>
            </div>
            <p className="text-slate-500">
              Dispensary regulatory standing is verified against PCN premises database. Superintendent pharmacist possesses overriding clinical dispensation authority.
            </p>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Active Premise License:</span>
                  <span className="font-bold font-mono text-brand-600">{systemProfile.premisesLicense}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Superintendent Pharmacist:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{systemProfile.superintendentName}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Superintendent Annual License:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{systemProfile.superintendentLicense}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 text-[11px] flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600" />
                <span>All prescription dispensations are cryptographically tagged with active premises and pharmacist credentials.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Creation Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateRole} className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Define New Custom RBAC Role</h3>
              <button type="button" onClick={() => setShowRoleModal(false)}><X className="w-4 h-4" /></button>
            </div>

            <div className="text-xs space-y-3">
              <div>
                <label className="font-semibold block mb-1">Role Title *</label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  placeholder="e.g. Intern Pharmacist, Senior Cashier"
                  className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Role Description</label>
                <input
                  type="text"
                  value={newRoleDesc}
                  onChange={e => setNewRoleDesc(e.target.value)}
                  placeholder="Operational scope and authorizations..."
                  className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Maximum Financial Approval Ceiling ({currentCurrency.symbol})</label>
                <input
                  type="number"
                  value={financialLimit}
                  onChange={e => setFinancialLimit(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button type="button" onClick={() => setShowRoleModal(false)} className="px-4 py-2 border rounded-xl text-xs font-semibold">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold shadow">
                Save Custom Role
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
