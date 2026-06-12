import type { InteractableDefinition } from './types';

export const interactables: InteractableDefinition[] = [
  {
    id: 'cliffSign', kind: 'inspection', label: 'Beware of Cliff!', title: 'Beware of Cliff!', assetId: 'cliffSignInspection',
    caption: 'Someone scratched a strange symbol beneath the warning. The wooded gorge beyond feels oddly quiet.',
    x: 650, y: 365, w: 74, h: 110,
  },
  { id: 'flagpole', kind: 'message', label: 'Camp flagpole', x: 2660, y: 875, w: 42, h: 120, message: 'The flag snaps over Rally Field. Morning colors mean Service Crew is officially on the clock!' },
  { id: 'diningDelivery', kind: 'delivery-zone', label: 'Dining Hall delivery zone', x: 2010, y: 1330, w: 380, h: 255 },
  {
    id: 'blockedBridgeMessage', kind: 'message', label: 'Blocked Back 40 bridge', x: 3980, y: 2590, w: 200, h: 230,
    message: 'Back 40 is closed for now. Crazy Joe says Outdoor Challenge is not ready yet.',
  },
  {
    id: 'back40TeaserMessage', kind: 'message', label: 'Back 40 under-construction teaser', x: 4005, y: 2815, w: 150, h: 60,
    message: 'Under Construction: Back 40 coming soon!',
  },
];
