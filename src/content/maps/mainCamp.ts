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
    { id: 'southwestWoods', kind: 'woods', label: 'Cabin Loop Woods', x: 650, y: 1500, w: 2100, h: 1700 },
    { id: 'eastWoods', kind: 'woods', label: 'Lake Woods', x: 3400, y: 520, w: 1400, h: 2680 },
    { id: 'serviceWoods', kind: 'woods', x: 2500, y: 1450, w: 900, h: 1200 },

    // Correct north-to-south order: stream boundary, gorge, then a walkable gorge-edge trail.
    { id: 'northStream', kind: 'stream', label: 'North Boundary Stream', x: 0, y: 0, w: 4800, h: 115, blocksMovement: true, requiredSkill: 'swimming', missingSkillMessage: 'You need to pass the swimming test before crossing the north stream!' },
    { id: 'northGorge', kind: 'gorge', label: 'Gorge / Cliff Edge', x: 0, y: 115, w: 4800, h: 175, blocksMovement: true, requiredSkill: 'climbing' },
    { id: 'gorgeTrail', kind: 'road', label: 'Gorge-edge Trail', x: 180, y: 315, w: 3260, h: 72 },
    { id: 'treeHouseTrail', kind: 'road', label: 'Tree House Trail', x: 1180, y: 360, w: 68, h: 350 },
    { id: 'gymGorgeTrail', kind: 'road', label: 'Rally Field to Gorge Trail', x: 2670, y: 350, w: 70, h: 430 },
    { id: 'cliffWarningTrail', kind: 'road', label: 'Cliff Warning Trail', x: 500, y: 360, w: 70, h: 500 },

    { id: 'entranceRoad', kind: 'road', label: 'Entrance Road', x: 0, y: 1080, w: 1570, h: 90 },
    { id: 'parking', kind: 'road', label: 'Parking Lot', x: 1030, y: 1010, w: 630, h: 330 },
    { id: 'welcomePath', kind: 'road', x: 1370, y: 980, w: 72, h: 310 },
    { id: 'coreRoad', kind: 'road', label: 'Main Camp Core Road', x: 1540, y: 1160, w: 2220, h: 82 },
    { id: 'diningLoopWest', kind: 'road', x: 1810, y: 1040, w: 76, h: 690 },
    { id: 'diningLoopEast', kind: 'road', x: 2390, y: 1040, w: 76, h: 690 },
    { id: 'diningLoopSouth', kind: 'road', x: 1810, y: 1650, w: 656, h: 76 },
    { id: 'chapelRoad', kind: 'road', x: 1950, y: 700, w: 76, h: 540 },
    { id: 'rallyField', kind: 'field', label: 'Rally Field', x: 2130, y: 650, w: 470, h: 330 },
    { id: 'gymRoad', kind: 'road', x: 2510, y: 760, w: 620, h: 76 },
    { id: 'nurseRoad', kind: 'road', x: 2560, y: 790, w: 76, h: 450 },

    { id: 'serviceRoad', kind: 'road', label: 'Service Crew Work Route', x: 2380, y: 1650, w: 900, h: 82 },
    { id: 'showerSpur', kind: 'road', x: 2660, y: 1680, w: 76, h: 360 },
    { id: 'shedSpur', kind: 'road', x: 2780, y: 1920, w: 76, h: 300 },
    { id: 'dumpsterSpur', kind: 'road', x: 3080, y: 1700, w: 76, h: 520 },

    { id: 'cabinLoopNorth', kind: 'road', label: 'Cabin Loop', x: 720, y: 1760, w: 2260, h: 78 },
    { id: 'cabinLoopWest', kind: 'road', x: 700, y: 1760, w: 78, h: 850 },
    { id: 'cabinLoopSouth', kind: 'road', x: 700, y: 2580, w: 2100, h: 78 },
    { id: 'cabinLoopEast', kind: 'road', x: 2720, y: 1760, w: 78, h: 900 },
    { id: 'hawthornePath', kind: 'road', x: 1430, y: 1450, w: 76, h: 390 },
    { id: 'storePath', kind: 'road', x: 1540, y: 1650, w: 76, h: 190 },
    { id: 'beechPath', kind: 'road', x: 1700, y: 1650, w: 76, h: 270 },
    { id: 'mildonPath', kind: 'road', x: 2240, y: 1720, w: 76, h: 250 },
    { id: 'juniperPath', kind: 'road', x: 1340, y: 1800, w: 76, h: 500 },
    { id: 'patrickPath', kind: 'road', x: 2040, y: 2320, w: 76, h: 340 },
    { id: 'maplePath', kind: 'road', x: 2610, y: 2100, w: 76, h: 560 },

    { id: 'lakeRoad', kind: 'road', label: 'Lake / Bridge Road', x: 3480, y: 1160, w: 76, h: 1240 },
    { id: 'waterfrontRoad', kind: 'road', label: 'Waterfront', x: 3500, y: 1500, w: 600, h: 78 },
    { id: 'lake', kind: 'lake', label: 'Milner Lake', x: 4050, y: 900, w: 750, h: 1650, blocksMovement: true, requiredSkill: 'swimming' },
    { id: 'back40Stream', kind: 'stream', label: 'Back 40 Stream', x: 3000, y: 2700, w: 1800, h: 70, blocksMovement: true, requiredSkill: 'swimming', missingSkillMessage: 'The Back 40 stream is off limits until Outdoor Challenge opens.' },
    { id: 'back40Road', kind: 'road', label: 'Back 40 Teaser Road', x: 3325, y: 2740, w: 76, h: 460 },
  ],

  buildings: locations,
  walls: [
    { x: 0, y: 0, w: 40, h: 3200 }, { x: 4760, y: 0, w: 40, h: 3200 },
    // Hidden banks force the bridge crossing even if Swimming has been unlocked.
    { x: 3000, y: 2700, w: 300, h: 70 }, { x: 3420, y: 2700, w: 1380, h: 70 },
    { x: 3000, y: 2700, w: 45, h: 500 },
    // Keep the unlocked end-of-demo crossing confined to a small construction teaser.
    { x: 3240, y: 2770, w: 40, h: 430 }, { x: 3460, y: 2770, w: 40, h: 430 }, { x: 3240, y: 3100, w: 260, h: 40 },
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
    { id: 'welcomeArea', label: 'Welcome / Parking Area', x: 950, y: 780, w: 850, h: 650 },
    { id: 'mainCore', label: 'Main Camp Core', x: 1650, y: 450, w: 1550, h: 1450 },
    { id: 'serviceArea', label: 'Service Crew Work Area', x: 2450, y: 1450, w: 900, h: 850 },
    { id: 'cabinArea', label: 'Cabin Loop', x: 350, y: 1350, w: 2750, h: 1800 },
    { id: 'lakeEdge', label: 'Lake Edge', x: 3450, y: 750, w: 1350, h: 1850 },
    { id: 'back40Teaser', label: 'Bridge toward Back 40', x: 3000, y: 2600, w: 1800, h: 600 },
  ],
  spawns: [
    { id: 'start', x: 1540, y: 1130 },
    { id: 'showerHouseDoor', x: showerHouseDoorX + (showerHouseDoorway.width - 24) / 2, y: showerHouseLocation.y + showerHouseLocation.h + 18 },
  ],
};
