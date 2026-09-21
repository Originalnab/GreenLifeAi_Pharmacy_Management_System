import { BusinessLoan } from '../../types';

export const initialLoans: BusinessLoan[] = [
  {
    id: 'loan_001',
    lenderName: 'Access Bank Plc (Commercial Pharmacy SME Facility)',
    facilityReference: 'ABL-SME-2026-9042',
    principalAmount: 15000000.00, // 15 Million NGN
    annualInterestRate: 14.5,
    termMonths: 12,
    startDate: '2026-01-15',
    maturityDate: '2027-01-15',
    monthlyInstallment: 1350625.00,
    totalRepayable: 16207500.00,
    totalPaid: 10805000.00,
    outstandingBalance: 5402500.00,
    status: 'ACTIVE',
    schedule: [
      { installmentNumber: 1, dueDate: '2026-02-15', principalDue: 1169375.00, interestDue: 181250.00, totalDue: 1350625.00, paidAmount: 1350625.00, paidDate: '2026-02-14', status: 'PAID' },
      { installmentNumber: 2, dueDate: '2026-03-15', principalDue: 1183503.73, interestDue: 167121.27, totalDue: 1350625.00, paidAmount: 1350625.00, paidDate: '2026-03-15', status: 'PAID' },
      { installmentNumber: 3, dueDate: '2026-04-15', principalDue: 1197804.56, interestDue: 152820.44, totalDue: 1350625.00, paidAmount: 1350625.00, paidDate: '2026-04-12', status: 'PAID' },
      { installmentNumber: 4, dueDate: '2026-05-15', principalDue: 1212277.97, interestDue: 138347.03, totalDue: 1350625.00, paidAmount: 1350625.00, paidDate: '2026-05-14', status: 'PAID' },
      { installmentNumber: 5, dueDate: '2026-06-15', principalDue: 1226926.33, interestDue: 123698.67, totalDue: 1350625.00, paidAmount: 1350625.00, paidDate: '2026-06-15', status: 'PAID' },
      { installmentNumber: 6, dueDate: '2026-07-15', principalDue: 1241751.78, interestDue: 108873.22, totalDue: 1350625.00, paidAmount: 1350625.00, paidDate: '2026-07-14', status: 'PAID' },
      { installmentNumber: 7, dueDate: '2026-08-15', principalDue: 1256756.61, interestDue: 93868.39, totalDue: 1350625.00, paidAmount: 1350625.00, paidDate: '2026-08-15', status: 'PAID' },
      { installmentNumber: 8, dueDate: '2026-09-15', principalDue: 1271943.15, interestDue: 78681.85, totalDue: 1350625.00, paidAmount: 1350625.00, paidDate: '2026-09-14', status: 'PAID' },
      { installmentNumber: 9, dueDate: '2026-10-15', principalDue: 1287313.79, interestDue: 63311.21, totalDue: 1350625.00, paidAmount: 0.00, status: 'PENDING' },
      { installmentNumber: 10, dueDate: '2026-11-15', principalDue: 1302870.82, interestDue: 47754.18, totalDue: 1350625.00, paidAmount: 0.00, status: 'PENDING' },
      { installmentNumber: 11, dueDate: '2026-12-15', principalDue: 1318616.59, interestDue: 32008.41, totalDue: 1350625.00, paidAmount: 0.00, status: 'PENDING' },
      { installmentNumber: 12, dueDate: '2027-01-15', principalDue: 1334553.67, interestDue: 16071.33, totalDue: 1350625.00, paidAmount: 0.00, status: 'PENDING' },
    ]
  }
];
