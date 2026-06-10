import type { ItemDefinition } from './types';

// Add future tools, supplies, and other collectible map items here.
export const items: ItemDefinition[] = [
  {
    id: 'bathroomMop',
    label: 'Blue Mop / Bathroom Mop',
    description: 'Blue-headed mops can only be used in bathrooms.',
    useRestriction: 'bathroom-only',
    assetId: 'blueMop',
    x: 616, y: 552, w: 30, h: 42,
  },
  {
    id: 'floorMop',
    label: 'Green Mop / Floor Mop',
    description: 'Green-headed mops can only be used on normal floors.',
    useRestriction: 'normal-floor-only',
    assetId: 'greenMop',
    x: 680, y: 590, w: 30, h: 42,
  },
  { id: 'broom', label: 'Broom', assetId: 'broom', x: 886, y: 770, w: 30, h: 44 },
  { id: 'gloves', label: 'Gloves', assetId: 'gloves', x: 326, y: 344, w: 34, h: 30 },
  { id: 'bags', label: 'Trash Bags', assetId: 'trashBags', x: 1104, y: 530, w: 38, h: 36 },
  { id: 'crate', label: 'Supply Crate', assetId: 'supplyCrate', x: 106, y: 402, w: 38, h: 36 },
];
