import type { HazardDefinition } from './types';

// Add future terrain and wildlife hazards here, using a supported hazard kind.
export const hazards: HazardDefinition[] = [
  { id: 'mud1', label: 'Mud', kind: 'mud', assetId: 'mud', x: 540, y: 315, w: 100, h: 65 },
  { id: 'wet1', label: 'Wet Floor', kind: 'wet', assetId: 'wetFloor', x: 805, y: 610, w: 85, h: 50 },
  { id: 'bugs1', label: 'Mosquitoes', kind: 'mosquitoes', assetId: 'mosquitoes', x: 1120, y: 310, w: 105, h: 80 },
  { id: 'bugs2', label: 'Mosquitoes', kind: 'mosquitoes', assetId: 'mosquitoes', x: 210, y: 430, w: 80, h: 65 },
  { id: 'snake1', label: 'Snake', kind: 'snake', assetId: 'snake', x: 1160, y: 660, w: 70, h: 42 },
  { id: 'mouse1', label: 'Mouse', kind: 'mouse', assetId: 'mouse', x: 455, y: 270, w: 44, h: 34 },
  { id: 'raccoon1', label: 'Raccoon', kind: 'raccoon', assetId: 'raccoon', x: 1110, y: 530, w: 54, h: 48 },
];
