import { 
  User, Product, Batch, Sale, Supplier, Customer,
  CashierShift, Expense, AuditEvent, StorageLocation,
  DraftSale, SaleReturn, CustomerCreditNote, ProductPackagingTier,
  PurchaseOrder
} from '../types';

const DEMO_USERNAMES = new Set([
  'admink19', 'superadmin', 'mgr_koffi', 'acct_zainab', 'admin_clara', 'pharm_amaka',
  'cashier_emmanuel', 'stock_tunde', 'proc_kwame', 'audit_justice'
]);

export function mapUserFromBackend(bUser: any): User {
  const username = (bUser.username || '').toLowerCase();
  const isDemoUser = DEMO_USERNAMES.has(username) || String(bUser.id || '').startsWith('usr_');

  return {
    id: String(bUser.id),
    username: bUser.username,
    name: bUser.name || `${bUser.first_name || ''} ${bUser.last_name || ''}`.trim() || bUser.username,
    firstName: bUser.first_name || '',
    middleName: bUser.middle_name || '',
    lastName: bUser.last_name || '',
    dob: bUser.dob || '',
    phone: bUser.phone || '',
    alternatePhone: bUser.alternate_phone || '',
    email: bUser.email || '',
    role: bUser.role || 'Cashier',
    primaryRole: bUser.primary_role || bUser.role || 'Cashier',
    assignedRoles: Array.isArray(bUser.assigned_roles) && bUser.assigned_roles.length > 0 
      ? bUser.assigned_roles 
      : (bUser.role ? [bUser.role] : ['Cashier']),
    branchId: String(bUser.branch_id || ''),
    branchName: bUser.branch_name || 'Central Branch',
    avatarUrl: bUser.avatar_url,
    active: bUser.is_active ?? true,
    licenseNumber: bUser.license_number,
    mustChangePassword: isDemoUser ? false : (bUser.must_change_password ?? false),
    isTemporaryPassword: isDemoUser ? false : (bUser.is_temporary_password ?? false),
    passwordResetNotice: bUser.password_reset_notice ? {
      resetAt: bUser.password_reset_notice.reset_at || '',
      resetBy: bUser.password_reset_notice.reset_by || 'Admin',
      acknowledged: bUser.password_reset_notice.acknowledged ?? false
    } : undefined
  };
}

export function mapProductFromBackend(bProd: any, balances: any[] = []): Product {
  // Find on-hand balances for this product
  const prodBalances = balances.filter(b => b.product === bProd.id || b.product_id === bProd.id);
  const totalOnHand = prodBalances.reduce((acc, b) => acc + Number(b.quantity_on_hand_base || 0), 0);
  const totalAvail = prodBalances.reduce((acc, b) => acc + Number(b.available_quantity_base || b.quantity_on_hand_base || 0), 0);

  // Map packaging units
  const packagingTiers: ProductPackagingTier[] = (bProd.packaging_units || []).map((u: any) => ({
    unitName: u.unit_label || u.tier_name,
    tierType: u.tier_name === 'OUTER_BOX' ? 'PACK' : (u.tier_name === 'STRIP' ? 'STRIP' : 'PIECE'),
    multiplier: Number(u.multiplier_to_base || 1),
    sellingPrice: Number(u.retail_selling_price || 0),
    costPrice: Number(u.wholesale_cost || 0),
    isBase: u.tier_name === 'BASE_UNIT'
  }));

  // Ensure at least base unit tier exists
  if (!packagingTiers.some(t => t.isBase)) {
    packagingTiers.unshift({
      unitName: bProd.base_dispensing_unit || 'Piece',
      tierType: 'PIECE',
      multiplier: 1,
      sellingPrice: Number(bProd.selling_price_base || 0),
      costPrice: Number(bProd.cost_price_base || 0),
      isBase: true
    });
  }

  const reorder = Number(bProd.reorder_level_base || 50);
  let status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
  if (totalAvail <= 0) {
    status = 'OUT_OF_STOCK';
  } else if (totalAvail <= reorder) {
    status = 'LOW_STOCK';
  }

  return {
    id: String(bProd.id),
    barcode: bProd.barcode || '',
    sku: bProd.product_code || '',
    genericName: bProd.generic_name || '',
    brandName: bProd.brand_name || '',
    dosageForm: bProd.dosage_form_name || 'Tablet',
    strength: bProd.strength || '',
    packSize: `${bProd.pack_box_multiplier || 1}s`,
    categoryId: String(bProd.category || ''),
    categoryName: bProd.category_name || 'General Medicines',
    manufacturer: 'Licensed Pharmaceutical Manufacturer',
    baseUnit: bProd.base_dispensing_unit || 'Piece',
    packagingTiers,
    isPrescriptionRequired: bProd.is_prescription_required ?? false,
    requiresColdChain: (bProd.storage_condition || '').toLowerCase().includes('cold') || (bProd.storage_condition || '').includes('2-8'),
    reorderLevel: reorder,
    maxStockLevel: Number(bProd.maximum_stock_base || 1000),
    unitCost: Number(bProd.cost_price_base || 0),
    sellingPrice: Number(bProd.selling_price_base || 0),
    totalQuantity: totalOnHand,
    availableQuantity: totalAvail,
    status
  };
}

