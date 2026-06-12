import { hazards } from '../hazards';
import { interactables } from '../interactables';
import { items } from '../items';
import { blockedBridge, locations, showerHouseLocation } from '../locations';
import { npcs } from '../npcs';
import type { MapDefinition } from '../types';

const showerHouseDoorway = showerHouseLocation.doorway!;
const showerHouseDoorDepth = showerHouseDoorway.depth ?? 40;
const showerHouseDoorX = showerHouseLocation.x + showerHouseDoorway.offset;
const showerHouseDoorY = showerHouseLocation.y + showerHouseLocation.h - showerHouseDoorDepth;

/** Expanded Main Camp: a spacious central core framed by woods, northern gorge, lake, and teaser landmarks. */
export const mainCamp: MapDefinition = {
  id: 'mainCamp',
  displayName: 'Main Camp',
  size: { w: 4800, h: 3200 },
  background: '#78a956',
  terrainStyle: 'outdoor',
  buildingFrontOverlap: 28,
  terrain: [
    // Broad woods regions are broken by readable roads, trails, fields, and objective clearings.
    { id: 'northWoods', kind: 'woods', label: 'North Woods', x: 0, y: 0, w: 4800, h: 680 },
    { id: 'westWoods', kind: 'woods', label: 'West Woods', x: 0, y: 520, w: 720, h: 2680 },
    { id: 'southwestWoods', kind: 'woods', label: 'Cabin Loop Woods', x: 650, y: 1800, w: 2100, h: 1400 },
    { id: 'eastWoods', kind: 'woods', label: 'Lake Woods', x: 3400, y: 520, w: 1400, h: 2680 },
    { id: 'serviceWoods', kind: 'woods', x: 2600, y: 1650, w: 900, h: 1450 },

    // Correct north-to-south order: stream boundary, gorge, then a walkable gorge-edge trail.
    { id: 'northStream', kind: 'stream', label: 'North Boundary Stream', x: 0, y: 0, w: 4800, h: 115, blocksMovement: true, requiredSkill: 'swimming', missingSkillMessage: 'You need to pass the swimming test before crossing the north stream!' },
    { id: 'northGorge', kind: 'gorge', label: 'Gorge / Cliff Edge', x: 0, y: 115, w: 4800, h: 175, blocksMovement: true, requiredSkill: 'climbing' },
    { id: 'gorgeTrail', kind: 'road', label: 'Gorge-edge Trail', x: 180, y: 315, w: 3260, h: 72 },
    { id: 'treeHouseTrail', kind: 'road', label: 'Tree House Trail', x: 1180, y: 360, w: 68, h: 470 },
    { id: 'gymGorgeTrail', kind: 'road', label: 'Rally Field to Gorge Trail', x: 2670, y: 350, w: 70, h: 530 },
    { id: 'cliffWarningTrail', kind: 'road', label: 'Cliff Warning Trail', x: 500, y: 360, w: 70, h: 500 },

    { id: 'entranceRoad', kind: 'road', label: 'Entrance Road', x: 0, y: 1230, w: 1450, h: 90 },
    { id: 'parking', kind: 'road', label: 'Parking / Arrival Area', x: 650, y: 1030, w: 650, h: 330 },
    { id: 'welcomePath', kind: 'road', x: 1050, y: 1180, w: 72, h: 330 },
    { id: 'coreRoad', kind: 'road', label: 'Main Camp Core Road', x: 1100, y: 1280, w: 2620, h: 82 },
    { id: 'diningLoopWest', kind: 'road', x: 1840, y: 1080, w: 76, h: 760 },
    { id: 'diningLoopEast', kind: 'road', x: 2470, y: 1080, w: 76, h: 760 },
    { id: 'diningLoopSouth', kind: 'road', x: 1840, y: 1760, w: 706, h: 76 },
    { id: 'chapelRoad', kind: 'road', x: 2170, y: 720, w: 76, h: 650 },
    { id: 'rallyField', kind: 'field', label: 'Rally Field', x: 2350, y: 720, w: 470, h: 330 },
    { id: 'gymRoad', kind: 'road', x: 2700, y: 900, w: 620, h: 76 },
    { id: 'nurseRoad', kind: 'road', x: 2940, y: 930, w: 76, h: 430 },

    { id: 'serviceRoad', kind: 'road', label: 'Service Crew Work Route', x: 2470, y: 1740, w: 1050, h: 82 },
    { id: 'showerSpur', kind: 'road', x: 3100, y: 1770, w: 76, h: 420 },
    { id: 'shedSpur', kind: 'road', x: 2860, y: 2140, w: 76, h: 350 },
    { id: 'dumpsterSpur', kind: 'road', x: 3380, y: 1780, w: 76, h: 580 },

    { id: 'cabinLoopNorth', kind: 'road', label: 'Cabin Loop', x: 720, y: 2010, w: 1840, h: 78 },
    { id: 'cabinLoopWest', kind: 'road', x: 700, y: 2010, w: 78, h: 830 },
    { id: 'cabinLoopSouth', kind: 'road', x: 700, y: 2810, w: 2050, h: 78 },
    { id: 'cabinLoopEast', kind: 'road', x: 2670, y: 2020, w: 78, h: 870 },
    { id: 'storePath', kind: 'road', x: 1560, y: 1780, w: 76, h: 310 },
    { id: 'beechPath', kind: 'road', x: 1180, y: 2030, w: 76, h: 310 },
    { id: 'mildonPath', kind: 'road', x: 2030, y: 2020, w: 76, h: 320 },
    { id: 'patrickPath', kind: 'road', x: 1660, y: 2450, w: 76, h: 430 },
    { id: 'maplePath', kind: 'road', x: 2370, y: 2440, w: 76, h: 440 },

    { id: 'lakeRoad', kind: 'road', label: 'Lake / Bridge Road', x: 3480, y: 1280, w: 76, h: 1420 },
    { id: 'waterfrontRoad', kind: 'road', x: 3500, y: 1510, w: 600, h: 78 },
    { id: 'lake', kind: 'lake', label: 'Milner Lake', x: 4050, y: 900, w: 750, h: 1650, blocksMovement: true, requiredSkill: 'swimming' },
    { id: 'back40Stream', kind: 'stream', label: 'Back 40 Stream', x: 3600, y: 2700, w: 1200, h: 70, blocksMovement: true, requiredSkill: 'swimming', missingSkillMessage: 'The Back 40 stream is off limits until Outdoor Challenge opens.' },
    { id: 'back40Road', kind: 'road', label: 'Back 40 Teaser Road', x: 4045, y: 2740, w: 76, h: 460 },
  ],
  buildings: locations,
  walls: [
    { x: 0, y: 0, w: 40, h: 3200 }, { x: 4760, y: 0, w: 40, h: 3200 },
    // Hidden banks force the bridge crossing even if Swimming has been unlocked.
    { x: 3600, y: 2700, w: 420, h: 70 }, { x: 4140, y: 2700, w: 660, h: 70 },
    { x: 3600, y: 2700, w: 45, h: 500 },
    // Keep the unlocked end-of-demo crossing confined to a small construction teaser.
    { x: 3960, y: 2770, w: 40, h: 430 }, { x: 4180, y: 2770, w: 40, h: 430 }, { x: 3960, y: 3100, w: 260, h: 40 },
    blockedBridge,
  ],
  exits: [
    {
      id: 'showerHouseEntrance', kind: 'map-exit', label: 'Enter Shower House',
      x: showerHouseDoorX, y: showerHouseDoorY, w: showerHouseDoorway.width, h: 30,
      targetMapId: 'showerHouse', targetSpawnId: 'entrance', activation: 'automatic',
    },
  ],
  npcs,
  items,
  hazards,
  interactables,
  zones: [
    { id: 'cliffZone', label: 'Cliff / Gorge Warning Area', x: 300, y: 110, w: 1050, h: 430 },
    { id: 'treeHouseArea', label: 'Tree House / Gorge Trail', x: 1000, y: 180, w: 500, h: 650 },
    { id: 'welcomeArea', label: 'Welcome / Parking Area', x: 500, y: 900, w: 950, h: 650 },
    { id: 'mainCore', label: 'Main Camp Core', x: 1700, y: 650, w: 1650, h: 1300 },
    { id: 'serviceArea', label: 'Service Crew Work Area', x: 2650, y: 1650, w: 950, h: 850 },
    { id: 'cabinArea', label: 'Cabin Loop', x: 350, y: 1700, w: 2550, h: 1450 },
    { id: 'lakeEdge', label: 'Lake Edge', x: 3450, y: 750, w: 1350, h: 1850 },
    { id: 'back40Teaser', label: 'Bridge toward Back 40', x: 3600, y: 2600, w: 1200, h: 600 },
  ],
  spawns: [
    { id: 'start', x: 1100, y: 1270 },
    { id: 'showerHouseDoor', x: showerHouseDoorX + (showerHouseDoorway.width - 24) / 2, y: showerHouseLocation.y + showerHouseLocation.h + 18 },
  ],
};
