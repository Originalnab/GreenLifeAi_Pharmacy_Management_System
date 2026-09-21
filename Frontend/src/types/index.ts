export type RoleType = 
  | 'Super Admin'
  | 'Pharmacy Admin'
  | 'Manager'
  | 'Pharmacist'
  | 'Cashier'
  | 'Stock Officer'
  | 'Procurement Officer'
  | 'Accountant'
  | 'Auditor'
  | 'Custom Role';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: RoleType;
  branchId: string;
  branchName: string;
  avatarUrl?: string;
  active: boolean;
  licenseNumber?: string;
}

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

export interface RoleSensitiveControls {
  viewCost: boolean;
  viewProfit: boolean;
  viewAudit: boolean;
  manageSettings: boolean;
  protectedDiagnostics: boolean;
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
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export type BatchStatus = 'ACTIVE' | 'NEAR_EXPIRY' | 'EXPIRED' | 'QUARANTINED' | 'RECALLED' | 'DISPOSED';

export interface Batch {
  id: string;
  productId: string;
  productName: string;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  quantityOnHand: number;
  availableQuantity: number;
  unitCost: number;
  sellingPrice: number;
  supplierId: string;
  supplierName: string;
  status: BatchStatus;
  storageLocation: string;
  receivedDate: string;
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

export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT';

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
  status: 'COMPLETED' | 'HELD' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
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

export interface Expense {
  id: string;
  category: 'Rent' | 'Utilities' | 'Salaries' | 'Logistics' | 'Licenses' | 'Petty Cash' | 'Maintenance';
  amount: number;
  expenseDate: string;
  payee: string;
  paymentMethod: 'CASH' | 'TRANSFER' | 'CARD';
  referenceNumber: string;
  notes?: string;
  approvedBy: string;
  receiptAttachment?: string;
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
  defaultVatPercent: number;
  logoUrl?: string;
  branchName: string;
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
  headerNote: string;
  footerPolicy: string;
  fontScale: 'compact' | 'normal' | 'large';
  autoCut: boolean;
  openDrawerOnPrint: boolean;
}

export type ThemePreset = 'emerald' | 'ocean' | 'violet' | 'dark' | 'contrast';

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


