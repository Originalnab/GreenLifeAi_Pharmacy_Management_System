import { CashierShift } from '../../types';

export const initialShifts: CashierShift[] = [
  {
    id: 'shift_20260920_01',
    shiftNumber: 'SHF-20260920-A',
    cashierId: 'usr_003',
    cashierName: 'Emmanuel Balogun',
    terminalId: 'POS-TERMINAL-01',
    startTime: '2026-09-20 08:00:00',
    openingFloat: 25000.00,
    cashSales: 3000.00,
    cardSales: 10000.00,
    transferSales: 0.00,
    creditSales: 2631.25,
    refundsTotal: 0.00,
    midShiftCashDrops: 0.00,
    expectedCash: 27580.00, // 25,000 float + 3000 cash - 420 change = 27,580
    status: 'OPEN'
  },
  {
    id: 'shift_20260919_02',
    shiftNumber: 'SHF-20260919-B',
    cashierId: 'usr_003',
    cashierName: 'Emmanuel Balogun',
    terminalId: 'POS-TERMINAL-01',
    startTime: '2026-09-19 14:00:00',
    endTime: '2026-09-19 21:30:00',
    openingFloat: 20000.00,
    cashSales: 145000.00,
    cardSales: 289000.00,
    transferSales: 64000.00,
    creditSales: 15000.00,
    refundsTotal: 3200.00,
    midShiftCashDrops: 100000.00,
    expectedCash: 61800.00,
    countedCash: 61800.00,
    variance: 0.00,
    status: 'RECONCILED',
    reconciledBy: 'Zainab Mohammed (Accountant)'
  }
];
