import type { TaskDefinition } from './types';

// Add future Service Checklist objectives here in the order players should see them.
export const tasks: TaskDefinition[] = [
  { id: 'talked', label: 'Get the checklist from Coop' },
  { id: 'mop', label: 'Find the missing mop' },
  { id: 'broom', label: 'Find the promoted-to-missing broom' },
  { id: 'gloves', label: 'Find the cleaning gloves' },
  { id: 'bags', label: 'Find the trash bags' },
  { id: 'delivered', label: 'Deliver a supply crate to Dining Hall' },
  { id: 'bridge', label: 'Investigate the blocked Back 40 bridge' },
];
