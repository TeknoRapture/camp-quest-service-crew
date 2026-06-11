import type { LocationDefinition } from './types';

// Main Camp buildings: west is the gorge, the camp core is central, and the lake / Back 40 bridge are east.
export const locations: LocationDefinition[] = [
  { id: 'office', label: 'WELCOME CENTER', x: 245, y: 690, w: 210, h: 120, color: '#ae6837' },
  { id: 'nurse', label: 'NURSE STATION', x: 260, y: 500, w: 160, h: 100, color: '#b57b52' },
  { id: 'shed', label: 'SUPPLY SHED', x: 300, y: 300, w: 145, h: 100, color: '#7d5532' },
  { id: 'dining', label: 'DINING HALL', x: 470, y: 420, w: 230, h: 130, color: '#a96532' },
  { id: 'kitchen', label: 'KITCHEN', x: 515, y: 565, w: 150, h: 80, color: '#87532e' },
  { id: 'chapel', label: 'CHAPEL', x: 650, y: 120, w: 205, h: 110, color: '#9d6538' },
  { id: 'gym', label: 'GYM', x: 700, y: 690, w: 205, h: 125, color: '#986137' },
  {
    id: 'shower', label: 'SHOWER HOUSE', x: 820, y: 450, w: 165, h: 135, color: '#a96e3e',
    doorway: { side: 'bottom', offset: 58, width: 49, depth: 40 },
  },
  { id: 'cabinPatrick', label: 'PATRICK', x: 970, y: 690, w: 125, h: 85, color: '#9d693b' },
  { id: 'cabinMildon', label: 'MILDON', x: 1120, y: 720, w: 125, h: 85, color: '#9d693b' },
  { id: 'store', label: 'PHILIPPIANS', x: 525, y: 820, w: 190, h: 105, color: '#a56636' },
  { id: 'dumpster', label: 'DUMPSTER', x: 1045, y: 560, w: 110, h: 70, color: '#315c4c' },
];

export const blockedBridge: LocationDefinition = { id: 'blockedBridge', label: 'BRIDGE CLOSED · DAY 1', x: 1320, y: 440, w: 70, h: 95 };
