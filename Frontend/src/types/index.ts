export type RoleType = 
  | 'Super Admin'
  | 'Pharmacy Admin'
  | 'Manager'
  | 'Pharmacist'
  | 'Cashier'
  | 'Sales Person'
  | 'Stock Officer'
  | 'Procurement Officer'
  | 'Accountant'
  | 'Auditor'
  | 'Custom Role';

export interface User {
  id: string;
  username: string;
  name: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dob?: string;
  phone?: string;
  alternatePhone?: string;
  email: string;
  password?: string;
  role: RoleType;
  primaryRole?: RoleType;
  assignedRoles?: RoleType[];
  branchId: string;
  branchName: string;
  avatarUrl?: string;
  active: boolean;
  licenseNumber?: string;
  mustChangePassword?: boolean;
  isTemporaryPassword?: boolean;
  passwordResetNotice?: {
    resetAt: string;
    resetBy: string;
    acknowledged: boolean;
  };
}

export const ALL_SYSTEM_ROLES: RoleType[] = [
  'Super Admin',
  'Pharmacy Admin',
  'Manager',
  'Pharmacist',
  'Cashier',
  'Sales Person',
  'Stock Officer',
  'Procurement Officer',
  'Accountant',
  'Auditor'
];

export const getUserAssignedRoles = (user?: User | null): RoleType[] => {
  if (!user) return [];
  // Super Admin inherently possesses authority over all system roles
  if (
    user.role === 'Super Admin' ||
    user.primaryRole === 'Super Admin' ||
    (Array.isArray(user.assignedRoles) && user.assignedRoles.includes('Super Admin')) ||
    user.username?.toLowerCase() === 'admink19' ||
    user.username === 'superadmin'
  ) {
    return ALL_SYSTEM_ROLES;
  }
  if (Array.isArray(user.assignedRoles) && user.assignedRoles.length > 0) {
    return user.assignedRoles;
  }
  return user.role ? [user.role] : ['Pharmacist'];
};

export const getUserPrimaryRole = (user?: User | null): RoleType => {
  if (!user) return 'Pharmacist';
  if (user.primaryRole) return user.primaryRole;
  if (user.username?.toLowerCase() === 'admink19' || user.username === 'superadmin') return 'Super Admin';
  if (Array.isArray(user.assignedRoles) && user.assignedRoles.length > 0) {
    return user.assignedRoles[0];
  }
  return user.role || 'Pharmacist';
};

export const isDemoUser = (user?: User | null): boolean => {
  if (!user) return false;
  const demoUsernames = [
    'admink19', 'superadmin', 'mgr_koffi', 'acct_zainab', 'admin_clara',
    'pharm_amaka', 'cashier_emmanuel', 'stock_tunde', 'proc_kwame', 'audit_justice'
  ];
  return (
    user.id.startsWith('usr_') ||
    demoUsernames.includes(user.username?.toLowerCase() || '')
  );
};

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export' | 'override';
export type ModuleName = 
  | 'pos'
  | 'sales'
  | 'catalogue'
  | 'purchasing'
  | 'inventory'
  | 'parties'
  | 'finance'
  | 'loans'
  | 'reports'
  | 'administration'
  | 'audit';

export type PermissionMatrix = Record<ModuleName, Record<PermissionAction, boolean>>;

export interface NavigationModuleItem {
  id: string;
  label: string;
  category: 'Dispensary & POS' | 'Commercial & Sales' | 'Clinical & Formulary' | 'Supply Chain' | 'CRM & Stakeholders' | 'Financial & Ledgers' | 'Executive & Audit' | 'Governance';
  type: 'main' | 'sub';
  parentId?: string;
  description: string;
  icon?: string;
  isSystemLocked?: boolean;
}

export type EnabledModulesState = Record<string, boolean>;

export interface RoleSensitiveControls {
  viewCost: boolean;
  viewProfit: boolean;
  viewAudit: boolean;
  manageSettings: boolean;
  protectedDiagnostics: boolean;
  viewAllSalesRecords?: boolean;
}

