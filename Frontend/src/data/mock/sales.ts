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
        unitPrice: 12.00,
        refundSubtotal: 12.00,
        condition: 'RESELLABLE'
      }
    ],
    refundTotal: 12.00,
    refundMethod: 'CASH',
    restocked: true
  },
  {
    id: 'ret_002',
    creditNoteNumber: 'CN-20260921-002',
    saleId: 'sale_002',
    receiptNumber: 'REC-20260921-0042',
    customerName: 'Dr. Fatima Bello-Osagie',
    cashierName: 'Nana Osei',
    authorizedByPharmacist: 'Pharm. Kwabena Mensah',
    createdAt: '2026-09-21 11:15:30',
    reason: 'Patient reported adverse gastric sensitivity; physician switched medication to liquid formulation.',
    returnType: 'PARTIAL',
    condition: 'DAMAGED',
    items: [
      {
        productId: 'prod_amox_500',
        productName: 'Amoxicillin 500mg Caps',
        batchNumber: 'AMX-2025-109',
        quantity: 2,
        unitPrice: 28.50,
        refundSubtotal: 57.00,
        condition: 'DAMAGED'
      }
    ],
    refundTotal: 57.00,
    refundMethod: 'CASH',
    restocked: false
  },
  {
    id: 'ret_003',
    creditNoteNumber: 'CN-20260922-003',
    saleId: 'sale_003',
    receiptNumber: 'REC-20260922-0118',
    customerName: 'Chief Olatunji Williams',
    cashierName: 'Emmanuel Balogun',
    authorizedByPharmacist: 'Pharm. Amaka Okafor',
    createdAt: '2026-09-22 09:40:10',
    reason: 'Unopened duplicate inhaler dispensed during hospital discharge; issued customer store credit voucher.',
    returnType: 'FULL',
    condition: 'RESELLABLE',
    items: [
      {
        productId: 'prod_vent_100',
        productName: 'Ventolin Inhaler 100mcg',
        batchNumber: 'VNT-2026-044',
        quantity: 1,
        unitPrice: 48.00,
        refundSubtotal: 48.00,
        condition: 'RESELLABLE'
      }
    ],
    refundTotal: 48.00,
    refundMethod: 'STORE_CREDIT',
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
        unitPrice: 45.00,
        quantity: 3,
        selectedUnitName: 'Pack',
        unitMultiplier: 1,
        discountPercent: 0,
        subtotal: 135.00,
        isPrescriptionRequired: true,
        availableStock: 75,
        isFefoRecommended: true
      }
    ],
    subtotal: 135.00,
    discountTotal: 0,
    taxTotal: 0,
    total: 135.00,
    hasPrescriptionDrugs: true,
    prescription: {
      prescriberName: 'Dr. Kelechi Nnamdi',
      prescriberLicense: 'MDCN-44109',
      hospitalClinic: 'St. Nicholas Hospital, Accra',
      patientName: 'Chief Olatunji Williams',
      verifiedByPharmacistId: 'usr_002',
      verifiedByPharmacistName: 'Pharm. Amaka Okafor'
    },
    status: 'DRAFT'
  },
  {
    id: 'draft_002',
    draftNumber: 'DFT-20260922-002',
    title: 'Outpatient Pediatric Antibiotic Estimate',
    notes: 'Parent inquiring total cost of treatment before confirming prescription fill.',
    createdAt: '2026-09-22 10:20:00',
    updatedAt: '2026-09-22 10:20:00',
    cashierId: 'usr_001',
    cashierName: 'Nana Osei',
    customerId: 'cust_002',
    customerName: 'Dr. Fatima Bello-Osagie',
    items: [
      {
        productId: 'prod_amox_500',
        productName: 'Amoxicillin Suspension 250mg/5mL',
        dosageForm: 'Suspension',
        strength: '250mg/5mL',
        batchId: 'batch_amox_02',
        batchNumber: 'AMX-SUSP-902',
        expiryDate: '2027-06-30',
        unitPrice: 32.00,
        quantity: 2,
        selectedUnitName: 'Bottle',
        unitMultiplier: 1,
        discountPercent: 0,
        subtotal: 64.00,
        isPrescriptionRequired: true,
        availableStock: 40,
        isFefoRecommended: true
      },
      {
        productId: 'prod_para_500',
        productName: 'Paracetamol Pediatric Drops 15mL',
        dosageForm: 'Drops',
        strength: '100mg/mL',
        batchId: 'batch_para_02',
        batchNumber: 'PND-DRP-331',
        expiryDate: '2027-08-31',
        unitPrice: 18.00,
        quantity: 1,
        selectedUnitName: 'Bottle',
        unitMultiplier: 1,
        discountPercent: 0,
        subtotal: 18.00,
        isPrescriptionRequired: false,
        availableStock: 50,
        isFefoRecommended: true
      }
    ],
    subtotal: 82.00,
    discountTotal: 0,
    taxTotal: 0,
    total: 82.00,
    hasPrescriptionDrugs: true,
    status: 'DRAFT'
  },
  {
    id: 'draft_003',
    draftNumber: 'DFT-20260922-003',
    title: 'Corporate Clinic First Aid Replenishment Quotation',
    notes: 'Official pro-forma quotation requested for corporate accounts payable review.',
    createdAt: '2026-09-22 13:45:00',
    updatedAt: '2026-09-22 13:45:00',
    cashierId: 'usr_002',
    cashierName: 'Pharm. Kwabena Mensah',
    customerId: 'cust_001',
    customerName: 'St. Nicholas Clinic Medical Center',
    items: [
      {
        productId: 'prod_para_500',
        productName: 'Panadol Extra 500mg',
        dosageForm: 'Tablet',
        strength: '500mg',
        batchId: 'batch_pnd_01',
        batchNumber: 'PND-2025-772',
        expiryDate: '2027-05-31',
        unitPrice: 12.00,
        quantity: 10,
        selectedUnitName: 'Pack',
        unitMultiplier: 1,
        discountPercent: 5,
        subtotal: 114.00,
        isPrescriptionRequired: false,
        availableStock: 200,
        isFefoRecommended: true
      }
    ],
    subtotal: 114.00,
    discountTotal: 6.00,
    taxTotal: 0,
    total: 114.00,
    hasPrescriptionDrugs: false,
    status: 'DRAFT'
  }
];

