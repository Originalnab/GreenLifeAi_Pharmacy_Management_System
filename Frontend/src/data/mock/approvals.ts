import { ApprovalRequest } from '../../types';

export const initialApprovals: ApprovalRequest[] = [
  {
    id: 'appr_001',
    module: 'inventory',
    title: 'Disposal of Expired Redoxon Immuno Pro (15 Units)',
    requestedBy: 'Pharm. Amaka Okafor',
    requestedAt: '2026-09-20 10:15:00',
    amount: 27000.00,
    details: 'Batch RDX-2024-009 passed manufacturer expiry on 2026-08-31. Quarantine holding completed. Awaiting PCN witness disposal sign-off.',
    status: 'PENDING',
    referenceId: 'batch_vitc_exp'
  },
  {
    id: 'appr_002',
    module: 'purchasing',
    title: 'Purchase Order #PO-2026-0985 (Fidson Healthcare)',
    requestedBy: 'Babatunde Fashola',
    requestedAt: '2026-09-19 16:45:00',
    amount: 765000.00,
    details: 'Restock order including Lantus SoloStar Pen insulin and Coartem 80/480.',
    status: 'APPROVED',
    referenceId: 'po_002'
  },
  {
    id: 'appr_003',
    module: 'sales',
    title: 'Special 10% Institutional Discount on Chronic Maintenance Pack',
    requestedBy: 'Emmanuel Balogun',
    requestedAt: '2026-09-20 11:20:00',
    amount: 14200.00,
    details: 'Customer Chief Olatunji Williams purchasing 3-month supply of Glucophage and Amlodipine.',
    status: 'PENDING',
    referenceId: 'sale_draft_091'
  }
];