export function mapBatchFromBackend(bBatch: any, balance?: any): Batch {
  const onHand = balance 
    ? Number(balance.quantity_on_hand_base || 0) 
    : (bBatch.quantity_on_hand_base !== undefined ? Number(bBatch.quantity_on_hand_base) : Number(bBatch.initial_quantity_base || 0));
  const avail = balance 
    ? Number(balance.available_quantity_base || balance.quantity_on_hand_base || 0) 
    : (bBatch.available_quantity_base !== undefined ? Number(bBatch.available_quantity_base) : onHand);

  let status: any = bBatch.status || 'ACTIVE';
  if (onHand <= 0) status = 'DEPLETED';
  else if (bBatch.expiry_risk?.level === 'EXPIRED') status = 'EXPIRED';
  else if (bBatch.expiry_risk?.level === 'CRITICAL' || bBatch.expiry_risk?.level === 'WARNING') status = 'NEAR_EXPIRY';

  return {
    id: String(bBatch.id),
    productId: String(bBatch.product || ''),
    productName: bBatch.product_name || 'Pharmaceutical Item',
    batchNumber: bBatch.batch_number || '',
    manufacturingDate: bBatch.manufacturing_date || '',
    mfgDate: bBatch.manufacturing_date || '',
    expiryDate: bBatch.expiry_date || '',
    quantityOnHand: onHand,
    availableQuantity: avail,
    remainingStock: avail,
    initialStock: Number(bBatch.initial_quantity_base || 0),
    unitCost: Number(bBatch.unit_cost_base || 0),
    costPrice: Number(bBatch.unit_cost_base || 0),
    sellingPrice: Number(bBatch.unit_cost_base * 1.5 || 0),
    supplierId: '',
    supplierName: 'Authorized Distributor',
    status,
    storageLocation: bBatch.storage_location_name || 'Main Shelf',
    receivedDate: bBatch.created_at || new Date().toISOString()
  };
}

export function mapSaleFromBackend(bSale: any): Sale {
  return {
    id: String(bSale.id),
    receiptNumber: bSale.receipt_number,
    createdAt: bSale.created_at,
    cashierId: String(bSale.cashier || ''),
    cashierName: bSale.cashier_name || 'Cashier',
    customerId: bSale.customer ? String(bSale.customer) : undefined,
    customerName: bSale.customer_name,
    subtotal: Number(bSale.subtotal || 0),
    discountTotal: Number(bSale.discount_amount || 0),
    taxTotal: Number(bSale.tax_amount || 0),
    total: Number(bSale.total_amount || 0),
    payments: (bSale.tenders || []).map((t: any) => ({
      method: t.tender_method,
      amount: Number(t.amount_paid || 0),
      reference: t.transaction_reference
    })),
    changeDue: 0,
    hasPrescriptionDrugs: Boolean(bSale.prescribing_doctor_name),
    prescription: bSale.prescribing_doctor_name ? {
      prescriberName: bSale.prescribing_doctor_name,
      prescriberLicense: bSale.doctor_license_number || '',
      patientName: bSale.customer_name || 'Patient',
      prescriptionSlipUrl: bSale.patient_prescription_number || '',
      verifiedByPharmacistId: 'rx_verifier',
      verifiedByPharmacistName: bSale.pharmacist_name || 'Supervising Pharmacist'
    } : undefined,
    status: bSale.status === 'REFUNDED' ? 'REFUNDED' : 'COMPLETED',
    items: (bSale.lines || []).map((l: any) => ({
      productId: String(l.product),
      productName: l.product_name,
      dosageForm: '',
      strength: '',
      batchId: String(l.batch),
      batchNumber: l.batch_number,
      expiryDate: '',
      unitPrice: Number(l.unit_selling_price || 0),
      quantity: Number(l.quantity_dispensed_units || 1),
      selectedUnitName: l.packaging_unit_name,
      unitMultiplier: Number(l.multiplier_to_base || 1),
      discountPercent: Number(l.discount_percent || 0),
      subtotal: Number(l.total_line_amount || 0),
      isPrescriptionRequired: false,
      availableStock: 100,
      isFefoRecommended: true
    }))
  };
}

