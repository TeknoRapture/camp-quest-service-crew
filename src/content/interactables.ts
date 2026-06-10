import type { InteractableDefinition } from './types';

// Add future signs, inspection objects, and non-item interaction zones here.
export const interactables: InteractableDefinition[] = [
  {
    id: 'cliffSign', kind: 'inspection', label: 'Beware of Cliff!', title: 'Beware of Cliff!', assetId: 'cliffSignInspection',
    caption: 'Someone scratched a strange symbol beneath the warning. The wooded gorge beyond feels oddly quiet.',
    x: 150, y: 250, w: 74, h: 110,
  },
  { id: 'diningDelivery', kind: 'delivery-zone', label: 'Dining Hall delivery zone', x: 450, y: 390, w: 270, h: 190 },
  {
    id: 'blockedBridgeMessage', kind: 'message', label: 'Blocked Back 40 bridge', x: 1285, y: 405, w: 145, h: 150,
    message: 'Back 40 is closed for now. Crazy Joe says Outdoor Challenge is not ready yet.',
  },
];
