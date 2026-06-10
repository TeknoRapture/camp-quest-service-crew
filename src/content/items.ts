import type { ItemDefinition } from './types';

// Add future tools, supplies, and other collectible map items here.
export const items: ItemDefinition[] = [
  { id: 'mop', label: 'Mop', assetId: 'mop', sprite: { width: 30, height: 42, offsetY: -6 }, x: 620, y: 570, w: 22, h: 26 },
  { id: 'broom', label: 'Broom', assetId: 'broom', sprite: { width: 28, height: 40, offsetY: -7 }, x: 890, y: 790, w: 22, h: 26 },
  { id: 'gloves', label: 'Gloves', assetId: 'gloves', sprite: { width: 34, height: 28, offsetY: -4 }, x: 330, y: 350, w: 24, h: 20 },
  { id: 'bags', label: 'Trash Bags', assetId: 'trashBags', sprite: { width: 34, height: 31, offsetY: -3 }, x: 1110, y: 540, w: 25, h: 23 },
  { id: 'crate', label: 'Supply Crate', assetId: 'supplyCrate', sprite: { width: 38, height: 34, offsetY: -3 }, x: 110, y: 410, w: 30, h: 28 },
];
