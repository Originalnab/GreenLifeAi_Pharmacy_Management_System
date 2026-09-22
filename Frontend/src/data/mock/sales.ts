import { Sale, SaleReturn, DraftSale, CustomerCreditNote, CreditAccountSale } from '../../types';

export const initialSales: Sale[] = [
  {
    id: 'sale_8901',
    receiptNumber: 'REC-20260921-8901',
    createdAt: '2026-09-21 08:05:12',
    cashierId: 'usr_002',
    cashierName: 'Kwame Mensah',
    customerId: 'cust_001',
    customerName: 'Chief Olatunji Williams',
    items: [
      {
        productId: 'prod_amox_500',
        productName: 'Amoxicillin 500mg Caps',
        dosageForm: 'Capsule',
        strength: '500mg',
        batchId: 'batch_amox_01',
        batchNumber: 'AMX-2025-109',
        expiryDate: '2027-04-30',
        unitPrice: 45.00,
        quantity: 2,
        selectedUnitName: 'Pack',
        unitMultiplier: 1,
        discountPercent: 0,
        subtotal: 90.00,
        isPrescriptionRequired: true,
        availableStock: 140,
        isFefoRecommended: true
      },
      {
        productId: 'prod_para_500',
        productName: 'Panadol Extra 500mg',
        dosageForm: 'Tablet',
        strength: '500mg',
        batchId: 'batch_para_01',
        batchNumber: 'PND-2025-772',
        expiryDate: '2026-11-15',
        unitPrice: 18.00,
        quantity: 1,
        selectedUnitName: 'Pack',
        unitMultiplier: 1,
        discountPercent: 0,
        subtotal: 18.00,
        isPrescriptionRequired: false,
        availableStock: 120,
        isFefoRecommended: true
      }
    ],
    subtotal: 108.00,
    discountTotal: 0,
    taxTotal: 0,
    total: 108.00,
    payments: [
      { method: 'MOMO', amount: 108.00, reference: 'MTN MoMo: MM-TXN-89012' }
    ],
    changeDue: 0,
    hasPrescriptionDrugs: true,
    prescription: {
      prescriberName: 'Dr. Kelechi Nnamdi',
      prescriberLicense: 'MDCN-44109',
      patientName: 'Chief Olatunji Williams',
      verifiedByPharmacistId: 'usr_001',
      verifiedByPharmacistName: 'Dr. Adeyemi Adeleke'
    },
    status: 'COMPLETED'
  },
  {
    id: 'sale_001',
    receiptNumber: 'REC-20260920-001',
    createdAt: '2026-09-20 09:12:44',
    cashierId: 'usr_003',
    cashierName: 'Emmanuel Balogun',
    customerId: 'cust_003',
    customerName: 'Walk-in Retail Customer',
    items: [
      {
        productId: 'prod_para_500',
        productName: 'Panadol Extra 500mg',
        dosageForm: 'Tablet',
        strength: '500mg',
        batchId: 'batch_para_01',
        batchNumber: 'PND-2025-772',
        expiryDate: '2026-11-15',
        unitPrice: 1200.00,
        quantity: 2,
        selectedUnitName: 'Pack',
        unitMultiplier: 1,
        discountPercent: 0,
        subtotal: 2400.00,
        isPrescriptionRequired: false,
        availableStock: 120,
        isFefoRecommended: true
      }
    ],
    subtotal: 2400.00,
    discountTotal: 0,
    taxTotal: 180.00,
    total: 2580.00,
    payments: [
      { method: 'CASH', amount: 3000.00 }
    ],
    changeDue: 420.00,
    hasPrescriptionDrugs: false,
    status: 'COMPLETED'
  },
  {
    id: 'sale_002',
    receiptNumber: 'REC-20260920-002',
    createdAt: '2026-09-20 09:45:10',
    cashierId: 'usr_003',
    cashierName: 'Emmanuel Balogun',
    customerId: 'cust_001',
    customerName: 'Chief Olatunji Williams',
    items: [
      {
        productId: 'prod_metform_500',
        productName: 'Glucophage 500mg',
        dosageForm: 'Tablet',
        strength: '500mg',
        batchId: 'batch_met_01',
        batchNumber: 'GLU-MER-881',
        expiryDate: '2027-07-31',
        unitPrice: 4500.00,
        quantity: 2,
        selectedUnitName: 'Pack',
        unitMultiplier: 1,
        discountPercent: 5,
        subtotal: 8550.00,
        isPrescriptionRequired: true,
        availableStock: 75,
        isFefoRecommended: true
      },
      {
        productId: 'prod_coartem_80',
        productName: 'Coartem 80/480',
        dosageForm: 'Tablet',
        strength: '80mg/480mg',
        batchId: 'batch_coar_01',
        batchNumber: 'CRT-NOV-401',
        expiryDate: '2027-05-30',
        unitPrice: 3200.00,
        quantity: 1,
        selectedUnitName: 'Pack',
        unitMultiplier: 1,
        discountPercent: 0,
        subtotal: 3200.00,
        isPrescriptionRequired: false,
        availableStock: 92,
        isFefoRecommended: true
      }
    ],
    subtotal: 12200.00,
    discountTotal: 450.00,
    taxTotal: 881.25,
    total: 12631.25,
    payments: [
      { method: 'CARD', amount: 10000.00, reference: 'POS-TXN-881903' },
      { method: 'CREDIT', amount: 2631.25, reference: 'CUST-CREDIT-WILLIAMS' }
    ],
    changeDue: 0.00,
    hasPrescriptionDrugs: true,
    prescription: {
      prescriberName: 'Dr. Kelechi Nnamdi',
      prescriberLicense: 'MDCN-44109',
      hospitalClinic: 'St. Nicholas Hospital, Lagos',
      patientName: 'Chief Olatunji Williams',
      patientAge: 68,
      patientGender: 'MALE',
      verifiedByPharmacistId: 'usr_002',
      verifiedByPharmacistName: 'Pharm. Amaka Okafor',
      notes: 'Repeat diabetic maintenance prescription verified via phone.'
    },
    status: 'COMPLETED'
  }
];

