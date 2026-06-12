import type { LocationDefinition } from './types';

// Axis-aligned landmarks follow the reference-note relationships while retaining expanded woods and trail buffers.
export const showerHouseLocation: LocationDefinition = {
  id: 'shower', label: 'SHOWER HOUSE', x: 2580, y: 1580, w: 190, h: 150, color: '#a96e3e',
  doorway: { side: 'bottom', offset: 76, width: 38, depth: 44 },
};

export const locations: LocationDefinition[] = [
  { id: 'office', label: 'WELCOME CENTER', x: 1260, y: 880, w: 270, h: 145, color: '#ae6837' },
  { id: 'dining', label: 'DINING HALL', x: 2000, y: 1250, w: 300, h: 165, color: '#a96532' },
  { id: 'kitchen', label: 'KITCHEN', x: 2070, y: 1435, w: 175, h: 95, color: '#87532e' },
  { id: 'chapel', label: 'CHAPEL', x: 1820, y: 650, w: 270, h: 145, color: '#9d6538' },
  { id: 'gym', label: 'GYM', x: 2760, y: 500, w: 260, h: 150, color: '#986137' },
  { id: 'nurse', label: 'NURSE STATION', x: 2470, y: 1000, w: 190, h: 115, color: '#b57b52' },
  { id: 'store', label: 'PHILIPPIANS', x: 1420, y: 1630, w: 220, h: 125, color: '#a56636' },
  { id: 'treeHouse', label: 'TREE HOUSE', x: 1120, y: 220, w: 190, h: 145, color: '#77512d', doorway: { side: 'bottom', offset: 76, width: 38, depth: 42 } },
  { id: 'cabinWalnut', label: 'WALNUT', x: 620, y: 430, w: 140, h: 92, color: '#9d693b' },
  { id: 'cabinCrusader', label: 'CRUSADER', x: 250, y: 980, w: 145, h: 95, color: '#9d693b' },
  { id: 'cabinHawthorne', label: 'HAWTHORNE', x: 1360, y: 1420, w: 145, h: 95, color: '#9d693b' },
  { id: 'cabinStoddard', label: 'STODDARD', x: 680, y: 1650, w: 145, h: 95, color: '#9d693b' },
  { id: 'cabinBeech', label: 'BEECH', x: 1640, y: 1570, w: 140, h: 92, color: '#9d693b' },
  { id: 'cabinMildon', label: 'MILDON', x: 2180, y: 1650, w: 140, h: 92, color: '#9d693b' },
  showerHouseLocation,
  { id: 'shed', label: 'SUPPLY SHED', x: 2700, y: 1950, w: 165, h: 115, color: '#7d5532' },
  { id: 'dumpster', label: 'DUMPSTER', x: 3020, y: 1980, w: 120, h: 76, color: '#315c4c' },
  { id: 'cabinCherry', label: 'CHERRY', x: 2920, y: 1740, w: 140, h: 92, color: '#9d693b' },
  { id: 'cabinWillow', label: 'WILLOW', x: 3420, y: 1490, w: 140, h: 92, color: '#9d693b' },
  { id: 'cabinJuniper', label: 'JUNIPER', x: 1280, y: 2220, w: 140, h: 92, color: '#9d693b' },
  { id: 'cabinHickory', label: 'HICKORY', x: 920, y: 1940, w: 140, h: 92, color: '#9d693b' },
  { id: 'cabinPatrick', label: 'PATRICK', x: 1980, y: 2520, w: 140, h: 92, color: '#9d693b' },
  { id: 'cabinMaple', label: 'MAPLE', x: 2550, y: 2260, w: 140, h: 92, color: '#9d693b' },
  // Visible in the small unlocked end-of-demo teaser, without adding Back 40 gameplay or interiors.
  { id: 'cabinPine', label: 'PINE', x: 3770, y: 2920, w: 140, h: 92, color: '#775d3b' },
  { id: 'aFrame', label: 'A-FRAME', x: 4020, y: 2970, w: 155, h: 100, color: '#775d3b' },
  { id: 'pavilion', label: 'FOOTPRINTS PAVILION', x: 4270, y: 2890, w: 210, h: 105, color: '#775d3b' },
  { id: 'donsPlace', label: "DON'S PLACE", x: 4550, y: 2780, w: 165, h: 105, color: '#775d3b' },
];

export const blockedBridge: LocationDefinition = { id: 'blockedBridge', label: 'BRIDGE CLOSED · DAY 1', x: 3300, y: 2640, w: 120, h: 115 };
