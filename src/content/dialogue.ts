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
    id: 'rangerEoj.woods',
    npcId: 'crazyjoe',
    label: 'Ask about the woods',
    priority: 500,
    response: 'The woods are a good teacher if you pay attention, respect the boundaries, and do not wander where campers should not go. Also: if a trail looks mysterious before breakfast, that is usually mud wearing a disguise.',
    nextTopicIds: ['rangerEoj.woods.watchOut', 'rangerEoj.woods.back40', 'rangerEoj.woods.neverMind'],
  },
  {
    id: 'rangerEoj.woods.watchOut',
    npcId: 'crazyjoe',
    label: 'What should I watch out for?',
    priority: 490,
    response: 'Mud with ambition, critters with opinions, and any vulture acting like it has clipboard authority. Stay alert, stay kind, and stay on marked paths.',
  },
  {
    id: 'rangerEoj.woods.back40',
    npcId: 'crazyjoe',
    label: 'What is Back 40?',
    priority: 480,
    response: 'Back 40 is Outdoor Challenge territory: bigger trails, bigger teamwork, and absolutely not a place to wander into without permission. Day 1 Service Crew can wave at it from this side of the bridge.',
  },
  {
    id: 'rangerEoj.woods.neverMind',
    npcId: 'crazyjoe',
    label: 'Never mind.',
    priority: 470,
    response: 'Fair enough. The woods will still be there after the checklist stops looking like a raccoon edited it.',
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
