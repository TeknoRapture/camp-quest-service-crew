import type { LocationDefinition, Rect } from './types';

// Add future named buildings and map locations here; add collision-only map boundaries separately below.
export const locations: LocationDefinition[] = [
  { id: 'office', label: 'WELCOME CENTER', x: 100, y: 610, w: 210, h: 125, color: '#ae6837' },
  { id: 'dining', label: 'DINING HALL', x: 360, y: 465, w: 225, h: 125, color: '#a96532' },
  { id: 'shed', label: 'SUPPLY SHED', x: 165, y: 280, w: 150, h: 105, color: '#7d5532' },
  { id: 'shower', label: 'SHOWER HOUSE', x: 765, y: 335, w: 165, h: 130, color: '#a96e3e' },
  { id: 'chapel', label: 'RALLY CIRCLE', x: 370, y: 160, w: 190, h: 105, color: '#9d6538' },
  { id: 'gym', label: 'GYM', x: 670, y: 675, w: 180, h: 120, color: '#986137' },
  { id: 'store', label: 'PHILIPPIANS', x: 565, y: 850, w: 190, h: 105, color: '#a56636' },
  { id: 'dumpster', label: 'DUMPSTER', x: 1005, y: 615, w: 110, h: 70, color: '#315c4c' },
];

export const blockedBridge: LocationDefinition = { id: 'blockedBridge', label: 'BRIDGE CLOSED · DAY 1', x: 1240, y: 370, w: 70, h: 100 };

export const mapBoundaries: Rect[] = [
  { x: 1260, y: 0, w: 35, h: 1000 },
  { x: 1250, y: 390, w: 250, h: 28 },
];

export const worldSize = { w: 1500, h: 1000 } as const;
