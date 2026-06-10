import type { CreatureDefinition, HazardDefinition } from './types';

// Add future terrain and wildlife hazards here, using a supported hazard kind.
export const hazards: HazardDefinition[] = [
  { id: 'mud1', label: 'Mud', kind: 'mud', assetId: 'mud', x: 600, y: 300, w: 100, h: 65 },
  { id: 'wet1', label: 'Wet Floor', kind: 'wet', assetId: 'wetFloor', x: 860, y: 500, w: 85, h: 50 },
  { id: 'bugs1', label: 'Mosquitoes', kind: 'mosquitoes', assetId: 'mosquitoes', x: 1020, y: 220, w: 105, h: 80 },
  { id: 'bugs2', label: 'Mosquitoes', kind: 'mosquitoes', assetId: 'mosquitoes', x: 735, y: 580, w: 80, h: 65 },
];

// Decorative creature placements use SVG art now and can gain behavior in a future gameplay pass.
export const creatures: CreatureDefinition[] = [
  { id: 'snake1', label: 'Snake', kind: 'snake', assetId: 'snake', x: 1075, y: 365, w: 58, h: 36 },
  { id: 'mouse1', label: 'Mouse', kind: 'mouse', assetId: 'mouse', x: 325, y: 455, w: 38, h: 30 },
  { id: 'raccoon1', label: 'Raccoon', kind: 'raccoon', assetId: 'raccoon', x: 1125, y: 675, w: 48, h: 42 },
];
