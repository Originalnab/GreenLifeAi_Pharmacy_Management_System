import { UnitType, CurrencyConfig } from '../../types';

export const initialUnitTypes: UnitType[] = [
  // Container & Bulk Units
  { id: 'unit_pack', name: 'Pack', category: 'CONTAINER', description: 'Standard primary commercial pack', isDefault: true },
  { id: 'unit_box', name: 'Box', category: 'CONTAINER', description: 'Secondary multi-strip or multi-bottle box', isDefault: true },
  { id: 'unit_carton', name: 'Carton', category: 'CONTAINER', description: 'Wholesale shipping outer carton', isDefault: true },
  { id: 'unit_bottle', name: 'Bottle', category: 'CONTAINER', description: 'Glass or plastic liquid or tablet container', isDefault: true },
  { id: 'unit_tin', name: 'Tin / Tub', category: 'CONTAINER', description: 'Metal or plastic powder or ointment container', isDefault: true },

  // Sub-Packaging Units
  { id: 'unit_strip', name: 'Strip', category: 'SUB_CONTAINER', description: 'Foil or plastic blister strip of tablets', isDefault: true },
  { id: 'unit_blister', name: 'Blister', category: 'SUB_CONTAINER', description: 'Push-through individual blister card', isDefault: true },
  { id: 'unit_sachet', name: 'Sachet', category: 'SUB_CONTAINER', description: 'Single-dose powder or suspension envelope', isDefault: true },
  { id: 'unit_card', name: 'Card', category: 'SUB_CONTAINER', description: 'Ampoule or vial holding card', isDefault: true },

  // Atomic Base Dispensing Units
  { id: 'unit_piece', name: 'Piece', category: 'DISPENSING_BASE', description: 'Single count atomic unit', isDefault: true },
  { id: 'unit_tablet', name: 'Tablet', category: 'DISPENSING_BASE', description: 'Individual oral solid tablet', isDefault: true },
  { id: 'unit_capsule', name: 'Capsule', category: 'DISPENSING_BASE', description: 'Individual oral hard or soft gel capsule', isDefault: true },
  { id: 'unit_ampoule', name: 'Ampoule', category: 'DISPENSING_BASE', description: 'Single sealed glass injection unit', isDefault: true },
  { id: 'unit_vial', name: 'Vial', category: 'DISPENSING_BASE', description: 'Rubber-stoppered injectable container', isDefault: true },
  { id: 'unit_actuation', name: 'Actuation', category: 'DISPENSING_BASE', description: 'Metered dose inhaler spray puff', isDefault: true },
  { id: 'unit_ml', name: 'mL', category: 'DISPENSING_BASE', description: 'Liquid volume measurement (milliliters)', isDefault: true },
  { id: 'unit_tube', name: 'Tube', category: 'DISPENSING_BASE', description: 'Topical cream, ointment or gel tube', isDefault: true },
  { id: 'unit_suppository', name: 'Suppository', category: 'DISPENSING_BASE', description: 'Rectal or vaginal solid form unit', isDefault: true },
  { id: 'unit_disp_bottle', name: 'Bottle', category: 'DISPENSING_BASE', description: 'Single complete bottle unit (syrups, drops)', isDefault: true }
];

export const availableCurrencies: CurrencyConfig[] = [
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' }
];

export const supportedCurrencies = availableCurrencies;

