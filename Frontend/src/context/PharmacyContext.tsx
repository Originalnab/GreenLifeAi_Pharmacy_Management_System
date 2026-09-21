import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, Product, Batch, StockMovement, Sale, CashierShift, 
  Supplier, Customer, PurchaseOrder, BusinessLoan, Expense, 
  AuditEvent, ApprovalRequest, CustomRoleDefinition, UnitType, CurrencyConfig,
  SystemProfile, ApiCredentialsConfig, PrinterConfig, OperatingMode, ThemePreset, SystemLogEntry,
  Category, DosagePreset, RoleSensitiveControls, UserAuthorization, PermissionMatrix, RoleType, ModuleName, PermissionAction
} from '../types';
import { initialUsers, defaultPermissions, initialCustomRoles, defaultSensitiveControls, initialUserAuthorizations } from '../data/mock/users';
import { initialProducts, initialCategories } from '../data/mock/catalogue';
import { initialBatches, initialStockMovements } from '../data/mock/batches';
import { initialSuppliers, initialCustomers } from '../data/mock/parties';
import { initialSales } from '../data/mock/sales';
import { initialShifts } from '../data/mock/shifts';
import { initialLoans } from '../data/mock/loans';
import { initialExpenses } from '../data/mock/expenses';
import { initialPurchaseOrders } from '../data/mock/purchasing';
import { initialApprovals } from '../data/mock/approvals';
import { initialAuditLogs } from '../data/mock/audit';
import { initialUnitTypes, availableCurrencies } from '../data/mock/units';
import { initialDosagePresets } from '../data/mock/dosagePresets';
import { 
  initialSystemProfile, 
  initialApiCredentials, 
  initialPrinterConfig, 
  initialSystemLogs 
} from '../data/mock/settings';

interface PharmacyContextType {
  currentUser: User;
  switchUser: (user: User) => void;
  users: User[];
  hasPermission: (module: keyof typeof defaultPermissions['Super Admin'] | string, action: keyof typeof defaultPermissions['Super Admin']['pos'] | string) => boolean;
  
  // Permissions & Staff Authorizations Management
  rolePermissions: Record<string, PermissionMatrix>;
  roleSensitiveControls: Record<string, RoleSensitiveControls>;
  userAuthorizations: Record<string, UserAuthorization>;
  updateRolePermissions: (role: string, matrix: PermissionMatrix, sensitiveControls?: RoleSensitiveControls) => void;
  updateUserAuthorization: (userId: string, updates: Partial<UserAuthorization>) => void;
  updateUserRole: (userId: string, newRole: RoleType) => boolean;
  updateUserStatus: (userId: string, active: boolean) => boolean;
  revokeUserSessions: (userId: string) => void;
  resetUserCredentials: (userId: string) => void;
  getUserAuthorization: (userId: string) => UserAuthorization;
  
  // Data collections
  products: Product[];
  categories: Category[];
  batches: Batch[];
  stockMovements: StockMovement[];
  sales: Sale[];
  shifts: CashierShift[];
  activeShift: CashierShift | null;
  suppliers: Supplier[];
  customers: Customer[];
  purchaseOrders: PurchaseOrder[];
  loans: BusinessLoan[];
  expenses: Expense[];
  approvals: ApprovalRequest[];
  auditLogs: AuditEvent[];
  customRoles: CustomRoleDefinition[];
  unitTypes: UnitType[];
  currencies: CurrencyConfig[];
  currentCurrency: CurrencyConfig;
  setCurrency: (code: string) => void;
  formatCurrency: (amount: number) => string;

  // System Settings & Super Admin Control
  systemProfile: SystemProfile;
  updateSystemProfile: (updates: Partial<SystemProfile>) => void;
  apiCredentials: ApiCredentialsConfig;
  updateApiCredentials: (updates: Partial<ApiCredentialsConfig>) => void;
  printerConfig: PrinterConfig;
  updatePrinterConfig: (updates: Partial<PrinterConfig>) => void;
  operatingMode: OperatingMode;
  setOperatingMode: (mode: OperatingMode) => void;
  resetDemoData: () => void;
  systemLogs: SystemLogEntry[];
  addSystemLog: (entry: Omit<SystemLogEntry, 'id' | 'timestamp'>) => void;
  clearSystemLogs: () => void;
  themePreset: ThemePreset;
  setThemePreset: (preset: ThemePreset) => void;

