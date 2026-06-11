import type { ItemDefinition } from './types';

// Supplies are spread across recognizable camp routes without making the opening hunt tedious.
export const items: ItemDefinition[] = [
  { id: 'bathroomMop', label: 'Blue Mop / Bathroom Mop', description: 'Blue-headed mops can only be used in bathrooms.', useRestriction: 'bathroom-only', assetId: 'blueMop', x: 1640, y: 930, w: 30, h: 42 },
  { id: 'floorMop', label: 'Green Mop / Floor Mop', description: 'Green-headed mops can only be used on normal floors.', useRestriction: 'normal-floor-only', assetId: 'greenMop', x: 1330, y: 890, w: 30, h: 42 },
  { id: 'broom', label: 'Broom', assetId: 'broom', x: 1410, y: 500, w: 30, h: 44 },
  { id: 'gloves', label: 'Gloves', assetId: 'gloves', x: 1030, y: 1280, w: 34, h: 30 },
  { id: 'bags', label: 'Trash Bags', assetId: 'trashBags', x: 1870, y: 1150, w: 38, h: 36 },
  { id: 'crate', label: 'Supply Crate', assetId: 'supplyCrate', x: 1660, y: 760, w: 38, h: 36 },
];
