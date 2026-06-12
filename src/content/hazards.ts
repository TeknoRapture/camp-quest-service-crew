import type { HazardDefinition } from './types';

const natureInteraction = {
  interactionSkill: 'nature',
  missingSkillMessage: 'Crazy Joe should probably teach you Nature Skills before you try that.',
} as const;

const nuisanceWildlifeDamage = {
  ...natureInteraction,
  mitigationSkill: 'nature',
  mitigationMultiplier: .5,
} as const;

// Hazards reinforce each region while leaving the connected roads comfortable to navigate.
export const hazards: HazardDefinition[] = [
  { id: 'mud1', label: 'Mud', kind: 'mud', assetId: 'mud', x: 1120, y: 1000, w: 100, h: 65 },
  { id: 'wet1', label: 'Wet Floor', kind: 'wet', assetId: 'wetFloor', x: 1490, y: 930, w: 85, h: 50 },
  { id: 'bugs1', label: 'Mosquitoes', kind: 'mosquitoes', assetId: 'mosquitoes', x: 1830, y: 980, w: 105, h: 80, energyDamage: 4, damageInterval: .5, damageMessage: 'Mosquito cloud!', ...nuisanceWildlifeDamage },
  { id: 'bugs2', label: 'Mosquitoes', kind: 'mosquitoes', assetId: 'mosquitoes', x: 190, y: 820, w: 80, h: 65, energyDamage: 4, damageInterval: .5, damageMessage: 'Mosquito cloud!', ...nuisanceWildlifeDamage },
  { id: 'snake1', label: 'Snake', kind: 'snake', assetId: 'snake', x: 1720, y: 900, w: 70, h: 42, ...natureInteraction },
  { id: 'mouse1', label: 'Mouse', kind: 'mouse', assetId: 'mouse', x: 870, y: 760, w: 44, h: 34, ...natureInteraction },
  { id: 'raccoon1', label: 'Raccoon', kind: 'raccoon', assetId: 'raccoon', x: 1650, y: 1040, w: 54, h: 48, ...natureInteraction },
];
