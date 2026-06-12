import type { LocationDefinition } from './types';

// Axis-aligned landmarks follow the Stony Glen center-camp relationships while leaving roomy paths.
export const showerHouseLocation: LocationDefinition = {
  id: 'shower', label: 'SHOWER HOUSE', x: 1320, y: 790, w: 165, h: 135, color: '#a96e3e',
  doorway: { side: 'bottom', offset: 65, width: 35, depth: 40 },
};

export const locations: LocationDefinition[] = [
  { id: 'office', label: 'WELCOME CENTER', x: 520, y: 330, w: 240, h: 130, color: '#ae6837' },
  { id: 'dining', label: 'DINING HALL', x: 900, y: 600, w: 250, h: 140, color: '#a96532' },
  { id: 'kitchen', label: 'KITCHEN', x: 940, y: 755, w: 160, h: 85, color: '#87532e' },
  { id: 'chapel', label: 'CHAPEL', x: 820, y: 245, w: 240, h: 130, color: '#9d6538' },
  { id: 'gym', label: 'GYM', x: 1320, y: 260, w: 220, h: 135, color: '#986137' },
  { id: 'nurse', label: 'NURSE STATION', x: 1240, y: 480, w: 170, h: 105, color: '#b57b52' },
  { id: 'store', label: 'PHILIPPIANS', x: 650, y: 850, w: 200, h: 110, color: '#a56636' },
  { id: 'cabinHawthorne', label: 'HAWTHORNE', x: 470, y: 680, w: 135, h: 85, color: '#9d693b' },
  { id: 'cabinBeech', label: 'BEECH', x: 740, y: 760, w: 125, h: 85, color: '#9d693b' },
  { id: 'cabinMildon', label: 'MILDON', x: 1080, y: 880, w: 125, h: 85, color: '#9d693b' },
  showerHouseLocation,
  { id: 'shed', label: 'SUPPLY SHED', x: 1220, y: 1010, w: 150, h: 105, color: '#7d5532' },
  { id: 'dumpster', label: 'DUMPSTER', x: 1530, y: 1030, w: 110, h: 70, color: '#315c4c' },
  { id: 'cabinCherry', label: 'CHERRY', x: 1510, y: 820, w: 125, h: 85, color: '#9d693b' },
  { id: 'cabinWillow', label: 'WILLOW', x: 1740, y: 690, w: 125, h: 85, color: '#9d693b' },
  { id: 'cabinJuniper', label: 'JUNIPER', x: 570, y: 1080, w: 125, h: 85, color: '#9d693b' },
  { id: 'cabinHickory', label: 'HICKORY', x: 360, y: 940, w: 125, h: 85, color: '#9d693b' },
  { id: 'cabinPatrick', label: 'PATRICK', x: 980, y: 1260, w: 125, h: 85, color: '#9d693b' },
  { id: 'cabinMaple', label: 'MAPLE', x: 1260, y: 1160, w: 125, h: 85, color: '#9d693b' },
  // Visible across the closed Day 1 bridge, but isolated behind the Back 40 boundary.
  { id: 'cabinPine', label: 'PINE', x: 1530, y: 1390, w: 125, h: 85, color: '#775d3b' },
  { id: 'aFrame', label: 'A-FRAME', x: 1760, y: 1390, w: 145, h: 90, color: '#775d3b' },
  { id: 'pavilion', label: 'PAVILION', x: 2000, y: 1340, w: 170, h: 95, color: '#775d3b' },
  { id: 'donsPlace', label: "DON'S PLACE", x: 2190, y: 1240, w: 150, h: 95, color: '#775d3b' },
];

export const blockedBridge: LocationDefinition = { id: 'blockedBridge', label: 'BRIDGE CLOSED · DAY 1', x: 1680, y: 1165, w: 110, h: 95 };
