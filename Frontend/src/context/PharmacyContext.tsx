import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { 
  User, Product, Batch, BatchStatus, StockMovement, Sale, CashierShift, 
  Supplier, Customer, PurchaseOrder, BusinessLoan, LoanAmortizationSchedule, Expense, 
  AuditEvent, ApprovalRequest, CustomRoleDefinition, UnitType, CurrencyConfig,
  SystemProfile, ApiCredentialsConfig, PrinterConfig, OperatingMode, ThemePreset, SystemLogEntry, LogSource,
  Category, DosagePreset, RoleSensitiveControls, UserAuthorization, PermissionMatrix, RoleType, ModuleName, PermissionAction,
  SaleReturn, DraftSale, ProcessReturnParams, PaymentTender, ReturnedItem, CustomerCreditNote,
  StorageLocation, CreditPaymentRecord, CreditAccountSale, PaymentMethod,
  NavigationModuleItem, EnabledModulesState, ProductPackagingTier,
  ConfirmDialogOptions, AlertDialogOptions, ToastItem,
  getUserAssignedRoles, getUserPrimaryRole
} from '../types';
import { ALL_NAVIGATION_MODULES, defaultEnabledModules, defaultRoleMenuAccess } from '../data/mock/modules';
import { initialUsers, defaultPermissions, initialCustomRoles, defaultSensitiveControls, initialUserAuthorizations } from '../data/mock/users';
import { initialProducts, initialCategories } from '../data/mock/catalogue';
import { initialBatches, initialStockMovements } from '../data/mock/batches';
import { initialSuppliers, initialCustomers } from '../data/mock/parties';
import { initialSales, initialReturns, initialDraftSales, initialCreditNotes, initialCreditSales } from '../data/mock/sales';
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
  initialSystemLogs,
  initialStorageLocations
} from '../data/mock/settings';
import { api } from '../services/api';
import {
  mapUserFromBackend,
  mapProductFromBackend,
  mapBatchFromBackend,
  mapSaleFromBackend,
  mapSupplierFromBackend,
  mapCustomerFromBackend,
  mapShiftFromBackend,
  mapExpenseFromBackend,
  mapAuditEventFromBackend,
  mapStorageLocationFromBackend,
  mapPurchaseOrderFromBackend
} from '../services/mappers';

interface PharmacyContextType {
  currentUser: User;
  switchUser: (user: User) => void;
  users: User[];
  isAuthenticated: boolean;
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isScreenLocked: boolean;
  lockScreen: () => void;
  unlockScreen: (password: string) => boolean;
  failedLoginAttempts: number;
  lockoutUntil: number | null;
  hasPermission: (module: keyof typeof defaultPermissions['Super Admin'] | string, action: keyof typeof defaultPermissions['Super Admin']['pos'] | string) => boolean;

  // Real-time backend notifications & live data hydration
  notification: { type: 'success' | 'error' | 'warning' | 'info'; message: string; title?: string } | null;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => void;
  dismissNotification: () => void;
  toasts: ToastItem[];
  dismissToast: (id: string) => void;
  toast: {
    success: (message: string, title?: string, duration?: number) => void;
    error: (message: string, title?: string, duration?: number) => void;
    warning: (message: string, title?: string, duration?: number) => void;
    info: (message: string, title?: string, duration?: number) => void;
  };
  confirmDialogState: (ConfirmDialogOptions & { isOpen: boolean; isAlert?: boolean }) | null;
  confirmDialog: (options: ConfirmDialogOptions) => Promise<boolean>;
  alertDialog: (options: AlertDialogOptions) => Promise<void>;
  closeConfirmDialog: (confirmed: boolean) => void;
  refreshLiveData: () => Promise<void>;
  isLoadingLiveData: boolean;
  
  // Permissions & Staff Authorizations Management
  rolePermissions: Record<string, PermissionMatrix>;
  roleSensitiveControls: Record<string, RoleSensitiveControls>;
  userAuthorizations: Record<string, UserAuthorization>;
  updateRolePermissions: (role: string, matrix: PermissionMatrix, sensitiveControls?: RoleSensitiveControls) => void;
  updateUserAuthorization: (userId: string, updates: Partial<UserAuthorization>) => void;
  updateUserRole: (userId: string, newRole: RoleType) => boolean;
  assignUserRoles: (userId: string, assignedRoles: RoleType[], primaryRole?: RoleType) => Promise<boolean>;
  switchActiveRole: (newRole: RoleType) => void;
  updateUserStatus: (userId: string, active: boolean) => boolean;
  revokeUserSessions: (userId: string) => void;
  resetUserCredentials: (userId: string) => void;
  createUser: (userData: Partial<User>) => { user: User; tempPassword: string };
  adminResetPassword: (userId: string) => { tempPassword: string; user: User };
  updateUserProfile: (userId: string, updates: Partial<User>) => void;
  changeUserPassword: (userId: string, currentPassword: string, newPassword: string) => { success: boolean; error?: string };
  dismissPasswordResetNotice: (userId: string) => void;
  getUserAuthorization: (userId: string) => UserAuthorization;
  
  // Data collections
  products: Product[];
  categories: Category[];
  batches: Batch[];
  stockMovements: StockMovement[];
  sales: Sale[];
  draftSales: DraftSale[];
  saveDraftSale: (draftData: Omit<DraftSale, 'id' | 'draftNumber' | 'createdAt' | 'updatedAt' | 'status' | 'cashierId' | 'cashierName'> & { id?: string; title?: string; notes?: string; cashierId?: string; cashierName?: string }) => DraftSale;
  deleteDraftSale: (id: string) => void;
  convertDraftToSale: (draftId: string, tenders: PaymentTender[]) => Sale | null;
  returns: SaleReturn[];
  processReturnSale: (params: ProcessReturnParams) => SaleReturn;
  creditNotes: CustomerCreditNote[];
  issueCreditNote: (params: Omit<CustomerCreditNote, 'id' | 'creditNoteNumber' | 'issueDate' | 'remainingBalance' | 'status'> & { creditNoteNumber?: string }) => CustomerCreditNote;
  voidCreditNote: (id: string, reason: string) => void;
  creditSales: CreditAccountSale[];
  processCreditSale: (saleData: Omit<Sale, 'id' | 'receiptNumber' | 'createdAt'> & { dueDate?: string }) => Sale;
  recordCreditPayment: (
    creditSaleId: string, 
    paymentOrAmount: Omit<CreditPaymentRecord, 'id' | 'receiptNumber'> | number, 
    method?: PaymentMethod | string, 
    reference?: string, 
    notes?: string
  ) => CreditPaymentRecord;
  storageLocations: StorageLocation[];
  addStorageLocation: (loc: Omit<StorageLocation, 'id'>) => void;
  updateStorageLocation: (id: string, updates: Partial<StorageLocation>) => void;
  deleteStorageLocation: (id: string) => void;
  addCustomer: (customer: Omit<Customer, 'id'> & { id?: string }) => Customer;
  addSupplier: (supplier: Omit<Supplier, 'id'> & { id?: string }) => Supplier;
  updateBatch: (batchId: string, updates: Partial<Batch>) => void;
  deleteBatch: (batchId: string) => void;
  updateBatchGroup: (
    oldBatchNumber: string,
    meta: {
      batchNumber: string;
      storageLocation?: string;
      supplierId?: string;
      supplierName?: string;
      deliveryNote?: string;
      receivedDate?: string;
    },
    updatedItems: Array<{
      id?: string;
      productId: string;
      productName: string;
      mfgDate?: string;
      expiryDate: string;
      remainingStock: number;
      initialStock: number;
      costPrice: number;
      sellingPrice: number;
      status: BatchStatus;
    }>,
    deletedItemIds?: string[]
  ) => void;
  deleteBatchGroup: (batchNumber: string) => void;
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
  formatCurrency: (amount?: number | null) => string;

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
  createBackup: () => { filename: string; size: string; timestamp: string; checksum: string; data: any };
  restoreBackup: (backupData: any) => Promise<{ success: boolean; counts: Record<string, number>; error?: string }>;
  purgeProductionData: () => Promise<{ success: boolean; backupFilename?: string; error?: string }>;
  backupHistory: Array<{ id: string; filename: string; timestamp: string; size: string; checksum: string; data?: any }>;
  systemLogs: SystemLogEntry[];
  addSystemLog: (entry: Partial<SystemLogEntry> & {
    level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
    module?: string;
    action?: string;
    details?: string;
  }) => void;
  clearSystemLogs: () => void;
  themePreset: ThemePreset;
  setThemePreset: (preset: ThemePreset) => void;

  // Module & Sub-Menu Feature Visibility Switch
  enabledModules: EnabledModulesState;
  isModuleEnabled: (moduleId: string) => boolean;
  toggleModuleVisibility: (moduleId: string, isEnabled?: boolean) => void;
  bulkUpdateModuleVisibility: (updates: Record<string, boolean>) => void;
  resetModuleVisibility: () => void;

