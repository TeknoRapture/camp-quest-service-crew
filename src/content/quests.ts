import type { QuestDefinition } from './types';

export const morningSupplyScrambleQuest: QuestDefinition = {
  id: 'morningSupplyScramble',
  title: 'Morning Supply Scramble',
  category: 'main',
  questlineId: 'morningServiceCrew',
  sequence: 1,
  startsActive: true,
  objectives: [
    { id: 'talked', label: 'Get the checklist from Coop', type: 'talkToNpc', npcId: 'coop', mapId: 'mainCamp', target: { type: 'npc', id: 'coop', mapId: 'mainCamp' }, rewards: [{ type: 'addScore', amount: 25 }] },
    { id: 'bathroomMop', label: 'Find the blue bathroom mop', type: 'findItem', itemId: 'bathroomMop', mapId: 'mainCamp', target: { type: 'item', id: 'bathroomMop', mapId: 'mainCamp', label: 'Blue mop' }, prerequisiteObjectiveIds: ['talked'], rewards: [{ type: 'addScore', amount: 50 }] },
    { id: 'floorMop', label: 'Find the green floor mop', type: 'findItem', itemId: 'floorMop', mapId: 'mainCamp', target: { type: 'item', id: 'floorMop', mapId: 'mainCamp', label: 'Green mop' }, prerequisiteObjectiveIds: ['talked'], rewards: [{ type: 'addScore', amount: 50 }] },
    { id: 'broom', label: 'Find the promoted-to-missing broom', type: 'findItem', itemId: 'broom', mapId: 'mainCamp', target: { type: 'item', id: 'broom', mapId: 'mainCamp' }, prerequisiteObjectiveIds: ['talked'], rewards: [{ type: 'addScore', amount: 50 }] },
    { id: 'gloves', label: 'Find the cleaning gloves', type: 'findItem', itemId: 'gloves', mapId: 'mainCamp', target: { type: 'item', id: 'gloves', mapId: 'mainCamp' }, prerequisiteObjectiveIds: ['talked'], rewards: [{ type: 'addScore', amount: 50 }] },
    { id: 'bags', label: 'Find the trash bags', type: 'findItem', itemId: 'bags', mapId: 'mainCamp', target: { type: 'item', id: 'bags', mapId: 'mainCamp' }, prerequisiteObjectiveIds: ['talked'], rewards: [{ type: 'addScore', amount: 50 }] },
    { id: 'crate', label: 'Find the supply crate', type: 'findItem', itemId: 'crate', mapId: 'mainCamp', target: { type: 'item', id: 'crate', mapId: 'mainCamp', label: 'Supply Crate' }, prerequisiteObjectiveIds: ['talked'], rewards: [{ type: 'addScore', amount: 50 }] },
    { id: 'delivered', label: 'Deliver the supply crate to Dining Hall', type: 'deliverItem', itemId: 'crate', interactableId: 'diningDelivery', mapId: 'mainCamp', target: { type: 'interactable', id: 'diningDelivery', mapId: 'mainCamp', label: 'Dining Hall' }, prerequisiteObjectiveIds: ['bathroomMop', 'floorMop', 'broom', 'gloves', 'bags', 'crate'], rewards: [{ type: 'addScore', amount: 100 }] },
    { id: 'bridge', label: 'Investigate the blocked Back 40 bridge', type: 'completeInteraction', interactableId: 'back40TeaserMessage', mapId: 'mainCamp', target: { type: 'interactable', id: 'back40TeaserMessage', mapId: 'mainCamp', label: 'Back 40 bridge' }, prerequisiteObjectiveIds: ['delivered'], rewards: [{ type: 'addScore', amount: 50 }, { type: 'setFlag', flag: 'bridgeTeaserInspected', value: true }] },
  ],
};

export const quests: QuestDefinition[] = [morningSupplyScrambleQuest];
