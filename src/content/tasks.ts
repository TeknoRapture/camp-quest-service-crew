import type { QuestDefinition } from './types';

export const morningSupplyScrambleQuest: QuestDefinition = {
  id: 'morningSupplyScramble',
  title: 'Morning Supply Scramble',
  objectives: [
    { id: 'talked', questId: 'morningSupplyScramble', label: 'Get the checklist from Coop', type: 'talkToNpc', targetType: 'npc', targetId: 'coop', targetMapId: 'mainCamp' },
    { id: 'bathroomMop', questId: 'morningSupplyScramble', label: 'Find the blue bathroom mop', type: 'findItem', targetType: 'item', targetId: 'bathroomMop', targetMapId: 'mainCamp', targetLabel: 'Blue mop', prerequisiteObjectiveIds: ['talked'] },
    { id: 'floorMop', questId: 'morningSupplyScramble', label: 'Find the green floor mop', type: 'findItem', targetType: 'item', targetId: 'floorMop', targetMapId: 'mainCamp', targetLabel: 'Green mop', prerequisiteObjectiveIds: ['talked'] },
    { id: 'broom', questId: 'morningSupplyScramble', label: 'Find the promoted-to-missing broom', type: 'findItem', targetType: 'item', targetId: 'broom', targetMapId: 'mainCamp', prerequisiteObjectiveIds: ['talked'] },
    { id: 'gloves', questId: 'morningSupplyScramble', label: 'Find the cleaning gloves', type: 'findItem', targetType: 'item', targetId: 'gloves', targetMapId: 'mainCamp', prerequisiteObjectiveIds: ['talked'] },
    { id: 'bags', questId: 'morningSupplyScramble', label: 'Find the trash bags', type: 'findItem', targetType: 'item', targetId: 'bags', targetMapId: 'mainCamp', prerequisiteObjectiveIds: ['talked'] },
    { id: 'crate', questId: 'morningSupplyScramble', label: 'Find the supply crate', type: 'findItem', targetType: 'item', targetId: 'crate', targetMapId: 'mainCamp', targetLabel: 'Supply Crate', prerequisiteObjectiveIds: ['talked'] },
    { id: 'delivered', questId: 'morningSupplyScramble', label: 'Deliver the supply crate to Dining Hall', type: 'deliverItem', targetType: 'interactable', targetId: 'diningDelivery', targetMapId: 'mainCamp', targetLabel: 'Dining Hall', requiredItemId: 'crate', prerequisiteObjectiveIds: ['bathroomMop', 'floorMop', 'broom', 'gloves', 'bags', 'crate'] },
    { id: 'bridge', questId: 'morningSupplyScramble', label: 'Investigate the blocked Back 40 bridge', type: 'completeInteraction', targetType: 'interactable', targetId: 'back40TeaserMessage', targetMapId: 'mainCamp', targetLabel: 'Back 40 bridge', prerequisiteObjectiveIds: ['delivered'] },
  ],
};

export const quests: QuestDefinition[] = [morningSupplyScrambleQuest];
