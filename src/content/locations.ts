import type { LocationDefinition } from './types';

// Main Camp buildings are grouped into roomy arrival, core, service-loop, and cabin regions.
export const locations: LocationDefinition[] = [
  { id: 'office', label: 'WELCOME CENTER', x: 500, y: 1210, w: 240, h: 130, color: '#ae6837' },
  { id: 'nurse', label: 'NURSE STATION', x: 820, y: 1260, w: 170, h: 105, color: '#b57b52' },
  { id: 'dining', label: 'DINING HALL', x: 750, y: 650, w: 250, h: 140, color: '#a96532' },
  { id: 'kitchen', label: 'KITCHEN', x: 800, y: 825, w: 160, h: 85, color: '#87532e' },
  { id: 'chapel', label: 'CHAPEL', x: 1050, y: 260, w: 240, h: 130, color: '#9d6538' },
  { id: 'gym', label: 'GYM', x: 1260, y: 730, w: 220, h: 135, color: '#986137' },
  { id: 'store', label: 'PHILIPPIANS', x: 1040, y: 1080, w: 200, h: 110, color: '#a56636' },
  { id: 'shed', label: 'SUPPLY SHED', x: 1480, y: 700, w: 150, h: 105, color: '#7d5532' },
  {
    id: 'shower', label: 'SHOWER HOUSE', x: 1700, y: 900, w: 165, h: 135, color: '#a96e3e',
    doorway: { side: 'bottom', offset: 58, width: 49, depth: 40 },
  },
  { id: 'dumpster', label: 'DUMPSTER', x: 1930, y: 1120, w: 110, h: 70, color: '#315c4c' },
  { id: 'cabinPatrick', label: 'PATRICK', x: 1550, y: 1380, w: 125, h: 85, color: '#9d693b' },
  { id: 'cabinMildon', label: 'MILDON', x: 1850, y: 1390, w: 125, h: 85, color: '#9d693b' },
];

export const blockedBridge: LocationDefinition = { id: 'blockedBridge', label: 'BRIDGE CLOSED · DAY 1', x: 2260, y: 500, w: 90, h: 110 };
