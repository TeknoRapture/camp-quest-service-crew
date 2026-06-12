import type { HazardDefinition } from './types';

const natureInteraction = { interactionSkill: 'nature', missingSkillMessage: 'Crazy Joe should probably teach you Nature Skills before you try that.' } as const;
const nuisanceWildlifeDamage = { ...natureInteraction, mitigationSkill: 'nature', mitigationMultiplier: .5 } as const;

// Hazards sit near, not on, the expanded camp's readable objective routes.
export const hazards: HazardDefinition[] = [
  { id: 'mud1', label: 'Mud', kind: 'mud', assetId: 'mud', x: 2620, y: 2180, w: 100, h: 65 },
  { id: 'wet1', label: 'Wet Floor', kind: 'wet', assetId: 'wetFloor', x: 3220, y: 2030, w: 85, h: 50 },
  { id: 'bugs1', label: 'Mosquitoes', kind: 'mosquitoes', assetId: 'mosquitoes', x: 3740, y: 1840, w: 105, h: 80, energyDamage: 4, damageInterval: .5, damageMessage: 'Mosquito cloud!', ...nuisanceWildlifeDamage },
  { id: 'bugs2', label: 'Mosquitoes', kind: 'mosquitoes', assetId: 'mosquitoes', x: 520, y: 560, w: 80, h: 65, energyDamage: 4, damageInterval: .5, damageMessage: 'Mosquito cloud!', ...nuisanceWildlifeDamage },
  { id: 'snake1', label: 'Snake', kind: 'snake', assetId: 'snake', x: 3650, y: 2260, w: 70, h: 42, ...natureInteraction },
  { id: 'mouse1', label: 'Mouse', kind: 'mouse', assetId: 'mouse', x: 1800, y: 1780, w: 44, h: 34, ...natureInteraction },
  { id: 'raccoon1', label: 'Raccoon', kind: 'raccoon', assetId: 'raccoon', x: 3490, y: 2330, w: 54, h: 48, ...natureInteraction },
];
