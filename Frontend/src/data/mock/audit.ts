import { AuditEvent } from '../../types';

export const initialAuditLogs: AuditEvent[] = [
  {
    id: 'aud_001',
    timestamp: '2026-09-20 08:00:10',
    actorId: 'usr_003',
    actorName: 'Emmanuel Balogun',
    actorRole: 'Cashier',
    action: 'SHIFT_OPEN',
    module: 'finance',
    recordReference: 'SHF-20260920-A',
    newValue: 'Opening float ₦25,000.00 declared at terminal POS-TERMINAL-01',
    ipAddress: '192.168.1.104',
    outcome: 'SUCCESS'
  },
  {
    id: 'aud_002',
    timestamp: '2026-09-20 08:30:15',
    actorId: 'usr_004',
    actorName: 'Babatunde Fashola',
    actorRole: 'Stock Officer',
    action: 'GOODS_RECEIVE_COMMITTED',
    module: 'purchasing',
    recordReference: 'GRN-2026-0041',
    newValue: 'Committed 140 units Amoxil Forte Batch AMX-2026-014 into inventory',
    ipAddress: '192.168.1.112',
    outcome: 'SUCCESS'
  },
  {
    id: 'aud_003',
    timestamp: '2026-09-20 09:45:10',
    actorId: 'usr_002',
    actorName: 'Pharm. Amaka Okafor',
    actorRole: 'Pharmacist',
    action: 'PRESCRIPTION_VERIFIED',
    module: 'sales',
    recordReference: 'REC-20260920-002',
    details: 'Prescription for Glucophage 500mg verified. Prescriber: Dr. Kelechi Nnamdi (MDCN-44109)',
    ipAddress: '192.168.1.102',
    outcome: 'SUCCESS'
  },
  {
    id: 'aud_004',
    timestamp: '2026-09-20 10:04:18',
    actorId: 'usr_002',
    actorName: 'Pharm. Amaka Okafor',
    actorRole: 'Pharmacist',
    action: 'BATCH_QUARANTINED',
    module: 'inventory',
    recordReference: 'batch_vitc_exp',
    previousValue: 'Status: NEAR_EXPIRY',
    newValue: 'Status: EXPIRED, Quarantined 15 units',
    ipAddress: '192.168.1.102',
    outcome: 'WARNING',
    details: 'Batch passed expiry on 2026-08-31'
  }
];