export function mapSupplierFromBackend(bSup: any): Supplier {
  return {
    id: String(bSup.id),
    name: bSup.name,
    code: bSup.code,
    contactPerson: bSup.contact_person || '',
    phone: bSup.telephone || '',
    email: bSup.email || '',
    address: bSup.address || '',
    paymentTermsDays: Number(bSup.payment_terms_days || 30),
    outstandingBalance: 0,
    status: bSup.is_active ? 'ACTIVE' : 'INACTIVE'
  };
}

export function mapCustomerFromBackend(bCust: any): Customer {
  return {
    id: String(bCust.id),
    name: bCust.name,
    phone: bCust.phone || '',
    email: bCust.email || '',
    address: bCust.address || '',
    creditLimit: Number(bCust.credit_limit || 0),
    currentBalance: Number(bCust.current_credit_balance || 0),
    receivablesAgeing: {
      current: Number(bCust.current_credit_balance || 0),
      days30: 0,
      days60: 0,
      days90Plus: 0
    },
    totalPurchases: 0
  };
}

export function mapShiftFromBackend(bShift: any): CashierShift {
  return {
    id: String(bShift.id),
    shiftNumber: bShift.shift_number,
    cashierId: String(bShift.user || ''),
    cashierName: bShift.user_name || 'Cashier',
    terminalId: 'POS-01',
    openingFloat: Number(bShift.opening_float || 0),
    startTime: bShift.opened_at,
    endTime: bShift.closed_at,
    status: bShift.status === 'OPEN' ? 'OPEN' : 'CLOSED',
    countedCash: bShift.closing_counted_cash ? Number(bShift.closing_counted_cash) : undefined,
    expectedCash: Number(bShift.closing_system_expected_cash || bShift.opening_float || 0),
    variance: bShift.discrepancy_amount ? Number(bShift.discrepancy_amount) : undefined,
    cashSales: 0,
    cardSales: 0,
    transferSales: 0,
    creditSales: 0,
    refundsTotal: 0,
    midShiftCashDrops: 0
  };
}

export function mapExpenseFromBackend(bExp: any): Expense {
  return {
    id: String(bExp.id),
    expenseDate: bExp.created_at ? bExp.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    category: bExp.category_name || 'Operational Expense',
    amount: Number(bExp.amount || 0),
    paymentMethod: bExp.payment_method || 'CASH',
    payee: bExp.disbursed_to || '',
    referenceNumber: bExp.reference_identifier || `EXP-${String(bExp.id).substring(0, 6)}`,
    notes: bExp.purpose || '',
    approvedBy: bExp.approved_by_name || 'Admin',
    receiptAttachment: bExp.receipt_url
  };
}

export function mapAuditEventFromBackend(bAudit: any): AuditEvent {
  return {
    id: String(bAudit.id),
    timestamp: bAudit.timestamp,
    actorId: String(bAudit.actor || ''),
    actorName: bAudit.actor_name || 'System',
    actorRole: bAudit.actor_role || 'Super Admin',
    action: bAudit.action_type || 'SYSTEM_ACTION',
    module: (bAudit.module || 'sales') as any,
    recordReference: bAudit.target_identifier || 'REF',
    ipAddress: bAudit.ip_address || '127.0.0.1',
    outcome: 'SUCCESS',
    details: bAudit.description
  };
}

export function mapStorageLocationFromBackend(bLoc: any): StorageLocation {
  return {
    id: String(bLoc.id),
    code: bLoc.code,
    name: bLoc.name,
    type: bLoc.type || 'SHELF',
    description: bLoc.description || '',
    isActive: bLoc.is_active ?? true
  };
}

export function mapPurchaseOrderFromBackend(bPo: any): PurchaseOrder {
  return {
    id: String(bPo.id),
    poNumber: bPo.po_number,
    supplierId: String(bPo.supplier || ''),
    supplierName: bPo.supplier_name || 'Authorized Supplier',
    createdAt: bPo.created_at ? bPo.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    expectedDate: bPo.expected_delivery_date || bPo.created_at || new Date().toISOString().split('T')[0],
    items: (bPo.lines || []).map((l: any) => ({
      productId: String(l.product || ''),
      productName: l.product_name || 'Pharmaceutical Item',
      orderedQty: Number(l.quantity_ordered_base || 0),
      receivedQty: Number(l.quantity_received_base || 0),
      unitCost: Number(l.unit_cost_base || 0),
      totalCost: Number(l.line_total || (l.quantity_ordered_base * l.unit_cost_base) || 0)
    })),
    totalAmount: Number(bPo.total_amount || 0),
    status: bPo.status || 'SUBMITTED',
    approvalStatus: bPo.approval_status || 'PENDING',
    approvedBy: bPo.approved_by ? String(bPo.approved_by) : undefined,
    notes: bPo.notes || ''
  };
}

