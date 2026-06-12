import type { NPCDefinition } from './types';

// Add future camp staff and story characters here; put their spoken lines in dialogue.ts.
export const genericNpcPortrait = 'assets/portraits/generic-npc-portrait.png';

export const npcs: NPCDefinition[] = [
  { id: 'coop', label: 'Coop', displayName: 'Coop', accent: '#a43f28', portraits: { default: 'assets/portraits/coop-npc-portrait.png' }, dialogueId: 'coop', x: 1540, y: 1130, w: 28, h: 34 },
  { id: 'ethan', label: 'Ethan', displayName: 'Ethan', accent: '#386d95', portraits: { default: 'assets/portraits/ethan-npc-portrait.png' }, dialogueId: 'ethan', x: 2360, y: 1330, w: 28, h: 34 },
  { id: 'gweggowy', label: 'Gweggowy', displayName: 'Gweggowy', accent: '#80552a', portraits: { default: 'assets/portraits/gweggowy-npc-portrait.png' }, dialogueId: 'gweggowy', x: 2230, y: 825, w: 28, h: 34 },
  { id: 'crazyjoe', label: 'Crazy Joe', displayName: 'Crazy Joe', accent: '#cf6f38', dialogueId: 'crazyjoe', x: 3060, y: 2200, w: 28, h: 34 },
  { id: 'cliff', label: 'Cliff?', displayName: 'Cliff?', accent: '#684f78', dialogueId: 'cliff', x: 610, y: 390, w: 28, h: 34 },
];