export const initialCreditNotes: CustomerCreditNote[] = [
  {
    id: 'crn_001',
    creditNoteNumber: 'CRN-20260920-001',
    customerId: 'cust_001',
    customerName: 'Chief Olatunji Williams',
    originalAmount: 150.00,
    remainingBalance: 150.00,
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
    originalAmount: 285.00,
    remainingBalance: 92.00,
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
    customerPhone: '+233 24 519 4481',
    cashierId: 'usr_003',
    cashierName: 'Emmanuel Balogun',
    saleDate: '2026-09-15 14:32:00',
    createdAt: '2026-09-15 14:32:00',
    dueDate: '2026-10-15',
    totalAmount: 425.00,
    invoicedTotal: 425.00,
    paidAmount: 150.00,
    balanceDue: 275.00,
    remainingBalance: 275.00,
    status: 'PARTIALLY_PAID',
    itemsCount: 2,
    items: [
      {
        productId: 'prod_metform_500',
        productName: 'Glucophage 500mg',
        dosageForm: 'Tablet',
        strength: '500mg',
        batchId: 'batch_met_01',
        batchNumber: 'GLU-MER-881',
        expiryDate: '2027-07-31',
        unitPrice: 45.00,
        quantity: 5,
        selectedUnitName: 'Pack',
        unitMultiplier: 1,
        discountPercent: 0,
        subtotal: 225.00,
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
        unitPrice: 20.00,
        quantity: 10,
        selectedUnitName: 'Pack',
        unitMultiplier: 1,
        discountPercent: 0,
        subtotal: 200.00,
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
        amount: 150.00,
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
    customerPhone: '+233 20 884 1029',
    cashierId: 'usr_003',
    cashierName: 'Emmanuel Balogun',
    saleDate: '2026-09-18 16:45:00',
    createdAt: '2026-09-18 16:45:00',
    dueDate: '2026-10-02',
    totalAmount: 180.00,
    invoicedTotal: 180.00,
    paidAmount: 0.00,
    balanceDue: 180.00,
    remainingBalance: 180.00,
    status: 'OUTSTANDING',
    itemsCount: 1,
    items: [
      {
        productId: 'prod_vent_100',
        productName: 'Ventolin Inhaler 100mcg',
        dosageForm: 'Inhaler',
        strength: '100mcg',
        batchId: 'batch_vnt_01',
        batchNumber: 'VNT-2026-044',
        expiryDate: '2027-10-31',
        unitPrice: 45.00,
        quantity: 4,
        selectedUnitName: 'Piece',
        unitMultiplier: 1,
        discountPercent: 0,
        subtotal: 180.00,
        isPrescriptionRequired: true,
        availableStock: 80,
        isFefoRecommended: true
      }
    ],
    notes: 'Emergency oncology supportive therapy on 14-day consultant physician credit facility.',
    payments: []
  },
  {
    id: 'crd_sale_003',
    saleId: 'sale_crd_03',
    invoiceNumber: 'INV-CRD-2026-0102',
    saleNumber: 'INV-CRD-2026-0102',
    customerId: 'cust_001',
    customerName: 'St. Nicholas Clinic Medical Center',
    customerPhone: '+233 27 712 9004',
    cashierId: 'usr_002',
    cashierName: 'Pharm. Kwabena Mensah',
    saleDate: '2026-09-10 11:20:00',
    createdAt: '2026-09-10 11:20:00',
    dueDate: '2026-09-24',
    totalAmount: 350.00,
    invoicedTotal: 350.00,
    paidAmount: 350.00,
    balanceDue: 0.00,
    remainingBalance: 0.00,
    status: 'PAID',
    itemsCount: 2,
    items: [
      {
        productId: 'prod_para_500',
        productName: 'Panadol Extra 500mg',
        dosageForm: 'Tablet',
        strength: '500mg',
        batchId: 'batch_pnd_01',
        batchNumber: 'PND-2025-772',
        expiryDate: '2027-05-31',
        unitPrice: 12.00,
        quantity: 15,
        selectedUnitName: 'Pack',
        unitMultiplier: 1,
        discountPercent: 0,
        subtotal: 180.00,
        isPrescriptionRequired: false,
        availableStock: 190,
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
        unitPrice: 17.00,
        quantity: 10,
        selectedUnitName: 'Pack',
        unitMultiplier: 1,
        discountPercent: 0,
        subtotal: 170.00,
        isPrescriptionRequired: true,
        availableStock: 120,
        isFefoRecommended: true
      }
    ],
    notes: 'Institutional emergency ward supply, 100% cleared via company bank draft.',
    payments: [
      {
        id: 'crd_pay_03',
        creditSaleId: 'crd_sale_003',
        receiptNumber: 'RCP-CRD-2026-0055',
        amount: 350.00,
        paymentMethod: 'TRANSFER',
        method: 'TRANSFER',
        paymentDate: '2026-09-20 14:00:00',
        date: '2026-09-20 14:00:00',
        receivedBy: 'Pharm. Kwabena Mensah',
        receivedByName: 'Pharm. Kwabena Mensah',
        reference: 'STANBIC-CHQ-10492',
        notes: 'Full payment settlement via cheque cleared'
      }
    ]
  },
  {
    id: 'crd_sale_004',
    saleId: 'sale_crd_04',
    invoiceNumber: 'INV-CRD-2026-0065',
    saleNumber: 'INV-CRD-2026-0065',
    customerId: 'cust_003',
    customerName: 'Alhaji Ibrahim Musa',
    customerPhone: '+233 55 319 8820',
    cashierId: 'usr_003',
    cashierName: 'Emmanuel Balogun',
    saleDate: '2026-08-25 15:10:00',
    createdAt: '2026-08-25 15:10:00',
    dueDate: '2026-09-10',
    totalAmount: 220.00,
    invoicedTotal: 220.00,
    paidAmount: 50.00,
    balanceDue: 170.00,
    remainingBalance: 170.00,
    status: 'PARTIALLY_PAID',
    itemsCount: 1,
    items: [
      {
        productId: 'prod_metform_500',
        productName: 'Glucophage 500mg',
        dosageForm: 'Tablet',
        strength: '500mg',
        batchId: 'batch_met_01',
        batchNumber: 'GLU-MER-881',
        expiryDate: '2027-07-31',
        unitPrice: 44.00,
        quantity: 5,
        selectedUnitName: 'Pack',
        unitMultiplier: 1,
        discountPercent: 0,
        subtotal: 220.00,
        isPrescriptionRequired: true,
        availableStock: 210,
        isFefoRecommended: true
      }
    ],
    notes: 'Chronic care supply. Overdue notice sent via automated WhatsApp/SMS integration.',
    payments: [
      {
        id: 'crd_pay_04',
        creditSaleId: 'crd_sale_004',
        receiptNumber: 'RCP-CRD-2026-0021',
        amount: 50.00,
        paymentMethod: 'MOMO',
        method: 'MOMO',
        paymentDate: '2026-08-30 09:30:00',
        date: '2026-08-30 09:30:00',
        receivedBy: 'Nana Osei',
        receivedByName: 'Nana Osei',
        reference: 'MTN-MM-8491028',
        notes: 'Mobile money cash deposit'
      }
    ]
  }
];

