import { BankAccount, BankingRecord } from '../../types';

export const initialBankAccounts: BankAccount[] = [
  {
    id: 'bank_gcb_01',
    bankName: 'GCB Bank PLC',
    accountName: 'GreenLife Pharmacy Ltd - Operational Account',
    accountNumber: '1011130004921',
    branchName: 'High Street Main Branch, Accra',
    currency: 'GHS',
    accountType: 'CURRENT',
    isDefault: true,
    currentBalance: 84500.00
  },
  {
    id: 'bank_eco_01',
    bankName: 'Ecobank Ghana',
    accountName: 'GreenLife Pharmacy Ltd - Dispensary Revenue',
    accountNumber: '1441002938101',
    branchName: 'Airport City Branch, Accra',
    currency: 'GHS',
    accountType: 'CURRENT',
    isDefault: false,
    currentBalance: 52300.00
  },
  {
    id: 'bank_stanbic_01',
    bankName: 'Stanbic Bank Ghana',
    accountName: 'GreenLife Pharmacy Ltd - Working Capital & Payroll',
    accountNumber: '9040003829104',
    branchName: 'Osu Oxford Street Branch, Accra',
    currency: 'GHS',
    accountType: 'SAVINGS',
    isDefault: false,
    currentBalance: 28900.00
  },
  {
    id: 'bank_momo_01',
    bankName: 'MTN Mobile Money Merchant',
    accountName: 'GreenLife Dispensary Retail Pay',
    accountNumber: '0244192038 (Merchant ID: 894102)',
    branchName: 'Digital Merchant Wallet',
    currency: 'GHS',
    accountType: 'MERCHANT_MOMO',
    isDefault: false,
    currentBalance: 16450.00
  },
  {
    id: 'bank_vault_01',
    bankName: 'Dispensary Secure Vault',
    accountName: 'Central Safe & Petty Float Holding',
    accountNumber: 'SAFE-DISP-01',
    branchName: 'On-site Armored Safe',
    currency: 'GHS',
    accountType: 'VAULT_SAFE',
    isDefault: false,
    currentBalance: 12500.00
  }
];

export const initialBankingRecords: BankingRecord[] = [
  {
    id: 'bnk_rec_001',
    transactionNumber: 'BNK-2026-0041',
    type: 'DEPOSIT',
    bankAccountId: 'bank_gcb_01',
    bankAccountName: 'GCB Bank PLC (1011130004921)',
    amount: 14500.00,
    source: 'CASH_DRAWER',
    referenceSlip: 'GCB-DEP-884129',
    transactionDate: '2026-09-20 14:30:00',
    depositedBy: 'Emmanuel Balogun',
    notes: 'Weekend retail shift cash takings banked at High Street branch.',
    status: 'CLEARED',
    verifiedBy: 'Dr. Adeyemi Adeleke',
    createdAt: '2026-09-20 14:35:00'
  },
  {
    id: 'bnk_rec_002',
    transactionNumber: 'BNK-2026-0042',
    type: 'DEPOSIT',
    bankAccountId: 'bank_eco_01',
    bankAccountName: 'Ecobank Ghana (1441002938101)',
    amount: 9800.00,
    source: 'VAULT_SAFE',
    referenceSlip: 'ECO-DEP-992014',
    transactionDate: '2026-09-19 11:15:00',
    depositedBy: 'Pharm. Amaka Okafor',
    notes: 'Vault reserve surplus deposit ahead of supplier invoice settlement.',
    status: 'CLEARED',
    verifiedBy: 'Koffi Mensah (Manager)',
    createdAt: '2026-09-19 11:20:00'
  },
  {
    id: 'bnk_rec_003',
    transactionNumber: 'BNK-2026-0043',
    type: 'SAFE_DROP',
    bankAccountId: 'bank_vault_01',
    bankAccountName: 'Dispensary Secure Vault (SAFE-DISP-01)',
    amount: 6200.00,
    source: 'CASH_DRAWER',
    referenceSlip: 'VLT-DROP-2026-0920',
    transactionDate: '2026-09-20 19:45:00',
    depositedBy: 'Emmanuel Balogun',
    notes: 'Evening shift register cash sweep deposited into overnight time-delay vault.',
    status: 'CLEARED',
    verifiedBy: 'Dr. Adeyemi Adeleke',
    createdAt: '2026-09-20 19:50:00'
  },
  {
    id: 'bnk_rec_004',
    transactionNumber: 'BNK-2026-0044',
    type: 'WITHDRAWAL',
    bankAccountId: 'bank_gcb_01',
    bankAccountName: 'GCB Bank PLC (1011130004921)',
    amount: 5000.00,
    source: 'POS_FLOAT',
    referenceSlip: 'GCB-CHQ-004128',
    transactionDate: '2026-09-21 08:30:00',
    depositedBy: 'Kwame Mensah',
    notes: 'Counter float cash replenishment and petty expenses reserve withdrawal.',
    status: 'PENDING',
    verifiedBy: 'Koffi Mensah (Manager)',
    createdAt: '2026-09-21 08:35:00'
  }
];
