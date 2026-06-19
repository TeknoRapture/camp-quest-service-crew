import type { SkillDefinition, SkillId } from './types';

/** Static skill definitions. Unlocking and progression will be added by future content. */
export const skills: Record<SkillId, SkillDefinition> = {
  nature: {
    id: 'nature',
    label: 'Nature Skills',
    missingSkillMessage: 'Ranger Eoj should probably teach you Nature Skills before you try that.',
  },
  swimming: {
    id: 'swimming',
    label: 'Swimming',
    missingSkillMessage: 'You need to pass the swimming test before going in the lake!',
  },
  climbing: {
    id: 'climbing',
    label: 'Climbing',
    missingSkillMessage: 'You need climbing training before exploring the gorge!',
  },
};