  // Therapeutic Categories Management
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => boolean;

  // Dosage Forms & Clinical Rules Management
  dosagePresets: Record<string, DosagePreset>;
  updateDosagePreset: (formName: string, updates: Partial<DosagePreset>) => void;
  addDosagePreset: (formName: string, preset: DosagePreset) => void;
  deleteDosagePreset: (formName: string) => boolean;

  // Unit Types & Hierarchy Multipliers
  addUnitType: (unit: Omit<UnitType, 'id'>) => void;
  updateUnitType: (id: string, updates: Partial<UnitType>) => void;
  deleteUnitType: (id: string) => void;
  globalBulkDiscountPercent: number;
  setGlobalBulkDiscountPercent: (percent: number) => void;
  
  // State Mutators
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  receiveStock: (grnNumber: string, items: Array<{ productId: string; batchNumber: string; mfgDate: string; expDate: string; qty: number; unitCost: number; sellingPrice: number }>) => void;
  quarantineBatch: (batchId: string, reason: string) => void;
  disposeBatch: (batchId: string, reason: string) => void;
  processSale: (saleData: Omit<Sale, 'id' | 'receiptNumber' | 'createdAt'>) => Sale;
  openShift: (openingFloat: number) => void;
  closeShift: (countedCash: number, explanation: string) => void;
  recordLoanPayment: (loanId: string, installmentNumber: number) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt'>) => void;
  approveRequest: (id: string) => void;
  rejectRequest: (id: string) => void;
  addCustomRole: (role: CustomRoleDefinition) => void;
  logAuditEvent: (action: string, module: any, ref: string, details?: string) => void;
  
