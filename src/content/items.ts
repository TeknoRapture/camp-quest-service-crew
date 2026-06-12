import type { ItemDefinition } from './types';

// Supplies remain on clear, recognizable routes in the expanded camp rather than deep in the woods.
export const items: ItemDefinition[] = [
  { id: 'bathroomMop', label: 'Blue Mop / Bathroom Mop', description: 'Blue-headed mops can only be used in bathrooms.', useRestriction: 'bathroom-only', assetId: 'blueMop', x: 2960, y: 1900, w: 30, h: 42 },
  { id: 'floorMop', label: 'Green Mop / Floor Mop', description: 'Green-headed mops can only be used on normal floors.', useRestriction: 'normal-floor-only', assetId: 'greenMop', x: 2460, y: 1580, w: 30, h: 42 },
  { id: 'broom', label: 'Broom', assetId: 'broom', x: 3090, y: 860, w: 30, h: 44 },
  { id: 'gloves', label: 'Gloves', assetId: 'gloves', x: 1310, y: 2100, w: 34, h: 30 },
  { id: 'bags', label: 'Trash Bags', assetId: 'trashBags', x: 3290, y: 2260, w: 38, h: 36 },
  { id: 'crate', label: 'Supply Crate', assetId: 'supplyCrate', x: 2720, y: 2250, w: 38, h: 36 },
];
