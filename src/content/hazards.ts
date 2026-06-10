import type { HazardDefinition } from './types';

// Add future terrain and wildlife hazards here, using a supported hazard kind.
export const hazards: HazardDefinition[] = [
  { id: 'mud1', label: 'Mud', kind: 'mud', assetId: 'mud', x: 600, y: 300, w: 100, h: 65 },
  { id: 'wet1', label: 'Wet Floor', kind: 'wet', assetId: 'wetFloor', x: 860, y: 500, w: 85, h: 50 },
  { id: 'bugs1', label: 'Mosquitoes', kind: 'mosquitoes', assetId: 'mosquitoes', x: 1020, y: 220, w: 105, h: 80 },
  { id: 'bugs2', label: 'Mosquitoes', kind: 'mosquitoes', assetId: 'mosquitoes', x: 735, y: 580, w: 80, h: 65 },
  { id: 'creek1', label: 'Creek', kind: 'water', assetId: 'water', x: 1320, y: 70, w: 130, h: 75 },
  { id: 'snake1', label: 'Snake', kind: 'snake', assetId: 'snake', x: 1150, y: 735, w: 70, h: 42 },
  { id: 'mouse1', label: 'Mouse', kind: 'mouse', assetId: 'mouse', x: 320, y: 245, w: 44, h: 34 },
  { id: 'raccoon1', label: 'Raccoon', kind: 'raccoon', assetId: 'raccoon', x: 1125, y: 650, w: 54, h: 48 },
];
