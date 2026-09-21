import { Expense } from '../../types';

export const initialExpenses: Expense[] = [
  {
    id: 'exp_001',
    category: 'Utilities',
    amount: 145000.00,
    expenseDate: '2026-09-18',
    payee: 'Eko Electricity Distribution Company (EKEDC)',
    paymentMethod: 'TRANSFER',
    referenceNumber: 'EXP-UTIL-202609-01',
    notes: 'Commercial power bill for Victoria Island dispensary & cold storage units.',
    approvedBy: 'Koffi Mensah (Manager)'
  },
  {
    id: 'exp_002',
    category: 'Logistics',
    amount: 32000.00,
    expenseDate: '2026-09-19',
    payee: 'SpeedyCare Cold-Chain Courier Services',
    paymentMethod: 'CASH',
    referenceNumber: 'EXP-LOG-202609-02',
    notes: 'Emergency refrigerated transport of insulin batch from distributor warehouse.',
    approvedBy: 'Pharm. Amaka Okafor'
  },
  {
    id: 'exp_003',
    category: 'Licenses',
    amount: 250000.00,
    expenseDate: '2026-09-15',
    payee: 'Pharmacists Council of Nigeria (PCN)',
    paymentMethod: 'TRANSFER',
    referenceNumber: 'EXP-LIC-202609-03',
    notes: 'Annual pharmacy premises operating license renewal fee 2026/2027.',
    approvedBy: 'Dr. Adeyemi Adeleke'
  }
];
