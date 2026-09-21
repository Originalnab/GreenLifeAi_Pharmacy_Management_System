import { Sale } from '../../types';

export const initialSales: Sale[] = [
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
