import type { ItemDefinition } from './types';

// Supplies are spread across recognizable camp routes without making the opening hunt tedious.
export const items: ItemDefinition[] = [
  { id: 'bathroomMop', label: 'Blue Mop / Bathroom Mop', description: 'Blue-headed mops can only be used in bathrooms.', useRestriction: 'bathroom-only', assetId: 'blueMop', x: 1270, y: 845, w: 30, h: 42 },
  { id: 'floorMop', label: 'Green Mop / Floor Mop', description: 'Green-headed mops can only be used on normal floors.', useRestriction: 'normal-floor-only', assetId: 'greenMop', x: 1210, y: 650, w: 30, h: 42 },
  { id: 'broom', label: 'Broom', assetId: 'broom', x: 1435, y: 420, w: 30, h: 44 },
  { id: 'gloves', label: 'Gloves', assetId: 'gloves', x: 720, y: 1040, w: 34, h: 30 },
  { id: 'bags', label: 'Trash Bags', assetId: 'trashBags', x: 1480, y: 1070, w: 38, h: 36 },
  { id: 'crate', label: 'Supply Crate', assetId: 'supplyCrate', x: 1170, y: 1045, w: 38, h: 36 },
];
