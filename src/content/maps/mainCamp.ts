import { hazards } from '../hazards';
import { interactables } from '../interactables';
import { items } from '../items';
import { blockedBridge, locations, showerHouseLocation } from '../locations';
import { npcs } from '../npcs';
import type { MapDefinition } from '../types';

const showerHouseDoorway = showerHouseLocation.doorway!;
const showerHouseDoorDepth = showerHouseDoorway.depth ?? 40;

/**
 * Main Camp uses broad, connected regions: a quiet western gorge, southwest arrival area,
 * central Chapel / Rally landmark, eastern service loop, southeast cabins, and lake bridge.
 */
export const mainCamp: MapDefinition = {
  id: 'mainCamp',
  displayName: 'Main Camp',
  size: { w: 2400, h: 1600 },
  background: '#78a956',
  terrainStyle: 'outdoor',
  buildingFrontOverlap: 28,
  terrain: [
    { id: 'westWoods', kind: 'woods', label: 'Wooded Gorge Edge', x: 0, y: 0, w: 370, h: 1280 },
    { id: 'westGorge', kind: 'gorge', label: 'Cliff / Gorge Warning Area', x: 0, y: 120, w: 125, h: 1040, blocksMovement: true, requiredSkill: 'climbing' },
    { id: 'westStream', kind: 'stream', x: 135, y: 150, w: 55, h: 1020, blocksMovement: true, requiredSkill: 'swimming', missingSkillMessage: 'You need to pass the swimming test before crossing the stream!' },
    { id: 'cliffPath', kind: 'road', label: 'Cliff Warning Path', x: 190, y: 1030, w: 500, h: 58 },
    { id: 'entranceRoad', kind: 'road', label: 'Entrance Road / Parking', x: 300, y: 1390, w: 820, h: 82 },
    { id: 'welcomeRoad', kind: 'road', x: 680, y: 980, w: 78, h: 460 },
    { id: 'campCoreRoad', kind: 'road', x: 680, y: 940, w: 1110, h: 78 },
    { id: 'chapelRoad', kind: 'road', x: 1120, y: 420, w: 78, h: 540 },
    { id: 'rallyField', kind: 'field', label: 'Rally Field / Flagpole', x: 920, y: 430, w: 500, h: 300 },
    { id: 'serviceRoad', kind: 'road', label: 'Service Crew Work Route', x: 1530, y: 540, w: 78, h: 750 },
    { id: 'serviceLoop', kind: 'road', x: 1530, y: 1180, w: 500, h: 68 },
    { id: 'cabinLane', kind: 'road', label: 'Cabin Lane', x: 1450, y: 1280, w: 720, h: 70 },
    { id: 'lake', kind: 'lake', label: 'Milner Lake', x: 1950, y: 80, w: 450, h: 470, blocksMovement: true, requiredSkill: 'swimming' },
    { id: 'bridgeRoad', kind: 'road', label: 'Back 40 Approach', x: 1450, y: 540, w: 950, h: 70 },
  ],
  buildings: locations,
  walls: [
    { x: 0, y: 0, w: 40, h: 1600 },
    { x: 2355, y: 0, w: 45, h: 1600 },
    { x: 2280, y: 0, w: 120, h: 500 },
    { x: 2280, y: 610, w: 120, h: 990 },
    blockedBridge,
  ],
  exits: [
    {
      id: 'showerHouseEntrance', kind: 'map-exit', label: 'Enter Shower House',
      x: showerHouseLocation.x + showerHouseDoorway.offset, y: showerHouseLocation.y + showerHouseLocation.h - showerHouseDoorDepth,
      w: showerHouseDoorway.width, h: 28, targetMapId: 'showerHouse', targetSpawnId: 'entrance', activation: 'automatic',
    },
  ],
  npcs,
  items,
  hazards,
  interactables,
  zones: [
    { id: 'cliffZone', label: 'Cliff / Gorge Warning Area', x: 40, y: 120, w: 330, h: 1040 },
    { id: 'welcomeArea', label: 'Welcome / Entrance Area', x: 350, y: 1080, w: 650, h: 500 },
    { id: 'mainCore', label: 'Main Camp Core', x: 680, y: 250, w: 850, h: 850 },
    { id: 'serviceArea', label: 'Service Crew Work Area', x: 1450, y: 650, w: 620, h: 620 },
    { id: 'cabinArea', label: 'Cabin Area', x: 1450, y: 1260, w: 720, h: 300 },
    { id: 'lakeEdge', label: 'Lake Edge', x: 1880, y: 80, w: 400, h: 650 },
    { id: 'back40Teaser', label: 'Bridge toward Back 40', x: 2100, y: 450, w: 300, h: 260 },
  ],
  spawns: [
    { id: 'start', x: 760, y: 1405 },
    { id: 'showerHouseDoor', x: 1771, y: 1052 },
  ],
};
