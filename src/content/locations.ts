import type { LocationDefinition } from './types';

// Axis-aligned landmarks use the expanded Main Camp to leave woods and trail buffers between activity areas.
export const showerHouseLocation: LocationDefinition = {
  id: 'shower', label: 'SHOWER HOUSE', x: 3020, y: 1840, w: 190, h: 150, color: '#a96e3e',
  doorway: { side: 'bottom', offset: 76, width: 38, depth: 44 },
};

export const locations: LocationDefinition[] = [
  { id: 'office', label: 'WELCOME CENTER', x: 820, y: 1090, w: 270, h: 145, color: '#ae6837' },
  { id: 'dining', label: 'DINING HALL', x: 2050, y: 1370, w: 300, h: 165, color: '#a96532' },
  { id: 'kitchen', label: 'KITCHEN', x: 2120, y: 1555, w: 175, h: 95, color: '#87532e' },
  { id: 'chapel', label: 'CHAPEL', x: 2040, y: 790, w: 270, h: 145, color: '#9d6538' },
  { id: 'gym', label: 'GYM', x: 2820, y: 680, w: 260, h: 150, color: '#986137' },
  { id: 'nurse', label: 'NURSE STATION', x: 2870, y: 1160, w: 190, h: 115, color: '#b57b52' },
  { id: 'store', label: 'PHILIPPIANS', x: 1460, y: 1850, w: 220, h: 125, color: '#a56636' },
  { id: 'treeHouse', label: 'TREE HOUSE', x: 1120, y: 235, w: 190, h: 145, color: '#77512d', doorway: { side: 'bottom', offset: 76, width: 38, depth: 42 } },
  { id: 'cabinHawthorne', label: 'HAWTHORNE', x: 850, y: 1830, w: 145, h: 95, color: '#9d693b' },
  { id: 'cabinBeech', label: 'BEECH', x: 1120, y: 2180, w: 140, h: 92, color: '#9d693b' },
  { id: 'cabinMildon', label: 'MILDON', x: 1970, y: 2200, w: 140, h: 92, color: '#9d693b' },
  showerHouseLocation,
  { id: 'shed', label: 'SUPPLY SHED', x: 2780, y: 2200, w: 165, h: 115, color: '#7d5532' },
  { id: 'dumpster', label: 'DUMPSTER', x: 3340, y: 2230, w: 120, h: 76, color: '#315c4c' },
  { id: 'cabinCherry', label: 'CHERRY', x: 2470, y: 2350, w: 140, h: 92, color: '#9d693b' },
  { id: 'cabinWillow', label: 'WILLOW', x: 3420, y: 1740, w: 140, h: 92, color: '#9d693b' },
  { id: 'cabinJuniper', label: 'JUNIPER', x: 900, y: 2640, w: 140, h: 92, color: '#9d693b' },
  { id: 'cabinHickory', label: 'HICKORY', x: 470, y: 2320, w: 140, h: 92, color: '#9d693b' },
  { id: 'cabinPatrick', label: 'PATRICK', x: 1600, y: 2750, w: 140, h: 92, color: '#9d693b' },
  { id: 'cabinMaple', label: 'MAPLE', x: 2310, y: 2760, w: 140, h: 92, color: '#9d693b' },
  // Visible in the small unlocked end-of-demo teaser, without adding Back 40 gameplay or interiors.
  { id: 'cabinPine', label: 'PINE', x: 3770, y: 2920, w: 140, h: 92, color: '#775d3b' },
  { id: 'aFrame', label: 'A-FRAME', x: 4020, y: 2970, w: 155, h: 100, color: '#775d3b' },
  { id: 'pavilion', label: 'FOOTPRINTS PAVILION', x: 4270, y: 2890, w: 210, h: 105, color: '#775d3b' },
  { id: 'donsPlace', label: "DON'S PLACE", x: 4550, y: 2780, w: 165, h: 105, color: '#775d3b' },
];

export const blockedBridge: LocationDefinition = { id: 'blockedBridge', label: 'BRIDGE CLOSED · DAY 1', x: 4020, y: 2640, w: 120, h: 115 };
