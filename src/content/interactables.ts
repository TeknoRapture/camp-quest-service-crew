import type { InteractableDefinition } from './types';

// Add future signs, inspection objects, and non-item interaction zones here.
export const interactables: InteractableDefinition[] = [
  {
    id: 'cliffSign',
    kind: 'inspection',
    label: 'Beware of Cliff!',
    title: 'Beware of Cliff!',
    assetId: 'cliffSignInspection',
    caption: 'Someone scratched a strange symbol beneath the warning. Beyond it, misplaced crates block the bridge to the Back 40.',
    x: 1175,
    y: 300,
    w: 74,
    h: 110,
  },
  { id: 'diningDelivery', kind: 'delivery-zone', label: 'Dining Hall delivery zone', x: 350, y: 430, w: 250, h: 180 },
];
