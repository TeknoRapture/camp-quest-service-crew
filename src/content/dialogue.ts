import type { Dialogue, DialogueTopic } from './types';

// Legacy story/default lines kept while NPCs migrate to topic-based dialogue.
export const dialogue: Dialogue = {
  opening: ['Morning bell! Find me by the Welcome Center. The supplies have apparently begun their annual migration.'],
  coop: [
    'Morning bell rang! Service Crew is ready. Unfortunately, the supplies are not.',
    'Find the missing blue bathroom mop, green floor mop, broom, gloves, and trash bags. Blue only cleans bathrooms; green only cleans normal floors. Service Crew Rule #1: the thing you need is never where it belongs.',
  ],
  ethan: [
    'Program borrowed a supply crate for a skit. We returned... a different crate?',
    'Bring a crate from the Supply Shed to the Dining Hall when you find one.',
  ],
  gweggowy: [
    'Camp readiness report: cheerful, promising, and currently missing two correctly color-coded mops.',
    'Finish the checklist and report to the Rally Circle!',
  ],
  crazyjoe: [
    'The Back 40 is not ready for Service Crew... yet. Nature Skills training starts another day!',
    'Until then, respect the wildlife and never challenge a vulture to a staring contest.',
  ],
  cliff: ['...', 'A shadow slips deeper into the Back 40.'],
};

export const dialogueTopics: DialogueTopic[] = [
  {
    id: 'coop.serviceList',
    npcId: 'coop',
    label: 'Ask for the Service Crew list',
    priority: 900,
    conditions: [
      { type: 'objectiveUnlocked', questId: 'morningSupplyScramble', objectiveId: 'talked' },
      { type: 'objectiveCompleted', questId: 'morningSupplyScramble', objectiveId: 'talked', invert: true },
    ],
    response: dialogue.coop[1],
    effects: [{ type: 'runNpcQuestInteraction', npcId: 'coop' }],
  },
  {
    id: 'coop.cliffSign',
    npcId: 'coop',
    label: 'Ask about the Cliff sign',
    priority: 650,
    conditions: [{ type: 'questFlag', flag: 'cliffSignInspected', value: true }],
    response: 'That sign? It has been warning campers longer than the lost-and-found bin has been collecting single socks. If you saw the symbol, stay cheerful... and stay on the Main Camp side of the bridge for now.',
    effects: [{ type: 'setDialogueFlag', flag: 'coopDiscussedCliffSign', value: true }],
  },
  {
    id: 'coop.default',
    npcId: 'coop',
    label: 'Chat with Coop',
    priority: 0,
    isDefault: true,
    response: dialogue.coop[0],
    effects: [{ type: 'runNpcQuestInteraction', npcId: 'coop' }],
  },
];
