import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, ShieldCheck, Coins, Search, Plus, X, 
  CheckCircle2, FileSpreadsheet, Check, KeyRound, Lock, Unlock,
  Sliders, Eye, EyeOff, AlertTriangle, RotateCcw, BadgePercent,
  CheckCheck, Info, Shield, UserCheck, UserX, Layers, Sparkles, RefreshCw,
  Stethoscope, Zap, MapPin, Warehouse, Trash2, Edit3, Store, Image, UploadCloud,
  Palette, Receipt
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { defaultPermissions, defaultSensitiveControls } from '../../data/mock/users';
import { supportedCurrencies } from '../../data/mock/units';
import { ALL_NAVIGATION_MODULES, defaultEnabledModules, defaultRoleMenuAccess } from '../../data/mock/modules';
import { 
  CustomRoleDefinition, ModuleName, PermissionAction, 
  PermissionMatrix, RoleSensitiveControls, UserAuthorization, RoleType,
  StorageLocation, User, isDemoUser, getUserAssignedRoles, getUserPrimaryRole
} from '../../types';
import { FloatingBulkActionBar } from '../../components/common/FloatingBulkActionBar';
import { WorkflowGuideNotice } from '../../components/common/WorkflowGuideNotice';
import { FieldGuideNotice } from '../../components/common/FieldGuideNotice';
import { Pagination } from '../../components/common/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { CreateUserModal } from './components/CreateUserModal';
import { UserCredentialsModal } from './components/UserCredentialsModal';
import { AssignUserRolesModal } from './components/AssignUserRolesModal';
import { PharmacyBrandingSection } from './components/PharmacyBrandingSection';

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
    roleMenuAccess,
    updateRolePermissions,
    updateUserAuthorization,
    updateRoleMenuAccess,
    updateUserRole,
    updateUserStatus,
    revokeUserSessions,
    resetUserCredentials,
    getUserAuthorization,
    storageLocations,
    addStorageLocation,
    updateStorageLocation,
    deleteStorageLocation,
    adminResetPassword,
    operatingMode,
    toast,
    confirmDialog
  } = usePharmacy();

  const [showDemoUsersInProd, setShowDemoUsersInProd] = useState(false);

  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'roles' | 'permissions' | 'branding' | 'settings'>('profile');

  // User Management Modals State
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [credentialsModal, setCredentialsModal] = useState<{
    isOpen: boolean;
    user: User | null;
    tempPassword: string;
    isReset: boolean;
  }>({
    isOpen: false,
    user: null,
    tempPassword: '',
    isReset: false,
  });

  // Dispensary Profile Form State
  const [profileForm, setProfileForm] = useState(systemProfile);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    setProfileForm(systemProfile);
  }, [systemProfile]);

  // Storage Locations & Branches State
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<StorageLocation | null>(null);
  const [locCode, setLocCode] = useState('');
  const [locName, setLocName] = useState('');
  const [locType, setLocType] = useState<StorageLocation['type']>('BRANCH');
  const [locAddress, setLocAddress] = useState('Main Dispensary Floor');
  const [locDescription, setLocDescription] = useState('');
  const [locIsActive, setLocIsActive] = useState(true);

  const handleOpenAddLocation = () => {
    setEditingLocation(null);
    setLocCode(`LOC-2026-${Math.floor(100 + Math.random() * 900)}`);
    setLocName('');
    setLocType('BRANCH');
    setLocAddress('Main Dispensary Floor');
    setLocDescription('');
    setLocIsActive(true);
    setShowLocationModal(true);
  };

  const handleOpenEditLocation = (loc: StorageLocation) => {
    setEditingLocation(loc);
    setLocCode(loc.code || '');
    setLocName(loc.name);
    setLocType(loc.type);
    setLocAddress(loc.address || '');
    setLocDescription(loc.description || '');
    setLocIsActive(loc.isActive ?? true);
    setShowLocationModal(true);
  };

  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName.trim()) {
      toast.warning('Please enter a location or branch name.', 'Location Name Required');
      return;
    }
    if (editingLocation) {
      updateStorageLocation(editingLocation.id, {
        code: locCode,
        name: locName,
        type: locType,
        address: locAddress,
        description: locDescription,
        isActive: locIsActive
      });
    } else {
      addStorageLocation({
        code: locCode,
        name: locName,
        type: locType,
        address: locAddress,
        description: locDescription,
        isActive: locIsActive
      });
    }
    setShowLocationModal(false);
  };

  // Staff Users Directory State
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [assignRolesModal, setAssignRolesModal] = useState<{ isOpen: boolean; user: User | null }>({ isOpen: false, user: null });

  // Custom Role Builder State
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [financialLimit, setFinancialLimit] = useState('500000');

  // Permissions & Authorizations Tab State
  const [permSubTab, setPermSubTab] = useState<'matrix' | 'users' | 'navigation'>('matrix');

  // Role Menu & Navigation Access State
  const [selectedNavRole, setSelectedNavRole] = useState<string>('Pharmacist');
  const [navRoleMenuState, setNavRoleMenuState] = useState<Record<string, boolean>>(() => {
    return roleMenuAccess['Pharmacist'] || defaultRoleMenuAccess['Pharmacist'] || { ...defaultEnabledModules };
  });
  const [navSavedSuccess, setNavSavedSuccess] = useState(false);

  // Sync navRoleMenuState when selectedNavRole changes
  useEffect(() => {
    if (roleMenuAccess[selectedNavRole]) {
      setNavRoleMenuState({ ...roleMenuAccess[selectedNavRole] });
    } else if (defaultRoleMenuAccess[selectedNavRole as RoleType]) {
      setNavRoleMenuState({ ...defaultRoleMenuAccess[selectedNavRole as RoleType] });
    } else {
      setNavRoleMenuState({ ...defaultEnabledModules });
    }
  }, [selectedNavRole, roleMenuAccess]);

  const handleToggleNavRoleModule = (moduleId: string) => {
    if (selectedNavRole === 'Super Admin' && moduleId === 'settings') return; // Settings is permanent for super admin
    setNavRoleMenuState(prev => {
      const current = prev[moduleId] !== false;
      const nextState = !current;
      const updated = { ...prev, [moduleId]: nextState };

      // If disabling a parent module, also disable all child sub-modules
      if (!nextState && !moduleId.includes(':')) {
        ALL_NAVIGATION_MODULES.filter(m => m.parentId === moduleId).forEach(sub => {
          updated[sub.id] = false;
        });
      }
      // If enabling a child sub-module, ensure parent module is enabled too
      if (nextState && moduleId.includes(':')) {
        const parentId = moduleId.split(':')[0];
        updated[parentId] = true;
      }
      return updated;
    });
  };

  const handleNavRolePreset = (preset: 'grant_all' | 'dispensary' | 'reset_defaults') => {
    if (preset === 'grant_all') {
      const allOn: Record<string, boolean> = {};
      ALL_NAVIGATION_MODULES.forEach(m => {
        allOn[m.id] = m.id === 'settings' ? selectedNavRole === 'Super Admin' : true;
      });
      setNavRoleMenuState(allOn);
    } else if (preset === 'dispensary') {
      const dispState: Record<string, boolean> = {
        dashboard: true,
        pos: true,
        sales: true,
        'sales:ledger': true,
        'sales:credit': false,
        'sales:drafts': true,
        'sales:returns': false,
        'sales:credits': false,
        catalogue: true,
        'catalogue:products': true,
        'catalogue:categories': false,
        'catalogue:dosage-forms': false,
        'catalogue:units': false,
        inventory: false,
        'inventory:stock': false,
        'inventory:adjustments': false,
        'inventory:quarantine': false,
        purchasing: false,
        'purchasing:orders': false,
        'purchasing:grn': false,
        parties: true,
        'parties:customers': true,
        'parties:suppliers': false,
        finance: false,
        'finance:expenses': false,
        'finance:loans': false,
        reports: false,
        administration: false,
        audit: false,
        settings: false,
      };
      setNavRoleMenuState(dispState);
    } else if (preset === 'reset_defaults') {
      const def = defaultRoleMenuAccess[selectedNavRole as RoleType] || defaultEnabledModules;
      setNavRoleMenuState({ ...def });
    }
  };

  const handleSaveNavRoleMenuAccess = () => {
    updateRoleMenuAccess(selectedNavRole, navRoleMenuState);
    setNavSavedSuccess(true);
    setTimeout(() => setNavSavedSuccess(false), 4000);
  };

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
    'Sales Person',
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
    toast.success(`Custom role "${newRole.name}" saved to RBAC registry.`, 'Role Created');
  };

  const isSuperAdmin = currentUser?.role === 'Super Admin';
  const isDemo = operatingMode === 'DEMO';

  const visibleUsers = users.filter(u => {
    if (isDemo) return true;
    if (isSuperAdmin && showDemoUsersInProd) return true;
    return !isDemoUser(u);
  });

  const filteredUsers = visibleUsers.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                          (u.licenseNumber || '').toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const {
    currentPage: usersPage,
    setCurrentPage: setUsersPage,
    paginatedItems: paginatedUsers
  } = usePagination(filteredUsers, 10, [userSearch, userRoleFilter, showDemoUsersInProd]);

  const {
    currentPage: locationsPage,
    setCurrentPage: setLocationsPage,
    paginatedItems: paginatedLocations
  } = usePagination(storageLocations || [], 10);

  const {
    currentPage: rolesPage,
    setCurrentPage: setRolesPage,
    paginatedItems: paginatedRoles
  } = usePagination(customRoles, 10);

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
            onClick={() => setActiveTab('branding')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1 ${
              activeTab === 'branding' ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-sm font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Pharmacy Branding & UI</span>
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

      {/* TAB 1: DISPENSARY SYSTEM PROFILE & STORAGE LOCATIONS */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
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
            <div className="md:col-span-2 bg-gradient-to-r from-brand-50 to-emerald-50 dark:from-brand-950/40 dark:to-emerald-950/40 p-4 rounded-2xl border-2 border-brand-300 dark:border-brand-700/80 space-y-2 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center space-x-2">
                  <Store className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>Shop / Active Branch Location Name *</span>
                </label>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/80 text-brand-700 dark:text-brand-300 font-bold border border-brand-200 dark:border-brand-800 w-fit">
                  Live on Receipts, Invoices & TopBar
                </span>
              </div>
              <input
                type="text"
                required
                id="input-shop-branch-name"
                placeholder="e.g. Greenlife Central Branch (Victoria Island)"
                value={profileForm.branchName || ''}
                onChange={e => setProfileForm({ ...profileForm, branchName: e.target.value })}
                className="w-full p-2.5 rounded-xl border-2 border-brand-400 dark:border-brand-600 bg-white dark:bg-slate-900 font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 shadow-inner"
              />
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                ⭐ Enter your custom shop / branch name here (e.g. <strong>Greenlife Central Branch (Victoria Island)</strong>). Clicking <strong>Save System Profile</strong> updates this name across the <strong>Top Bar</strong>, <strong>Thermal POS Receipts</strong>, <strong>Sales Reprints</strong>, <strong>Medication Return Slips</strong>, <strong>Credit Vouchers</strong>, and all official records.
              </p>
            </div>

            {/* Dispensary Brand Logo Card */}
            <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center space-x-2">
                  <Image className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>Dispensary Brand Logo (Receipts, Invoices & Official Documents)</span>
                </label>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 w-fit">
                  Receipts, Reports & Slips
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Upload your pharmacy brand logo or paste an image URL. When enabled in <strong>Printer Configuration</strong>, this logo prints at the top of 80mm & 58mm POS thermal receipts, invoice headers, and exported audit reports.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 items-start">
                <div className="md:col-span-2 space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <label className="flex-1 cursor-pointer flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border-2 border-dashed border-brand-300 dark:border-brand-700 hover:bg-brand-50/50 dark:hover:bg-brand-950/30 transition text-brand-700 dark:text-brand-300 font-bold text-xs bg-white dark:bg-slate-900 shadow-sm">
                      <UploadCloud className="w-4 h-4" />
                      <span>Choose Brand Logo File (PNG / JPG / SVG)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              toast.warning('Logo file must be under 2MB.', 'File Too Large');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = ev => {
                              const result = ev.target?.result as string;
                              if (result) {
                                setProfileForm({ ...profileForm, logoUrl: result });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {profileForm.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setProfileForm({ ...profileForm, logoUrl: '' })}
                        className="px-3 py-2 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center justify-center space-x-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Logo</span>
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-medium block mb-1">Or Direct Web Image URL:</label>
                    <input
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={profileForm.logoUrl || ''}
                      onChange={e => setProfileForm({ ...profileForm, logoUrl: e.target.value })}
                      className="w-full p-2 text-xs rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                    />
                  </div>
                </div>

                {/* Thermal Simulation Box */}
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner flex flex-col items-center justify-center text-center space-y-1.5">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Receipt Header Simulation
                  </span>
                  {profileForm.logoUrl ? (
                    <div className="space-y-1">
                      <img
                        src={profileForm.logoUrl}
                        alt="Dispensary Logo"
                        className="h-10 max-w-[140px] mx-auto object-contain p-0.5 border border-slate-200 dark:border-slate-700 rounded bg-white"
                      />
                      <p className="font-mono font-bold text-[11px] text-slate-900 dark:text-white uppercase tracking-tight">
                        {profileForm.branchName || profileForm.tradeName || 'Pharmacy Branch'}
                      </p>
                    </div>
                  ) : (
                    <div className="py-2 space-y-1">
                      <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 mx-auto flex items-center justify-center font-bold text-xs">
                        G+
                      </div>
                      <p className="text-[10px] text-slate-400">Default Brand Icon</p>
                    </div>
                  )}
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ Ready for 80mm & 58mm Thermal
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1">Pharmacy Legal Enterprise Name *</label>
              <input
                type="text"
                required
                value={profileForm.legalName}
                onChange={e => setProfileForm({ ...profileForm, legalName: e.target.value })}
                className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Official corporate registered title</span>
            </div>

            <div>
              <label className="font-semibold block mb-1">Trade / Storefront Brand Name</label>
              <input
                type="text"
                value={profileForm.tradeName}
                onChange={e => setProfileForm({ ...profileForm, tradeName: e.target.value })}
                className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Storefront brand title shown on receipts</span>
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

            {/* SUPER ADMIN CLINICAL DISPENSING POLICY: PRESCRIPTION SIGN-OFF REQUIRED (POM) */}
            <div className="md:col-span-2 border-t pt-5 mt-2 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-start space-x-3">
                  <div className={`p-2.5 rounded-xl ${
                    (profileForm.requireDoctorAuthorization ?? true)
                      ? 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300'
                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Prescription Sign-Off Required (POM)
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border border-violet-200">
                        Clinical Governance
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Toggle clinical authorization gating for Prescription-Only Medications (POM). When turned <strong>OFF</strong>, the system will never show the doctor authorization modal or warning messages—cashiers can sell immediately.
                    </p>
                  </div>
                </div>

                {/* Live Status Badge & Toggle Switch */}
                <div className="flex items-center space-x-4 self-end sm:self-center flex-shrink-0">
                  <div className="text-right">
                    {(profileForm.requireDoctorAuthorization ?? true) ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 border border-violet-300 flex items-center space-x-1 shadow-sm">
                        <Lock className="w-3 h-3 text-violet-600" />
                        <span>ON (Strict Sign-Off Required)</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 flex items-center space-x-1 shadow-sm">
                        <Unlock className="w-3 h-3 text-emerald-600" />
                        <span>OFF (Direct Sales Allowed)</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    id="toggle-prescription-signoff"
                    onClick={() => {
                      const newVal = !(profileForm.requireDoctorAuthorization ?? true);
                      const updated = { ...profileForm, requireDoctorAuthorization: newVal };
                      setProfileForm(updated);
                      // Apply immediately to systemProfile context as well
                      updateSystemProfile({ requireDoctorAuthorization: newVal });
                    }}
                    className={`relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      (profileForm.requireDoctorAuthorization ?? true) ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                    role="switch"
                    aria-checked={profileForm.requireDoctorAuthorization ?? true}
                    title="Toggle Prescription Sign-Off Required (POM)"
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        (profileForm.requireDoctorAuthorization ?? true) ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Policy Visual Simulation Box */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    POS Prescription Sign-Off Verification Modal Preview:
                  </span>
                  {(profileForm.requireDoctorAuthorization ?? true) ? (
                    <span className="text-[11px] font-semibold text-rose-600 flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Shown at POS Counter when dispensing POMs</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Bypassed: Cashiers will NOT see this modal; direct checkout allowed</span>
                    </span>
                  )}
                </div>

                {/* Simulated Modal Card */}
                <div className={`p-4 rounded-xl border max-w-lg transition-all ${
                  (profileForm.requireDoctorAuthorization ?? true)
                    ? 'border-violet-300 bg-violet-50/40 dark:bg-violet-950/20 opacity-100'
                    : 'border-dashed border-slate-300 bg-slate-50/50 dark:bg-slate-800/30 opacity-60'
                }`}>
                  <div className="flex items-center space-x-2 text-violet-700 dark:text-violet-400 font-bold text-xs pb-2 border-b border-violet-200 dark:border-violet-800/50 mb-3">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Prescription Sign-Off Required (POM)</span>
                    {!(profileForm.requireDoctorAuthorization ?? true) && (
                      <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">BYPASSED</span>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-[11px] text-slate-600 dark:text-slate-400">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Patient Name *: </span>
                      <span className="font-mono text-slate-500">Full patient name</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Prescribing Doctor *: </span>
                      <span className="text-slate-700 dark:text-slate-300">Dr. Kelechi Nnamdi</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Medical License Number *: </span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">MDCN-44109</span>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <p className="font-bold text-slate-800 dark:text-slate-200">Supervising Pharmacist Sign-Off</p>
                      <p className="text-[10px] text-emerald-600 font-semibold">Dr. Adeyemi Adeleke (PCN-SA-88392)</p>
                    </div>
                    <div className="flex justify-end space-x-2 pt-1 text-[10px]">
                      <span className="px-2.5 py-1 rounded border border-slate-300 bg-white dark:bg-slate-800 font-semibold">Cancel</span>
                      <span className="px-2.5 py-1 rounded bg-violet-600 text-white font-bold">Authorize & Continue</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* PHARMACY BRANDING & UI AESTHETICS (8-PALETTE SUITE) */}
        <PharmacyBrandingSection />

        {/* LOCATIONS, BRANCHES & RECEIVING BAYS REGISTRY */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                  <Warehouse className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Dispensary Branches, Shops & Storage Locations Registry
                  </h3>
                  <p className="text-xs text-slate-500">
                    Register additional retail shops, branch dispensaries, intake receiving bays, and cold rooms. These locations populate the GRN receiving dropdown automatically.
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="add-location-branch-btn"
                onClick={handleOpenAddLocation}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow flex items-center space-x-1.5 transition whitespace-nowrap self-end sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Branch / Location</span>
              </button>
            </div>

            {/* Locations Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Location Code</th>
                    <th className="p-3">Branch / Location Name</th>
                    <th className="p-3">Facility Type</th>
                    <th className="p-3">Address / Zone</th>
                    <th className="p-3">Operational Notes</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(paginatedLocations || []).map(loc => {
                    const typeBadge = (() => {
                      switch (loc.type) {
                        case 'BRANCH':
                          return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">Branch Pharmacy / Shop</span>;
                        case 'BAY':
                          return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Receiving Bay / Dock</span>;
                        case 'COLD_ROOM':
                          return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">Cold Chain (2°C - 8°C)</span>;
                        case 'WAREHOUSE':
                          return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Central Warehouse Depot</span>;
                        default:
                          return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">Dispensary Shelf</span>;
                      }
                    })();

                    return (
                      <tr key={loc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3 font-mono font-bold text-teal-700 dark:text-teal-400">
                          {loc.code}
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                            <span>{loc.name}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          {typeBadge}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">
                          {loc.address || 'Central Premises'}
                        </td>
                        <td className="p-3 text-slate-500 text-[11px] max-w-xs truncate">
                          {loc.description || '—'}
                        </td>
                        <td className="p-3 text-center">
                          {loc.isActive ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditLocation(loc)}
                              className="p-1.5 text-slate-600 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg transition"
                              title="Edit location"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const confirmed = await confirmDialog({
                                  title: 'Delete Storage Location',
                                  message: `Are you sure you want to delete storage location "${loc.name}"?`,
                                  description: 'Inventory items currently mapped to this bay will need reassignment.',
                                  confirmText: 'Delete Location',
                                  variant: 'danger'
                                });
                                if (confirmed) {
                                  deleteStorageLocation(loc.id);
                                  toast.success(`Storage location "${loc.name}" deleted.`, 'Location Deleted');
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                              title="Delete location"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={locationsPage}
              totalItems={(storageLocations || []).length}
              pageSize={10}
              onPageChange={setLocationsPage}
            />
          </div>
        </div>
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
                <option value="Manager">Manager</option>
                <option value="Pharmacist">Pharmacist</option>
                <option value="Cashier">Cashier</option>
                <option value="Sales Person">Sales Person</option>
                <option value="Stock Officer">Stock Officer</option>
                <option value="Procurement Officer">Procurement Officer</option>
                <option value="Accountant">Accountant</option>
                <option value="Auditor">Auditor</option>
              </select>

              {isSuperAdmin && !isDemo && (
                <button
                  type="button"
                  onClick={() => setShowDemoUsersInProd(!showDemoUsersInProd)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border flex items-center space-x-1.5 transition ${
                    showDemoUsersInProd
                      ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                  title="Toggle demo logins visibility (Super Admin Exclusive)"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{showDemoUsersInProd ? 'Hide Demo Logins' : 'Show Demo Logins'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowCreateUserModal(true)}
                className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Staff Member</span>
              </button>
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
                    <th className="p-3">Staff Member</th>
                    <th className="p-3">System Role</th>
                    <th className="p-3">Contact & Phone</th>
                    <th className="p-3">Date of Birth</th>
                    <th className="p-3">PCN / Medical License</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No staff members found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((u, index) => {
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
                                {(usersPage - 1) * 10 + index + 1}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center space-x-2.5">
                              {u.avatarUrl ? (
                                <img
                                  src={u.avatarUrl}
                                  alt={u.name}
                                  className="w-7 h-7 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center">
                                  {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white leading-tight flex items-center space-x-1.5">
                                  <span>{u.name}</span>
                                  {isDemoUser(u) && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                                      DEMO
                                    </span>
                                  )}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono">@{u.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            {(() => {
                              const assigned = getUserAssignedRoles(u);
                              const primary = getUserPrimaryRole(u);
                              const hasMultiple = assigned.length > 1;
                              return (
                                <div className="space-y-0.5">
                                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300">
                                      {primary}
                                    </span>
                                    {hasMultiple && (
                                      <span 
                                        className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 cursor-help"
                                        title={`Assigned Roles (${assigned.length}): ${assigned.join(', ')}`}
                                      >
                                        +{assigned.length - 1} more
                                      </span>
                                    )}
                                  </div>
                                  {hasMultiple && (
                                    <p className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]" title={assigned.join(', ')}>
                                      {assigned.filter(r => r !== primary).join(', ')}
                                    </p>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="p-3">
                            <div className="space-y-0.5">
                              <p className="text-slate-600 dark:text-slate-300 font-mono text-[11px]">{u.email}</p>
                              {u.phone && (
                                <p className="text-[10px] text-slate-500 font-mono flex items-center space-x-1">
                                  <span>📞 {u.phone}</span>
                                  {u.alternatePhone && <span className="text-slate-400">/ {u.alternatePhone}</span>}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                            {u.dob ? (
                              <span className="inline-flex items-center space-x-1">
                                <span>📅</span>
                                <span>{u.dob}</span>
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="p-3 font-mono text-slate-500">{u.licenseNumber || '—'}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              u.active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {u.active ? 'Active' : 'Deactivated'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                type="button"
                                onClick={() => setAssignRolesModal({ isOpen: true, user: u })}
                                className="p-1.5 text-brand-600 hover:text-brand-700 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-lg transition"
                                title="Assign Roles & Privileges (Multi-Role Management)"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={async () => {
                                  const confirmed = await confirmDialog({
                                    title: 'Reset Staff Password',
                                    message: `Reset password for staff member "${u.name}" (@${u.username})?`,
                                    description: 'A new single-use temporary password will be generated and active sessions will be terminated.',
                                    confirmText: 'Reset Password',
                                    variant: 'warning'
                                  });
                                  if (confirmed) {
                                    const res = adminResetPassword(u.id);
                                    setCredentialsModal({
                                      isOpen: true,
                                      user: res.user,
                                      tempPassword: res.tempPassword,
                                      isReset: true,
                                    });
                                    toast.success(`Temporary password generated for ${u.name}.`, 'Credentials Reset');
                                  }
                                }}
                                className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition"
                                title="Reset Password & Issue Temporary Credentials"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => updateUserStatus(u.id, !u.active)}
                                className={`p-1.5 rounded-lg transition ${
                                  u.active
                                    ? 'text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                    : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                }`}
                                title={u.active ? 'Deactivate Account' : 'Activate Account'}
                              >
                                {u.active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
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
              currentPage={usersPage}
              totalItems={filteredUsers.length}
              pageSize={10}
              onPageChange={setUsersPage}
            />

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
            {paginatedRoles.map(role => (
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

          {customRoles.length > 0 && (
            <Pagination
              currentPage={rolesPage}
              totalItems={customRoles.length}
              pageSize={10}
              onPageChange={setRolesPage}
            />
          )}
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
              <button
                type="button"
                onClick={() => setPermSubTab('navigation')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                  permSubTab === 'navigation' ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-sm font-bold' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Role Menu & Navigation Access</span>
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

                  {/* View All Staff Sales Records */}
                  <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 cursor-pointer hover:border-brand-300 transition">
                    <input
                      type="checkbox"
                      disabled={selectedRole === 'Super Admin'}
                      checked={selectedRole === 'Super Admin' ? true : !!sensitiveState.viewAllSalesRecords}
                      onChange={e => setSensitiveState({ ...sensitiveState, viewAllSalesRecords: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                    />
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1">
                        <Receipt className="w-3.5 h-3.5 text-slate-500" />
                        <span>View All Staff Sales Records</span>
                      </span>
                      <p className="text-[11px] text-slate-500">
                        When unchecked, sales persons and cashiers only see sales receipts/invoices they processed personally. When checked, they see store-wide sales from all staff.
                      </p>
                    </div>
                  </label>

                  {/* Elevated to Super Admin Settings */}
                  <div className="md:col-span-2 p-3.5 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700/80 bg-amber-50/70 dark:bg-amber-950/20 space-y-1.5">
                    <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                      <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Elevated to Super Admin Governance Settings</span>
                    </div>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                      <strong>Manage Dispensary System Settings</strong> (premises license, superintendent credentials, active operating currency, and printer templates) and <strong>Access Technical Health & Docker</strong> (PostgreSQL 16 connection pool, Redis cache, local Docker service status, and latency logs) are now exclusively accessible to <strong>Super Administrators</strong> under <strong>System Settings &gt; Super Admin Settings</strong>.
                    </p>
                  </div>
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

                    {/* View All Staff Sales Records */}
                    <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 cursor-pointer hover:border-brand-300 transition">
                      <input
                        type="checkbox"
                        checked={!!userAuthForm.canViewAllSalesRecords}
                        onChange={e => setUserAuthForm({ ...userAuthForm, canViewAllSalesRecords: e.target.checked })}
                        className="mt-0.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                      />
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1">
                          <Receipt className="w-3.5 h-3.5 text-slate-500" />
                          <span>Allow Viewing All Staff Sales Records</span>
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Directly overrides role restriction to grant this staff member access to view all store-wide sales transactions rather than only their personal records.
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

          {/* SUB-VIEW 3: ROLE MENU & NAVIGATION ACCESS */}
          {permSubTab === 'navigation' && (
            <div className="space-y-4 text-xs">
              {/* Role Selection & Quick Presets Toolbar */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Target Role:</label>
                    <select
                      value={selectedNavRole}
                      onChange={e => setSelectedNavRole(e.target.value)}
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
                    selectedNavRole === 'Super Admin'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                      : customRoles.some(r => r.name === selectedNavRole)
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300'
                      : 'bg-brand-100 text-brand-800 dark:bg-brand-950/80 dark:text-brand-300'
                  }`}>
                    {selectedNavRole === 'Super Admin' ? 'Full Unrestricted Access' : `${users.filter(u => u.role === selectedNavRole).length} Active Staff Member(s)`}
                  </span>
                </div>

                {/* Quick Presets & Save */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-400 font-medium">Quick Presets:</span>
                  <button
                    type="button"
                    disabled={selectedNavRole === 'Super Admin'}
                    onClick={() => handleNavRolePreset('grant_all')}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold disabled:opacity-40"
                  >
                    Grant All Menus
                  </button>
                  <button
                    type="button"
                    disabled={selectedNavRole === 'Super Admin'}
                    onClick={() => handleNavRolePreset('dispensary')}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold disabled:opacity-40"
                  >
                    Dispensary Counter Preset
                  </button>
                  <button
                    type="button"
                    disabled={selectedNavRole === 'Super Admin'}
                    onClick={() => handleNavRolePreset('reset_defaults')}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center space-x-1 disabled:opacity-40"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Defaults</span>
                  </button>
                </div>
              </div>

              {/* Informational Guidance Notice */}
              <WorkflowGuideNotice
                title="Role-Based Menu & Sub-Tab Navigation Governance"
                subtitle="Configure exact sidebar menu, sub-menu, and tab visibility per staff role"
                badgeText="Navigation Matrix"
                variant="emerald"
              >
                <div className="space-y-1.5 text-xs text-emerald-800 dark:text-emerald-300">
                  <p className="leading-relaxed">
                    • <strong>Real-Time Dynamic Sidebar:</strong> When a user logs in or switches into this role, only the enabled main menus, sub-menu tabs, and pages will be visible in their left navigation bar and tab bars.
                  </p>
                  <p className="leading-relaxed">
                    • <strong>Parent/Child Synchronization:</strong> Disabling a main menu automatically hides all child sub-menus (e.g. disabling <em>Commercial & Sales</em> hides <em>Invoices Ledger</em>, <em>Drafts</em>, and <em>Returns</em>).
                  </p>
                </div>
              </WorkflowGuideNotice>

              {/* Success Notification */}
              {navSavedSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Navigation menu access configuration saved for "{selectedNavRole}". Active sessions refreshed immediately.</span>
                </div>
              )}

              {/* Category-Grouped Navigation Matrix */}
              <div className="space-y-4">
                {Array.from(new Set(ALL_NAVIGATION_MODULES.map(m => m.category))).map(categoryName => {
                  const categoryModules = ALL_NAVIGATION_MODULES.filter(m => m.category === categoryName);
                  const mainModules = categoryModules.filter(m => m.type === 'main');

                  return (
                    <div key={categoryName} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                      <div className="bg-slate-50/80 dark:bg-slate-800/80 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-brand-500" />
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">{categoryName}</h4>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {categoryModules.filter(m => navRoleMenuState[m.id] !== false).length} of {categoryModules.length} enabled
                        </span>
                      </div>

                      <div className="p-4 space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
                        {mainModules.map(mainMod => {
                          const isMainEnabled = navRoleMenuState[mainMod.id] !== false;
                          const subModules = categoryModules.filter(m => m.parentId === mainMod.id);

                          return (
                            <div key={mainMod.id} className="pt-3 first:pt-0 space-y-3">
                              {/* Main Menu Item Row */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-0.5">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-bold text-slate-900 dark:text-white text-xs">{mainMod.label}</span>
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                                      Main Navigation
                                    </span>
                                    {mainMod.isSystemLocked && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                        Super Admin Locked
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500">{mainMod.description}</p>
                                </div>

                                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                                  <input
                                    type="checkbox"
                                    disabled={selectedNavRole === 'Super Admin' && mainMod.id === 'settings'}
                                    checked={selectedNavRole === 'Super Admin' ? true : isMainEnabled}
                                    onChange={() => handleToggleNavRoleModule(mainMod.id)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600 disabled:opacity-50"></div>
                                </label>
                              </div>

                              {/* Sub-Menus & Sub-Tabs */}
                              {subModules.length > 0 && (
                                <div className={`ml-4 pl-4 border-l-2 space-y-2.5 transition ${isMainEnabled ? 'border-brand-200 dark:border-brand-800' : 'border-slate-200 dark:border-slate-800 opacity-50'}`}>
                                  {subModules.map(subMod => {
                                    const isSubEnabled = isMainEnabled && (navRoleMenuState[subMod.id] !== false);

                                    return (
                                      <div key={subMod.id} className="flex items-center justify-between gap-3 py-1">
                                        <div className="space-y-0.5">
                                          <div className="flex items-center space-x-2">
                                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{subMod.label}</span>
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                              Sub-Menu / Tab
                                            </span>
                                          </div>
                                          <p className="text-[10px] text-slate-400">{subMod.description}</p>
                                        </div>

                                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                          <input
                                            type="checkbox"
                                            disabled={!isMainEnabled || selectedNavRole === 'Super Admin'}
                                            checked={selectedNavRole === 'Super Admin' ? true : isSubEnabled}
                                            onChange={() => handleToggleNavRoleModule(subMod.id)}
                                            className="sr-only peer"
                                          />
                                          <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600 disabled:opacity-40"></div>
                                        </label>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-slate-500 text-[11px]">
                  Configuring navigation menus & sub-tabs for role: <strong className="text-slate-900 dark:text-white font-bold">{selectedNavRole}</strong>
                </div>

                <button
                  type="button"
                  disabled={selectedNavRole === 'Super Admin'}
                  onClick={handleSaveNavRoleMenuAccess}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center space-x-1.5 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Navigation Access for {selectedNavRole}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PHARMACY BRANDING & UI AESTHETICS */}
      {activeTab === 'branding' && (
        <PharmacyBrandingSection isStandaloneTab={true} />
      )}

      {/* TAB 6: SETTINGS & CURRENCY CONFIGURATION */}
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

      {/* MODAL: ADD / EDIT DISPENSARY BRANCH & STORAGE LOCATION */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveLocation} className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600">
                  <Warehouse className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {editingLocation ? 'Edit Branch / Storage Bay' : 'Register New Branch / Location'}
                  </h3>
                  <p className="text-xs text-slate-500">Populates GRN Receiving Bay and inventory transfers</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowLocationModal(false)}><X className="w-4 h-4" /></button>
            </div>

            <div className="text-xs space-y-3">
              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  Location / Branch Name *
                </label>
                <input
                  type="text"
                  required
                  value={locName}
                  onChange={e => setLocName(e.target.value)}
                  placeholder="e.g. Receiving Bay A - Central Dock, or East Legon Branch"
                  className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Code *</label>
                    <button
                      type="button"
                      onClick={() => setLocCode(`LOC-2026-${Math.floor(100 + Math.random() * 900)}`)}
                      className="text-[10px] text-teal-600 hover:text-teal-700 font-bold flex items-center space-x-0.5"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Re-roll</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={locCode}
                    onChange={e => setLocCode(e.target.value)}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800 font-mono font-bold text-teal-700 dark:text-teal-400"
                  />
                </div>

                <div>
                  <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">Facility Type *</label>
                  <select
                    value={locType}
                    onChange={e => setLocType(e.target.value as any)}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800 font-medium"
                  >
                    <option value="BRANCH">Branch Pharmacy / Shop</option>
                    <option value="BAY">Receiving Bay / Intake Dock</option>
                    <option value="COLD_ROOM">Cold Chain Storage</option>
                    <option value="WAREHOUSE">Warehouse / Bulk Depot</option>
                    <option value="SHELF">Dispensary Retail Shelf</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  Address / Floor / Room Zone
                </label>
                <input
                  type="text"
                  value={locAddress}
                  onChange={e => setLocAddress(e.target.value)}
                  placeholder="e.g. Ground Floor Intake Dock 1, or 45 Boundary Rd"
                  className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  Operational Purpose & Description
                </label>
                <textarea
                  rows={2}
                  value={locDescription}
                  onChange={e => setLocDescription(e.target.value)}
                  placeholder="e.g. Dedicated bay for ambient pharmaceutical carton intake and FEFO quarantine"
                  className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800 font-medium"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="loc-active-checkbox"
                  checked={locIsActive}
                  onChange={e => setLocIsActive(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
                <label htmlFor="loc-active-checkbox" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Active Facility (Available for intake receiving & dispensing)
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="save-location-btn"
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow flex items-center space-x-1"
              >
                <Check className="w-4 h-4" />
                <span>{editingLocation ? 'Save Changes' : 'Register Location'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Staff Account Modal */}
      <CreateUserModal
        isOpen={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
        onUserCreated={(newUser, tempPassword) => {
          setCredentialsModal({
            isOpen: true,
            user: newUser,
            tempPassword,
            isReset: false,
          });
        }}
      />

      {/* User Temporary Credentials Modal */}
      {credentialsModal.user && (
        <UserCredentialsModal
          isOpen={credentialsModal.isOpen}
          onClose={() => setCredentialsModal(prev => ({ ...prev, isOpen: false, user: null }))}
          user={credentialsModal.user}
          temporaryPassword={credentialsModal.tempPassword}
          isPasswordReset={credentialsModal.isReset}
        />
      )}

      {/* Assign User Roles Modal (Multi-Role Management) */}
      {assignRolesModal.user && (
        <AssignUserRolesModal
          isOpen={assignRolesModal.isOpen}
          onClose={() => setAssignRolesModal({ isOpen: false, user: null })}
          user={assignRolesModal.user}
        />
      )}
    </div>
  );
};