  // Dark mode
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const PharmacyContext = createContext<PharmacyContextType | undefined>(undefined);

export const PharmacyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(initialUsers[0]); // Default Super Admin
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [rolePermissions, setRolePermissions] = useState<Record<string, PermissionMatrix>>(defaultPermissions);
  const [roleSensitiveControls, setRoleSensitiveControls] = useState<Record<string, RoleSensitiveControls>>(defaultSensitiveControls);
  const [userAuthorizations, setUserAuthorizations] = useState<Record<string, UserAuthorization>>(initialUserAuthorizations);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [dosagePresets, setDosagePresets] = useState<Record<string, DosagePreset>>(initialDosagePresets);
  const [globalBulkDiscountPercent, setGlobalBulkDiscountPercent] = useState<number>(10);
  const [batches, setBatches] = useState<Batch[]>(initialBatches);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(initialStockMovements);
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [shifts, setShifts] = useState<CashierShift[]>(initialShifts);
  const [activeShift, setActiveShift] = useState<CashierShift | null>(initialShifts[0]);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders);
  const [loans, setLoans] = useState<BusinessLoan[]>(initialLoans);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(initialApprovals);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>(initialAuditLogs);
  const [customRoles, setCustomRoles] = useState<CustomRoleDefinition[]>(initialCustomRoles);
  const [unitTypes, setUnitTypes] = useState<UnitType[]>(initialUnitTypes);
  
  // Currency state: Default to GHS (Ghanaian Cedi GH₵)
  const [currentCurrency, setCurrentCurrency] = useState<CurrencyConfig>(availableCurrencies[0]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // System Settings & Super Admin Control states
  const [systemProfile, setSystemProfile] = useState<SystemProfile>(initialSystemProfile);
  const [apiCredentials, setApiCredentials] = useState<ApiCredentialsConfig>(initialApiCredentials);
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>(initialPrinterConfig);
  const [operatingMode, setOperatingModeState] = useState<OperatingMode>('PRODUCTION');
  const [systemLogs, setSystemLogs] = useState<SystemLogEntry[]>(initialSystemLogs);
  const [themePreset, setThemePreset] = useState<ThemePreset>('emerald');

  const updateSystemProfile = (updates: Partial<SystemProfile>) => {
    setSystemProfile(prev => ({ ...prev, ...updates }));
    logAuditEvent('SYSTEM_PROFILE_UPDATED', 'administration', 'PROFILE', 'Dispensary legal/premises profile updated');
  };

  const updateApiCredentials = (updates: Partial<ApiCredentialsConfig>) => {
    setApiCredentials(prev => ({ ...prev, ...updates }));
    logAuditEvent('API_CREDENTIALS_UPDATED', 'administration', 'CREDENTIALS', 'SMS/Payment gateway API keys updated');
  };

  const updatePrinterConfig = (updates: Partial<PrinterConfig>) => {
    setPrinterConfig(prev => ({ ...prev, ...updates }));
    logAuditEvent('PRINTER_CONFIG_UPDATED', 'administration', updates.paperSize || 'PRINTER', 'Receipt layout/printer config adjusted');
  };

  const setOperatingMode = (mode: OperatingMode) => {
    setOperatingModeState(mode);
    logAuditEvent('OPERATING_MODE_CHANGED', 'administration', mode, `System switched to ${mode} mode`);
  };

  const resetDemoData = () => {
    setProducts(initialProducts);
    setBatches(initialBatches);
    setStockMovements(initialStockMovements);
    setSales(initialSales);
    setShifts(initialShifts);
    setActiveShift(initialShifts[0]);
    logAuditEvent('DEMO_DATA_RESET', 'administration', 'SANDBOX', 'Demo and training environment restored to initial seed state');
  };

  const addSystemLog = (entry: Omit<SystemLogEntry, 'id' | 'timestamp'>) => {
    const newLog: SystemLogEntry = {
      ...entry,
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    setSystemLogs(prev => [newLog, ...prev]);
  };

  const clearSystemLogs = () => {
    setSystemLogs([]);
    logAuditEvent('SYSTEM_LOGS_CLEARED', 'administration', 'LOGS', 'System error and debug logs purged by administrator');
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const setCurrency = (code: string) => {
    const found = availableCurrencies.find(c => c.code === code);
    if (found) {
      setCurrentCurrency(found);
      logAuditEvent('CURRENCY_CHANGED', 'administration', code, `System currency set to ${found.name} (${found.symbol})`);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `${currentCurrency.symbol} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const switchUser = (user: User) => {
    setCurrentUser(user);
    logAuditEvent('USER_SWITCHED', 'administration', user.id, `Simulated login switch to ${user.name} (${user.role})`);
  };

  const getUserAuthorization = (userId: string): UserAuthorization => {
    if (userAuthorizations[userId]) return userAuthorizations[userId];
    return {
      userId,
      maxDiscountPercent: 5,
      maxRefundLimit: 100,
      stockAdjustmentLimit: 0,
      expenseApprovalLimit: 0,
      poApprovalLimit: 0,
      requireTwoFactor: false,
      canOverridePrice: false,
      canViewCostPrices: false,
      canViewProfits: false,
      sessionsActive: 1,
      lastPasswordChange: new Date().toISOString().slice(0, 10),
    };
  };

  const updateRolePermissions = (role: string, matrix: PermissionMatrix, sensitiveControls?: RoleSensitiveControls) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: matrix
    }));
    if (sensitiveControls) {
      setRoleSensitiveControls(prev => ({
        ...prev,
        [role]: sensitiveControls
      }));
    }
    logAuditEvent('PERMISSIONS_UPDATED', 'administration', role, `Updated RBAC matrix & sensitive controls for role "${role}"`);
  };

  const updateUserAuthorization = (userId: string, updates: Partial<UserAuthorization>) => {
    setUserAuthorizations(prev => {
      const current = prev[userId] || getUserAuthorization(userId);
      return {
        ...prev,
        [userId]: { ...current, ...updates }
      };
    });
    logAuditEvent('USER_AUTHORIZATION_CHANGED', 'administration', userId, `Updated direct user authorization limits/flags for ${userId}`);
  };

  const updateUserRole = (userId: string, newRole: RoleType): boolean => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return false;

    // Safety rule: Do not allow removing the final viable Super Admin access path
    if (targetUser.role === 'Super Admin' && newRole !== 'Super Admin') {
      const remainingSuperAdmins = users.filter(u => u.id !== userId && u.role === 'Super Admin' && u.active);
      if (remainingSuperAdmins.length === 0) {
        logAuditEvent('SECURITY_POLICY_VIOLATION', 'administration', userId, `Rejected attempt to demote the final viable active Super Admin account.`);
        alert('Action Denied: You cannot remove or demote the final viable active Super Admin account.');
        return false;
      }
    }

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    if (currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, role: newRole }));
    }
    logAuditEvent('USER_ROLE_CHANGED', 'administration', userId, `Changed role of ${targetUser.name} to "${newRole}"`);
    return true;
  };

  const updateUserStatus = (userId: string, active: boolean): boolean => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return false;

    // Safety rule: Cannot deactivate final active Super Admin
    if (targetUser.role === 'Super Admin' && !active) {
      const remainingActiveSuperAdmins = users.filter(u => u.id !== userId && u.role === 'Super Admin' && u.active);
      if (remainingActiveSuperAdmins.length === 0) {
        logAuditEvent('SECURITY_POLICY_VIOLATION', 'administration', userId, `Rejected attempt to deactivate the final active Super Admin account.`);
        alert('Action Denied: You cannot deactivate the final viable active Super Admin account.');
        return false;
      }
    }

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, active } : u));
    logAuditEvent(active ? 'USER_ACTIVATED' : 'USER_DEACTIVATED', 'administration', userId, `${active ? 'Activated' : 'Deactivated'} user account: ${targetUser.name}`);
    return true;
  };

  const revokeUserSessions = (userId: string) => {
    setUserAuthorizations(prev => {
      const current = prev[userId] || getUserAuthorization(userId);
      return {
        ...prev,
        [userId]: { ...current, sessionsActive: 0 }
      };
    });
    logAuditEvent('SESSIONS_REVOKED', 'administration', userId, `Force-terminated all active sessions for user ${userId}`);
  };

  const resetUserCredentials = (userId: string) => {
    setUserAuthorizations(prev => {
      const current = prev[userId] || getUserAuthorization(userId);
      return {
        ...prev,
        [userId]: { ...current, lastPasswordChange: new Date().toISOString().slice(0, 10), sessionsActive: 0 }
      };
    });
    logAuditEvent('CREDENTIALS_RESET', 'administration', userId, `Issued password reset token & forced credential update for user ${userId}`);
  };

  const hasPermission = (module: any, action: any): boolean => {
    if (currentUser.role === 'Super Admin') return true;
    
    // Check direct user custom override if present
    const userAuth = userAuthorizations[currentUser.id];
    if (userAuth?.customPermissions?.[module as ModuleName]?.[action as PermissionAction] !== undefined) {
      return !!userAuth.customPermissions[module as ModuleName]![action as PermissionAction];
    }

    const roleMatrix = rolePermissions[currentUser.role] || defaultPermissions[currentUser.role];
    if (!roleMatrix || !roleMatrix[module as ModuleName]) return false;
    return !!roleMatrix[module as ModuleName][action as PermissionAction];
  };

  const logAuditEvent = (action: string, module: any, ref: string, details?: string) => {
    const newLog: AuditEvent = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action,
      module,
      recordReference: ref,
      details,
      ipAddress: '127.0.0.1 (Local)',
      outcome: 'SUCCESS'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const addProduct = (prodData: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...prodData,
      id: `prod_${Date.now()}`,
    };
    setProducts(prev => [newProd, ...prev]);
    logAuditEvent('PRODUCT_CREATED', 'catalogue', newProd.sku, `Added ${newProd.brandName} (${newProd.genericName})`);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    logAuditEvent('PRODUCT_UPDATED', 'catalogue', id, `Updated product parameters on ${id}`);
  };

  // Category Management
  const addCategory = (catData: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...catData,
      id: `cat_${Date.now()}`
    };
    setCategories(prev => [...prev, newCat]);
    logAuditEvent('CATEGORY_CREATED', 'catalogue', newCat.id, `Created therapeutic category ${newCat.name}`);
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    logAuditEvent('CATEGORY_UPDATED', 'catalogue', id, `Updated therapeutic category ${updates.name || id}`);
  };

  const deleteCategory = (id: string): boolean => {
    const isUsed = products.some(p => p.categoryId === id);
    if (isUsed) {
      return false; // Safely blocked: active medications linked
    }
    setCategories(prev => prev.filter(c => c.id !== id));
    logAuditEvent('CATEGORY_DELETED', 'catalogue', id, `Deleted therapeutic category ${id}`);
    return true;
  };

  // Dosage Presets Management
  const updateDosagePreset = (formName: string, updates: Partial<DosagePreset>) => {
    setDosagePresets(prev => {
      const existing = prev[formName] || {
        baseUnit: 'Piece',
        recommendedUnits: ['Piece'],
        hasStrip: false,
        stripMultiplier: 1,
        hasPack: true,
        packMultiplier: 1,
        packDescription: 'Standard Pack',
        clinicalNote: ''
      };
      return {
        ...prev,
        [formName]: { ...existing, ...updates }
      };
    });
    logAuditEvent('DOSAGE_RULE_UPDATED', 'catalogue', formName, `Updated clinical rule for ${formName}`);
  };

  const addDosagePreset = (formName: string, preset: DosagePreset) => {
    setDosagePresets(prev => ({
      ...prev,
      [formName]: { ...preset, isCustom: true }
    }));
    logAuditEvent('DOSAGE_RULE_CREATED', 'catalogue', formName, `Created custom dosage rule for ${formName}`);
  };

  const deleteDosagePreset = (formName: string): boolean => {
    const isUsed = products.some(p => p.dosageForm === formName);
    if (isUsed) {
      return false; // Safely blocked: active medications linked
    }
    setDosagePresets(prev => {
      const copy = { ...prev };
      delete copy[formName];
      return copy;
    });
    logAuditEvent('DOSAGE_RULE_DELETED', 'catalogue', formName, `Deleted custom dosage rule for ${formName}`);
    return true;
  };

  // Unit Types Management
  const addUnitType = (unitData: Omit<UnitType, 'id'>) => {
    const newUnit: UnitType = {
      ...unitData,
      id: `unit_${Date.now()}`,
      isDefault: false
    };
    setUnitTypes(prev => [...prev, newUnit]);
    logAuditEvent('UNIT_TYPE_CREATED', 'administration', newUnit.name, `Added unit type ${newUnit.name} (${newUnit.category})`);
  };

  const updateUnitType = (id: string, updates: Partial<UnitType>) => {
    setUnitTypes(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    logAuditEvent('UNIT_TYPE_UPDATED', 'administration', id, `Updated unit type ${updates.name || id}`);
  };

  const deleteUnitType = (id: string) => {
    setUnitTypes(prev => prev.filter(u => u.id !== id));
    logAuditEvent('UNIT_TYPE_DELETED', 'administration', id, `Deleted unit type ${id}`);
  };

  const receiveStock = (grnNumber: string, items: Array<{ productId: string; batchNumber: string; mfgDate: string; expDate: string; qty: number; unitCost: number; sellingPrice: number }>) => {
    items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      const newBatch: Batch = {
        id: `batch_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        productId: item.productId,
        productName: prod ? prod.brandName : 'Unknown Product',
        batchNumber: item.batchNumber,
        manufacturingDate: item.mfgDate,
        expiryDate: item.expDate,
        quantityOnHand: item.qty,
        availableQuantity: item.qty,
        unitCost: item.unitCost,
        sellingPrice: item.sellingPrice,
        supplierId: 'sup_001',
        supplierName: 'Emzor Pharmaceuticals',
        status: 'ACTIVE',
        storageLocation: 'Dispensary Shelf R-01',
        receivedDate: new Date().toISOString().split('T')[0]
      };
      
      setBatches(prev => [newBatch, ...prev]);

      // Add immutable movement
      const mov: StockMovement = {
        id: `mov_${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        movementType: 'PURCHASE_RECEIVE',
        productId: item.productId,
        productName: prod ? prod.brandName : 'Product',
        batchId: newBatch.id,
        batchNumber: newBatch.batchNumber,
        quantity: item.qty,
        balanceBefore: prod ? prod.totalQuantity : 0,
        balanceAfter: (prod ? prod.totalQuantity : 0) + item.qty,
        referenceNumber: grnNumber,
        actorName: currentUser.name,
        reason: `Goods receipt note ${grnNumber}`
      };
      setStockMovements(prev => [mov, ...prev]);

      // Update product quantity and baseline cost if revised
      setProducts(prev => prev.map(p => p.id === item.productId ? {
        ...p,
        totalQuantity: p.totalQuantity + item.qty,
        availableQuantity: p.availableQuantity + item.qty,
        unitCost: item.unitCost,
        sellingPrice: item.sellingPrice,
        status: 'IN_STOCK'
      } : p));
    });

    logAuditEvent('STOCK_RECEIVED', 'inventory', grnNumber, `Received ${items.length} product batches via GRN`);
  };

  const quarantineBatch = (batchId: string, reason: string) => {
    const target = batches.find(b => b.id === batchId);
    if (!target) return;

    setBatches(prev => prev.map(b => b.id === batchId ? { ...b, status: 'QUARANTINED', availableQuantity: 0 } : b));
    setProducts(prev => prev.map(p => p.id === target.productId ? {
      ...p,
      availableQuantity: Math.max(0, p.availableQuantity - target.availableQuantity)
    } : p));

    const mov: StockMovement = {
      id: `mov_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      movementType: 'QUARANTINE_TRANSFER',
      productId: target.productId,
      productName: target.productName,
      batchId: target.id,
      batchNumber: target.batchNumber,
      quantity: -target.availableQuantity,
      balanceBefore: target.quantityOnHand,
      balanceAfter: 0,
      referenceNumber: `QRN-${Date.now().toString().slice(-4)}`,
      actorName: currentUser.name,
      reason
    };
    setStockMovements(prev => [mov, ...prev]);
    logAuditEvent('BATCH_QUARANTINED', 'inventory', target.batchNumber, reason);
  };

  const disposeBatch = (batchId: string, reason: string) => {
    const target = batches.find(b => b.id === batchId);
    if (!target) return;

    setBatches(prev => prev.map(b => b.id === batchId ? { ...b, status: 'DISPOSED', quantityOnHand: 0, availableQuantity: 0 } : b));
    setProducts(prev => prev.map(p => p.id === target.productId ? {
      ...p,
      totalQuantity: Math.max(0, p.totalQuantity - target.quantityOnHand),
      availableQuantity: Math.max(0, p.availableQuantity - target.availableQuantity)
    } : p));

    const mov: StockMovement = {
      id: `mov_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      movementType: 'EXPIRED_DISPOSAL',
      productId: target.productId,
      productName: target.productName,
      batchId: target.id,
      batchNumber: target.batchNumber,
      quantity: -target.quantityOnHand,
      balanceBefore: target.quantityOnHand,
      balanceAfter: 0,
      referenceNumber: `DISP-${Date.now().toString().slice(-4)}`,
      actorName: currentUser.name,
      reason
    };
    setStockMovements(prev => [mov, ...prev]);
    logAuditEvent('BATCH_DISPOSED', 'inventory', target.batchNumber, reason);
  };

  const processSale = (saleData: Omit<Sale, 'id' | 'receiptNumber' | 'createdAt'>): Sale => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).split('-').join('');
    const receiptNumber = `REC-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const newSale: Sale = {
      ...saleData,
      id: `sale_${Date.now()}`,
      receiptNumber,
      createdAt: now.toISOString().replace('T', ' ').substring(0, 19),
      status: 'COMPLETED'
    };

    setSales(prev => [newSale, ...prev]);

    // Deduct stock accurately in base units using packaging multiplier
    saleData.items.forEach(item => {
      const baseUnitsDeducted = item.quantity * (item.unitMultiplier || 1);

      setBatches(prev => prev.map(b => {
        if (b.id === item.batchId) {
          const newQty = Math.max(0, b.quantityOnHand - baseUnitsDeducted);
          return { ...b, quantityOnHand: newQty, availableQuantity: newQty };
        }
        return b;
      }));

      setProducts(prev => prev.map(p => {
        if (p.id === item.productId) {
          const newTotal = Math.max(0, p.totalQuantity - baseUnitsDeducted);
          return {
            ...p,
            totalQuantity: newTotal,
            availableQuantity: newTotal,
            status: newTotal === 0 ? 'OUT_OF_STOCK' : newTotal <= p.reorderLevel ? 'LOW_STOCK' : 'IN_STOCK'
          };
        }
        return p;
      }));

      const mov: StockMovement = {
        id: `mov_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        timestamp: now.toISOString().replace('T', ' ').substring(0, 19),
        movementType: 'POS_SALE',
        productId: item.productId,
        productName: item.productName,
        batchId: item.batchId,
        batchNumber: item.batchNumber,
        quantity: -baseUnitsDeducted,
        balanceBefore: item.availableStock,
        balanceAfter: item.availableStock - baseUnitsDeducted,
        referenceNumber: receiptNumber,
        actorName: currentUser.name,
        reason: `Point of sale: ${item.quantity} ${item.selectedUnitName || 'Unit'}`
      };
      setStockMovements(prev => [mov, ...prev]);
    });

    // Update shift totals if active
    if (activeShift) {
      let cashDelta = 0;
      let cardDelta = 0;
      let transferDelta = 0;
      let creditDelta = 0;

      saleData.payments.forEach(p => {
        if (p.method === 'CASH') cashDelta += (p.amount - saleData.changeDue);
        if (p.method === 'CARD') cardDelta += p.amount;
        if (p.method === 'TRANSFER') transferDelta += p.amount;
        if (p.method === 'CREDIT') creditDelta += p.amount;
      });

      setActiveShift({
        ...activeShift,
        cashSales: activeShift.cashSales + cashDelta,
        cardSales: activeShift.cardSales + cardDelta,
        transferSales: activeShift.transferSales + transferDelta,
        creditSales: activeShift.creditSales + creditDelta,
        expectedCash: activeShift.expectedCash + cashDelta
      });
    }

    logAuditEvent('SALE_COMPLETED', 'pos', receiptNumber, `Sale Total: ${formatCurrency(saleData.total)}`);
    return newSale;
  };

  const openShift = (openingFloat: number) => {
    const shiftNum = `SHF-${new Date().toISOString().slice(0, 10).split('-').join('')}-${Math.floor(100+Math.random()*900)}`;
    const newShift: CashierShift = {
      id: `shift_${Date.now()}`,
      shiftNumber: shiftNum,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      terminalId: 'POS-TERMINAL-01',
      startTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      openingFloat,
      cashSales: 0,
      cardSales: 0,
      transferSales: 0,
      creditSales: 0,
      refundsTotal: 0,
      midShiftCashDrops: 0,
      expectedCash: openingFloat,
      status: 'OPEN'
    };
    setActiveShift(newShift);
    setShifts(prev => [newShift, ...prev]);
    logAuditEvent('SHIFT_OPENED', 'finance', shiftNum, `Float: ${formatCurrency(openingFloat)}`);
  };

  const closeShift = (countedCash: number, explanation: string) => {
    if (!activeShift) return;
    const variance = countedCash - activeShift.expectedCash;
    const closed: CashierShift = {
      ...activeShift,
      endTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      countedCash,
      variance,
      varianceReason: explanation,
      status: 'CLOSED',
      reconciledBy: currentUser.name
    };
    setShifts(prev => prev.map(s => s.id === activeShift.id ? closed : s));
    setActiveShift(null);
    logAuditEvent('SHIFT_CLOSED', 'finance', activeShift.shiftNumber, `Counted: ${formatCurrency(countedCash)}, Variance: ${formatCurrency(variance)}`);
  };

  const recordLoanPayment = (loanId: string, installmentNumber: number) => {
    setLoans(prev => prev.map(loan => {
      if (loan.id === loanId) {
        const targetInstallment = loan.schedule.find(s => s.installmentNumber === installmentNumber);
        if (!targetInstallment) return loan;

        const updatedSchedule = loan.schedule.map(s => {
          if (s.installmentNumber === installmentNumber) {
            return {
              ...s,
              status: 'PAID' as const,
              paidAmount: s.totalDue,
              paidDate: new Date().toISOString().split('T')[0]
            };
          }
          return s;
        });

        const newTotalPaid = loan.totalPaid + targetInstallment.totalDue;
        const newBalance = Math.max(0, loan.totalRepayable - newTotalPaid);

        return {
          ...loan,
          totalPaid: newTotalPaid,
          outstandingBalance: newBalance,
          schedule: updatedSchedule,
          status: newBalance === 0 ? 'PAID_OFF' : 'ACTIVE'
        };
      }
      return loan;
    }));

    logAuditEvent('LOAN_PAYMENT_RECORDED', 'loans', loanId, `Recorded payment for installment #${installmentNumber}`);
  };

  const addExpense = (expData: Omit<Expense, 'id'>) => {
    const newExp: Expense = {
      ...expData,
      id: `exp_${Date.now()}`
    };
    setExpenses(prev => [newExp, ...prev]);
    logAuditEvent('EXPENSE_RECORDED', 'finance', newExp.referenceNumber, `${formatCurrency(newExp.amount)} - ${newExp.category}`);
  };

  const addPurchaseOrder = (poData: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt'>) => {
    const poNum = `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPO: PurchaseOrder = {
      ...poData,
      id: `po_${Date.now()}`,
      poNumber: poNum,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'SUBMITTED'
    };
    setPurchaseOrders(prev => [newPO, ...prev]);
    logAuditEvent('PO_CREATED', 'purchasing', poNum, `PO amount: ${formatCurrency(poData.totalAmount)}`);
  };

  const approveRequest = (id: string) => {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: 'APPROVED' } : a));
    logAuditEvent('APPROVAL_GRANTED', 'administration', id, `Approval request ${id} accepted by ${currentUser.name}`);
  };

  const rejectRequest = (id: string) => {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: 'REJECTED' } : a));
    logAuditEvent('APPROVAL_REJECTED', 'administration', id, `Approval request ${id} rejected by ${currentUser.name}`);
  };

  const addCustomRole = (role: CustomRoleDefinition) => {
    setCustomRoles(prev => [role, ...prev]);
    if (role.permissions) {
      setRolePermissions(prev => ({
        ...prev,
        [role.name]: role.permissions
      }));
    }
    if (role.sensitiveControls) {
      setRoleSensitiveControls(prev => ({
        ...prev,
        [role.name]: role.sensitiveControls!
      }));
    }
    logAuditEvent('CUSTOM_ROLE_CREATED', 'administration', role.name, `Created custom RBAC role ${role.name}`);
  };

  return (
    <PharmacyContext.Provider value={{
      currentUser,
      switchUser,
      users,
      hasPermission,
      rolePermissions,
      roleSensitiveControls,
      userAuthorizations,
      updateRolePermissions,
      updateUserAuthorization,
      updateUserRole,
      updateUserStatus,
      revokeUserSessions,
      resetUserCredentials,
      getUserAuthorization,
      products,
      categories,
      addCategory,
      updateCategory,
      deleteCategory,
      dosagePresets,
      updateDosagePreset,
      addDosagePreset,
      deleteDosagePreset,
      batches,
      stockMovements,
      sales,
      shifts,
      activeShift,
      suppliers,
      customers,
      purchaseOrders,
      loans,
      expenses,
      approvals,
      auditLogs,
      customRoles,
      unitTypes,
      updateUnitType,
      deleteUnitType,
      globalBulkDiscountPercent,
      setGlobalBulkDiscountPercent,
      currencies: availableCurrencies,
      currentCurrency,
      setCurrency,
      formatCurrency,
      addProduct,
      updateProduct,
      addUnitType,
      receiveStock,
      quarantineBatch,
      disposeBatch,
      processSale,
      openShift,
      closeShift,
      recordLoanPayment,
      addExpense,
      addPurchaseOrder,
      approveRequest,
      rejectRequest,
      addCustomRole,
      logAuditEvent,
      isDarkMode,
      toggleDarkMode,
      systemProfile,
      updateSystemProfile,
      apiCredentials,
      updateApiCredentials,
      printerConfig,
      updatePrinterConfig,
      operatingMode,
      setOperatingMode,
      resetDemoData,
      systemLogs,
      addSystemLog,
      clearSystemLogs,
      themePreset,
      setThemePreset
    }}>
      {children}
    </PharmacyContext.Provider>
  );
};

export const usePharmacy = () => {
  const context = useContext(PharmacyContext);
  if (!context) {
    throw new Error('usePharmacy must be used within a PharmacyProvider');
  }
  return context;
};
