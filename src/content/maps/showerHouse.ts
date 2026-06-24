import type { MapDefinition } from '../types';

/**
 * Proof-of-concept interior. To add another interior, copy this shape, register it in
 * maps/index.ts, then add matching map-exit interactables outdoors and indoors.
 */
export const showerHouse: MapDefinition = {
  id: 'showerHouse',
  displayName: 'Shower House Interior',
  size: { w: 760, h: 560 },
  background: '#d8c99d',
  terrainStyle: 'interior',
  terrain: [
    { id: 'bathroomTile', kind: 'tile', label: 'Bathroom Floor', x: 42, y: 42, w: 676, h: 476 },
    { id: 'showerRow', kind: 'shower', label: 'Shower Stalls', x: 70, y: 70, w: 210, h: 150 },
  ],
  buildings: [],
  walls: [
    { x: 0, y: 0, w: 760, h: 42 }, { x: 0, y: 518, w: 310, h: 42 }, { x: 450, y: 518, w: 310, h: 42 },
    { x: 0, y: 0, w: 42, h: 560 }, { x: 718, y: 0, w: 42, h: 560 },
    { x: 70, y: 70, w: 210, h: 26 }, { x: 70, y: 194, w: 210, h: 26 },
    { x: 70, y: 96, w: 24, h: 98 }, { x: 256, y: 96, w: 24, h: 98 },
    { x: 430, y: 90, w: 220, h: 55 }, { x: 500, y: 300, w: 150, h: 48 },
  ],
  exits: [
    {
      id: 'showerHouseExit', kind: 'map-exit', label: 'Exit to Main Camp',
      x: 330, y: 485, w: 100, h: 65, targetMapId: 'mainCamp', targetSpawnId: 'showerHouseDoor', activation: 'automatic',
    },
  ],
  npcs: [],
  items: [],
  hazards: [
    { id: 'interiorWetFloor', label: 'Wet Floor', kind: 'wet', assetId: 'wetFloor', x: 330, y: 235, w: 90, h: 55 },
  ],
  interactables: [
    {
      id: 'showerCleaningSpot1', kind: 'task-location', label: 'Dirty shower stall 1', x: 105, y: 225, w: 95, h: 56,
      message: 'A heroic scrubbing opportunity. Blue bathroom mop only—Service Crew has standards.',
    },
    {
      id: 'showerCleaningSpot2', kind: 'task-location', label: 'Dirty shower stall 2', x: 215, y: 225, w: 95, h: 56,
      message: 'This spot looks like it lost a wrestling match with muddy flip-flops.',
    },
    {
      id: 'showerCleaningSpot3', kind: 'task-location', label: 'Dirty sink corner', x: 325, y: 310, w: 100, h: 58,
      message: 'Mystery splashes. Probably camp chaos. Definitely mop territory.',
    },
    {
      id: 'showerCleaningSpot4', kind: 'task-location', label: 'Dirty changing area', x: 455, y: 380, w: 110, h: 58,
      message: 'The floor is requesting immediate Service Crew encouragement.',
    },
  ],
  zones: [
    { id: 'showers', label: 'Shower Stalls', x: 60, y: 60, w: 240, h: 175 },
    { id: 'bathroom', label: 'Bathroom / Restock Area', x: 410, y: 70, w: 270, h: 310 },
  ],
  spawns: [{ id: 'entrance', x: 368, y: 430 }],
};
