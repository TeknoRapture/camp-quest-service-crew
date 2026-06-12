import type { HazardDefinition } from './types';

const natureInteraction = { interactionSkill: 'nature', missingSkillMessage: 'Crazy Joe should probably teach you Nature Skills before you try that.' } as const;
const nuisanceWildlifeDamage = { ...natureInteraction, mitigationSkill: 'nature', mitigationMultiplier: .5 } as const;

// Hazards sit near, not on, the expanded camp's readable objective routes.
export const hazards: HazardDefinition[] = [
  { id: 'mud1', label: 'Mud', kind: 'mud', assetId: 'mud', x: 2540, y: 1930, w: 100, h: 65 },
  { id: 'wet1', label: 'Wet Floor', kind: 'wet', assetId: 'wetFloor', x: 2780, y: 1770, w: 85, h: 50 },
  { id: 'bugs1', label: 'Mosquitoes', kind: 'mosquitoes', assetId: 'mosquitoes', x: 3740, y: 1700, w: 105, h: 80, energyDamage: 4, damageInterval: .5, damageMessage: 'Mosquito cloud!', ...nuisanceWildlifeDamage },
  { id: 'bugs2', label: 'Mosquitoes', kind: 'mosquitoes', assetId: 'mosquitoes', x: 520, y: 560, w: 80, h: 65, energyDamage: 4, damageInterval: .5, damageMessage: 'Mosquito cloud!', ...nuisanceWildlifeDamage },
  { id: 'snake1', label: 'Snake', kind: 'snake', assetId: 'snake', x: 3500, y: 2150, w: 70, h: 42, ...natureInteraction },
  { id: 'mouse1', label: 'Mouse', kind: 'mouse', assetId: 'mouse', x: 1800, y: 1680, w: 44, h: 34, ...natureInteraction },
  { id: 'raccoon1', label: 'Raccoon', kind: 'raccoon', assetId: 'raccoon', x: 3170, y: 2080, w: 54, h: 48, ...natureInteraction },
];
