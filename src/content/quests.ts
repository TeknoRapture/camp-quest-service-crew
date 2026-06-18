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


export const inspectCliffSignQuest: QuestDefinition = {
  id: 'inspectCliffSign',
  title: 'Inspect Cliff Sign',
  summary: 'A completed hidden quest for reading the strange warning by Cliff Trail.',
  category: 'hidden',
  questlineId: 'cliffTeaser',
  sequence: 1,
  requiredForProgression: false,
  hiddenUntilDiscovered: true,
  discoveryTrigger: { type: 'event', event: { type: 'interactableInspected', interactableId: 'cliffSign', mapId: 'mainCamp' } },
  discoveryMessage: 'Hidden quest completed: Inspect Cliff Sign!',
  objectives: [
    {
      id: 'inspectCliffSign',
      label: 'Inspect the Beware of Cliff sign.',
      type: 'inspectInteractable',
      interactableId: 'cliffSign',
      mapId: 'mainCamp',
      target: { type: 'interactable', id: 'cliffSign', mapId: 'mainCamp', label: 'Beware of Cliff sign' },
    },
  ],
  rewards: [
    { type: 'setFlag', flag: 'cliffSignInspected', value: true },
    { type: 'addScore', amount: 10 },
    { type: 'showToast', text: 'Secret found: the Cliff sign has been logged on the checklist.' },
  ],
};


export const quests: QuestDefinition[] = [morningSupplyScrambleQuest, inspectCliffSignQuest];
