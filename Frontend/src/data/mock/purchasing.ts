import { PurchaseOrder } from '../../types';

export const initialPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po_001',
    poNumber: 'PO-2026-0982',
    supplierId: 'sup_001',
    supplierName: 'Emzor Pharmaceuticals Industries Ltd',
    createdAt: '2026-09-18',
    expectedDate: '2026-09-24',
    items: [
      { productId: 'prod_amox_500', productName: 'Amoxil Forte 500mg', orderedQty: 200, receivedQty: 140, unitCost: 1800.00, totalCost: 360000.00 },
      { productId: 'prod_cipro_500', productName: 'Ciprobay 500mg', orderedQty: 100, receivedQty: 0, unitCost: 2600.00, totalCost: 260000.00 }
    ],
    totalAmount: 620000.00,
    status: 'PARTIALLY_RECEIVED',
    approvedBy: 'Koffi Mensah (Manager)',
    notes: 'Urgent stock replenishment for Q3 antibiotic fast-movers.'
  },
  {
    id: 'po_002',
    poNumber: 'PO-2026-0985',
    supplierId: 'sup_002',
    supplierName: 'Fidson Healthcare Plc',
    createdAt: '2026-09-19',
    expectedDate: '2026-09-26',
    items: [
      { productId: 'prod_coartem_80', productName: 'Coartem 80/480', orderedQty: 150, receivedQty: 0, unitCost: 2200.00, totalCost: 330000.00 },
      { productId: 'prod_insulin_glarg', productName: 'Lantus SoloStar Pen', orderedQty: 30, receivedQty: 0, unitCost: 14500.00, totalCost: 435000.00 }
    ],
    totalAmount: 765000.00,
    status: 'APPROVED',
    approvedBy: 'Pharm. Amaka Okafor',
    notes: 'Maintain cold chain logistics on delivery.'
  }
];
