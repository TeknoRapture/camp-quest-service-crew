import type { ItemDefinition } from './types';

// Supplies remain on clear, recognizable routes in the expanded camp rather than deep in the woods.
export const items: ItemDefinition[] = [
  { id: 'bathroomMop', label: 'Blue Mop / Bathroom Mop', inventoryLabel: 'Blue Mop', carryType: 'large', carrySize: 1, description: 'Blue-headed mops can only be used in bathrooms.', useRestriction: 'bathroom-only', assetId: 'blueMop', x: 2520, y: 1640, w: 30, h: 42 },
  { id: 'floorMop', label: 'Green Mop / Floor Mop', inventoryLabel: 'Green Mop', carryType: 'large', carrySize: 1, description: 'Green-headed mops can only be used on normal floors.', useRestriction: 'normal-floor-only', assetId: 'greenMop', x: 2410, y: 1460, w: 30, h: 42 },
  { id: 'broom', label: 'Broom', carryType: 'large', carrySize: 1, assetId: 'broom', x: 3040, y: 680, w: 30, h: 44 },
  { id: 'gloves', label: 'Gloves', carryType: 'small', assetId: 'gloves', x: 1510, y: 1810, w: 34, h: 30 },
  { id: 'bags', label: 'Trash Bags', carryType: 'large', carrySize: 1, assetId: 'trashBags', x: 2970, y: 2010, w: 38, h: 36 },
  { id: 'crate', label: 'Supply Crate', inventoryLabel: 'Supply Crate', carryType: 'large', carrySize: 2, assetId: 'supplyCrate', x: 2640, y: 2000, w: 38, h: 36 },
];
