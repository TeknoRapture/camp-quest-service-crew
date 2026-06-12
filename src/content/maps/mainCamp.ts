import { hazards } from '../hazards';
import { interactables } from '../interactables';
import { items } from '../items';
import { blockedBridge, locations, showerHouseLocation } from '../locations';
import { npcs } from '../npcs';
import type { MapDefinition } from '../types';

const showerHouseDoorway = showerHouseLocation.doorway!;
const showerHouseDoorDepth = showerHouseDoorway.depth ?? 40;

/**
 * Main Camp follows the Stony Glen center-camp relationships: arrival and parking to the west,
 * Dining Hall at the core, Chapel to the north, service buildings to the east, and lake beyond.
 */
export const mainCamp: MapDefinition = {
  id: 'mainCamp',
  displayName: 'Main Camp',
  size: { w: 2400, h: 1600 },
  background: '#78a956',
  terrainStyle: 'outdoor',
  buildingFrontOverlap: 28,
  terrain: [
    { id: 'westWoods', kind: 'woods', label: 'West Woods / Gorge Edge', x: 0, y: 0, w: 300, h: 1370 },
    { id: 'westGorge', kind: 'gorge', label: 'Cliff / Gorge Warning Area', x: 0, y: 520, w: 105, h: 720, blocksMovement: true, requiredSkill: 'climbing' },
    { id: 'westStream', kind: 'stream', x: 120, y: 560, w: 50, h: 690, blocksMovement: true, requiredSkill: 'swimming', missingSkillMessage: 'You need to pass the swimming test before crossing the stream!' },
    { id: 'cliffPath', kind: 'road', label: 'Cliff Warning Path', x: 170, y: 990, w: 420, h: 58 },
    { id: 'entranceRoad', kind: 'road', label: 'Entrance Road', x: 170, y: 500, w: 520, h: 76 },
    { id: 'parking', kind: 'road', label: 'Parking / Arrival Area', x: 420, y: 490, w: 390, h: 150 },
    { id: 'welcomePath', kind: 'road', x: 625, y: 420, w: 64, h: 300 },
    { id: 'coreRoad', kind: 'road', label: 'Main Camp Core Road', x: 690, y: 520, w: 1040, h: 72 },
    { id: 'diningLoop', kind: 'road', x: 820, y: 545, w: 72, h: 420 },
    { id: 'chapelRoad', kind: 'road', x: 1080, y: 300, w: 70, h: 300 },
    { id: 'northRoad', kind: 'road', x: 1080, y: 410, w: 570, h: 66 },
    { id: 'rallyField', kind: 'field', label: 'Rally Field / Flagpole', x: 800, y: 390, w: 420, h: 170 },
    { id: 'serviceRoad', kind: 'road', label: 'Service Crew Work Route', x: 1170, y: 720, w: 570, h: 68 },
    { id: 'serviceSpur', kind: 'road', x: 1400, y: 750, w: 68, h: 410 },
    { id: 'cabinLoopWest', kind: 'road', label: 'Cabin Loop', x: 480, y: 790, w: 700, h: 68 },
    { id: 'cabinLoopSouth', kind: 'road', x: 520, y: 1000, w: 930, h: 68 },
    { id: 'patrickPath', kind: 'road', x: 900, y: 1040, w: 68, h: 330 },
    { id: 'lakeRoad', kind: 'road', label: 'Lake / Bridge Road', x: 1600, y: 780, w: 70, h: 430 },
    { id: 'waterfrontRoad', kind: 'road', x: 1620, y: 780, w: 360, h: 68 },
    { id: 'lake', kind: 'lake', label: 'Milner Lake', x: 1950, y: 470, w: 450, h: 680, blocksMovement: true, requiredSkill: 'swimming' },
    { id: 'back40Stream', kind: 'stream', label: 'Back 40 Stream', x: 1450, y: 1210, w: 950, h: 58, blocksMovement: true, requiredSkill: 'swimming', missingSkillMessage: 'The Back 40 stream is off limits until Outdoor Challenge opens.' },
    { id: 'back40Road', kind: 'road', label: 'Back 40 Teaser Road', x: 1710, y: 1240, w: 70, h: 360 },
  ],
  buildings: locations,
  walls: [
    { x: 0, y: 0, w: 40, h: 1600 },
    { x: 2360, y: 0, w: 40, h: 1600 },
    // The stream and these hidden boundary walls keep Day 1 players from walking around the bridge gate.
    { x: 1450, y: 1210, w: 230, h: 58 },
    { x: 1790, y: 1210, w: 610, h: 58 },
    { x: 1450, y: 1210, w: 45, h: 390 },
    // Keep the unlocked end-of-demo crossing confined to a small construction teaser.
    { x: 1640, y: 1268, w: 40, h: 332 },
    { x: 1790, y: 1268, w: 40, h: 332 },
    { x: 1640, y: 1370, w: 190, h: 40 },
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
    { id: 'cliffZone', label: 'Cliff / Gorge Warning Area', x: 40, y: 520, w: 300, h: 720 },
    { id: 'welcomeArea', label: 'Welcome / Parking Area', x: 300, y: 280, w: 530, h: 420 },
    { id: 'mainCore', label: 'Main Camp Core', x: 760, y: 200, w: 850, h: 790 },
    { id: 'serviceArea', label: 'Service Crew Work Area', x: 1160, y: 700, w: 540, h: 480 },
    { id: 'cabinArea', label: 'Cabin Loop', x: 330, y: 650, w: 1090, h: 750 },
    { id: 'lakeEdge', label: 'Lake Edge', x: 1650, y: 430, w: 750, h: 740 },
    { id: 'back40Teaser', label: 'Bridge toward Back 40', x: 1450, y: 1180, w: 950, h: 420 },
  ],
  spawns: [
    { id: 'start', x: 620, y: 620 },
    { id: 'showerHouseDoor', x: 1391, y: 942 },
  ],
};
