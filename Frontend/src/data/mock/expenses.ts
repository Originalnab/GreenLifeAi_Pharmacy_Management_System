import { Expense } from '../../types';

export const initialExpenses: Expense[] = [
  {
    id: 'exp_001',
    category: 'Utilities',
    amount: 1450.00,
    expenseDate: '2026-09-18',
    payee: 'Electricity Company of Ghana (ECG)',
    paymentMethod: 'TRANSFER',
    referenceNumber: 'EXP-UTIL-202609-01',
    notes: 'Commercial power bill for Accra central dispensary & vaccine cold chain storage.',
    approvedBy: 'Koffi Mensah (Manager)',
    status: 'PAID',
    items: [
      { id: 'it_01', description: 'Dispensary Main Meter Monthly Tariff', quantity: 1, unitPrice: 1100.00, amount: 1100.00 },
      { id: 'it_02', description: 'Backup Cold Room Sub-Meter Billing', quantity: 1, unitPrice: 350.00, amount: 350.00 }
    ]
  },
  {
    id: 'exp_002',
    category: 'Logistics',
    amount: 450.00,
    expenseDate: '2026-09-19',
    payee: 'SpeedyCare Cold-Chain Courier Services',
    paymentMethod: 'MOMO',
    referenceNumber: 'EXP-LOG-202609-02',
    notes: 'Emergency refrigerated courier transport of insulin and biologic vaccines.',
    approvedBy: 'Pharm. Amaka Okafor',
    status: 'PAID',
    items: [
      { id: 'it_03', description: 'Dry Ice Container Rental & Packing', quantity: 2, unitPrice: 75.00, amount: 150.00 },
      { id: 'it_04', description: 'Same-day Temperature Controlled Dispatch', quantity: 1, unitPrice: 300.00, amount: 300.00 }
    ]
  },
  {
    id: 'exp_003',
    category: 'Petty Cash',
    amount: 320.00,
    expenseDate: '2026-09-20',
    payee: 'Office Point Stationery & Supplies',
    paymentMethod: 'CASH',
    referenceNumber: 'EXP-PET-202609-03',
    notes: 'Counter POS thermal rolls and dispensing labels restocking.',
    approvedBy: 'Emmanuel Balogun',
    status: 'PAID',
    items: [
      { id: 'it_05', description: '80mm Thermal Receipt Paper Rolls (Pack of 10)', quantity: 2, unitPrice: 85.00, amount: 170.00 },
      { id: 'it_06', description: 'Prescription Warning Dispensing Label Stickers', quantity: 3, unitPrice: 50.00, amount: 150.00 }
    ]
  }
];
