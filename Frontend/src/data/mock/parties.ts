import { Supplier, Customer } from '../../types';

export const initialSuppliers: Supplier[] = [
  {
    id: 'sup_001',
    name: 'Emzor Pharmaceuticals Industries Ltd',
    code: 'EMZOR',
    contactPerson: 'Mrs. Folake Disu',
    email: 'orders@emzorpharma.com',
    phone: '+234 1 493 8210',
    address: 'Plot 3C, Block A, Industrial Estate, Ikeja, Lagos',
    paymentTermsDays: 30,
    outstandingBalance: 1250000.00,
    status: 'ACTIVE'
  },
  {
    id: 'sup_002',
    name: 'Fidson Healthcare Plc',
    code: 'FIDSON',
    contactPerson: 'Mr. Chidi Eze',
    email: 'distribution@fidson.com',
    phone: '+234 1 740 6817',
    address: 'Fidson Towers, 268 Ikorodu Road, Obanikoro, Lagos',
    paymentTermsDays: 45,
    outstandingBalance: 820000.00,
    status: 'ACTIVE'
  },
  {
    id: 'sup_003',
    name: 'Swiss Pharma Nigeria Ltd',
    code: 'SWIPHA',
    contactPerson: 'Ibrahim Danjuma',
    email: 'orders@swiphanigeria.com',
    phone: '+234 1 492 0543',
    address: '5 Dopemu Road, Agege Industrial Layout, Lagos',
    paymentTermsDays: 30,
    outstandingBalance: 450000.00,
    status: 'ACTIVE'
  },
  {
    id: 'sup_004',
    name: 'May & Baker Nigeria Plc',
    code: 'M&B',
    contactPerson: 'Grace Alabi',
    email: 'supply@may-baker.com',
    phone: '+234 1 212 1290',
    address: '1 May & Baker Avenue, Ikeja, Lagos',
    paymentTermsDays: 30,
    outstandingBalance: 0.00,
    status: 'ACTIVE'
  }
];

export const initialCustomers: Customer[] = [
  {
    id: 'cust_001',
    name: 'Chief Olatunji Williams',
    phone: '+234 803 219 4481',
    email: 'o.williams@lagosconsortium.ng',
    address: '14 Queen’s Drive, Ikoyi, Lagos',
    dateOfBirth: '1958-04-12',
    allergies: ['Penicillin (mild rash)'],
    chronicConditions: ['Type 2 Diabetes', 'Hypertension'],
    creditLimit: 150000.00,
    currentBalance: 42500.00,
    receivablesAgeing: {
      current: 42500.00,
      days30: 0,
      days60: 0,
      days90Plus: 0,
    },
    totalPurchases: 485000.00
  },
  {
    id: 'cust_002',
    name: 'Dr. Fatima Bello-Osagie',
    phone: '+234 802 884 1029',
    email: 'fatima.bello@stnicholas.org',
    address: 'Ahmadu Bello Way, Victoria Island, Lagos',
    dateOfBirth: '1974-09-22',
    allergies: ['Sulfa drugs'],
    chronicConditions: ['Asthma'],
    creditLimit: 200000.00,
    currentBalance: 88000.00,
    receivablesAgeing: {
      current: 55000.00,
      days30: 33000.00,
      days60: 0,
      days90Plus: 0,
    },
    totalPurchases: 720000.00
  },
  {
    id: 'cust_003',
    name: 'Walk-in Retail Customer',
    phone: 'N/A',
    creditLimit: 0,
    currentBalance: 0,
    receivablesAgeing: { current: 0, days30: 0, days60: 0, days90Plus: 0 },
    totalPurchases: 1845000.00
  }
];
