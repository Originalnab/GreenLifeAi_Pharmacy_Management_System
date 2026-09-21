import { DosagePreset } from '../../types';

export const initialDosagePresets: Record<string, DosagePreset> = {
  Tablet: {
    baseUnit: 'Tablet',
    recommendedUnits: ['Tablet', 'Strip', 'Piece'],
    hasStrip: true,
    stripMultiplier: 10,
    hasPack: true,
    packMultiplier: 100,
    packDescription: '10x10 Blister Pack',
    clinicalNote: 'Dispensed per individual tablet. Standard packaging has 10 tablets/strip and 100 tablets/pack.'
  },
  Capsule: {
    baseUnit: 'Capsule',
    recommendedUnits: ['Capsule', 'Strip', 'Piece'],
    hasStrip: true,
    stripMultiplier: 10,
    hasPack: true,
    packMultiplier: 100,
    packDescription: '10x10 Blister Pack',
    clinicalNote: 'Dispensed per individual capsule. Standard packaging has 10 capsules/strip and 100 capsules/pack.'
  },
  Syrup: {
    baseUnit: 'mL',
    recommendedUnits: ['mL', 'Bottle'],
    hasStrip: false,
    stripMultiplier: 1,
    hasPack: true,
    packMultiplier: 100,
    packDescription: '100 mL Amber Bottle',
    clinicalNote: 'Oral liquid solution. Dispensed by volume (mL) or complete Bottle. Strip packaging tier auto-disabled.'
  },
  Suspension: {
    baseUnit: 'mL',
    recommendedUnits: ['mL', 'Bottle'],
    hasStrip: false,
    stripMultiplier: 1,
    hasPack: true,
    packMultiplier: 100,
    packDescription: '100 mL Reconstituted Bottle',
    clinicalNote: 'Oral liquid suspension. Dispensed by volume (mL) or complete Bottle. Strip packaging tier auto-disabled.'
  },
  Injection: {
    baseUnit: 'Ampoule',
    recommendedUnits: ['Ampoule', 'Vial', 'Piece'],
    hasStrip: false,
    stripMultiplier: 1,
    hasPack: true,
    packMultiplier: 10,
    packDescription: 'Box of 10 Ampoules/Vials',
    clinicalNote: 'Sterile injectable. Dispensed per Ampoule or Vial. Standard clinical box contains 10 units. Strip tier auto-disabled.'
  },
  Inhaler: {
    baseUnit: 'Actuation',
    recommendedUnits: ['Actuation', 'Bottle', 'Piece'],
    hasStrip: false,
    stripMultiplier: 1,
    hasPack: true,
    packMultiplier: 200,
    packDescription: 'Pressurized Canister (200 Actuations)',
    clinicalNote: 'Metered dose aerosol inhaler. Dispensed per Actuation (metered puff) or canister (200 actuations).'
  },
  Cream: {
    baseUnit: 'Tube',
    recommendedUnits: ['Tube', 'Piece', 'Tin / Tub'],
    hasStrip: false,
    stripMultiplier: 1,
    hasPack: true,
    packMultiplier: 1,
    packDescription: 'Individual 15g/30g Tube',
    clinicalNote: 'Topical semi-solid cream. Dispensed per individual Tube. Strip packaging tier auto-disabled.'
  },
  Ointment: {
    baseUnit: 'Tube',
    recommendedUnits: ['Tube', 'Piece', 'Tin / Tub'],
    hasStrip: false,
    stripMultiplier: 1,
    hasPack: true,
    packMultiplier: 1,
    packDescription: 'Individual 15g/30g Tube',
    clinicalNote: 'Topical semi-solid ointment. Dispensed per individual Tube. Strip packaging tier auto-disabled.'
  },
  'Eye Drops': {
    baseUnit: 'Bottle',
    recommendedUnits: ['Bottle', 'mL', 'Piece'],
    hasStrip: false,
    stripMultiplier: 1,
    hasPack: true,
    packMultiplier: 1,
    packDescription: '10 mL Sterile Dropper Bottle',
    clinicalNote: 'Ophthalmic drops. Dispensed per individual Dropper Bottle.'
  },
  'Ear Drops': {
    baseUnit: 'Bottle',
    recommendedUnits: ['Bottle', 'mL', 'Piece'],
    hasStrip: false,
    stripMultiplier: 1,
    hasPack: true,
    packMultiplier: 1,
    packDescription: '15 mL Otic Dropper Bottle',
    clinicalNote: 'Otic drops. Dispensed per individual Dropper Bottle.'
  },
  Suppository: {
    baseUnit: 'Suppository',
    recommendedUnits: ['Suppository', 'Strip', 'Piece'],
    hasStrip: true,
    stripMultiplier: 5,
    hasPack: true,
    packMultiplier: 10,
    packDescription: 'Box of 2 Strips x 5 Suppositories',
    clinicalNote: 'Rectal/vaginal solid form. Dispensed per individual Suppository or foil strip of 5.'
  },
  Sachet: {
    baseUnit: 'Sachet',
    recommendedUnits: ['Sachet', 'Piece', 'Pack'],
    hasStrip: false,
    stripMultiplier: 1,
    hasPack: true,
    packMultiplier: 20,
    packDescription: 'Box of 20 Sachets',
    clinicalNote: 'Powder formulation. Dispensed per single Sachet packet.'
  }
};