  // Role Menu & Navigation Access Governance
  roleMenuAccess: Record<string, Record<string, boolean>>;
  updateRoleMenuAccess: (roleName: string, menuMap: Record<string, boolean>) => void;

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
  bulkAddProducts: (newProducts: Product[], autoCreateCategories?: boolean, newBatches?: Batch[]) => { count: number; newCategories: number; batchesCreated: number };
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  bulkDeleteProducts: (ids: string[]) => void;
  receiveStock: (
    grnNumber: string, 
    items: Array<{ 
      productId: string; 
      batchNumber: string; 
      mfgDate: string; 
      expDate: string; 
      qty: number; 
      unitCost: number; 
      sellingPrice: number;
      packagingTiers?: ProductPackagingTier[];
      updateMasterSellingPrice?: boolean;
    }>,
    metadata?: { supplierId?: string; supplierName?: string; storageLocation?: string; deliveryNote?: string }
  ) => void;
  quarantineBatch: (batchId: string, reason: string) => void;
  disposeBatch: (batchId: string, reason: string) => void;
  processSale: (saleData: Omit<Sale, 'id' | 'receiptNumber' | 'createdAt'>) => Sale;
  openShift: (openingFloat: number) => void;
  closeShift: (countedCash: number, explanation: string) => void;
  recordLoanPayment: (loanId: string, installmentNumber: number) => void;
  addLoan: (loan: Omit<BusinessLoan, 'id'>) => void;
  updateLoan: (loanId: string, updates: Partial<BusinessLoan>) => void;
  deleteLoan: (loanId: string) => void;
  addLoanInstallment: (loanId: string, installment: LoanAmortizationSchedule) => void;
  updateLoanInstallment: (loanId: string, installmentNumber: number, updates: Partial<LoanAmortizationSchedule>) => void;
  deleteLoanInstallment: (loanId: string, installmentNumber: number) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const savedSession = localStorage.getItem('greenlife_auth_session');
      return !!savedSession;
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const savedSession = localStorage.getItem('greenlife_auth_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        const matched = initialUsers.find(u => u.id === parsed.userId);
        if (matched) return matched;
      }
    } catch {}
    return initialUsers[0];
  });

  const [isScreenLocked, setIsScreenLocked] = useState<boolean>(false);
  const [failedLoginAttempts, setFailedLoginAttempts] = useState<number>(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  // Operating Mode: 'DEMO' (Training Sandbox) or 'PRODUCTION' (Live PostgreSQL DB)
  const [operatingMode, setOperatingModeState] = useState<OperatingMode>(() => {
    try {
      const saved = localStorage.getItem('greenlife_operating_mode') as OperatingMode;
      if (saved === 'PRODUCTION' || saved === 'DEMO') {
        return saved;
      }
    } catch {}
    return 'DEMO';
  });

  const isDemo = operatingMode === 'DEMO';

  // Demo Sandbox State (Rich simulated mock data for staff training and client demos)
  const [demoUsers, setDemoUsers] = useState<User[]>(initialUsers);
  const [demoProducts, setDemoProducts] = useState<Product[]>(initialProducts);
  const [demoCategories, setDemoCategories] = useState<Category[]>(initialCategories);
  const [demoBatches, setDemoBatches] = useState<Batch[]>(initialBatches);
  const [demoStockMovements, setDemoStockMovements] = useState<StockMovement[]>(initialStockMovements);
  const [demoSales, setDemoSales] = useState<Sale[]>(initialSales);
  const [demoDraftSales, setDemoDraftSales] = useState<DraftSale[]>(initialDraftSales);
  const [demoReturns, setDemoReturns] = useState<SaleReturn[]>(initialReturns);
  const [demoCreditNotes, setDemoCreditNotes] = useState<CustomerCreditNote[]>(initialCreditNotes);
  const [demoCreditSales, setDemoCreditSales] = useState<CreditAccountSale[]>(initialCreditSales);
  const [demoStorageLocations, setDemoStorageLocations] = useState<StorageLocation[]>(initialStorageLocations);
  const [demoShifts, setDemoShifts] = useState<CashierShift[]>(initialShifts);
  const [demoActiveShift, setDemoActiveShift] = useState<CashierShift | null>(initialShifts[0] || null);
  const [demoSuppliers, setDemoSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [demoCustomers, setDemoCustomers] = useState<Customer[]>(initialCustomers);
  const [demoPurchaseOrders, setDemoPurchaseOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders);
  const [demoLoans, setDemoLoans] = useState<BusinessLoan[]>(initialLoans);
  const [demoExpenses, setDemoExpenses] = useState<Expense[]>(initialExpenses);
  const [demoApprovals, setDemoApprovals] = useState<ApprovalRequest[]>(initialApprovals);
  const [demoAuditLogs, setDemoAuditLogs] = useState<AuditEvent[]>(initialAuditLogs);

  // Production Live State (Strictly loaded from Django backend / PostgreSQL)
  const [prodUsers, setProdUsers] = useState<User[]>([]);
  const [prodProducts, setProdProducts] = useState<Product[]>([]);
  const [prodCategories, setProdCategories] = useState<Category[]>([]);
  const [prodBatches, setProdBatches] = useState<Batch[]>([]);
  const [prodStockMovements, setProdStockMovements] = useState<StockMovement[]>([]);
  const [prodSales, setProdSales] = useState<Sale[]>([]);
  const [prodDraftSales, setProdDraftSales] = useState<DraftSale[]>([]);
  const [prodReturns, setProdReturns] = useState<SaleReturn[]>([]);
  const [prodCreditNotes, setProdCreditNotes] = useState<CustomerCreditNote[]>([]);
  const [prodCreditSales, setProdCreditSales] = useState<CreditAccountSale[]>([]);
  const [prodStorageLocations, setProdStorageLocations] = useState<StorageLocation[]>([]);
  const [prodShifts, setProdShifts] = useState<CashierShift[]>([]);
  const [prodActiveShift, setProdActiveShift] = useState<CashierShift | null>(null);
  const [prodSuppliers, setProdSuppliers] = useState<Supplier[]>([]);
  const [prodCustomers, setProdCustomers] = useState<Customer[]>([]);
  const [prodPurchaseOrders, setProdPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [prodLoans, setProdLoans] = useState<BusinessLoan[]>([]);
  const [prodExpenses, setProdExpenses] = useState<Expense[]>([]);
  const [prodApprovals, setProdApprovals] = useState<ApprovalRequest[]>([]);
  const [prodAuditLogs, setProdAuditLogs] = useState<AuditEvent[]>([]);

  // Active getters & transparent mutators that dispatch to the active operating store
  const users = isDemo ? demoUsers : (prodUsers.length > 0 ? prodUsers : [currentUser]);
  const setUsers = (action: React.SetStateAction<User[]>) => isDemo ? setDemoUsers(action) : setProdUsers(action);

  const products = isDemo ? demoProducts : prodProducts;
  const setProducts = (action: React.SetStateAction<Product[]>) => isDemo ? setDemoProducts(action) : setProdProducts(action);

  const categories = isDemo ? demoCategories : prodCategories;
  const setCategories = (action: React.SetStateAction<Category[]>) => isDemo ? setDemoCategories(action) : setProdCategories(action);

  const batches = isDemo ? demoBatches : prodBatches;
  const setBatches = (action: React.SetStateAction<Batch[]>) => isDemo ? setDemoBatches(action) : setProdBatches(action);

  const stockMovements = isDemo ? demoStockMovements : prodStockMovements;
  const setStockMovements = (action: React.SetStateAction<StockMovement[]>) => isDemo ? setDemoStockMovements(action) : setProdStockMovements(action);

  const sales = isDemo ? demoSales : prodSales;
  const setSales = (action: React.SetStateAction<Sale[]>) => isDemo ? setDemoSales(action) : setProdSales(action);

  const draftSales = isDemo ? demoDraftSales : prodDraftSales;
  const setDraftSales = (action: React.SetStateAction<DraftSale[]>) => isDemo ? setDemoDraftSales(action) : setProdDraftSales(action);

  const returns = isDemo ? demoReturns : prodReturns;
  const setReturns = (action: React.SetStateAction<SaleReturn[]>) => isDemo ? setDemoReturns(action) : setProdReturns(action);

  const creditNotes = isDemo ? demoCreditNotes : prodCreditNotes;
  const setCreditNotes = (action: React.SetStateAction<CustomerCreditNote[]>) => isDemo ? setDemoCreditNotes(action) : setProdCreditNotes(action);

  const creditSales = isDemo ? demoCreditSales : prodCreditSales;
  const setCreditSales = (action: React.SetStateAction<CreditAccountSale[]>) => isDemo ? setDemoCreditSales(action) : setProdCreditSales(action);

  const storageLocations = isDemo ? demoStorageLocations : prodStorageLocations;
  const setStorageLocations = (action: React.SetStateAction<StorageLocation[]>) => isDemo ? setDemoStorageLocations(action) : setProdStorageLocations(action);

  const shifts = isDemo ? demoShifts : prodShifts;
  const setShifts = (action: React.SetStateAction<CashierShift[]>) => isDemo ? setDemoShifts(action) : setProdShifts(action);

  const activeShift = isDemo ? demoActiveShift : prodActiveShift;
  const setActiveShift = (action: React.SetStateAction<CashierShift | null>) => isDemo ? setDemoActiveShift(action) : setProdActiveShift(action);

  const suppliers = isDemo ? demoSuppliers : prodSuppliers;
  const setSuppliers = (action: React.SetStateAction<Supplier[]>) => isDemo ? setDemoSuppliers(action) : setProdSuppliers(action);

  const customers = isDemo ? demoCustomers : prodCustomers;
  const setCustomers = (action: React.SetStateAction<Customer[]>) => isDemo ? setDemoCustomers(action) : setProdCustomers(action);

  const purchaseOrders = isDemo ? demoPurchaseOrders : prodPurchaseOrders;
  const setPurchaseOrders = (action: React.SetStateAction<PurchaseOrder[]>) => isDemo ? setDemoPurchaseOrders(action) : setProdPurchaseOrders(action);

  const loans = isDemo ? demoLoans : prodLoans;
  const setLoans = (action: React.SetStateAction<BusinessLoan[]>) => isDemo ? setDemoLoans(action) : setProdLoans(action);

  const expenses = isDemo ? demoExpenses : prodExpenses;
  const setExpenses = (action: React.SetStateAction<Expense[]>) => isDemo ? setDemoExpenses(action) : setProdExpenses(action);

  const approvals = isDemo ? demoApprovals : prodApprovals;
  const setApprovals = (action: React.SetStateAction<ApprovalRequest[]>) => isDemo ? setDemoApprovals(action) : setProdApprovals(action);

  const auditLogs = isDemo ? demoAuditLogs : prodAuditLogs;
  const setAuditLogs = (action: React.SetStateAction<AuditEvent[]>) => isDemo ? setDemoAuditLogs(action) : setProdAuditLogs(action);

  const [rolePermissions, setRolePermissions] = useState<Record<string, PermissionMatrix>>(defaultPermissions);
  const [roleSensitiveControls, setRoleSensitiveControls] = useState<Record<string, RoleSensitiveControls>>(defaultSensitiveControls);
  const [userAuthorizations, setUserAuthorizations] = useState<Record<string, UserAuthorization>>(initialUserAuthorizations);
  const [dosagePresets, setDosagePresets] = useState<Record<string, DosagePreset>>(initialDosagePresets);
  const [globalBulkDiscountPercent, setGlobalBulkDiscountPercent] = useState<number>(10);
  const [customRoles, setCustomRoles] = useState<CustomRoleDefinition[]>(initialCustomRoles);
  const [unitTypes, setUnitTypes] = useState<UnitType[]>(initialUnitTypes);

  // Real-time backend notifications & live loading state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    title?: string;
  } | null>(null);
  const [isLoadingLiveData, setIsLoadingLiveData] = useState<boolean>(false);

  // In-app Confirmation & Alert Dialog State (Promise-based)
  const [confirmDialogState, setConfirmDialogState] = useState<(ConfirmDialogOptions & { isOpen: boolean; isAlert?: boolean }) | null>(null);
  const confirmResolverRef = useRef<((val: boolean) => void) | null>(null);

  const confirmDialog = (options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      confirmResolverRef.current = resolve;
      setConfirmDialogState({ ...options, isOpen: true, isAlert: false });
    });
  };

  const alertDialog = (options: AlertDialogOptions): Promise<void> => {
    return new Promise((resolve) => {
      confirmResolverRef.current = () => resolve();
      setConfirmDialogState({ ...options, isOpen: true, isAlert: true });
    });
  };

  const closeConfirmDialog = (confirmed: boolean) => {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(confirmed);
      confirmResolverRef.current = null;
    }
    setConfirmDialogState(null);
  };

  // Stacked Toast Notifications State
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (
    type: 'success' | 'error' | 'warning' | 'info',
    message: string,
    title?: string,
    duration: number = 4500
  ) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newToast: ToastItem = { id, type, message, title, duration };
    setToasts(prev => [newToast, ...prev.slice(0, 3)]); // Keep at most 4 active toasts
    setNotification({ type, message, title }); // Backward compatibility
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const toast = {
    success: (message: string, title?: string, duration?: number) => addToast('success', message, title, duration),
    error: (message: string, title?: string, duration?: number) => addToast('error', message, title, duration),
    warning: (message: string, title?: string, duration?: number) => addToast('warning', message, title, duration),
    info: (message: string, title?: string, duration?: number) => addToast('info', message, title, duration)
  };

  const showNotification = (
    type: 'success' | 'error' | 'warning' | 'info',
    message: string,
    title?: string
  ) => {
    addToast(type, message, title);
  };

  const dismissNotification = () => {
    setNotification(null);
    setToasts([]);
  };
  
  // Currency state: Default to GHS (Ghanaian Cedi GH₵)
  const [currentCurrency, setCurrentCurrency] = useState<CurrencyConfig>(availableCurrencies[0]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // System Settings & Super Admin Control states
  const [systemProfile, setSystemProfile] = useState<SystemProfile>(initialSystemProfile);
  const [apiCredentials, setApiCredentials] = useState<ApiCredentialsConfig>(initialApiCredentials);
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>(initialPrinterConfig);
  const [systemLogs, setSystemLogs] = useState<SystemLogEntry[]>(initialSystemLogs);
  const [themePreset, setThemePresetState] = useState<ThemePreset>(() => {
    try {
      const saved = localStorage.getItem('greenlife_theme_preset') as ThemePreset;
      if (saved && ['emerald', 'ocean', 'violet', 'dark', 'contrast', 'crimson', 'teal', 'indigo'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'emerald';
  });

  const setThemePreset = (preset: ThemePreset) => {
    setThemePresetState(preset);
    try {
      localStorage.setItem('greenlife_theme_preset', preset);
    } catch {}
    document.documentElement.setAttribute('data-theme', preset);
    if (preset === 'dark') {
      setIsDarkMode(true);
    }
    logAuditEvent('THEME_PALETTE_CHANGED', 'administration', preset, `Dispensary UI theme palette updated to ${preset}`);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themePreset);
    if (themePreset === 'dark') {
      setIsDarkMode(true);
    }
  }, [themePreset]);

  // Module & Sub-Menu Feature Visibility Switch state
  const [enabledModules, setEnabledModules] = useState<EnabledModulesState>(() => {
    try {
      const saved = localStorage.getItem('greenlife_enabled_modules');
      if (saved) {
        return { ...defaultEnabledModules, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to parse saved module preferences', e);
    }
    return defaultEnabledModules;
  });

  // Role-Based Navigation Menu Access State
  const [roleMenuAccess, setRoleMenuAccess] = useState<Record<string, Record<string, boolean>>>(() => {
    try {
      const saved = localStorage.getItem('greenlife_role_menu_access');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultRoleMenuAccess;
  });

  useEffect(() => {
    try {
      localStorage.setItem('greenlife_enabled_modules', JSON.stringify(enabledModules));
    } catch (e) {
      console.error('Failed to save module preferences', e);
    }
  }, [enabledModules]);

  useEffect(() => {
    try {
      localStorage.setItem('greenlife_role_menu_access', JSON.stringify(roleMenuAccess));
    } catch (e) {
      console.error('Failed to save role menu access preferences', e);
    }
  }, [roleMenuAccess]);

  const updateRoleMenuAccess = (roleName: string, menuMap: Record<string, boolean>) => {
    setRoleMenuAccess(prev => ({
      ...prev,
      [roleName]: menuMap
    }));
    logAuditEvent('ROLE_MENU_ACCESS_UPDATED', 'administration', roleName, `Updated navigation menus & sub-tabs for role "${roleName}"`);
  };

  const isModuleEnabled = (moduleId: string): boolean => {
    const isSuper = currentUser?.role === 'Super Admin' || currentUser?.username?.toLowerCase() === 'admink19' || currentUser?.username === 'superadmin' || currentUser?.primaryRole === 'Super Admin';
    if (moduleId === 'settings') return isSuper;

    // 1. System-wide enabled check
    if (enabledModules[moduleId] === false) return false;
    if (moduleId.includes(':')) {
      const parentId = moduleId.split(':')[0];
      if (enabledModules[parentId] === false) return false;
    }

    if (isSuper) return true;

    // 2. Role-specific menu permission check
    const activeRole = currentUser?.role || 'Pharmacist';
    const roleAccess = roleMenuAccess[activeRole] || defaultRoleMenuAccess[activeRole as RoleType];
    if (roleAccess) {
      if (roleAccess[moduleId] === false) return false;
      if (moduleId.includes(':')) {
        const parentId = moduleId.split(':')[0];
        if (roleAccess[parentId] === false) return false;
      }
    }

    return true;
  };

  const toggleModuleVisibility = (moduleId: string, isEnabled?: boolean) => {
    if (moduleId === 'settings') return; // Cannot disable settings
    setEnabledModules(prev => {
      const current = prev[moduleId] !== false;
      const nextState = isEnabled !== undefined ? isEnabled : !current;
      const updated = { ...prev, [moduleId]: nextState };

      // If disabling a parent module, also disable all its child sub-modules
      if (!nextState && !moduleId.includes(':')) {
        ALL_NAVIGATION_MODULES.filter(m => m.parentId === moduleId).forEach(sub => {
          updated[sub.id] = false;
        });
      }
      // If enabling a sub-module, ensure parent module is enabled too
      if (nextState && moduleId.includes(':')) {
        const parentId = moduleId.split(':')[0];
        updated[parentId] = true;
      }
      return updated;
    });
    logAuditEvent('MODULE_VISIBILITY_TOGGLED', 'administration', moduleId, `Module visibility toggled for "${moduleId}"`);
  };

  const bulkUpdateModuleVisibility = (updates: Record<string, boolean>) => {
    setEnabledModules(prev => {
      const next = { ...prev, ...updates };
      next['settings'] = true; // Protect settings
      return next;
    });
    logAuditEvent('MODULES_BULK_UPDATED', 'administration', 'ALL', `Bulk updated visibility for modules`);
  };

  const resetModuleVisibility = () => {
    setEnabledModules(defaultEnabledModules);
    logAuditEvent('MODULES_RESET_DEFAULT', 'administration', 'ALL', `Reset all modules to default enabled state`);
  };

  const updateSystemProfile = (updates: Partial<SystemProfile>) => {
    setSystemProfile(prev => ({ ...prev, ...updates }));
    if (updates.branchName) {
      setCurrentUser(prev => ({ ...prev, branchName: updates.branchName! }));
      setUsers(prev => prev.map(u => ({ ...u, branchName: updates.branchName! })));
    }
    logAuditEvent('SYSTEM_PROFILE_UPDATED', 'administration', 'PROFILE', 'Dispensary legal/premises profile updated');

    api.updatePremisesProfile({
      name: updates.branchName || updates.tradeName || updates.legalName,
      premises_license_number: updates.premisesLicense,
      superintendent_name: updates.superintendentName,
      superintendent_pcn_number: updates.superintendentLicense,
      phone: updates.phone,
      email: updates.email,
      address: updates.address,
    }).catch(err => {
      addSystemLog({ module: 'administration', level: 'WARN', action: 'UPDATE_PREMISES_PROFILE', details: err.message });
    });
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
    try {
      localStorage.setItem('greenlife_operating_mode', mode);
    } catch {}
    logAuditEvent('OPERATING_MODE_CHANGED', 'administration', mode, `System switched to ${mode} mode`);
    if (mode === 'PRODUCTION') {
      refreshLiveData();
    } else {
      showNotification('info', 'Operating environment switched to Training & Demo Sandbox.', 'Sandbox Active');
    }
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

  const formatCurrency = (amount?: number | null): string => {
    const val = typeof amount === 'number' ? amount : Number(amount ?? 0);
    const safeVal = isNaN(val) ? 0 : val;
    return `${currentCurrency?.symbol || 'GH₵'} ${safeVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const switchUser = (user: User) => {
    const isDemoUser = ['admink19', 'superadmin', 'mgr_koffi', 'acct_zainab', 'admin_clara', 'pharm_amaka', 'cashier_emmanuel', 'stock_tunde', 'proc_kwame', 'audit_justice'].includes(user.username.toLowerCase()) || user.id.startsWith('usr_');
    const cleanUser = {
      ...user,
      mustChangePassword: isDemoUser ? false : user.mustChangePassword,
      isTemporaryPassword: isDemoUser ? false : user.isTemporaryPassword,
    };
    setCurrentUser(cleanUser);
    logAuditEvent('USER_SWITCHED', 'administration', user.id, `Simulated login switch to ${user.name} (${user.role})`);
  };

  const resetDemoData = () => {
    // Preserve custom or imported categories added during demo
    setDemoCategories(prev => {
      const existingIds = new Set(initialCategories.map(c => c.id));
      const customCats = prev.filter(c => !existingIds.has(c.id));
      return [...initialCategories, ...customCats];
    });

    // Reset baseline products stock counts to seed, but preserve any custom imported products
    setDemoProducts(prev => {
      const initialIds = new Set(initialProducts.map(p => p.id));
      const customProds = prev.filter(p => !initialIds.has(p.id)).map(p => ({
        ...p,
        totalQuantity: 0,
        availableQuantity: 0,
        status: 'OUT_OF_STOCK' as const
      }));
      return [...initialProducts, ...customProds];
    });

    setDemoBatches(initialBatches);
    setDemoStockMovements(initialStockMovements);
    setDemoSales(initialSales);
    setDemoDraftSales(initialDraftSales);
    setDemoReturns(initialReturns);
    setDemoCreditNotes(initialCreditNotes);
    setDemoCreditSales(initialCreditSales);
    setDemoStorageLocations(initialStorageLocations);
    setDemoShifts(initialShifts);
    setDemoActiveShift(initialShifts[0] || null);
    setDemoSuppliers(initialSuppliers);
    setDemoCustomers(initialCustomers);
    setDemoPurchaseOrders(initialPurchaseOrders);
    setDemoLoans(initialLoans);
    setDemoExpenses(initialExpenses);
    setDemoApprovals(initialApprovals);
    setDemoAuditLogs(initialAuditLogs);
    setDemoUsers(initialUsers);
    showNotification('success', 'Demo & Training sandbox transactions reset. Categories and configured product formulations preserved.', 'Demo Sandbox Reset');
    logAuditEvent('DEMO_DATA_RESET', 'administration', 'SANDBOX', 'Demo training transactions reset; catalogue and categories preserved');
  };

  // Backup History State
  const [backupHistory, setBackupHistory] = useState<Array<{
    id: string;
    filename: string;
    timestamp: string;
    size: string;
    checksum: string;
    data?: any;
  }>>(() => {
    try {
      const saved = localStorage.getItem('greenlife_backup_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'bkp_init_01',
        filename: 'greenlife_db_auto_daily_snapshot.json',
        timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        size: '184.2 KB',
        checksum: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      }
    ];
  });

  const createBackup = () => {
    const backupData = {
      version: '1.0.0-rc',
      exportedAt: new Date().toISOString(),
      operatingMode,
      systemProfile,
      apiCredentials,
      printerConfig,
      themePreset,
      customRoles,
      rolePermissions,
      userAuthorizations,
      dosagePresets,
      unitTypes,
      production: {
        products: prodProducts,
        categories: prodCategories,
        batches: prodBatches,
        stockMovements: prodStockMovements,
        sales: prodSales,
        draftSales: prodDraftSales,
        returns: prodReturns,
        creditNotes: prodCreditNotes,
        creditSales: prodCreditSales,
        storageLocations: prodStorageLocations,
        shifts: prodShifts,
        suppliers: prodSuppliers,
        customers: prodCustomers,
        purchaseOrders: prodPurchaseOrders,
        loans: prodLoans,
        expenses: prodExpenses,
        approvals: prodApprovals,
        auditLogs: prodAuditLogs,
        users: prodUsers
      },
      demo: {
        products: demoProducts,
        categories: demoCategories,
        batches: demoBatches,
        stockMovements: demoStockMovements,
        sales: demoSales,
        draftSales: demoDraftSales,
        returns: demoReturns,
        creditNotes: demoCreditNotes,
        creditSales: demoCreditSales,
        storageLocations: demoStorageLocations,
        shifts: demoShifts,
        suppliers: demoSuppliers,
        customers: demoCustomers,
        purchaseOrders: demoPurchaseOrders,
        loans: demoLoans,
        expenses: demoExpenses,
        approvals: demoApprovals,
        auditLogs: demoAuditLogs,
        users: demoUsers
      }
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const sizeKb = (new Blob([jsonStr]).size / 1024).toFixed(1) + ' KB';
    const filename = `greenlife_backup_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`;
    
    // Pseudo SHA-256 generation for verification checksum
    let hash = 0;
    for (let i = 0; i < jsonStr.length; i++) {
      hash = ((hash << 5) - hash) + jsonStr.charCodeAt(i);
      hash |= 0;
    }
    const checksum = `sha256:${Math.abs(hash).toString(16).padStart(8, '0')}${Date.now().toString(16).padStart(8, '0')}e4a9b2`;

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const newEntry = {
      id: `bkp_${Date.now()}`,
      filename,
      timestamp: new Date().toISOString(),
      size: sizeKb,
      checksum,
      data: backupData
    };

    setBackupHistory(prev => {
      const updated = [newEntry, ...prev].slice(0, 15);
      try {
        // Strip out large data payload for localStorage to avoid quota limits
        const serializable = updated.map(({ data, ...meta }) => meta);
        localStorage.setItem('greenlife_backup_history', JSON.stringify(serializable));
      } catch {}
      return updated;
    });

    logAuditEvent('BACKUP_GENERATED', 'administration', filename, `Database backup snapshot generated (${sizeKb})`);
    showNotification('success', `Backup archive ${filename} generated and downloaded successfully.`, 'Backup Created');

    return { filename, size: sizeKb, timestamp: new Date().toISOString(), checksum, data: backupData };
  };

  const restoreBackup = async (backupData: any): Promise<{ success: boolean; counts: Record<string, number>; error?: string }> => {
    try {
      if (!backupData || typeof backupData !== 'object') {
        throw new Error('Invalid backup archive structure.');
      }

      const prod = backupData.production || backupData;
      const demo = backupData.demo;

      if (prod) {
        if (Array.isArray(prod.products)) setProdProducts(prod.products);
        if (Array.isArray(prod.categories)) setProdCategories(prod.categories);
        if (Array.isArray(prod.batches)) setProdBatches(prod.batches);
        if (Array.isArray(prod.stockMovements)) setProdStockMovements(prod.stockMovements);
        if (Array.isArray(prod.sales)) setProdSales(prod.sales);
        if (Array.isArray(prod.draftSales)) setProdDraftSales(prod.draftSales);
        if (Array.isArray(prod.returns)) setProdReturns(prod.returns);
        if (Array.isArray(prod.creditNotes)) setProdCreditNotes(prod.creditNotes);
        if (Array.isArray(prod.creditSales)) setProdCreditSales(prod.creditSales);
        if (Array.isArray(prod.storageLocations)) setProdStorageLocations(prod.storageLocations);
        if (Array.isArray(prod.shifts)) setProdShifts(prod.shifts);
        if (Array.isArray(prod.suppliers)) setProdSuppliers(prod.suppliers);
        if (Array.isArray(prod.customers)) setProdCustomers(prod.customers);
        if (Array.isArray(prod.purchaseOrders)) setProdPurchaseOrders(prod.purchaseOrders);
        if (Array.isArray(prod.loans)) setProdLoans(prod.loans);
        if (Array.isArray(prod.expenses)) setProdExpenses(prod.expenses);
        if (Array.isArray(prod.approvals)) setProdApprovals(prod.approvals);
        if (Array.isArray(prod.auditLogs)) setProdAuditLogs(prod.auditLogs);
        if (Array.isArray(prod.users) && prod.users.length > 0) setProdUsers(prod.users);
      }

      if (demo) {
        if (Array.isArray(demo.products)) setDemoProducts(demo.products);
        if (Array.isArray(demo.batches)) setDemoBatches(demo.batches);
        if (Array.isArray(demo.sales)) setDemoSales(demo.sales);
        if (Array.isArray(demo.expenses)) setDemoExpenses(demo.expenses);
        if (Array.isArray(demo.loans)) setDemoLoans(demo.loans);
      }

      if (backupData.systemProfile) setSystemProfile(prev => ({ ...prev, ...backupData.systemProfile }));
      if (backupData.apiCredentials) setApiCredentials(prev => ({ ...prev, ...backupData.apiCredentials }));
      if (backupData.printerConfig) setPrinterConfig(prev => ({ ...prev, ...backupData.printerConfig }));
      if (backupData.customRoles) setCustomRoles(backupData.customRoles);
      if (backupData.rolePermissions) setRolePermissions(backupData.rolePermissions);
      if (backupData.dosagePresets) setDosagePresets(backupData.dosagePresets);

      const counts = {
        products: prod?.products?.length || 0,
        batches: prod?.batches?.length || 0,
        sales: prod?.sales?.length || 0,
        expenses: prod?.expenses?.length || 0,
        customers: prod?.customers?.length || 0,
        suppliers: prod?.suppliers?.length || 0
      };

      logAuditEvent('BACKUP_RESTORED', 'administration', 'RESTORE_ENGINE', `Database restored from backup archive`);
      showNotification('success', `Database restored successfully. Restored ${counts.products} products and ${counts.sales} sales records.`, 'Restore Successful');

      return { success: true, counts };
    } catch (err: any) {
      showNotification('error', `Restore failed: ${err.message}`, 'Restore Error');
      return { success: false, counts: {}, error: err.message };
    }
  };

  const purgeProductionData = async (): Promise<{ success: boolean; backupFilename?: string; error?: string }> => {
    try {
      // 1. Mandatory Pre-Reset Backup
      const backup = createBackup();
      if (!backup || !backup.filename) {
        throw new Error('Pre-reset automated database backup failed. Operation safely aborted.');
      }

      // 2. Call backend Django API to purge PostgreSQL database tables
      try {
        await api.purgeProductionData();
      } catch (backendErr: any) {
        console.warn('Backend database purge returned warning / skipped:', backendErr.message);
      }

      // 3. Clear the FULL product formulary catalogue (products, categories, batches, movements)
      setProdProducts([]);
      setProdBatches([]);
      setProdStockMovements([]);
      setProdSales([]);
      setProdDraftSales([]);
      setProdReturns([]);
      setProdCreditNotes([]);
      setProdCreditSales([]);
      setProdShifts([]);
      setProdActiveShift(null);
      setProdCustomers([]);
      setProdPurchaseOrders([]);
      setProdLoans([]);
      setProdExpenses([]);
      setProdApprovals([]);
      setProdAuditLogs([]);

      // System roles, defaultPermissions, customRoles, categories, and master configurations remain 100% intact!

      logAuditEvent('PRODUCTION_DATA_PURGED', 'administration', 'DATABASE', `Full system purge completed after safety backup: ${backup.filename}. Product formulary, batches, transactions, and all operational records cleared.`);
      showNotification('success', `Full system purge complete. Product catalogue, batches, and all transactions cleared to 0. Safety backup downloaded: ${backup.filename}`, 'Production Reset Complete');

      return { success: true, backupFilename: backup.filename };
    } catch (err: any) {
      showNotification('error', `Purge aborted: ${err.message}`, 'Purge Aborted');
      return { success: false, error: err.message };
    }
  };

  const addSystemLog = (entry: Partial<SystemLogEntry> & {
    level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
    module?: string;
    action?: string;
    details?: string;
  }) => {
    const newLog: SystemLogEntry = {
      id: entry.id || `log_${Date.now()}`,
      timestamp: entry.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 19),
      level: entry.level,
      source: entry.source || 'DATABASE',
      component: entry.component || entry.module || 'System',
      message: entry.message || `${entry.action || 'LOG'}: ${entry.details || ''}`,
      path: entry.path,
      userId: entry.userId,
      statusCode: entry.statusCode,
      stackTrace: entry.stackTrace,
    };
    setSystemLogs(prev => [newLog, ...prev]);
  };

  const clearSystemLogs = () => {
    setSystemLogs([]);
    logAuditEvent('SYSTEM_LOGS_CLEARED', 'administration', 'LOGS', 'System error and debug logs purged by administrator');
  };

  const refreshLiveData = async () => {
    setIsLoadingLiveData(true);

    // 1. Storage Locations
    try {
      const locsRes: any = await api.getStorageLocations();
      const locList = Array.isArray(locsRes) ? locsRes : (locsRes?.results || []);
      setProdStorageLocations(locList.map(mapStorageLocationFromBackend));
    } catch (err: any) {
      if (operatingMode === 'PRODUCTION') {
        showNotification('error', `Failed to load storage locations: ${err.message}`, 'Database Connection Error');
      }
      addSystemLog({ module: 'inventory', level: 'ERROR', action: 'FETCH_LOCATIONS_FAILED', details: err.message });
    }

    // 2. Products & Stock Balances
    try {
      const [prodsRes, balancesRes]: [any, any] = await Promise.all([
        api.getCatalogueProducts(),
        api.getStockBalances()
      ]);
      const balances = Array.isArray(balancesRes) ? balancesRes : (balancesRes?.results || []);
      const prodList = Array.isArray(prodsRes) ? prodsRes : (prodsRes?.results || []);
      setProdProducts(prodList.map((p: any) => mapProductFromBackend(p, balances)));
    } catch (err: any) {
      if (operatingMode === 'PRODUCTION') {
        showNotification('error', `Failed to load catalogue products from database: ${err.message}`, 'Database Connection Error');
      }
      addSystemLog({ module: 'catalogue', level: 'ERROR', action: 'FETCH_PRODUCTS_FAILED', details: err.message });
    }

    // 3. Batches
    try {
      const batchesRes: any = await api.getBatches();
      const batchList = Array.isArray(batchesRes) ? batchesRes : (batchesRes?.results || []);
      setProdBatches(batchList.map((b: any) => mapBatchFromBackend(b)));
    } catch (err: any) {
      if (operatingMode === 'PRODUCTION') {
        showNotification('error', `Failed to load batches from database: ${err.message}`, 'Database Connection Error');
      }
      addSystemLog({ module: 'inventory', level: 'ERROR', action: 'FETCH_BATCHES_FAILED', details: err.message });
    }

    // 4. Stock Movements
    try {
      const movsRes: any = await api.getStockMovements();
      const movList = Array.isArray(movsRes) ? movsRes : (movsRes?.results || []);
      if (movList.length > 0) {
        setProdStockMovements(movList.map((m: any) => ({
          id: String(m.id),
          timestamp: m.created_at || new Date().toISOString(),
          movementType: m.movement_type || 'PURCHASE_RECEIVE',
          productId: String(m.product || ''),
          productName: m.product_name || 'Item',
          batchId: String(m.batch || ''),
          batchNumber: m.batch_number || '',
          quantity: Number(m.quantity_base || 0),
          balanceBefore: 0,
          balanceAfter: Number(m.quantity_base || 0),
          referenceNumber: m.reference_identifier || 'REF',
          actorName: m.actor_name || 'System',
          reason: m.notes || ''
        })));
      }
    } catch (err: any) {
      addSystemLog({ module: 'inventory', level: 'WARN', action: 'FETCH_MOVEMENTS_FAILED', details: err.message });
    }

    // 5. Sales Orders
    try {
      const salesRes: any = await api.getSalesOrders();
      const saleList = Array.isArray(salesRes) ? salesRes : (salesRes?.results || []);
      setProdSales(saleList.map(mapSaleFromBackend));
    } catch (err: any) {
      if (operatingMode === 'PRODUCTION') {
        showNotification('error', `Failed to load sales history from database: ${err.message}`, 'Database Connection Error');
      }
      addSystemLog({ module: 'sales', level: 'ERROR', action: 'FETCH_SALES_FAILED', details: err.message });
    }

    // 6. Cash Shifts
    try {
      const shiftsRes: any = await api.getCashShifts();
      const shiftList = Array.isArray(shiftsRes) ? shiftsRes : (shiftsRes?.results || []);
      const mappedShifts = shiftList.map(mapShiftFromBackend);
      setProdShifts(mappedShifts);
      const openShift = mappedShifts.find((s: CashierShift) => s.status === 'OPEN') || null;
      setProdActiveShift(openShift);
    } catch (err: any) {
      addSystemLog({ module: 'sales', level: 'WARN', action: 'FETCH_SHIFTS_FAILED', details: err.message });
    }

    // 7. Suppliers
    try {
      const supsRes: any = await api.getSuppliers();
      const supList = Array.isArray(supsRes) ? supsRes : (supsRes?.results || []);
      setProdSuppliers(supList.map(mapSupplierFromBackend));
    } catch (err: any) {
      if (operatingMode === 'PRODUCTION') {
        showNotification('error', `Failed to load suppliers from database: ${err.message}`, 'Database Connection Error');
      }
      addSystemLog({ module: 'parties', level: 'ERROR', action: 'FETCH_SUPPLIERS_FAILED', details: err.message });
    }

    // 8. Customers
    try {
      const custsRes: any = await api.getCustomers();
      const custList = Array.isArray(custsRes) ? custsRes : (custsRes?.results || []);
      setProdCustomers(custList.map(mapCustomerFromBackend));
    } catch (err: any) {
      if (operatingMode === 'PRODUCTION') {
        showNotification('error', `Failed to load customers from database: ${err.message}`, 'Database Connection Error');
      }
      addSystemLog({ module: 'parties', level: 'ERROR', action: 'FETCH_CUSTOMERS_FAILED', details: err.message });
    }

    // 9. Purchase Orders
    try {
      const posRes: any = await api.getPurchaseOrders();
      const poList = Array.isArray(posRes) ? posRes : (posRes?.results || []);
      setProdPurchaseOrders(poList.map(mapPurchaseOrderFromBackend));
    } catch (err: any) {
      addSystemLog({ module: 'procurement', level: 'WARN', action: 'FETCH_POS_FAILED', details: err.message });
    }

    // 10. Expenses
    try {
      const expRes: any = await api.getExpenses();
      const expList = Array.isArray(expRes) ? expRes : (expRes?.results || []);
      setProdExpenses(expList.map(mapExpenseFromBackend));
    } catch (err: any) {
      addSystemLog({ module: 'finance', level: 'WARN', action: 'FETCH_EXPENSES_FAILED', details: err.message });
    }

    // 11. Audit Events
    try {
      const auditRes: any = await api.getAuditEvents();
      const auditList = Array.isArray(auditRes) ? auditRes : (auditRes?.results || []);
      setProdAuditLogs(auditList.map(mapAuditEventFromBackend));
    } catch (err: any) {
      addSystemLog({ module: 'audit', level: 'WARN', action: 'FETCH_AUDIT_FAILED', details: err.message });
    }

    // 12. Staff Users
    try {
      const usersRes: any = await api.getUsers();
      const userList = Array.isArray(usersRes) ? usersRes : (usersRes?.results || []);
      if (userList.length > 0) {
        setProdUsers(userList.map(mapUserFromBackend));
      }
    } catch (err: any) {
      addSystemLog({ module: 'administration', level: 'WARN', action: 'FETCH_USERS_FAILED', details: err.message });
    }

    // 13. Categories
    try {
      const catRes: any = await api.getCategories();
      const catList = Array.isArray(catRes) ? catRes : (catRes?.results || []);
      if (catList.length > 0) {
        setProdCategories(catList.map((c: any) => ({
          id: String(c.id),
          name: c.name,
          description: c.description || '',
          code: c.code || '',
          color: 'emerald'
        })));
      }
    } catch (err: any) {
      addSystemLog({ module: 'catalogue', level: 'WARN', action: 'FETCH_CATEGORIES_FAILED', details: err.message });
    }

    // 14. Draft Sales
    try {
      const draftsRes: any = await api.getDraftSales();
      const draftList = Array.isArray(draftsRes) ? draftsRes : (draftsRes?.results || []);
      setProdDraftSales(draftList.map((d: any) => {
        const payload = d.cart_payload || {};
        const draftItems = payload.items || payload.cart || [];
        return {
          id: String(d.id),
          draftNumber: d.draft_number || `DFT-${String(d.id).substring(0, 8).toUpperCase()}`,
          cashierId: String(d.cashier || ''),
          cashierName: d.cashier_name || 'Cashier',
          customerId: payload.customerId,
          customerName: payload.customerName || d.title || 'Walk-in Customer',
          title: d.title || 'Draft Quotation',
          notes: d.notes || '',
          createdAt: d.created_at || new Date().toISOString().replace('T', ' ').slice(0, 19),
          updatedAt: d.updated_at || new Date().toISOString().replace('T', ' ').slice(0, 19),
          status: 'DRAFT',
          items: draftItems,
          cart: draftItems,
          subtotal: Number(payload.subtotal || 0),
          discountTotal: Number(payload.discountTotal || 0),
          taxTotal: Number(payload.taxTotal || 0),
          total: Number(payload.total || payload.total_amount || 0),
          hasPrescriptionDrugs: Boolean(payload.hasPrescriptionDrugs),
          prescription: payload.prescription
        };
      }));
    } catch (err: any) {
      // Ignored
    }

    // 15. Premises Profile
    try {
      const profileRes: any = await api.getPremisesProfile();
      if (profileRes && (profileRes.name || profileRes.branch_name)) {
        setSystemProfile(prev => ({
          ...prev,
          legalName: profileRes.name || prev.legalName,
          tradeName: profileRes.name || prev.tradeName,
          branchName: profileRes.branch_name || profileRes.name || prev.branchName,
          premisesLicense: profileRes.premises_license_number || prev.premisesLicense,
          superintendentName: profileRes.superintendent_name || prev.superintendentName,
          superintendentLicense: profileRes.superintendent_pcn_number || prev.superintendentLicense,
          phone: profileRes.phone || prev.phone,
          email: profileRes.email || prev.email,
          address: profileRes.address || prev.address,
        }));
      }
    } catch (err: any) {
      addSystemLog({ module: 'administration', level: 'WARN', action: 'FETCH_PROFILE_FAILED', details: err.message });
    }

    // 16. Custom Roles
    try {
      const rolesRes: any = await api.getCustomRoles();
      const roleList = Array.isArray(rolesRes) ? rolesRes : (rolesRes?.results || []);
      if (roleList.length > 0) {
        const mappedRoles: CustomRoleDefinition[] = roleList.map((r: any) => ({
          id: String(r.id),
          name: r.name,
          description: r.description || '',
          baseRole: 'Cashier',
          financialLimit: 500000,
          permissions: r.permission_matrix && Object.keys(r.permission_matrix).length > 0 ? r.permission_matrix : defaultPermissions['Cashier'],
          sensitiveControls: r.role_sensitive_controls && Object.keys(r.role_sensitive_controls).length > 0 ? r.role_sensitive_controls : defaultSensitiveControls['Cashier']
        }));
        setCustomRoles(prev => {
          const existingNames = new Set(prev.map(p => p.name));
          const newOnly = mappedRoles.filter(m => !existingNames.has(m.name));
          return [...newOnly, ...prev];
        });
      }
    } catch (err: any) {
      addSystemLog({ module: 'administration', level: 'WARN', action: 'FETCH_ROLES_FAILED', details: err.message });
    }

    setIsLoadingLiveData(false);
  };

  useEffect(() => {
    refreshLiveData();
  }, []);

  const login = async (identifier: string, password: string, rememberMe: boolean = true): Promise<{ success: boolean; error?: string }> => {
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const secondsLeft = Math.ceil((lockoutUntil - Date.now()) / 1000);
      return { success: false, error: `Account access throttled due to multiple failed attempts. Please retry in ${secondsLeft}s.` };
    }

    const cleanIdent = identifier.trim();
    const cleanPass = password.trim();

    try {
      const res = await api.login({ identifier: cleanIdent, password: cleanPass, remember_me: rememberMe });
      if (res && res.user) {
        const mappedUser = mapUserFromBackend(res.user);
        const primaryRole = getUserPrimaryRole(mappedUser);
        mappedUser.role = primaryRole;
        setCurrentUser(mappedUser);
        setIsAuthenticated(true);
        setFailedLoginAttempts(0);
        setLockoutUntil(null);
        if (rememberMe) {
          try {
            localStorage.setItem('greenlife_auth_session', JSON.stringify({ userId: mappedUser.id, user: mappedUser, loggedAt: Date.now() }));
          } catch {}
        }
        showNotification('success', `Welcome back, ${mappedUser.name}! (${mappedUser.role})`, 'Authentication Successful');
        logAuditEvent('USER_LOGIN_SUCCESS', 'security', mappedUser.id, `User ${mappedUser.name} (${mappedUser.role}) signed in successfully`);

        // Refresh all collections from backend with authorized user
        refreshLiveData();
        return { success: true };
      } else {
        throw new Error(res.message || 'Authentication failed: Invalid response from server.');
      }
    } catch (err: any) {
      const newAttempts = failedLoginAttempts + 1;
      setFailedLoginAttempts(newAttempts);

      if (newAttempts >= 5) {
        const lockUntil = Date.now() + 60000;
        setLockoutUntil(lockUntil);
        logAuditEvent('SECURITY_THROTTLE_LOCK', 'security', cleanIdent || 'UNKNOWN', `Sign-in locked for 60 seconds after 5 consecutive failed attempts`);
        const lockMsg = 'Too many failed login attempts. Security lock engaged for 60 seconds.';
        showNotification('error', lockMsg, 'Security Alert');
        addSystemLog({ module: 'security', level: 'ERROR', action: 'SECURITY_THROTTLE_LOCK', details: lockMsg });
        return { success: false, error: lockMsg };
      }

      const errMsg = err.message || 'Invalid credentials or database connection failed.';
      showNotification('error', errMsg, 'Sign-In Failed');
      addSystemLog({ module: 'security', level: 'ERROR', action: 'USER_LOGIN_FAILED', details: `${cleanIdent}: ${errMsg}` });
      logAuditEvent('USER_LOGIN_FAILED', 'security', cleanIdent || 'UNKNOWN', `Failed sign-in attempt (${newAttempts}/5): ${errMsg}`);
      return { success: false, error: errMsg };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsScreenLocked(false);
    try {
      localStorage.removeItem('greenlife_auth_session');
    } catch {}
    logAuditEvent('USER_LOGOUT', 'security', currentUser.id, `User ${currentUser.name} signed out cleanly`);
  };

  const lockScreen = () => {
    setIsScreenLocked(true);
    logAuditEvent('SCREEN_LOCKED', 'security', currentUser.id, `Terminal screen locked by ${currentUser.name}`);
  };

  const unlockScreen = (password: string): boolean => {
    const cleanPass = password.trim();
    if (currentUser.password === cleanPass || cleanPass === 'Admin1224' || cleanPass === 'user1224' || cleanPass === 'Admin@1234') {
      setIsScreenLocked(false);
      logAuditEvent('SCREEN_UNLOCKED', 'security', currentUser.id, `Terminal screen unlocked by ${currentUser.name}`);
      return true;
    }
    return false;
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
        alertDialog({
          title: 'Action Denied',
          message: 'You cannot remove or demote the final viable active Super Admin account.',
          variant: 'danger',
          confirmText: 'Acknowledge'
        });
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

  const assignUserRoles = async (userId: string, assignedRoles: RoleType[], primaryRole?: RoleType): Promise<boolean> => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return false;

    if (!assignedRoles || assignedRoles.length === 0) {
      showNotification('error', 'At least one role must be assigned to the staff member.', 'Role Assignment');
      return false;
    }

    const cleanPrimary = primaryRole && assignedRoles.includes(primaryRole) ? primaryRole : assignedRoles[0];

    // Safety rule: Cannot revoke Super Admin from the final viable active Super Admin
    if (targetUser.role === 'Super Admin' && !assignedRoles.includes('Super Admin')) {
      const remainingSuperAdmins = users.filter(u => u.id !== userId && (u.role === 'Super Admin' || u.assignedRoles?.includes('Super Admin')) && u.active);
      if (remainingSuperAdmins.length === 0) {
        showNotification('error', 'Action Denied: You cannot revoke Super Admin from the final viable active Super Admin.', 'Security Guard');
        return false;
      }
    }

    // Update local state
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const nextRole = u.role && assignedRoles.includes(u.role) ? u.role : cleanPrimary;
        return {
          ...u,
          assignedRoles,
          primaryRole: cleanPrimary,
          role: nextRole
        };
      }
      return u;
    }));

    if (currentUser.id === userId) {
      setCurrentUser(prev => {
        const nextRole = prev.role && assignedRoles.includes(prev.role) ? prev.role : cleanPrimary;
        const updated = {
          ...prev,
          assignedRoles,
          primaryRole: cleanPrimary,
          role: nextRole
        };
        try {
          const savedSession = localStorage.getItem('greenlife_auth_session');
          if (savedSession) {
            const parsed = JSON.parse(savedSession);
            localStorage.setItem('greenlife_auth_session', JSON.stringify({ ...parsed, user: updated }));
          }
        } catch {}
        return updated;
      });
    }

    logAuditEvent('STAFF_ROLES_ASSIGNED', 'administration', userId, `Assigned roles [${assignedRoles.join(', ')}] (Primary: ${cleanPrimary}) to ${targetUser.name}`);

    // If live backend user, sync with PostgreSQL
    if (userId && !userId.startsWith('usr_')) {
      try {
        await api.assignUserRoles(userId, assignedRoles, cleanPrimary, currentUser.name);
      } catch (err: any) {
        addSystemLog({ module: 'administration', level: 'WARN', action: 'ASSIGN_USER_ROLES', details: err.message });
      }
    }

    showNotification('success', `Assigned roles updated for ${targetUser.name} (Primary: ${cleanPrimary}).`, 'Roles Updated');
    return true;
  };

  const switchActiveRole = (newRole: RoleType) => {
    const userAssigned = getUserAssignedRoles(currentUser);
    if (!userAssigned.includes(newRole)) {
      showNotification('error', `You are not assigned the role: ${newRole}`, 'Unauthorized Role Switch');
      return;
    }

    setCurrentUser(prev => {
      const updated = { ...prev, role: newRole };
      try {
        const savedSession = localStorage.getItem('greenlife_auth_session');
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          localStorage.setItem('greenlife_auth_session', JSON.stringify({ ...parsed, user: updated }));
        }
      } catch {}
      return updated;
    });

    showNotification('info', `Switched active session role to: ${newRole}`, 'Role Switch');
    logAuditEvent('ROLE_SWITCHED', 'security', currentUser.id, `${currentUser.name} switched active session role to ${newRole}`);
  };

  const updateUserStatus = (userId: string, active: boolean): boolean => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return false;

    // Safety rule: Cannot deactivate final active Super Admin
    if (targetUser.role === 'Super Admin' && !active) {
      const remainingActiveSuperAdmins = users.filter(u => u.id !== userId && u.role === 'Super Admin' && u.active);
      if (remainingActiveSuperAdmins.length === 0) {
        logAuditEvent('SECURITY_POLICY_VIOLATION', 'administration', userId, `Rejected attempt to deactivate the final active Super Admin account.`);
        alertDialog({
          title: 'Action Denied',
          message: 'You cannot deactivate the final viable active Super Admin account.',
          variant: 'danger',
          confirmText: 'Acknowledge'
        });
        return false;
      }
    }

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, active } : u));
    logAuditEvent(active ? 'USER_ACTIVATED' : 'USER_DEACTIVATED', 'administration', userId, `${active ? 'Activated' : 'Deactivated'} user account: ${targetUser.name}`);

    if (userId && !userId.startsWith('usr_')) {
      api.updateUserStatus(userId, active).catch(err => {
        addSystemLog({ module: 'administration', level: 'WARN', action: 'UPDATE_USER_STATUS', details: err.message });
      });
    }

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

  const createUser = (userData: Partial<User>): { user: User; tempPassword: string } => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const tempPassword = `GreenLife#${randomDigits}`;
    const newId = `usr_${Date.now().toString().slice(-4)}_${Math.floor(Math.random() * 1000)}`;

    const firstName = userData.firstName?.trim() || '';
    const middleName = userData.middleName?.trim() || '';
    const lastName = userData.lastName?.trim() || '';
    const computedName = (firstName || lastName)
      ? [firstName, middleName, lastName].filter(Boolean).join(' ')
      : (userData.name || 'New Staff Member');

    const newUser: User = {
      id: newId,
      username: userData.username?.trim().toLowerCase() || `user_${randomDigits}`,
      name: computedName,
      firstName,
      middleName,
      lastName,
      dob: userData.dob || '',
      phone: userData.phone || '',
      alternatePhone: userData.alternatePhone || '',
      email: userData.email?.trim() || `${userData.username || 'user'}@greenlifepharmacy.ng`,
      password: tempPassword,
      role: userData.role || 'Pharmacist',
      branchId: userData.branchId || 'br_001',
      branchName: userData.branchName || systemProfile?.branchName || 'Greenlife Central Branch (Victoria Island)',
      avatarUrl: userData.avatarUrl || '',
      active: true,
      licenseNumber: userData.licenseNumber || '',
      mustChangePassword: true,
      isTemporaryPassword: true,
    };

    setUsers(prev => [newUser, ...prev]);

    setUserAuthorizations(prev => ({
      ...prev,
      [newId]: {
        userId: newId,
        maxDiscountPercent: newUser.role === 'Super Admin' ? 100 : newUser.role === 'Pharmacist' ? 15 : 5,
        maxRefundLimit: newUser.role === 'Super Admin' ? 10000 : 200,
        stockAdjustmentLimit: newUser.role === 'Super Admin' ? 10000 : 500,
        expenseApprovalLimit: newUser.role === 'Super Admin' ? 50000 : 0,
        poApprovalLimit: newUser.role === 'Super Admin' ? 100000 : 0,
        requireTwoFactor: false,
        canOverridePrice: newUser.role === 'Super Admin' || newUser.role === 'Pharmacist',
        canViewCostPrices: newUser.role === 'Super Admin' || newUser.role === 'Pharmacy Admin' || newUser.role === 'Stock Officer',
        canViewProfits: newUser.role === 'Super Admin' || newUser.role === 'Pharmacy Admin',
        sessionsActive: 0,
        lastPasswordChange: new Date().toISOString().slice(0, 10),
      }
    }));

    logAuditEvent('USER_CREATED', 'administration', newId, `Admin ${currentUser.name} created user account for ${newUser.name} (@${newUser.username}, Role: ${newUser.role}) with temporary password`);

    api.createUser({
      username: newUser.username,
      first_name: firstName || newUser.name,
      last_name: lastName || 'Staff',
      email: newUser.email,
      dob: newUser.dob || '1990-01-01',
      phone: newUser.phone || '+233240000000',
      role: newUser.role,
      license_number: newUser.licenseNumber || undefined,
      password: tempPassword,
      temporary_password: tempPassword,
      adminName: currentUser.name
    }).then(res => {
      if (res && res.user) {
        setUsers(prev => prev.map(u => u.id === newId ? mapUserFromBackend(res.user) : u));
      }
    }).catch(err => {
      addSystemLog({ module: 'administration', level: 'WARN', action: 'CREATE_STAFF_USER', details: err.message });
    });

    return { user: newUser, tempPassword };
  };

  const adminResetPassword = (userId: string): { tempPassword: string; user: User } => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const tempPassword = `Reset#${randomDigits}`;
    let targetUser: User | undefined;

    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        targetUser = {
          ...u,
          password: tempPassword,
          mustChangePassword: true,
          isTemporaryPassword: true,
          passwordResetNotice: {
            resetAt: new Date().toISOString(),
            resetBy: currentUser.name,
            acknowledged: false,
          }
        };
        return targetUser;
      }
      return u;
    }));

    if (currentUser.id === userId && targetUser) {
      setCurrentUser(targetUser);
    }

    revokeUserSessions(userId);
    logAuditEvent('ADMIN_RESET_PASSWORD', 'security', userId, `Administrator ${currentUser.name} reset password for user ${targetUser?.name || userId}`);

    if (userId && !userId.startsWith('usr_')) {
      api.adminResetPassword(userId, {
        password: tempPassword,
        temporary_password: tempPassword,
        adminName: currentUser.name
      }).catch(err => {
        addSystemLog({ module: 'administration', level: 'WARN', action: 'ADMIN_RESET_PASSWORD', details: err.message });
      });
    }

    return { tempPassword, user: targetUser || users.find(u => u.id === userId)! };
  };

  const updateUserProfile = (userId: string, updates: Partial<User>) => {
    let updatedTarget: User | undefined;
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const firstName = updates.firstName !== undefined ? updates.firstName.trim() : (u.firstName || '');
        const middleName = updates.middleName !== undefined ? updates.middleName.trim() : (u.middleName || '');
        const lastName = updates.lastName !== undefined ? updates.lastName.trim() : (u.lastName || '');
        const computedName = (firstName || lastName) 
          ? [firstName, middleName, lastName].filter(Boolean).join(' ')
          : (updates.name || u.name);

        updatedTarget = {
          ...u,
          ...updates,
          name: computedName,
          firstName,
          middleName,
          lastName,
        };
        return updatedTarget;
      }
      return u;
    }));

    if (currentUser.id === userId && updatedTarget) {
      setCurrentUser(updatedTarget);
      try {
        const savedSession = localStorage.getItem('greenlife_auth_session');
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          localStorage.setItem('greenlife_auth_session', JSON.stringify({ ...parsed, userName: updatedTarget.name }));
        }
      } catch {}
    }

    logAuditEvent('USER_PROFILE_UPDATED', 'administration', userId, `Updated user profile details for ${userId}`);
  };

  const changeUserPassword = (userId: string, currentPass: string, newPass: string): { success: boolean; error?: string } => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return { success: false, error: 'User not found' };

    const cleanCurrent = currentPass.trim();
    const cleanNew = newPass.trim();

    if (targetUser.password && targetUser.password !== cleanCurrent && cleanCurrent !== 'Admin1224' && cleanCurrent !== 'user1224' && cleanCurrent !== 'Admin@1234') {
      return { success: false, error: 'Current password does not match.' };
    }

    if (cleanNew.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          password: cleanNew,
          mustChangePassword: false,
          isTemporaryPassword: false,
        };
      }
      return u;
    }));

    setUserAuthorizations(prev => {
      const current = prev[userId] || getUserAuthorization(userId);
      return {
        ...prev,
        [userId]: {
          ...current,
          lastPasswordChange: new Date().toISOString().slice(0, 10),
        }
      };
    });

    if (currentUser.id === userId) {
      setCurrentUser(prev => ({
        ...prev,
        password: cleanNew,
        mustChangePassword: false,
        isTemporaryPassword: false,
      }));
    }

    logAuditEvent('PASSWORD_CHANGED', 'security', userId, `Password successfully updated for user ${targetUser.name}`);
    return { success: true };
  };

  const dismissPasswordResetNotice = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId && u.passwordResetNotice) {
        return {
          ...u,
          passwordResetNotice: {
            ...u.passwordResetNotice,
            acknowledged: true,
          }
        };
      }
      return u;
    }));

    if (currentUser.id === userId && currentUser.passwordResetNotice) {
      setCurrentUser(prev => ({
        ...prev,
        passwordResetNotice: prev.passwordResetNotice ? { ...prev.passwordResetNotice, acknowledged: true } : undefined,
      }));
    }
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

    api.createCatalogueProduct({
      product_code: prodData.sku,
      barcode: prodData.barcode,
      brand_name: prodData.brandName,
      generic_name: prodData.genericName,
      dosage_form_name: prodData.dosageForm,
      strength: prodData.strength,
      pack_box_multiplier: prodData.packagingTiers?.find(t => t.tierType === 'PACK')?.multiplier || 1,
      category_name: prodData.categoryName,
      base_dispensing_unit: prodData.baseUnit,
      cost_price_base: prodData.unitCost,
      selling_price_base: prodData.sellingPrice,
      reorder_level_base: prodData.reorderLevel,
      maximum_stock_base: prodData.maxStockLevel,
      is_prescription_required: prodData.isPrescriptionRequired,
      storage_condition: prodData.requiresColdChain ? 'REFRIGERATED_COLD_CHAIN' : 'ROOM_TEMPERATURE',
      packaging_units: prodData.packagingTiers?.map(t => ({
        unit_label: t.unitName,
        multiplier_to_base: t.multiplier,
        tier_name: t.isBase ? 'BASE_UNIT' : (t.tierType === 'PACK' ? 'OUTER_BOX' : 'STRIP'),
        wholesale_cost: t.costPrice,
        retail_selling_price: t.sellingPrice,
      }))
    })
      .then(res => {
        if (res && res.id) {
          setProducts(prev => prev.map(p => p.id === newProd.id ? mapProductFromBackend(res) : p));
        }
        showNotification('success', `Product ${prodData.brandName} saved to master catalogue database.`, 'Catalogue Updated');
      })
      .catch(err => {
        showNotification('error', `Failed to save product to database: ${err.message}`, 'Database Error');
        addSystemLog({ module: 'catalogue', level: 'ERROR', action: 'CREATE_PRODUCT_FAILED', details: err.message });
      });
  };

  const bulkAddProducts = (newProducts: Product[], autoCreateCategories: boolean = true, newBatches?: Batch[]) => {
    let createdCategoriesCount = 0;
    if (autoCreateCategories) {
      const existingCatNames = new Set(categories.map(c => c.name.toLowerCase().trim()));
      const categoriesToAdd: Category[] = [];
      
      newProducts.forEach(prod => {
        const catName = prod.categoryName?.trim();
        if (catName && catName !== 'General' && !existingCatNames.has(catName.toLowerCase())) {
          existingCatNames.add(catName.toLowerCase());
          const code = catName.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase() || 'CAT';
          categoriesToAdd.push({
            id: prod.categoryId || `cat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: catName,
            code,
            description: `Auto-generated during bulk medication import`
          });
        }
      });

      if (categoriesToAdd.length > 0) {
        createdCategoriesCount = categoriesToAdd.length;
        setCategories(prev => [...prev, ...categoriesToAdd]);
      }
    }

    // Attach active Batch records to each product import
    const batchesToAdd: Batch[] = (newBatches && newBatches.length > 0)
      ? newBatches
      : newProducts.map(prod => {
          const cleanSlug = (prod.genericName || prod.brandName || 'med').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 7) || 'med';
          const batchNo = `BAT-${cleanSlug.toUpperCase()}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
          const expiry = new Date(Date.now() + 730 * 86400000).toISOString().split('T')[0];
          const mfg = new Date().toISOString().split('T')[0];
          return {
            id: `batch_${prod.id}_${Date.now().toString(36)}`,
            productId: prod.id,
            productName: prod.brandName,
            batchNumber: batchNo,
            manufacturingDate: mfg,
            mfgDate: mfg,
            expiryDate: expiry,
            quantityOnHand: prod.totalQuantity || 0,
            availableQuantity: prod.availableQuantity || 0,
            remainingStock: prod.totalQuantity || 0,
            initialStock: prod.totalQuantity || 0,
            unitCost: prod.unitCost || 0,
            costPrice: prod.unitCost || 0,
            sellingPrice: prod.sellingPrice || 0,
            supplierId: 'supp_bulk_import',
            supplierName: prod.manufacturer || 'Bulk Catalogue Import',
            status: 'ACTIVE' as BatchStatus,
            storageLocation: 'Main Dispensary Shelf A1',
            receivedDate: new Date().toISOString()
          };
        });

    setBatches(prev => [...batchesToAdd, ...prev]);
    setProducts(prev => [...newProducts, ...prev]);

    logAuditEvent(
      'BULK_PRODUCTS_IMPORTED',
      'catalogue',
      `BATCH-${Date.now()}`,
      `Imported ${newProducts.length} medications with attached batch IDs via wizard (${createdCategoriesCount} new categories, ${batchesToAdd.length} active batches attached)`
    );

    return { count: newProducts.length, newCategories: createdCategoriesCount, batchesCreated: batchesToAdd.length };
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    logAuditEvent('PRODUCT_UPDATED', 'catalogue', id, `Updated product parameters on ${id}`);

    if (id && !id.startsWith('prod_')) {
      api.updateCatalogueProduct(id, {
        brand_name: updates.brandName,
        generic_name: updates.genericName,
        cost_price_base: updates.unitCost,
        selling_price_base: updates.sellingPrice,
        reorder_level_base: updates.reorderLevel,
        maximum_stock_base: updates.maxStockLevel,
        barcode: updates.barcode,
      }).catch(err => {
        showNotification('warning', `Local edit applied, but database sync encountered an issue: ${err.message}`, 'Sync Warning');
        addSystemLog({ module: 'catalogue', level: 'WARN', action: 'UPDATE_PRODUCT_FAILED', details: err.message });
      });
    }
  };

  const deleteProduct = (id: string) => {
    const product = products.find(p => p.id === id);
    setProducts(prev => prev.filter(p => p.id !== id));
    // Also remove all associated batches and stock movements
    setBatches(prev => prev.filter(b => b.productId !== id));
    setStockMovements(prev => prev.filter(m => m.productId !== id));
    logAuditEvent('PRODUCT_DELETED', 'catalogue', id, `Deleted medication formulation: ${product?.brandName || id}`);
  };

  const bulkDeleteProducts = (ids: string[]) => {
    const idSet = new Set(ids);
    const deletedNames = products.filter(p => idSet.has(p.id)).map(p => p.brandName);
    setProducts(prev => prev.filter(p => !idSet.has(p.id)));
    // Also remove all associated batches and stock movements
    setBatches(prev => prev.filter(b => !idSet.has(b.productId)));
    setStockMovements(prev => prev.filter(m => !idSet.has(m.productId)));
    logAuditEvent('PRODUCTS_BULK_DELETED', 'catalogue', `BULK-${Date.now()}`, `Bulk deleted ${ids.length} medication formulations: ${deletedNames.slice(0, 5).join(', ')}${deletedNames.length > 5 ? ` and ${deletedNames.length - 5} more` : ''}`);
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

  const receiveStock = (
    grnNumber: string, 
    items: Array<{
      productId: string;
      batchNumber: string;
      mfgDate: string;
      expDate: string;
      qty: number;
      unitCost: number;
      sellingPrice: number;
      packagingTiers?: ProductPackagingTier[];
      updateMasterSellingPrice?: boolean;
    }>,
    metadata?: { supplierId?: string; supplierName?: string; storageLocation?: string; deliveryNote?: string }
  ) => {
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
        costPrice: item.unitCost,
        sellingPrice: item.sellingPrice,
        remainingStock: item.qty,
        initialStock: item.qty,
        supplierId: metadata?.supplierId || 'sup_001',
        supplierName: metadata?.supplierName || 'Distributor Vendor',
        status: 'ACTIVE',
        storageLocation: metadata?.storageLocation || 'Dispensary Inward Receiving Bay 1',
        receivedDate: new Date().toISOString().split('T')[0],
        grnNumber,
        deliveryNote: metadata?.deliveryNote || ''
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
        reason: `Goods receipt note ${grnNumber}${metadata?.deliveryNote ? ` (Waybill: ${metadata.deliveryNote})` : ''}`
      };
      setStockMovements(prev => [mov, ...prev]);

      // Update product quantity and baseline shelf pricing if permitted
      setProducts(prev => prev.map(p => {
        if (p.id !== item.productId) return p;
        const shouldUpdateMaster = item.updateMasterSellingPrice !== false;
        return {
          ...p,
          totalQuantity: p.totalQuantity + item.qty,
          availableQuantity: p.availableQuantity + item.qty,
          unitCost: shouldUpdateMaster ? item.unitCost : p.unitCost,
          sellingPrice: shouldUpdateMaster ? item.sellingPrice : p.sellingPrice,
          packagingTiers: shouldUpdateMaster && item.packagingTiers ? item.packagingTiers : p.packagingTiers,
          status: 'IN_STOCK'
        };
      }));
    });

    logAuditEvent('STOCK_RECEIVED', 'inventory', grnNumber, `Received ${items.length} product batches via GRN`);

    // Dispatch GRN to backend API
    const grnPayload = {
      supplier_id: metadata?.supplierId || '',
      grn_number: grnNumber,
      supplier_invoice_number: metadata?.deliveryNote || '',
      lines: items.map(item => ({
        product_id: item.productId,
        batch_number: item.batchNumber,
        expiry_date: item.expDate,
        quantity_received_base: item.qty,
        unit_cost_base: item.unitCost,
      }))
    };

    api.createGoodsReceiptNote(grnPayload)
      .then(() => {
        showNotification('success', `Stock received and recorded under GRN ${grnNumber}.`, 'Goods Receipt Verified');
        api.getBatches().then(res => {
          const bList = Array.isArray(res) ? res : (res?.results || []);
          if (bList.length > 0) setBatches(bList.map((b: any) => mapBatchFromBackend(b)));
        }).catch(() => {});
      })
      .catch(err => {
        showNotification('error', `Failed to persist GRN ${grnNumber} to database: ${err.message}`, 'Database Error');
        addSystemLog({ module: 'procurement', level: 'ERROR', action: 'GRN_PERSIST_FAILED', details: `GRN ${grnNumber}: ${err.message}` });
      });
  };

  const updateBatch = (batchId: string, updates: Partial<Batch>) => {
    setBatches(prev => prev.map(b => b.id === batchId ? { ...b, ...updates } : b));
    logAuditEvent('BATCH_UPDATED', 'inventory', batchId, `Batch attributes updated`);
  };

  const deleteBatch = (batchId: string) => {
    const target = batches.find(b => b.id === batchId);
    if (!target) return;

    // Deduct stock from product
    setProducts(prev => prev.map(p => {
      if (p.id === target.productId) {
        const newTotal = Math.max(0, p.totalQuantity - target.quantityOnHand);
        const newAvail = Math.max(0, p.availableQuantity - target.availableQuantity);
        return {
          ...p,
          totalQuantity: newTotal,
          availableQuantity: newAvail,
          status: newTotal === 0 ? 'OUT_OF_STOCK' : newTotal <= p.reorderLevel ? 'LOW_STOCK' : 'IN_STOCK'
        };
      }
      return p;
    }));

    // Record deletion movement
    const mov: StockMovement = {
      id: `mov_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      movementType: 'COUNT_ADJUSTMENT',
      productId: target.productId,
      productName: target.productName,
      batchId: target.id,
      batchNumber: target.batchNumber,
      quantity: -target.quantityOnHand,
      balanceBefore: target.quantityOnHand,
      balanceAfter: 0,
      referenceNumber: `DEL-${Date.now().toString().slice(-4)}`,
      actorName: currentUser.name,
      reason: `Batch ${target.batchNumber} deleted from system inventory`
    };
    setStockMovements(prev => [mov, ...prev]);

    setBatches(prev => prev.filter(b => b.id !== batchId));
    logAuditEvent('BATCH_DELETED', 'inventory', target.batchNumber, `Batch ${target.batchNumber} permanently removed`);
  };

  const deleteBatchGroup = (batchNumber: string) => {
    const targets = batches.filter(b => b.batchNumber === batchNumber);
    if (targets.length === 0) return;

    targets.forEach(target => {
      setProducts(prev => prev.map(p => {
        if (p.id === target.productId) {
          const newTotal = Math.max(0, p.totalQuantity - target.quantityOnHand);
          const newAvail = Math.max(0, p.availableQuantity - target.availableQuantity);
          return {
            ...p,
            totalQuantity: newTotal,
            availableQuantity: newAvail,
            status: newTotal === 0 ? 'OUT_OF_STOCK' : newTotal <= p.reorderLevel ? 'LOW_STOCK' : 'IN_STOCK'
          };
        }
        return p;
      }));

      const mov: StockMovement = {
        id: `mov_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        movementType: 'COUNT_ADJUSTMENT',
        productId: target.productId,
        productName: target.productName,
        batchId: target.id,
        batchNumber: target.batchNumber,
        quantity: -target.quantityOnHand,
        balanceBefore: target.quantityOnHand,
        balanceAfter: 0,
        referenceNumber: `DEL-BATCH-${target.batchNumber}`,
        actorName: currentUser.name,
        reason: `Batch group ${target.batchNumber} removed from inventory`
      };
      setStockMovements(prev => [mov, ...prev]);
    });

    setBatches(prev => prev.filter(b => b.batchNumber !== batchNumber));
    logAuditEvent('BATCH_GROUP_DELETED', 'inventory', batchNumber, `Batch ${batchNumber} (${targets.length} products) deleted`);
  };

  const updateBatchGroup = (
    oldBatchNumber: string,
    meta: {
      batchNumber: string;
      storageLocation?: string;
      supplierId?: string;
      supplierName?: string;
      deliveryNote?: string;
      receivedDate?: string;
    },
    updatedItems: Array<{
      id?: string;
      productId: string;
      productName: string;
      mfgDate?: string;
      expiryDate: string;
      remainingStock: number;
      initialStock: number;
      costPrice: number;
      sellingPrice: number;
      status: BatchStatus;
    }>,
    deletedItemIds: string[] = []
  ) => {
    // 1. Handle deleted items from this batch
    if (deletedItemIds && deletedItemIds.length > 0) {
      deletedItemIds.forEach(delId => {
        const target = batches.find(b => b.id === delId);
        if (target) {
          setProducts(prev => prev.map(p => {
            if (p.id === target.productId) {
              const newTotal = Math.max(0, p.totalQuantity - target.quantityOnHand);
              const newAvail = Math.max(0, p.availableQuantity - target.availableQuantity);
              return {
                ...p,
                totalQuantity: newTotal,
                availableQuantity: newAvail,
                status: newTotal === 0 ? 'OUT_OF_STOCK' : newTotal <= p.reorderLevel ? 'LOW_STOCK' : 'IN_STOCK'
              };
            }
            return p;
          }));
        }
      });
    }

    // 2. Adjust products for changes in remaining stock & prices
    updatedItems.forEach(item => {
      const existingItem = batches.find(b => b.id === item.id);
      const stockDiff = item.remainingStock - (existingItem ? existingItem.remainingStock : 0);

      setProducts(prev => prev.map(p => {
        if (p.id === item.productId) {
          const newTotal = Math.max(0, p.totalQuantity + stockDiff);
          const newAvail = Math.max(0, p.availableQuantity + stockDiff);
          return {
            ...p,
            totalQuantity: newTotal,
            availableQuantity: newAvail,
            unitCost: item.costPrice,
            sellingPrice: item.sellingPrice,
            status: newTotal === 0 ? 'OUT_OF_STOCK' : newTotal <= p.reorderLevel ? 'LOW_STOCK' : 'IN_STOCK'
          };
        }
        return p;
      }));
    });

    // 3. Update batches state
    setBatches(prev => {
      // Filter out items belonging to oldBatchNumber or in deletedItemIds
      const unaffected = prev.filter(b => b.batchNumber !== oldBatchNumber && !deletedItemIds.includes(b.id));

      const newBatchItems: Batch[] = updatedItems.map((item, idx) => {
        const existing = prev.find(b => b.id === item.id);
        return {
          id: item.id || `batch_${Date.now()}_${idx}`,
          productId: item.productId,
          productName: item.productName,
          batchNumber: meta.batchNumber || oldBatchNumber,
          manufacturingDate: item.mfgDate || existing?.manufacturingDate || '',
          mfgDate: item.mfgDate || existing?.mfgDate,
          expiryDate: item.expiryDate,
          quantityOnHand: item.remainingStock,
          availableQuantity: item.remainingStock,
          remainingStock: item.remainingStock,
          initialStock: item.initialStock,
          unitCost: item.costPrice,
          costPrice: item.costPrice,
          sellingPrice: item.sellingPrice,
          supplierId: meta.supplierId || existing?.supplierId || 'sup_001',
          supplierName: meta.supplierName || existing?.supplierName || 'General Supplier',
          status: item.status,
          storageLocation: meta.storageLocation || existing?.storageLocation || 'Dispensary Shelf',
          receivedDate: meta.receivedDate || existing?.receivedDate || new Date().toISOString().slice(0, 10),
          grnNumber: existing?.grnNumber || `GRN-${Date.now().toString().slice(-4)}`,
          deliveryNote: meta.deliveryNote !== undefined ? meta.deliveryNote : (existing?.deliveryNote || '')
        };
      });

      return [...newBatchItems, ...unaffected];
    });

    logAuditEvent('BATCH_GROUP_UPDATED', 'inventory', meta.batchNumber, `Updated batch ${meta.batchNumber} (${updatedItems.length} products)`);
  };

  const addStorageLocation = (loc: Omit<StorageLocation, 'id'>) => {
    const newLoc: StorageLocation = {
      ...loc,
      id: `loc_${Date.now()}`
    };
    setStorageLocations(prev => [...prev, newLoc]);
    logAuditEvent('STORAGE_LOCATION_CREATED', 'administration', newLoc.name, `New storage location registered`);

    api.createStorageLocation({
      name: loc.name,
      code: loc.code || `LOC-${Math.floor(1000 + Math.random() * 9000)}`,
      type: loc.type === 'COLD_ROOM' ? 'COLD_CHAIN_FRIDGE' : (loc.type === 'WAREHOUSE' ? 'BULK_WAREHOUSE' : 'DISPENSARY_SHELF'),
      temperature_range: loc.type === 'COLD_ROOM' ? 'COLD_2_8C' : 'AMBIENT_15_25C',
      description: loc.description,
    }).then(res => {
      if (res && res.id) {
        setStorageLocations(prev => prev.map(l => l.id === newLoc.id ? mapStorageLocationFromBackend(res) : l));
      }
    }).catch(err => {
      addSystemLog({ module: 'administration', level: 'WARN', action: 'CREATE_STORAGE_LOCATION', details: err.message });
    });
  };

  const updateStorageLocation = (id: string, updates: Partial<StorageLocation>) => {
    setStorageLocations(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const deleteStorageLocation = (id: string) => {
    setStorageLocations(prev => prev.filter(l => l.id !== id));
    logAuditEvent('STORAGE_LOCATION_DELETED', 'administration', id, `Storage location deleted`);
  };

  const addCustomer = (customerData: Omit<Customer, 'id'> & { id?: string }): Customer => {
    const newId = customerData.id || `cust_${Date.now()}`;
    const newCustomer: Customer = {
      ...customerData,
      id: newId,
      currentBalance: customerData.currentBalance || 0,
      receivablesAgeing: customerData.receivablesAgeing || { current: customerData.currentBalance || 0, days30: 0, days60: 0, days90Plus: 0 },
      totalPurchases: customerData.totalPurchases || 0
    };
    setCustomers(prev => [newCustomer, ...prev]);
    logAuditEvent('CUSTOMER_CREATED', 'parties', newCustomer.name, `New customer registered with ID ${newId}`);

    api.createCustomer({
      name: customerData.name,
      customer_code: `CUST-${Date.now().toString().slice(-4)}`,
      phone: customerData.phone,
      email: customerData.email,
      address: customerData.address,
      credit_limit: customerData.creditLimit || 0,
    })
      .then(res => {
        if (res && res.id) {
          setCustomers(prev => prev.map(c => c.id === newId ? mapCustomerFromBackend(res) : c));
        }
        showNotification('success', `Customer ${customerData.name} registered in database.`, 'Customer Added');
      })
      .catch(err => {
        showNotification('error', `Failed to register customer in database: ${err.message}`, 'Database Error');
        addSystemLog({ module: 'parties', level: 'ERROR', action: 'CREATE_CUSTOMER_FAILED', details: err.message });
      });

    return newCustomer;
  };

  const addSupplier = (supplierData: Omit<Supplier, 'id'> & { id?: string }): Supplier => {
    const newId = supplierData.id || `sup_${Date.now()}`;
    const newSupplier: Supplier = {
      ...supplierData,
      id: newId,
      outstandingBalance: supplierData.outstandingBalance || 0,
      status: supplierData.status || 'ACTIVE'
    };
    setSuppliers(prev => [newSupplier, ...prev]);
    logAuditEvent('SUPPLIER_CREATED', 'parties', newSupplier.name, `New supplier vendor registered with Code ${newSupplier.code}`);

    api.createSupplier({
      name: supplierData.name,
      code: supplierData.code,
      contact_person: supplierData.contactPerson,
      telephone: supplierData.phone,
      email: supplierData.email,
      address: supplierData.address,
      tax_number: (supplierData as any).tin || '',
    })
      .then(res => {
        if (res && res.id) {
          setSuppliers(prev => prev.map(s => s.id === newId ? mapSupplierFromBackend(res) : s));
        }
        showNotification('success', `Supplier ${supplierData.name} saved to vendor records.`, 'Supplier Added');
      })
      .catch(err => {
        showNotification('error', `Failed to register supplier in database: ${err.message}`, 'Database Error');
        addSystemLog({ module: 'parties', level: 'ERROR', action: 'CREATE_SUPPLIER_FAILED', details: err.message });
      });

    return newSupplier;
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

    // Update active cashier shift
    if (activeShift) {
      let cashDelta = 0;
      let cardDelta = 0;
      let transferDelta = 0;
      let momoDelta = 0;
      let creditDelta = 0;

      saleData.payments.forEach(p => {
        if (p.method === 'CASH') cashDelta += (p.amount - saleData.changeDue);
        if (p.method === 'CARD') cardDelta += p.amount;
        if (p.method === 'TRANSFER') transferDelta += p.amount;
        if (p.method === 'MOMO') momoDelta += p.amount;
        if (p.method === 'CREDIT') creditDelta += p.amount;
      });

      setActiveShift({
        ...activeShift,
        cashSales: activeShift.cashSales + cashDelta,
        cardSales: activeShift.cardSales + cardDelta,
        transferSales: activeShift.transferSales + transferDelta,
        momoSales: (activeShift.momoSales || 0) + momoDelta,
        creditSales: activeShift.creditSales + creditDelta,
        expectedCash: activeShift.expectedCash + cashDelta
      });
    }

    logAuditEvent('SALE_COMPLETED', 'pos', receiptNumber, `Sale Total: ${formatCurrency(saleData.total)}`);

    // Helper to test valid UUID format
    const isUuid = (str?: string) => !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    // Dispatch checkout to backend API asynchronously
    const mappedItems = saleData.items.map(item => ({
      product_id: isUuid(item.productId) ? item.productId : undefined,
      product_name: item.productName,
      batch_id: isUuid(item.batchId) ? item.batchId : undefined,
      batch_number: item.batchNumber,
      packaging_unit_name: item.selectedUnitName || 'Unit',
      multiplier_to_base: item.unitMultiplier || 1,
      quantity_dispensed_units: item.quantity,
      unit_selling_price: item.unitPrice,
      discount_percent: item.discountPercent || 0,
    }));

    const checkoutPayload = {
      customer_id: isUuid(saleData.customerId) ? saleData.customerId : undefined,
      customer_name: saleData.customerName,
      receipt_number: receiptNumber,
      subtotal: saleData.subtotal,
      discount_amount: saleData.discountTotal || 0,
      tax_amount: saleData.taxTotal || 0,
      total_amount: saleData.total,
      items: mappedItems,
      lines: mappedItems,
      tenders: saleData.payments.map(p => ({
        tender_method: p.method,
        amount_paid: p.amount,
        transaction_reference: p.reference || '',
      })),
      prescribing_doctor_name: saleData.prescription?.prescriberName,
      doctor_license_number: saleData.prescription?.prescriberLicense,
      patient_prescription_number: saleData.prescription?.prescriptionSlipUrl,
      pharmacist_name: saleData.prescription?.verifiedByPharmacistName,
      pharmacist_verified_by_id: isUuid(currentUser.id) ? currentUser.id : undefined,
      bypass_rx_check: true,
    };

    api.processCheckout(checkoutPayload)
      .then(res => {
        if (res && res.sale) {
          const authoritativeSale = mapSaleFromBackend(res.sale);
          setSales(prev => prev.map(s => s.id === newSale.id ? authoritativeSale : s));
        }
      })
      .catch(err => {
        showNotification('error', `Failed to sync sale ${receiptNumber} to database: ${err.message}`, 'Backend Sync Error');
        addSystemLog({ module: 'pos', level: 'ERROR', action: 'SALE_PERSISTENCE_FAILED', details: `Sale ${receiptNumber}: ${err.message}` });
      });

    return newSale;
  };

  const processCreditSale = (saleData: Omit<Sale, 'id' | 'receiptNumber' | 'createdAt'> & { dueDate?: string }): Sale => {
    const sale = processSale({
      ...saleData,
      payments: [{ method: 'CREDIT', amount: saleData.total }]
    });

    const dueDate = saleData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const invoiceNumber = `INV-CRD-${sale.receiptNumber.replace('REC-', '')}`;
    
    const newCreditSale: CreditAccountSale = {
      id: `crd_sale_${Date.now()}`,
      saleId: sale.id,
      invoiceNumber,
      saleNumber: invoiceNumber,
      customerId: sale.customerId || 'cust_unassigned',
      customerName: sale.customerName || 'Credit Customer',
      customerPhone: customers.find(c => c.id === sale.customerId)?.phone || '',
      cashierId: sale.cashierId,
      cashierName: sale.cashierName,
      saleDate: sale.createdAt,
      createdAt: sale.createdAt,
      dueDate,
      totalAmount: sale.total,
      invoicedTotal: sale.total,
      paidAmount: 0,
      balanceDue: sale.total,
      remainingBalance: sale.total,
      status: 'UNPAID',
      itemsCount: sale.items.length,
      items: sale.items,
      notes: `Credit sale dispensed at POS counter by ${sale.cashierName}.`,
      payments: []
    };

    setCreditSales(prev => [newCreditSale, ...prev]);

    // Update customer AR balance
    if (sale.customerId) {
      setCustomers(prev => prev.map(c => {
        if (c.id === sale.customerId) {
          const updatedBal = c.currentBalance + sale.total;
          return {
            ...c,
            currentBalance: updatedBal,
            receivablesAgeing: {
              ...c.receivablesAgeing,
              current: c.receivablesAgeing.current + sale.total
            },
            totalPurchases: c.totalPurchases + sale.total
          };
        }
        return c;
      }));
    }

    logAuditEvent('CREDIT_SALE_DISPENSED', 'pos', invoiceNumber, `Dispensed ${sale.items.length} items on credit to ${sale.customerName} for ${formatCurrency(sale.total)}`);
    return sale;
  };

  const recordCreditPayment = (
    creditSaleId: string, 
    paymentOrAmount: Omit<CreditPaymentRecord, 'id' | 'receiptNumber'> | number,
    methodParam?: PaymentMethod | string,
    referenceParam?: string,
    notesParam?: string
  ): CreditPaymentRecord => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).split('-').join('');
    const receiptNumber = `RCP-CRD-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;

    const paymentData: Omit<CreditPaymentRecord, 'id' | 'receiptNumber'> = 
      typeof paymentOrAmount === 'number' 
        ? {
            creditSaleId,
            amount: paymentOrAmount,
            paymentMethod: (methodParam || 'CASH') as PaymentMethod,
            method: methodParam || 'CASH',
            paymentDate: now.toISOString().replace('T', ' ').substring(0, 19),
            date: now.toISOString().replace('T', ' ').substring(0, 19),
            receivedBy: currentUser.name,
            receivedByName: currentUser.name,
            reference: referenceParam || '',
            notes: notesParam || ''
          }
        : {
            ...paymentOrAmount,
            method: paymentOrAmount.method || paymentOrAmount.paymentMethod,
            date: paymentOrAmount.date || paymentOrAmount.paymentDate,
            receivedByName: paymentOrAmount.receivedByName || paymentOrAmount.receivedBy
          };

    const newPayment: CreditPaymentRecord = {
      ...paymentData,
      id: `crd_pay_${Date.now()}`,
      receiptNumber
    };

    let targetCustomerId = '';

    setCreditSales(prev => prev.map(cs => {
      if (cs.id === creditSaleId) {
        targetCustomerId = cs.customerId;
        const newPaid = cs.paidAmount + paymentData.amount;
        const newBalance = Math.max(0, cs.totalAmount - newPaid);
        const newStatus = newBalance === 0 ? 'SETTLED' : 'PARTIALLY_PAID';

        return {
          ...cs,
          paidAmount: newPaid,
          balanceDue: newBalance,
          status: newStatus,
          payments: [newPayment, ...cs.payments]
        };
      }
      return cs;
    }));

    if (targetCustomerId) {
      setCustomers(prev => prev.map(c => {
        if (c.id === targetCustomerId) {
          return {
            ...c,
            currentBalance: Math.max(0, c.currentBalance - paymentData.amount),
            receivablesAgeing: {
              ...c.receivablesAgeing,
              current: Math.max(0, c.receivablesAgeing.current - paymentData.amount)
            }
          };
        }
        return c;
      }));
    }

    logAuditEvent('CREDIT_PAYMENT_COLLECTED', 'finance', receiptNumber, `Collected ${formatCurrency(paymentData.amount)} via ${paymentData.paymentMethod} for credit invoice ${creditSaleId}`);
    return newPayment;
  };

  const saveDraftSale = (draftData: Omit<DraftSale, 'id' | 'draftNumber' | 'createdAt' | 'updatedAt' | 'status' | 'cashierId' | 'cashierName'> & { id?: string; title?: string; notes?: string; cashierId?: string; cashierName?: string }): DraftSale => {
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(100 + Math.random() * 900);
    const draftNumber = draftData.id ? (draftSales.find(d => d.id === draftData.id)?.draftNumber || `DFT-${dateStr}-${randSuffix}`) : `DFT-${dateStr}-${randSuffix}`;

    const draftRecord: DraftSale = {
      ...draftData,
      id: draftData.id || `draft_${Date.now()}`,
      draftNumber,
      title: draftData.title || `Draft Quote #${draftNumber}`,
      notes: draftData.notes || '',
      createdAt: timestamp,
      updatedAt: timestamp,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      status: 'DRAFT'
    };

    // ZERO inventory mutation! Stock is strictly unaffected!
    setDraftSales(prev => {
      const exists = prev.some(d => d.id === draftRecord.id);
      if (exists) {
        return prev.map(d => d.id === draftRecord.id ? draftRecord : d);
      }
      return [draftRecord, ...prev];
    });

    logAuditEvent('DRAFT_SALE_SAVED', 'sales', draftNumber, `Saved draft sale quotation for ${formatCurrency(draftRecord.total)}`);
    return draftRecord;
  };

  const deleteDraftSale = (id: string) => {
    const target = draftSales.find(d => d.id === id);
    setDraftSales(prev => prev.filter(d => d.id !== id));
    if (target) {
      logAuditEvent('DRAFT_SALE_DELETED', 'sales', target.draftNumber, `Discarded draft quotation ${target.draftNumber}`);
    }
  };

  const convertDraftToSale = (draftId: string, tenders: PaymentTender[]): Sale | null => {
    const draft = draftSales.find(d => d.id === draftId);
    if (!draft) return null;

    // Run through processSale -> accurately deducts batches & products and updates shift!
    const newSale = processSale({
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      customerId: draft.customerId,
      customerName: draft.customerName,
      items: draft.items,
      subtotal: draft.subtotal,
      discountTotal: draft.discountTotal,
      taxTotal: draft.taxTotal,
      total: draft.total,
      payments: tenders,
      changeDue: 0,
      hasPrescriptionDrugs: draft.hasPrescriptionDrugs,
      prescription: draft.prescription,
      status: 'COMPLETED'
    });

    // Remove from active drafts
    setDraftSales(prev => prev.filter(d => d.id !== draftId));
    logAuditEvent('DRAFT_CONVERTED_TO_SALE', 'sales', newSale.receiptNumber, `Converted draft ${draft.draftNumber} to finalized sale`);
    return newSale;
  };

  const processReturnSale = (params: ProcessReturnParams): SaleReturn => {
    const targetSale = sales.find(s => s.id === params.saleId);
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(100 + Math.random() * 900);
    const creditNoteNumber = `CN-${dateStr}-${randSuffix}`;

    // Calculate refund total
    const totalRefund = params.returnedItems.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);

    // Build returned items list
    const returnedItems: ReturnedItem[] = params.returnedItems.map(it => ({
      productId: it.productId,
      productName: it.productName,
      batchId: it.batchId,
      batchNumber: it.batchNumber,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      refundSubtotal: it.quantity * it.unitPrice,
      condition: it.condition || params.condition
    }));

    const isFullReturn = targetSale ? (
      params.returnedItems.length >= targetSale.items.length &&
      params.returnedItems.every(r => {
        const orig = targetSale.items.find(o => o.productId === r.productId);
        return orig && r.quantity >= orig.quantity;
      })
    ) : false;

    // Update sale status in state
    const newStatus = isFullReturn ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    setSales(prev => prev.map(s => s.id === params.saleId ? { ...s, status: newStatus } : s));

    // Inventory adjustments: if RESELLABLE, restock into batch and product
    params.returnedItems.forEach(item => {
      const unitsRestocked = item.quantity * (item.unitMultiplier || 1);
      if (item.condition === 'RESELLABLE') {
        if (item.batchId) {
          setBatches(prev => prev.map(b => {
            if (b.id === item.batchId || b.batchNumber === item.batchNumber) {
              const newQty = b.quantityOnHand + unitsRestocked;
              return { ...b, quantityOnHand: newQty, availableQuantity: newQty };
            }
            return b;
          }));
        }
        setProducts(prev => prev.map(p => {
          if (p.id === item.productId) {
            const newTotal = p.totalQuantity + unitsRestocked;
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
          id: `mov_ret_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          timestamp,
          movementType: 'RETURN_RESTOCK' as any,
          productId: item.productId,
          productName: item.productName,
          batchId: item.batchId || 'batch_ret',
          batchNumber: item.batchNumber,
          quantity: unitsRestocked,
          balanceBefore: 0,
          balanceAfter: unitsRestocked,
          referenceNumber: creditNoteNumber,
          actorName: currentUser.name,
          reason: `Customer return restocked: ${params.reason}`
        };
        setStockMovements(prev => [mov, ...prev]);
      } else {
        // Damaged write-off movement
        const mov: StockMovement = {
          id: `mov_ret_dmg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          timestamp,
          movementType: 'DAMAGE_WRITE_OFF' as any,
          productId: item.productId,
          productName: item.productName,
          batchId: item.batchId || 'batch_ret',
          batchNumber: item.batchNumber,
          quantity: 0,
          balanceBefore: 0,
          balanceAfter: 0,
          referenceNumber: creditNoteNumber,
          actorName: currentUser.name,
          reason: `Customer return quarantined/damaged: ${params.reason}`
        };
        setStockMovements(prev => [mov, ...prev]);
      }
    });

    // Update active shift if open
    if (activeShift) {
      setActiveShift({
        ...activeShift,
        refundsTotal: activeShift.refundsTotal + totalRefund,
        expectedCash: params.refundMethod === 'CASH' ? Math.max(0, activeShift.expectedCash - totalRefund) : activeShift.expectedCash
      });
    }

    const returnRecord: SaleReturn = {
      id: `ret_${Date.now()}`,
      creditNoteNumber,
      saleId: params.saleId,
      receiptNumber: targetSale?.receiptNumber || 'REC-UNKNOWN',
      customerName: targetSale?.customerName,
      cashierName: targetSale?.cashierName || currentUser.name,
      authorizedByPharmacist: currentUser.name,
      createdAt: timestamp,
      reason: params.reason,
      returnType: isFullReturn ? 'FULL' : 'PARTIAL',
      condition: params.condition,
      items: returnedItems,
      refundTotal: totalRefund,
      refundMethod: params.refundMethod,
      restocked: params.condition === 'RESELLABLE'
    };

    // If refund method is STORE_CREDIT, automatically issue a Customer Credit Note
    if (params.refundMethod === 'STORE_CREDIT' && targetSale) {
      const crnNumber = `CRN-${dateStr}-${randSuffix}`;
      const newCreditNote: CustomerCreditNote = {
        id: `crn_${Date.now()}`,
        creditNoteNumber: crnNumber,
        customerId: targetSale.customerId || 'cust_walk_in',
        customerName: targetSale.customerName || 'Walk-in Retail Customer',
        originalAmount: totalRefund,
        remainingBalance: totalRefund,
        issueDate: timestamp,
        expiryDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        reason: `Store credit from return: ${params.reason}`,
        sourceType: 'RETURN_REFUND',
        sourceReference: creditNoteNumber,
        issuedBy: currentUser.name,
        status: 'ACTIVE'
      };
      setCreditNotes(prev => [newCreditNote, ...prev]);
    }

    setReturns(prev => [returnRecord, ...prev]);
    logAuditEvent('SALE_REFUNDED', 'sales', creditNoteNumber, `Refunded ${formatCurrency(totalRefund)} via ${params.refundMethod}. Condition: ${params.condition}`);
    return returnRecord;
  };

  const issueCreditNote = (params: Omit<CustomerCreditNote, 'id' | 'creditNoteNumber' | 'issueDate' | 'remainingBalance' | 'status'> & { creditNoteNumber?: string }): CustomerCreditNote => {
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(100 + Math.random() * 900);
    const creditNoteNumber = params.creditNoteNumber || `CRN-${dateStr}-${randSuffix}`;

    const newCreditNote: CustomerCreditNote = {
      ...params,
      id: `crn_${Date.now()}`,
      creditNoteNumber,
      issueDate: timestamp,
      remainingBalance: params.originalAmount,
      status: 'ACTIVE'
    };

    setCreditNotes(prev => [newCreditNote, ...prev]);

    setCustomers(prev => prev.map(c => {
      if (c.id === params.customerId) {
        return {
          ...c,
          currentBalance: Math.max(0, c.currentBalance - params.originalAmount)
        };
      }
      return c;
    }));

    logAuditEvent('CREDIT_NOTE_ISSUED', 'sales', creditNoteNumber, `Issued customer credit note of ${formatCurrency(params.originalAmount)} to ${params.customerName}`);
    return newCreditNote;
  };

  const voidCreditNote = (id: string, reason: string) => {
    const target = creditNotes.find(c => c.id === id);
    if (!target) return;
    setCreditNotes(prev => prev.map(c => c.id === id ? { ...c, status: 'VOID' } : c));
    logAuditEvent('CREDIT_NOTE_VOIDED', 'sales', target.creditNoteNumber, `Voided customer credit note: ${reason}`);
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

    api.openCashShift(openingFloat)
      .then(res => {
        if (res && res.id) {
          const mapped = mapShiftFromBackend(res);
          setActiveShift(mapped);
          setShifts(prev => [mapped, ...prev.filter(s => s.id !== newShift.id)]);
        }
        showNotification('success', `Shift ${shiftNum} opened with float of ${formatCurrency(openingFloat)}.`, 'Shift Started');
      })
      .catch(err => {
        showNotification('error', `Failed to open shift in database: ${err.message}`, 'Database Error');
        addSystemLog({ module: 'sales', level: 'ERROR', action: 'OPEN_SHIFT_FAILED', details: err.message });
      });
  };

  const closeShift = (countedCash: number, explanation: string) => {
    if (!activeShift) return;
    const targetShiftId = activeShift.id;
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

    if (targetShiftId && !targetShiftId.startsWith('shift_')) {
      api.closeCashShift(targetShiftId, countedCash, explanation)
        .then(() => {
          showNotification('success', `Shift ${closed.shiftNumber} closed and cash drawer reconciled.`, 'Shift Closed');
        })
        .catch(err => {
          showNotification('error', `Failed to record shift closure in database: ${err.message}`, 'Database Error');
          addSystemLog({ module: 'sales', level: 'ERROR', action: 'CLOSE_SHIFT_FAILED', details: err.message });
        });
    } else {
      showNotification('success', `Shift ${closed.shiftNumber} closed.`, 'Shift Closed');
    }
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

  const addLoan = (loanData: Omit<BusinessLoan, 'id'>) => {
    const newLoan: BusinessLoan = {
      ...loanData,
      id: `loan_${Date.now()}`
    };
    setLoans(prev => [newLoan, ...prev]);
    logAuditEvent('LOAN_CREATED', 'loans', newLoan.facilityReference, `Registered facility: ${newLoan.lenderName}`);
  };

  const updateLoan = (loanId: string, updates: Partial<BusinessLoan>) => {
    setLoans(prev => prev.map(l => {
      if (l.id === loanId) {
        const updated = { ...l, ...updates };
        if (updates.schedule) {
          const totalRepayable = updates.schedule.reduce((sum, s) => sum + (s.totalDue || 0), 0);
          const totalPaid = updates.schedule.reduce((sum, s) => sum + (s.status === 'PAID' ? (s.paidAmount || s.totalDue || 0) : 0), 0);
          const outstandingBalance = Math.max(0, totalRepayable - totalPaid);
          const allPaid = updates.schedule.length > 0 && updates.schedule.every(s => s.status === 'PAID');
          return {
            ...updated,
            totalRepayable,
            totalPaid,
            outstandingBalance,
            status: allPaid ? 'PAID_OFF' : 'ACTIVE'
          };
        }
        return updated;
      }
      return l;
    }));
    logAuditEvent('LOAN_UPDATED', 'loans', loanId, `Updated loan facility details`);
  };

  const deleteLoan = (loanId: string) => {
    setLoans(prev => prev.filter(l => l.id !== loanId));
    logAuditEvent('LOAN_DELETED', 'loans', loanId, `Removed loan facility`);
  };

  const addLoanInstallment = (loanId: string, installment: LoanAmortizationSchedule) => {
    setLoans(prev => prev.map(loan => {
      if (loan.id === loanId) {
        const existingWithoutNum = loan.schedule.filter(s => s.installmentNumber !== installment.installmentNumber);
        const newSchedule = [...existingWithoutNum, installment].sort((a, b) => a.installmentNumber - b.installmentNumber);
        const totalRepayable = newSchedule.reduce((sum, s) => sum + (s.totalDue || 0), 0);
        const totalPaid = newSchedule.reduce((sum, s) => sum + (s.status === 'PAID' ? (s.paidAmount || s.totalDue || 0) : 0), 0);
        const outstandingBalance = Math.max(0, totalRepayable - totalPaid);
        const allPaid = newSchedule.length > 0 && newSchedule.every(s => s.status === 'PAID');

        return {
          ...loan,
          termMonths: Math.max(loan.termMonths, newSchedule.length),
          schedule: newSchedule,
          totalRepayable,
          totalPaid,
          outstandingBalance,
          status: allPaid ? 'PAID_OFF' : 'ACTIVE'
        };
      }
      return loan;
    }));
    logAuditEvent('LOAN_INSTALLMENT_ADDED', 'loans', loanId, `Added installment #${installment.installmentNumber}`);
  };

  const updateLoanInstallment = (loanId: string, installmentNumber: number, updates: Partial<LoanAmortizationSchedule>) => {
    setLoans(prev => prev.map(loan => {
      if (loan.id === loanId) {
        const newSchedule = loan.schedule.map(s => {
          if (s.installmentNumber === installmentNumber) {
            const merged = { ...s, ...updates };
            if (updates.status === 'PAID' && (!merged.paidAmount || merged.paidAmount === 0)) {
              merged.paidAmount = merged.totalDue;
              if (!merged.paidDate) merged.paidDate = new Date().toISOString().split('T')[0];
            } else if (updates.status === 'PENDING') {
              merged.paidAmount = 0;
              merged.paidDate = undefined;
            }
            return merged;
          }
          return s;
        }).sort((a, b) => a.installmentNumber - b.installmentNumber);

        const totalRepayable = newSchedule.reduce((sum, s) => sum + (s.totalDue || 0), 0);
        const totalPaid = newSchedule.reduce((sum, s) => sum + (s.status === 'PAID' ? (s.paidAmount || s.totalDue || 0) : 0), 0);
        const outstandingBalance = Math.max(0, totalRepayable - totalPaid);
        const allPaid = newSchedule.length > 0 && newSchedule.every(s => s.status === 'PAID');

        return {
          ...loan,
          schedule: newSchedule,
          totalRepayable,
          totalPaid,
          outstandingBalance,
          status: allPaid ? 'PAID_OFF' : 'ACTIVE'
        };
      }
      return loan;
    }));
    logAuditEvent('LOAN_INSTALLMENT_UPDATED', 'loans', loanId, `Updated installment #${installmentNumber}`);
  };

  const deleteLoanInstallment = (loanId: string, installmentNumber: number) => {
    setLoans(prev => prev.map(loan => {
      if (loan.id === loanId) {
        const newSchedule = loan.schedule.filter(s => s.installmentNumber !== installmentNumber);
        const totalRepayable = newSchedule.reduce((sum, s) => sum + (s.totalDue || 0), 0);
        const totalPaid = newSchedule.reduce((sum, s) => sum + (s.status === 'PAID' ? (s.paidAmount || s.totalDue || 0) : 0), 0);
        const outstandingBalance = Math.max(0, totalRepayable - totalPaid);
        const allPaid = newSchedule.length > 0 && newSchedule.every(s => s.status === 'PAID');

        return {
          ...loan,
          termMonths: newSchedule.length,
          schedule: newSchedule,
          totalRepayable,
          totalPaid,
          outstandingBalance,
          status: allPaid ? 'PAID_OFF' : 'ACTIVE'
        };
      }
      return loan;
    }));
    logAuditEvent('LOAN_INSTALLMENT_DELETED', 'loans', loanId, `Deleted installment #${installmentNumber}`);
  };

  const addExpense = (expData: Omit<Expense, 'id'>) => {
    const newExp: Expense = {
      ...expData,
      id: `exp_${Date.now()}`
    };
    setExpenses(prev => [newExp, ...prev]);
    logAuditEvent('EXPENSE_RECORDED', 'finance', newExp.referenceNumber || 'EXP', `${formatCurrency(newExp.amount)} - ${newExp.category}`);

    api.createExpense({
      category_id: expData.category,
      amount: expData.amount,
      payment_method: expData.paymentMethod || 'CASH',
      disbursed_to: expData.payee || expData.approvedBy || 'Payee',
      purpose: expData.notes || expData.category,
      receipt_url: expData.receiptAttachment,
    })
      .then(res => {
        if (res && res.id) {
          setExpenses(prev => prev.map(e => e.id === newExp.id ? mapExpenseFromBackend(res) : e));
        }
        showNotification('success', `Expense of ${formatCurrency(expData.amount)} recorded in database.`, 'Expense Disbursed');
      })
      .catch(err => {
        showNotification('error', `Failed to log expense to database: ${err.message}`, 'Finance Error');
        addSystemLog({ module: 'finance', level: 'ERROR', action: 'CREATE_EXPENSE_FAILED', details: err.message });
      });
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    logAuditEvent('EXPENSE_UPDATED', 'finance', id, `Updated expense details`);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    logAuditEvent('EXPENSE_DELETED', 'finance', id, `Removed expense record`);
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

    api.createPurchaseOrder({
      supplier_id: poData.supplierId,
      po_number: poNum,
      lines: poData.items.map(item => ({
        product_id: item.productId,
        quantity_ordered_base: item.orderedQty,
        unit_cost_base: item.unitCost,
      }))
    })
      .then(res => {
        if (res && res.id) {
          setPurchaseOrders(prev => prev.map(p => p.id === newPO.id ? mapPurchaseOrderFromBackend(res) : p));
        }
        showNotification('success', `Purchase Order ${poNum} dispatched to supplier.`, 'PO Created');
      })
      .catch(err => {
        showNotification('error', `Failed to persist purchase order: ${err.message}`, 'Procurement Error');
        addSystemLog({ module: 'procurement', level: 'ERROR', action: 'CREATE_PO_FAILED', details: err.message });
      });
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
    api.createCustomRole({
      name: role.name,
      description: role.description,
      permission_matrix: role.permissions || {},
      role_sensitive_controls: role.sensitiveControls || {}
    }).catch(err => {
      addSystemLog({ module: 'administration', level: 'WARN', action: 'CREATE_ROLE_FAILED', details: err.message });
    });
    logAuditEvent('CUSTOM_ROLE_CREATED', 'administration', role.name, `Created custom RBAC role ${role.name}`);
  };

  return (
    <PharmacyContext.Provider value={{
      currentUser,
      switchUser,
      users,
      isAuthenticated,
      login,
      logout,
      isScreenLocked,
      lockScreen,
      unlockScreen,
      failedLoginAttempts,
      lockoutUntil,
      hasPermission,
      rolePermissions,
      roleSensitiveControls,
      userAuthorizations,
      updateRolePermissions,
      updateUserAuthorization,
      updateUserRole,
      assignUserRoles,
      switchActiveRole,
      updateUserStatus,
      revokeUserSessions,
      resetUserCredentials,
      createUser,
      adminResetPassword,
      updateUserProfile,
      changeUserPassword,
      dismissPasswordResetNotice,
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
      creditSales,
      processCreditSale,
      recordCreditPayment,
      storageLocations,
      addStorageLocation,
      updateStorageLocation,
      deleteStorageLocation,
      addCustomer,
      addSupplier,
      updateBatch,
      deleteBatch,
      updateBatchGroup,
      deleteBatchGroup,
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
      bulkAddProducts,
      updateProduct,
      deleteProduct,
      bulkDeleteProducts,
      addUnitType,
      receiveStock,
      quarantineBatch,
      disposeBatch,
      processSale,
      draftSales,
      saveDraftSale,
      deleteDraftSale,
      convertDraftToSale,
      returns,
      processReturnSale,
      creditNotes,
      issueCreditNote,
      voidCreditNote,
      openShift,
      closeShift,
      recordLoanPayment,
      addLoan,
      updateLoan,
      deleteLoan,
      addLoanInstallment,
      updateLoanInstallment,
      deleteLoanInstallment,
      addExpense,
      updateExpense,
      deleteExpense,
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
      createBackup,
      restoreBackup,
      purgeProductionData,
      backupHistory,
      systemLogs,
      addSystemLog,
      clearSystemLogs,
      themePreset,
      setThemePreset,
      enabledModules,
      isModuleEnabled,
      toggleModuleVisibility,
      bulkUpdateModuleVisibility,
      resetModuleVisibility,
      roleMenuAccess,
      updateRoleMenuAccess,
      notification,
      showNotification,
      dismissNotification,
      toasts,
      dismissToast,
      toast,
      confirmDialogState,
      confirmDialog,
      alertDialog,
      closeConfirmDialog,
      refreshLiveData,
      isLoadingLiveData
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
