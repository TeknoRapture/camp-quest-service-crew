import type { TaskDefinition } from './types';

// Add future Service Checklist objectives here in the order players should see them.
export const tasks: TaskDefinition[] = [
  { id: 'talked', label: 'Get the checklist from Coop', targetType: 'npc', targetId: 'coop', targetMapId: 'mainCamp' },
  { id: 'bathroomMop', label: 'Find the blue bathroom mop', targetType: 'item', targetId: 'bathroomMop', targetMapId: 'mainCamp', targetLabel: 'Blue mop' },
  { id: 'floorMop', label: 'Find the green floor mop', targetType: 'item', targetId: 'floorMop', targetMapId: 'mainCamp', targetLabel: 'Green mop' },
  { id: 'broom', label: 'Find the promoted-to-missing broom', targetType: 'item', targetId: 'broom', targetMapId: 'mainCamp' },
  { id: 'gloves', label: 'Find the cleaning gloves', targetType: 'item', targetId: 'gloves', targetMapId: 'mainCamp' },
  { id: 'bags', label: 'Find the trash bags', targetType: 'item', targetId: 'bags', targetMapId: 'mainCamp' },
  { id: 'delivered', label: 'Deliver a supply crate to Dining Hall', targetType: 'interactable', targetId: 'diningDelivery', targetMapId: 'mainCamp', targetLabel: 'Dining Hall' },
  { id: 'bridge', label: 'Investigate the blocked Back 40 bridge', targetType: 'interactable', targetId: 'blockedBridgeMessage', targetMapId: 'mainCamp', targetLabel: 'Blocked bridge' },
];
