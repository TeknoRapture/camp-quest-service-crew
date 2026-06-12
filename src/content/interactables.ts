import type { InteractableDefinition } from './types';

// Add future signs, inspection objects, and non-item interaction zones here.
export const interactables: InteractableDefinition[] = [
  {
    id: 'cliffSign', kind: 'inspection', label: 'Beware of Cliff!', title: 'Beware of Cliff!', assetId: 'cliffSignInspection',
    caption: 'Someone scratched a strange symbol beneath the warning. The wooded gorge beyond feels oddly quiet.',
    x: 220, y: 930, w: 74, h: 110,
  },
  { id: 'diningDelivery', kind: 'delivery-zone', label: 'Dining Hall delivery zone', x: 875, y: 570, w: 300, h: 215 },
  {
    id: 'blockedBridgeMessage', kind: 'message', label: 'Blocked Back 40 bridge', x: 1645, y: 1120, w: 180, h: 185,
    message: 'Back 40 is closed for now. Crazy Joe says Outdoor Challenge is not ready yet.',
  },
];
