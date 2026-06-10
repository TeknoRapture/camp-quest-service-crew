import type { Dialogue } from './types';

// Add future NPC conversations and story messages here, keyed by a stable dialogue ID.
export const dialogue: Dialogue = {
  opening: ['Morning bell! Find me by the Welcome Center. The supplies have apparently begun their annual migration.'],
  coop: [
    'Morning bell rang! Service Crew is ready. Unfortunately, the supplies are not.',
    'Find the missing mop, broom, gloves, and trash bags. Service Crew Rule #1: the thing you need is never where it belongs.',
  ],
  ethan: [
    'Program borrowed a supply crate for a skit. We returned... a different crate?',
    'Bring a crate from the Supply Shed to the Dining Hall when you find one.',
  ],
  gweggowy: [
    'Camp readiness report: cheerful, promising, and currently missing one mop.',
    'Finish the checklist and report to the Rally Circle!',
  ],
  crazyjoe: [
    'The Back 40 is not ready for Service Crew... yet. Nature Skills training starts another day!',
    'Until then, respect the wildlife and never challenge a vulture to a staring contest.',
  ],
  cliff: ['...', 'A shadow slips deeper into the Back 40.'],
};