export const initialReturns: SaleReturn[] = [
  {
    id: 'ret_001',
    creditNoteNumber: 'CN-20260920-001',
    saleId: 'sale_001',
    receiptNumber: 'REC-20260920-001',
    customerName: 'Walk-in Retail Customer',
    cashierName: 'Emmanuel Balogun',
    authorizedByPharmacist: 'Pharm. Amaka Okafor',
    createdAt: '2026-09-20 14:30:15',
    reason: 'Customer purchased incorrect strength; sealed blister pack returned in pristine condition.',
    returnType: 'FULL',
    condition: 'RESELLABLE',
    items: [
      {
        productId: 'prod_para_500',
        productName: 'Panadol Extra 500mg',
        batchNumber: 'PND-2025-772',
        quantity: 1,
        unitPrice: 1200.00,
        refundSubtotal: 1200.00,
        condition: 'RESELLABLE'
      }
    ],
    refundTotal: 1290.00, // including tax proportion
    refundMethod: 'CASH',
    restocked: true
  }
];

export const initialDraftSales: DraftSale[] = [
  {
    id: 'draft_001',
    draftNumber: 'DFT-20260921-001',
    title: 'Dr. Nnamdi Ward Dispensation Estimate',
    notes: 'Awaiting ward nurse confirmation for exact tablet quantity.',
    createdAt: '2026-09-21 08:15:00',
    updatedAt: '2026-09-21 08:15:00',
    cashierId: 'usr_003',
    cashierName: 'Emmanuel Balogun',
    customerId: 'cust_001',
    customerName: 'Chief Olatunji Williams',
    items: [
      {
        productId: 'prod_metform_500',
        productName: 'Glucophage 500mg',
        dosageForm: 'Tablet',
        strength: '500mg',
        batchId: 'batch_met_01',
        batchNumber: 'GLU-MER-881',
        expiryDate: '2027-07-31',
        unitPrice: 4500.00,
        quantity: 3,
        selectedUnitName: 'Pack',
        unitMultiplier: 1,
        discountPercent: 0,
        subtotal: 13500.00,
        isPrescriptionRequired: true,
        availableStock: 75,
        isFefoRecommended: true
      }
    ],
    subtotal: 13500.00,
    discountTotal: 0,
    taxTotal: 1012.50,
    total: 14512.50,
    hasPrescriptionDrugs: true,
    prescription: {
      prescriberName: 'Dr. Kelechi Nnamdi',
      prescriberLicense: 'MDCN-44109',
      hospitalClinic: 'St. Nicholas Hospital, Lagos',
      patientName: 'Chief Olatunji Williams',
      verifiedByPharmacistId: 'usr_002',
      verifiedByPharmacistName: 'Pharm. Amaka Okafor'
    },
    status: 'DRAFT'
  }
];

