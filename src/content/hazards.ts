import type { HazardDefinition } from './types';

// Add future terrain and wildlife hazards here, using a supported hazard kind.
export const hazards: HazardDefinition[] = [
  { id: 'mud1', label: 'Mud', kind: 'mud', x: 600, y: 300, w: 100, h: 65 },
  { id: 'wet1', label: 'Wet Floor', kind: 'wet', x: 860, y: 500, w: 85, h: 50 },
  { id: 'bugs1', label: 'Mosquitoes', kind: 'mosquitoes', x: 1020, y: 220, w: 105, h: 80 },
  { id: 'bugs2', label: 'Mosquitoes', kind: 'mosquitoes', x: 735, y: 580, w: 80, h: 65 },
];
