import { hazards } from '../hazards';
import { interactables } from '../interactables';
import { items } from '../items';
import { blockedBridge, locations } from '../locations';
import { npcs } from '../npcs';
import type { MapDefinition } from '../types';

/**
 * Main Camp intentionally places the wooded gorge on the west, camp core in the center,
 * and lake / blocked Back 40 bridge on the east. Fine-tune this data as the layout evolves.
 */
export const mainCamp: MapDefinition = {
  id: 'mainCamp',
  displayName: 'Main Camp',
  size: { w: 1500, h: 1000 },
  background: '#78a956',
  terrainStyle: 'outdoor',
  buildingFrontOverlap: 28,
  terrain: [
    { id: 'westWoods', kind: 'woods', label: 'Wooded Gorge Edge', x: 0, y: 0, w: 210, h: 1000 },
    { id: 'westGorge', kind: 'gorge', label: 'Cliff / Gorge Warning Area', x: 0, y: 70, w: 90, h: 790 },
    { id: 'westStream', kind: 'stream', x: 88, y: 100, w: 48, h: 760 },
    { id: 'entranceRoad', kind: 'road', label: 'Entrance Road / Parking', x: 150, y: 730, w: 470, h: 72 },
    { id: 'campCoreRoad', kind: 'road', x: 480, y: 350, w: 72, h: 430 },
    { id: 'rallyField', kind: 'field', label: 'Rally Field / Flagpole', x: 580, y: 100, w: 330, h: 210 },
    { id: 'cabinLane', kind: 'road', label: 'Cabin Area', x: 860, y: 700, w: 410, h: 65 },
    { id: 'lake', kind: 'lake', label: 'Milner Lake', x: 1195, y: 70, w: 305, h: 365 },
    { id: 'bridgeRoad', kind: 'road', x: 1035, y: 430, w: 330, h: 58 },
  ],
  buildings: locations,
  walls: [
    { x: 0, y: 0, w: 40, h: 1000 },
    { x: 1455, y: 0, w: 45, h: 1000 },
    { x: 1330, y: 440, w: 170, h: 34 },
    blockedBridge,
  ],
  exits: [
    {
      id: 'showerHouseEntrance', kind: 'map-exit', label: 'Enter Shower House',
      x: 878, y: 557, w: 49, h: 28, targetMapId: 'showerHouse', targetSpawnId: 'entrance', activation: 'automatic',
    },
  ],
  npcs,
  items,
  hazards,
  interactables,
  zones: [
    { id: 'cliffZone', label: 'Cliff / Gorge Warning Area', x: 40, y: 70, w: 180, h: 350 },
    { id: 'mainCore', label: 'Main Camp Core', x: 350, y: 250, w: 700, h: 570 },
    { id: 'cabinArea', label: 'Cabin Area', x: 860, y: 650, w: 420, h: 250 },
    { id: 'lakeEdge', label: 'Lake Edge', x: 1120, y: 70, w: 380, h: 430 },
    { id: 'back40Teaser', label: 'Bridge toward Back 40', x: 1260, y: 370, w: 240, h: 180 },
  ],
  spawns: [
    { id: 'start', x: 475, y: 760 },
    { id: 'showerHouseDoor', x: 891, y: 602 },
  ],
};