export const initialCreditNotes: CustomerCreditNote[] = [
  {
    id: 'crn_001',
    creditNoteNumber: 'CRN-20260920-001',
    customerId: 'cust_001',
    customerName: 'Chief Olatunji Williams',
    originalAmount: 5000.00,
    remainingBalance: 5000.00,
    issueDate: '2026-09-20 16:10:00',
    expiryDate: '2026-12-20',
    reason: 'Billing adjustment credit from institutional order overpayment',
    sourceType: 'OVERPAYMENT',
    sourceReference: 'REC-20260920-002',
    issuedBy: 'Pharm. Amaka Okafor',
    status: 'ACTIVE'
  },
  {
    id: 'crn_002',
    creditNoteNumber: 'CRN-20260918-002',
    customerId: 'cust_002',
    customerName: 'Federal Medical Center Oncology Dept',
    originalAmount: 18500.00,
    remainingBalance: 9200.00,
    issueDate: '2026-09-18 11:25:00',
    expiryDate: '2026-12-31',
    reason: 'Store credit issued for returned cold-chain chemotherapy adjuvant',
    sourceType: 'RETURN_REFUND',
    sourceReference: 'CN-20260918-001',
    issuedBy: 'Pharm. Amaka Okafor',
    status: 'PARTIALLY_USED'
  }
];

export const initialCreditSales: CreditAccountSale[] = [
  {
    id: 'crd_sale_001',
    saleId: 'sale_crd_01',
    invoiceNumber: 'INV-CRD-2026-0081',
    saleNumber: 'INV-CRD-2026-0081',
    customerId: 'cust_001',
    customerName: 'Chief Olatunji Williams',
    customerPhone: '+234 803 219 4481',
    cashierId: 'usr_003',
    cashierName: 'Emmanuel Balogun',
    saleDate: '2026-09-15 14:32:00',
    createdAt: '2026-09-15 14:32:00',
    dueDate: '2026-10-15',
    totalAmount: 42500.00,
    invoicedTotal: 42500.00,
    paidAmount: 15000.00,
    balanceDue: 27500.00,
    remainingBalance: 27500.00,
    status: 'PARTIALLY_PAID',
    itemsCount: 3,
    items: [
      {
        productId: 'prod_metform_500',
        productName: 'Glucophage 500mg',
        dosageForm: 'Tablet',
        strength: '500mg',
        batchId: 'batch_met_01',
        batchNumber: 'GLU-MER-881',
        expiryDate: '2027-07-31',
        unitPrice: 4500.00,
        quantity: 5,
        selectedUnitName: 'Pack',
        unitMultiplier: 1,
        discountPercent: 0,
        subtotal: 22500.00,
        isPrescriptionRequired: true,
        availableStock: 250,
        isFefoRecommended: true
      },
      {
        productId: 'prod_amox_500',
        productName: 'Amoxicillin 500mg Caps',
        dosageForm: 'Capsule',
        strength: '500mg',
        batchId: 'batch_amox_01',
        batchNumber: 'AMX-2025-109',
        expiryDate: '2027-04-30',
        unitPrice: 2000.00,
        quantity: 10,
        selectedUnitName: 'Pack',
        unitMultiplier: 1,
        discountPercent: 0,
        subtotal: 20000.00,
        isPrescriptionRequired: true,
        availableStock: 140,
        isFefoRecommended: true
      }
    ],
    notes: 'Monthly chronic hypertension & diabetic prescription supply on approved corporate account.',
    payments: [
      {
        id: 'crd_pay_01',
        creditSaleId: 'crd_sale_001',
        receiptNumber: 'RCP-CRD-2026-0041',
        amount: 15000.00,
        paymentMethod: 'TRANSFER',
        method: 'TRANSFER',
        paymentDate: '2026-09-18 10:15:00',
        date: '2026-09-18 10:15:00',
        receivedBy: 'Pharm. Amaka Okafor',
        receivedByName: 'Pharm. Amaka Okafor',
        reference: 'GTB-TRF-99482103',
        notes: 'Initial bank wire partial deposit'
      }
    ]
  },
  {
    id: 'crd_sale_002',
    saleId: 'sale_crd_02',
    invoiceNumber: 'INV-CRD-2026-0094',
    saleNumber: 'INV-CRD-2026-0094',
    customerId: 'cust_002',
    customerName: 'Dr. Fatima Bello-Osagie',
    customerPhone: '+234 802 884 1029',
    cashierId: 'usr_003',
    cashierName: 'Emmanuel Balogun',
    saleDate: '2026-09-18 16:45:00',
    createdAt: '2026-09-18 16:45:00',
    dueDate: '2026-10-02',
    totalAmount: 55000.00,
    invoicedTotal: 55000.00,
    paidAmount: 0.00,
    balanceDue: 55000.00,
    remainingBalance: 55000.00,
    status: 'UNPAID',
    itemsCount: 2,
    items: [],
    notes: 'Emergency oncology supportive therapy on 14-day consultant physician credit facility.',
    payments: []
  }
];