export interface UserAuthorization {
  userId: string;
  maxDiscountPercent: number; // e.g. 5%, 10%, 25%
  maxRefundLimit: number; // in currency e.g. GH₵ 500
  stockAdjustmentLimit: number; // in currency e.g. GH₵ 1000
  expenseApprovalLimit: number; // in currency e.g. GH₵ 2000
  poApprovalLimit: number; // in currency e.g. GH₵ 10000
  requireTwoFactor: boolean;
  canOverridePrice: boolean;
  canViewCostPrices: boolean;
  canViewProfits: boolean;
  canViewAllSalesRecords?: boolean;
  customPermissions?: Partial<PermissionMatrix>;
  lastPasswordChange?: string;
  sessionsActive?: number;
}

export interface CustomRoleDefinition {
  id: string;
  name: string;
  description: string;
  baseRole: RoleType;
  financialLimit: number;
  permissions: PermissionMatrix;
  sensitiveControls?: RoleSensitiveControls;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface DosagePreset {
  baseUnit: string;
  recommendedUnits: string[];
  hasStrip: boolean;
  stripMultiplier: number;
  hasPack: boolean;
  packMultiplier: number;
  packDescription: string;
  clinicalNote: string;
  isCustom?: boolean;
}

export type UnitTypeCategory = 'CONTAINER' | 'SUB_CONTAINER' | 'DISPENSING_BASE';

export interface UnitType {
  id: string;
  name: string;
  plural?: string;
  category: UnitTypeCategory;
  description?: string;
  isDefault?: boolean;
  isCustom?: boolean;
}

export interface ProductPackagingTier {
  unitName: string; // e.g. "Pack", "Strip", "Piece"
  tierType?: 'PACK' | 'STRIP' | 'PIECE';
  multiplier: number; // e.g. 100 base units, 10 base units, 1 base unit
  sellingPrice: number;
  costPrice: number;
  isBase?: boolean;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
}

export interface Product {
  id: string;
  barcode: string;
  sku: string;
  genericName: string;
  brandName: string;
  dosageForm: 'Tablet' | 'Capsule' | 'Syrup' | 'Suspension' | 'Injection' | 'Cream' | 'Ointment' | 'Eye Drops' | 'Ear Drops' | 'Inhaler' | 'Suppository' | 'Sachet' | string;
  strength: string;
  packSize: string;
  categoryId: string;
  categoryName: string;
  manufacturer: string;
  baseUnit: string; // e.g. "Tablet", "Piece", "mL"
  packagingTiers: ProductPackagingTier[];
  bulkDiscountPercent?: number;
  isPrescriptionRequired: boolean;
  requiresColdChain: boolean;
  reorderLevel: number;
  maxStockLevel: number;
  unitCost: number;
  sellingPrice: number;
  totalQuantity: number; // in base units
  availableQuantity: number; // in base units
  stockOnHand?: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export type BatchStatus = 'ACTIVE' | 'NEAR_EXPIRY' | 'EXPIRED' | 'QUARANTINED' | 'RECALLED' | 'DISPOSED' | 'DEPLETED';

export interface Batch {
  id: string;
  productId: string;
  productName: string;
  batchNumber: string;
  manufacturingDate: string;
  mfgDate?: string;
  expiryDate: string;
  quantityOnHand: number;
  availableQuantity: number;
  remainingStock: number;
  initialStock: number;
  unitCost: number;
  costPrice: number;
  sellingPrice: number;
  supplierId: string;
  supplierName: string;
  status: BatchStatus;
  storageLocation: string;
  receivedDate: string;
  grnNumber?: string;
  deliveryNote?: string;
}

export type MovementType = 
  | 'PURCHASE_RECEIVE'
  | 'POS_SALE'
  | 'RETURN_IN'
  | 'RETURN_OUT'
  | 'DAMAGE_WRITE_OFF'
  | 'COUNT_ADJUSTMENT'
  | 'EXPIRED_DISPOSAL'
  | 'QUARANTINE_TRANSFER';

export interface StockMovement {
  id: string;
  timestamp: string;
  movementType: MovementType;
  productId: string;
  productName: string;
  batchId: string;
  batchNumber: string;
  quantity: number; // positive or negative
  balanceBefore: number;
  balanceAfter: number;
  referenceNumber: string;
  actorName: string;
  reason?: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  dosageForm: string;
  strength: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  unitPrice: number;
  quantity: number;
  selectedUnitName: string; // e.g. "Pack", "Strip", "Piece"
  unitMultiplier: number; // e.g. 100, 10, 1 base units
  packagingTiers?: ProductPackagingTier[];
  discountPercent: number;
  subtotal: number;
  isPrescriptionRequired: boolean;
  availableStock: number;
  isFefoRecommended: boolean;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT' | 'MOMO';

export interface PaymentTender {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

export interface PrescriptionDetails {
  prescriberName: string;
  prescriberPhone?: string;
  hospitalClinic?: string;
  prescriberLicense: string;
  patientName: string;
  patientAge?: number;
  patientGender?: 'MALE' | 'FEMALE' | 'OTHER';
  verifiedByPharmacistId: string;
  verifiedByPharmacistName: string;
  prescriptionSlipUrl?: string;
  notes?: string;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  createdAt: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  payments: PaymentTender[];
  changeDue: number;
  hasPrescriptionDrugs: boolean;
  prescription?: PrescriptionDetails;
  isTrainingSimulation?: boolean;
  patientPhone?: string;
  status: 'COMPLETED' | 'HELD' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
}

export interface ReturnedItem {
  productId: string;
  productName: string;
  batchId?: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  refundSubtotal: number;
  condition: 'RESELLABLE' | 'DAMAGED';
}

export interface SaleReturn {
  id: string;
  creditNoteNumber: string; // e.g. CN-20260921-001
  saleId: string;
  receiptNumber: string;
  customerName?: string;
  cashierName: string;
  authorizedByPharmacist: string;
  createdAt: string;
  reason: string;
  returnType: 'FULL' | 'PARTIAL';
  condition: 'RESELLABLE' | 'DAMAGED';
  items: ReturnedItem[];
  refundTotal: number;
  refundMethod: 'CASH' | 'STORE_CREDIT' | 'ORIGINAL_METHOD';
  restocked: boolean;
}

export interface ProcessReturnParams {
  saleId: string;
  reason: string;
  condition: 'RESELLABLE' | 'DAMAGED';
  refundMethod: 'CASH' | 'STORE_CREDIT' | 'ORIGINAL_METHOD';
  returnedItems: Array<{
    productId: string;
    productName: string;
    batchId?: string;
    batchNumber: string;
    quantity: number;
    unitPrice: number;
    unitMultiplier?: number;
    condition: 'RESELLABLE' | 'DAMAGED';
  }>;
}

export interface DraftSale {
  id: string;
  draftNumber: string; // e.g. DFT-20260921-001
  title?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  hasPrescriptionDrugs: boolean;
  prescription?: PrescriptionDetails;
  status: 'DRAFT';
}

export interface CustomerCreditNote {
  id: string;
  creditNoteNumber: string; // e.g. CRN-20260921-001
  customerId: string;
  customerName: string;
  originalAmount: number;
  remainingBalance: number;
  issueDate: string;
  expiryDate?: string;
  reason: string;
  sourceType: 'RETURN_REFUND' | 'MANUAL_ISSUANCE' | 'OVERPAYMENT' | 'GOODWILL';
  sourceReference?: string;
  issuedBy: string;
  status: 'ACTIVE' | 'PARTIALLY_USED' | 'REDEEMED' | 'EXPIRED' | 'VOID';
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  paymentTermsDays: number;
  outstandingBalance: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export type POStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PARTIALLY_RECEIVED' | 'COMPLETED' | 'CANCELLED';

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  orderedQty: number;
  receivedQty: number;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  createdAt: string;
  expectedDate: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: POStatus;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  dateOfBirth?: string;
  allergies?: string[];
  chronicConditions?: string[];
  creditLimit: number;
  currentBalance: number;
  receivablesAgeing: {
    current: number;
    days30: number;
    days60: number;
    days90Plus: number;
  };
  totalPurchases: number;
}

export interface CashierShift {
  id: string;
  shiftNumber: string;
  cashierId: string;
  cashierName: string;
  terminalId: string;
  startTime: string;
  endTime?: string;
  openingFloat: number;
  cashSales: number;
  cardSales: number;
  transferSales: number;
  momoSales?: number;
  creditSales: number;
  refundsTotal: number;
  midShiftCashDrops: number;
  expectedCash: number;
  countedCash?: number;
  variance?: number;
  varianceReason?: string;
  status: 'OPEN' | 'CLOSED' | 'RECONCILED';
  reconciledBy?: string;
}

export interface ExpenseItem {
  id: string;
  description: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Expense {
  id: string;
  category: 'Rent' | 'Utilities' | 'Salaries' | 'Logistics' | 'Licenses' | 'Petty Cash' | 'Maintenance' | 'Marketing' | 'Insurance' | string;
  amount: number;
  expenseDate: string;
  payee: string;
  paymentMethod: 'CASH' | 'TRANSFER' | 'CARD' | 'MOMO' | 'CHEQUE' | string;
  referenceNumber: string;
  notes?: string;
  approvedBy: string;
  receiptAttachment?: string;
  items?: ExpenseItem[];
  status?: 'PAID' | 'PENDING_APPROVAL' | 'VOIDED';
}

export type BankingTransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER_TO_BANK' | 'SAFE_DROP';

export interface BankAccount {
  id: string;
  bankName: string; // e.g. "GCB Bank", "Ecobank Ghana", "Stanbic Bank", "CalBank", "MTN MoMo"
  accountName: string;
  accountNumber: string;
  branchName: string;
  currency: string;
  accountType: 'CURRENT' | 'SAVINGS' | 'MERCHANT_MOMO' | 'VAULT_SAFE';
  isDefault?: boolean;
  currentBalance?: number;
}

export interface BankingRecord {
  id: string;
  transactionNumber: string; // e.g. "BNK-2026-0041"
  type: BankingTransactionType;
  bankAccountId: string;
  bankAccountName: string;
  amount: number;
  source: 'CASH_DRAWER' | 'VAULT_SAFE' | 'POS_FLOAT' | 'PETTY_CASH' | 'MOBILE_MONEY';
  referenceSlip: string; // Teller slip / deposit receipt #
  transactionDate: string;
  depositedBy: string; // Accountant name
  notes?: string;
  status: 'PENDING' | 'CLEARED' | 'RECONCILED';
  verifiedBy?: string;
  createdAt: string;
}

export interface LoanAmortizationSchedule {
  installmentNumber: number;
  dueDate: string;
  principalDue: number;
  interestDue: number;
  totalDue: number;
  paidAmount: number;
  paidDate?: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
}

export interface BusinessLoan {
  id: string;
  lenderName: string;
  facilityReference: string;
  facilityType?: 'COMMERCIAL_BANK_LOAN' | 'EQUIPMENT_FINANCE' | 'SUPPLIER_TRADE_CREDIT' | 'WORKING_CAPITAL' | string;
  principalAmount: number;
  annualInterestRate: number; // percentage e.g. 14.5%
  termMonths: number;
  startDate: string;
  maturityDate: string;
  monthlyInstallment: number;
  totalRepayable: number;
  totalPaid: number;
  outstandingBalance: number;
  status: 'ACTIVE' | 'RESTRUCTURED' | 'PAID_OFF';
  schedule: LoanAmortizationSchedule[];
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: RoleType;
  action: string;
  module: ModuleName;
  recordReference: string;
  previousValue?: string;
  newValue?: string;
  ipAddress: string;
  outcome: 'SUCCESS' | 'WARNING' | 'DENIED';
  details?: string;
}

export interface ApprovalRequest {
  id: string;
  module: ModuleName;
  title: string;
  requestedBy: string;
  requestedAt: string;
  amount?: number;
  details: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  referenceId: string;
}

export type OperatingMode = 'PRODUCTION' | 'DEMO';

export interface SystemProfile {
  legalName: string;
  name?: string; // alias for legalName
  tradeName: string;
  tagline: string;
  premisesLicense: string;
  superintendentName: string;
  superintendentLicense: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  taxIdentificationNumber: string;
  taxNumber?: string; // alias for taxIdentificationNumber
  defaultVatPercent: number;
  logoUrl?: string;
  branchName: string;
  requireDoctorAuthorization?: boolean; // When false, POS allows direct selling of POMs without doctor sign-off
}

export interface ApiCredentialsConfig {
  smsProvider: 'Termii' | 'Twilio' | 'AfricasTalking';
  smsApiKey: string;
  smsSenderId: string;
  smsEndpoint?: string;
  paymentGateway: 'Paystack' | 'Flutterwave' | 'Stripe';
  paymentPublicKey: string;
  paymentSecretKey: string;
  isPaymentLive: boolean;
  nafdacRegistryApiKey: string;
  pcnComplianceApiKey: string;
}

export type ReceiptPaperSize = '58mm' | '80mm' | 'A4';

export interface PrinterConfig {
  printerName: string;
  paperSize: ReceiptPaperSize;
  showLogo: boolean;
  showBarcode: boolean;
  showQrCode: boolean;
  showBatchDetails: boolean;
  showPrescriberInfo: boolean;
  showCashierName: boolean;
  showCustomerName: boolean;
  showTaxBreakdown: boolean;
  showHeaderNote: boolean;
  showFooterPolicy: boolean;
  showPremisesLicense: boolean;
  showSuperintendentName: boolean;
  showPoweredBy: boolean;
  poweredByText: string;
  headerNote: string;
  footerPolicy: string;
  fontScale: 'compact' | 'normal' | 'large';
  autoCut: boolean;
  openDrawerOnPrint: boolean;
}

export type ThemePreset = 'emerald' | 'ocean' | 'violet' | 'dark' | 'contrast' | 'crimson' | 'teal' | 'indigo';

export interface ThemePaletteDefinition {
  id: ThemePreset;
  name: string;
  subtitle: string;
  atmosphere: string;
  primaryColor: string;
  isDarkDefault?: boolean;
  sixColors: {
    primary: string;       // Token 1: Primary Main (600)
    accentGlow: string;    // Token 2: Accent Glow (400)
    surfaceTint: string;   // Token 3: Surface Tint (50)
    contrastText: string;  // Token 4: Deep Contrast (900)
    neutralBorder: string; // Token 5: Neutral Border (300/700)
    vitalityCue: string;   // Token 6: Vitality / Alert Accent
  };
}

export type LogSource = 'FRONTEND' | 'BACKEND_PYTHON' | 'DATABASE' | 'PRINTER_SPOOLER';

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  source: LogSource;
  component: string;
  message: string;
  stackTrace?: string;
  userId?: string;
  path?: string;
  statusCode?: number;
}

export interface StorageLocation {
  id: string;
  code?: string;
  name: string;
  type: 'BAY' | 'SHELF' | 'BRANCH' | 'COLD_ROOM' | 'WAREHOUSE';
  branchName?: string;
  address?: string;
  isActive?: boolean;
  isDefault?: boolean;
  description?: string;
}

export interface CreditPaymentRecord {
  id: string;
  creditSaleId: string;
  receiptNumber: string;
  amount: number;
  paymentMethod: PaymentMethod;
  method?: PaymentMethod | string;
  paymentDate: string;
  date?: string;
  receivedBy: string;
  receivedByName?: string;
  reference?: string;
  notes?: string;
}

export interface CreditAccountSale {
  id: string;
  saleId: string;
  invoiceNumber: string;
  saleNumber: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  cashierId: string;
  cashierName: string;
  saleDate: string;
  createdAt: string;
  dueDate: string;
  totalAmount: number;
  invoicedTotal: number;
  paidAmount: number;
  balanceDue: number;
  remainingBalance: number;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'SETTLED' | 'OVERDUE' | 'PAID' | 'OUTSTANDING';
  itemsCount: number;
  items: CartItem[];
  notes?: string;
  payments: CreditPaymentRecord[];
}

export type DialogVariant = 'danger' | 'warning' | 'info' | 'primary' | 'success';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
}

export interface AlertDialogOptions {
  title: string;
  message: string;
  description?: string;
  confirmText?: string;
  variant?: DialogVariant;
}

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  duration?: number;
}
