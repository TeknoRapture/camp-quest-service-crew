import './style.css';
import { AssetLoader, type AssetId, type AssetProgress } from './assets';
import { drawSprite } from './sprites';
import { dialogue } from './content/dialogue';
import { maps, mainCamp } from './content/maps';
import { chooseLoadingTip } from './content/loadingTips';
import { blockedBridge } from './content/locations';
import { genericNpcPortrait, npcPortraitPaths } from './content/npcs';
import { skills } from './content/skills';
import { tasks } from './content/tasks';
import type { DialogueSpeaker, InteractableDefinition, LocationDefinition, MapDefinition, ObjectiveTargetType, Rect, SkillId, TaskDefinition, TerrainFeature, Thing } from './content/types';

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const ctx = canvas.getContext('2d')!;
const assets = new AssetLoader();
type GamePhase = 'loading' | 'ready' | 'playing';
let gamePhase: GamePhase = 'loading';
let loadingProgress: AssetProgress = { total: 0, settled: 0, loaded: 0, failed: 0 };
const loadingTip = chooseLoadingTip();
const ui = {
  objective: document.querySelector('#objective')!, energy: document.querySelector<HTMLElement>('#energy-bar')!,
  points: document.querySelector('#points')!, best: document.querySelector('#best')!, tasks: document.querySelector('#tasks')!,
  dialogue: document.querySelector<HTMLElement>('#dialogue')!, speaker: document.querySelector('#speaker')!, text: document.querySelector('#dialogue-text')!,
  portraitPanel: document.querySelector('#portrait-panel')!, portrait: document.querySelector<HTMLImageElement>('#dialogue-portrait')!,
  toast: document.querySelector('#toast')!, checklist: document.querySelector('#checklist')!,
  inspection: document.querySelector('#image-inspection')!, inspectionImage: document.querySelector<HTMLImageElement>('#inspection-image')!,
  inspectionTitle: document.querySelector('#inspection-title')!, inspectionCaption: document.querySelector('#inspection-caption')!,
  inspectionFallback: document.querySelector('#inspection-fallback')!,
};

let currentMap: MapDefinition = mainCamp;
const start = currentMap.spawns.find(({ id }) => id === 'start')!;
const player = { x: start.x, y: start.y, w: 24, h: 30, speed: 185, energy: 100, points: 0 };
const camera = { x: Math.max(0, start.x - canvas.width / 2), y: Math.max(0, start.y - canvas.height / 2) };
const keys = new Set<string>();
let actionQueued = false, dialogueOpen = false, inspectionOpen = false, toastTimer = 0, hazardTick = 0, transitionCooldown = 0;
let blockedSkillMessageCooldown = 0, lastBlockedTerrainId = '';
const state = {
  talked: false, inventory: [] as string[], delivered: false, bridge: false,
  skills: { nature: false, swimming: false, climbing: false } as Record<SkillId, boolean>,
};
const allItems = Object.values(maps).flatMap(map => map.items);

function buildingCollisionRect(building: LocationDefinition): Rect {
  const frontOverlap = Math.max(0, Math.min(building.h, building.frontOverlap ?? currentMap.buildingFrontOverlap ?? 0));
  return { x: building.x, y: building.y, w: building.w, h: building.h - frontOverlap };
}
function areAllNonBridgeTasksComplete() { return tasks.filter(({ id }) => id !== 'bridge').every(({ id }) => isDone(id)); }
function isBridgeUnlocked() { return areAllNonBridgeTasksComplete(); }
function obstacles() { return [...currentMap.buildings.map(buildingCollisionRect), ...currentMap.walls.filter(wall => wall !== blockedBridge || !isBridgeUnlocked())]; }
function hasSkill(skillId: SkillId) { return state.skills[skillId]; }
function blockedTerrain() {
  return currentMap.terrain.find(feature => {
    if (!feature.blocksMovement || !intersects(player, feature) || (feature.requiredSkill && hasSkill(feature.requiredSkill))) return false;
    const onUnlockedBridge = feature.id === 'back40Stream' && isBridgeUnlocked() && player.x >= blockedBridge.x && player.x + player.w <= blockedBridge.x + blockedBridge.w;
    return !onUnlockedBridge;
  });
}
function showMissingTerrainSkill(feature: TerrainFeature) {
  if (blockedSkillMessageCooldown > 0 && lastBlockedTerrainId === feature.id) return;
  const message = feature.missingSkillMessage ?? (feature.requiredSkill ? skills[feature.requiredSkill].missingSkillMessage : 'That terrain is blocked.');
  toast(message); blockedSkillMessageCooldown = 1.25; lastBlockedTerrainId = feature.id;
}
function isDone(id: string) { return id === 'talked' || id === 'delivered' || id === 'bridge' ? state[id] : allItems.find(item => item.id === id)?.done; }
function completeBridgeObjective() {
  if (state.bridge || !isBridgeUnlocked()) return;
  state.bridge = true; award(50); toast('Under Construction: Back 40 coming soon! +50 SP'); refreshUI();
}
function activeTask() { return tasks.find(({ id }) => !isDone(id)); }
function objective() { return activeTask()?.label ?? 'Report to the Rally Circle'; }
function resolveObjectiveTarget(task: TaskDefinition) {
  if (!task.targetType || !task.targetId) return;
  const targetMap = maps[task.targetMapId ?? mainCamp.id];
  if (!targetMap) return;
  const collections: Record<ObjectiveTargetType, Thing[]> = {
    item: targetMap.items, npc: targetMap.npcs, interactable: targetMap.interactables, exit: targetMap.exits, zone: targetMap.zones, location: targetMap.buildings,
  };
  const target = collections[task.targetType].find(({ id }) => id === task.targetId);
  if (!target || (task.targetType === 'item' && target.done)) return;
  return { target, mapId: targetMap.id, label: task.targetLabel ?? target.label };
}
function refreshUI() {
  ui.energy.style.width = `${player.energy}%`; ui.points.textContent = `${player.points} SP`;
  const best = Number(localStorage.getItem('campQuestBest') || 0); ui.best.textContent = `BEST ${Math.max(best, player.points)}`;
  ui.objective.textContent = `${currentMap.displayName}: ${objective()}`;
  ui.tasks.innerHTML = tasks.map(({ id, label }) => `<li class="${isDone(id) ? 'done' : ''}">${label}</li>`).join('');
}
function showDialogue(speaker: DialogueSpeaker, text: string) {
  const displayName = speaker.displayName ?? speaker.label ?? 'Camp Staff';
  dialogueOpen = true; ui.speaker.textContent = displayName; ui.text.textContent = text;
  ui.dialogue.style.setProperty('--dialogue-accent', speaker.accent ?? '#a43f28');
  ui.dialogue.classList.remove('portrait-missing'); ui.portraitPanel.classList.remove('hidden'); ui.portrait.alt = `Portrait of ${displayName}`;
  ui.portrait.onerror = () => { ui.dialogue.classList.add('portrait-missing'); ui.portraitPanel.classList.add('hidden'); ui.portrait.removeAttribute('src'); };
  ui.portrait.src = speaker.portraits?.default ?? genericNpcPortrait; ui.dialogue.classList.remove('hidden');
}
function closeDialogue() { dialogueOpen = false; ui.dialogue.classList.add('hidden'); }
function inspectImage(title: string, assetId: AssetId, caption: string) {
  inspectionOpen = true; keys.clear(); ui.inspectionTitle.textContent = title; ui.inspectionCaption.textContent = caption;
  ui.inspectionImage.classList.remove('hidden'); ui.inspectionFallback.classList.add('hidden'); ui.inspectionImage.alt = title;
  ui.inspectionFallback.textContent = `${title} image unavailable`;
  ui.inspectionImage.onerror = () => { ui.inspectionImage.classList.add('hidden'); ui.inspectionFallback.classList.remove('hidden'); };
  ui.inspectionImage.src = assets.url(assetId); ui.inspection.classList.remove('hidden');
}
function closeInspection() { inspectionOpen = false; ui.inspection.classList.add('hidden'); }
function toast(text: string) { ui.toast.textContent = text; ui.toast.classList.remove('hidden'); toastTimer = 2.8; }
function dist(a: Rect, b: Rect) { return Math.hypot(a.x + a.w / 2 - b.x - b.w / 2, a.y + a.h / 2 - b.y - b.h / 2); }
function intersects(a: Rect, b: Rect) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function award(points: number) { player.points += points; localStorage.setItem('campQuestBest', String(Math.max(player.points, Number(localStorage.getItem('campQuestBest') || 0)))); }
function switchMap(exit: InteractableDefinition) {
  const nextMap = exit.targetMapId ? maps[exit.targetMapId] : undefined;
  const spawn = nextMap?.spawns.find(({ id }) => id === exit.targetSpawnId);
  if (!nextMap || !spawn) { toast('That route is not ready yet.'); return; }
  currentMap = nextMap; player.x = spawn.x; player.y = spawn.y; keys.clear(); transitionCooldown = .45;
  camera.x = 0; camera.y = 0; toast(`Entered ${currentMap.displayName}`); refreshUI();
}
function tryAutomaticExit() {
  if (transitionCooldown > 0) return false;
  const exit = currentMap.exits.find(candidate => candidate.activation === 'automatic' && intersects(player, candidate));
  if (!exit) return false;
  switchMap(exit); return true;
}
function interact() {
  if (inspectionOpen) { closeInspection(); return; }
  if (dialogueOpen) { closeDialogue(); return; }

  const nearbyExit = currentMap.exits.find(exit => exit.activation !== 'automatic' && dist(player, exit) < 85);
  if (nearbyExit) { switchMap(nearbyExit); return; }
  const nearbyInteractable = [...currentMap.interactables].sort((a, b) => dist(player, a) - dist(player, b))[0];
  if (nearbyInteractable && dist(player, nearbyInteractable) < 105) {
    if (nearbyInteractable.kind === 'inspection' && nearbyInteractable.title && nearbyInteractable.assetId) {
      inspectImage(nearbyInteractable.title, nearbyInteractable.assetId, nearbyInteractable.caption ?? nearbyInteractable.label); return;
    }
    if (nearbyInteractable.id === 'back40TeaserMessage') { completeBridgeObjective(); return; }
    if (nearbyInteractable.kind === 'message' || nearbyInteractable.kind === 'task-location') {
      const message = nearbyInteractable.id === 'blockedBridgeMessage' && isBridgeUnlocked()
        ? 'The bridge inspection is complete. Cross carefully for a tiny peek at the Back 40!'
        : nearbyInteractable.message ?? nearbyInteractable.label;
      toast(message); return;
    }
    if (nearbyInteractable.kind === 'delivery-zone' && state.inventory.includes('crate') && !state.delivered) {
      state.delivered = true; state.inventory = state.inventory.filter(id => id !== 'crate'); award(100); toast('Crate delivered! +100 SP'); refreshUI(); return;
    }
  }
  const npc = currentMap.npcs.filter(({ id }) => id !== 'cliff').sort((a, b) => dist(player, a) - dist(player, b))[0];
  if (npc && dist(player, npc) < 80) {
    if (npc.id === 'coop' && !state.talked) { state.talked = true; award(25); }
    showDialogue(npc, dialogue[npc.dialogueId][state.talked ? 1 : 0]); refreshUI(); return;
  }
  const item = currentMap.items.filter(({ done }) => !done).sort((a, b) => dist(player, a) - dist(player, b))[0];
  if (item && dist(player, item) < 70) { item.done = true; state.inventory.push(item.id); award(50); toast(`${item.label} recovered! +50 SP`); refreshUI(); return; }
  toast('Nothing useful nearby. Service Crew Rule #2: check the weirdest place first.');
}
function move(dx: number, dy: number) {
  const old = { x: player.x, y: player.y };
  player.x += dx;
  const blockedX = blockedTerrain();
  if (obstacles().some(obstacle => intersects(player, obstacle)) || blockedX) { player.x = old.x; if (blockedX) showMissingTerrainSkill(blockedX); }
  player.y += dy;
  const blockedY = blockedTerrain();
  if (obstacles().some(obstacle => intersects(player, obstacle)) || blockedY) { player.y = old.y; if (blockedY) showMissingTerrainSkill(blockedY); }
  player.x = Math.max(5, Math.min(currentMap.size.w - player.w - 5, player.x)); player.y = Math.max(5, Math.min(currentMap.size.h - player.h - 5, player.y));
}
function update(dt: number) {
  if (gamePhase !== 'playing') return;
  transitionCooldown = Math.max(0, transitionCooldown - dt); blockedSkillMessageCooldown = Math.max(0, blockedSkillMessageCooldown - dt);
  if (actionQueued) { actionQueued = false; interact(); }
  if (dialogueOpen || inspectionOpen) return;
  const x = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0), y = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0); const len = Math.hypot(x, y) || 1;
  const hazard = currentMap.hazards.find(item => intersects(player, item)); const speed = player.speed * (hazard && hazard.kind !== 'mosquitoes' ? .55 : 1); move(x / len * speed * dt, y / len * speed * dt);
  if (tryAutomaticExit()) return;
  const bridgeTeaser = currentMap.interactables.find(({ id }) => id === 'back40TeaserMessage');
  if (bridgeTeaser && intersects(player, bridgeTeaser)) completeBridgeObjective();
  hazardTick -= dt;
  if (hazard?.energyDamage && hazardTick <= 0) {
    const multiplier = hazard.mitigationSkill && hasSkill(hazard.mitigationSkill) ? hazard.mitigationMultiplier ?? 1 : 1;
    const damage = hazard.energyDamage * multiplier; player.energy = Math.max(0, player.energy - damage); hazardTick = hazard.damageInterval ?? .5;
    toast(`${hazard.damageMessage ?? hazard.label} Energy -${damage}`); refreshUI();
  }
  camera.x = Math.max(0, Math.min(Math.max(0, currentMap.size.w - canvas.width), player.x - canvas.width / 2));
  camera.y = Math.max(0, Math.min(Math.max(0, currentMap.size.h - canvas.height), player.y - canvas.height / 2));
}
function text(value: string, x: number, y: number, size = 13, color = '#fff8df') { ctx.font = `900 ${size}px Nunito`; ctx.textAlign = 'center'; ctx.fillStyle = '#19301d'; ctx.fillText(value, x + 1, y + 1); ctx.fillStyle = color; ctx.fillText(value, x, y); }
function drawTree(x: number, y: number) { ctx.fillStyle = '#543b21'; ctx.fillRect(x - 4, y + 10, 8, 18); ctx.fillStyle = '#285c30'; ctx.beginPath(); ctx.arc(x, y, 17, 0, 7); ctx.fill(); ctx.fillStyle = '#36733a'; ctx.beginPath(); ctx.arc(x - 7, y - 7, 11, 0, 7); ctx.fill(); }
function drawTerrain(feature: TerrainFeature) {
  const colors: Record<TerrainFeature['kind'], string> = { road: '#d0b67a', field: '#8dbd5e', woods: '#477b45', gorge: '#58473a', stream: '#5d9fc0', lake: '#4d91b8', tile: '#c8d2c3', shower: '#83afbd' };
  ctx.fillStyle = colors[feature.kind]; ctx.fillRect(feature.x, feature.y, feature.w, feature.h);
  if (feature.kind === 'tile') { ctx.strokeStyle = '#a9b5a6'; ctx.lineWidth = 2; for (let x = feature.x; x < feature.x + feature.w; x += 40) for (let y = feature.y; y < feature.y + feature.h; y += 40) ctx.strokeRect(x, y, 40, 40); }
  if (feature.label) text(feature.label, feature.x + feature.w / 2, feature.y + 20, 11, '#f8edc9');
}
function drawBuildingBody(building: LocationDefinition) {
  ctx.fillStyle = building.color ?? '#a96e3e'; ctx.fillRect(building.x, building.y, building.w, building.h);
  ctx.fillStyle = '#e8c47b';
  const door = building.doorway;
  if (door?.side === 'bottom') { const depth = door.depth ?? 40; ctx.fillRect(building.x + door.offset, building.y + building.h - depth, door.width, depth); }
  else ctx.fillRect(building.x + building.w / 2 - 15, building.y + building.h - 40, 30, 40);
}
function drawBuildingSign(building: LocationDefinition) {
  const fontSize = 11, paddingX = 7, signHeight = 19;
  ctx.font = `900 ${fontSize}px Nunito`;
  const signWidth = ctx.measureText(building.label).width + paddingX * 2;
  const signX = building.x + (building.w - signWidth) / 2;
  const signY = building.y + 9;
  ctx.fillStyle = '#f5e6b8'; ctx.fillRect(signX, signY, signWidth, signHeight);
  ctx.strokeStyle = '#6b4a2d'; ctx.lineWidth = 2; ctx.strokeRect(signX, signY, signWidth, signHeight);
  text(building.label, building.x + building.w / 2, signY + 14, fontSize, '#4a2d1d');
}
function drawBuildingRoof(building: LocationDefinition) {
  ctx.fillStyle = '#4d2e20'; ctx.beginPath();
  ctx.moveTo(building.x - 10, building.y); ctx.lineTo(building.x + building.w / 2, building.y - 38); ctx.lineTo(building.x + building.w + 10, building.y); ctx.fill();
  ctx.fillRect(building.x - 10, building.y - 3, building.w + 20, 7);
}
function drawGroundBackground() {
  ctx.fillStyle = currentMap.background; ctx.fillRect(0, 0, currentMap.size.w, currentMap.size.h);
}
function drawTerrainDecor() {
  currentMap.terrain.forEach(drawTerrain);
  if (currentMap.terrainStyle === 'outdoor') {
    // Only consider procedural trees near the camera. This keeps the denser expanded woods mobile-friendly.
    const margin = 90, spacing = 90;
    const minX = Math.max(45, Math.floor((camera.x - margin) / spacing) * spacing + 45);
    const maxX = Math.min(currentMap.size.w, camera.x + canvas.width + margin);
    const minY = Math.max(55, Math.floor((camera.y - margin) / spacing) * spacing + 55);
    const maxY = Math.min(currentMap.size.h, camera.y + canvas.height + margin);
    const protectedThings: Rect[] = [...currentMap.buildings, ...currentMap.walls, ...currentMap.npcs, ...currentMap.items, ...currentMap.interactables, ...currentMap.exits, ...currentMap.hazards];
    for (let x = minX; x < maxX; x += spacing) for (let y = minY; y < maxY; y += spacing) {
      const tree = { x: x - 25, y: y - 30, w: 50, h: 65 };
      const inWoods = currentMap.terrain.some(feature => feature.kind === 'woods' && intersects(tree, feature));
      const onClearedTerrain = currentMap.terrain.some(feature => feature.kind !== 'woods' && intersects(tree, feature));
      const nearContent = protectedThings.some(thing => intersects(tree, { x: thing.x - 18, y: thing.y - 18, w: thing.w + 36, h: thing.h + 36 }));
      const densityPick = Math.abs((x * 17 + y * 29) % 11);
      if (!onClearedTerrain && !nearContent && (inWoods ? densityPick !== 0 : densityPick < 3)) drawTree(x, y);
    }
  }
  if (currentMap.terrainStyle === 'interior') { ctx.fillStyle = '#665448'; currentMap.walls.forEach(wall => ctx.fillRect(wall.x, wall.y, wall.w, wall.h)); }
}
function drawBelowActors() {
  currentMap.buildings.forEach(drawBuildingBody);
  const bridge = currentMap.interactables.find(({ id }) => id === 'blockedBridgeMessage'); if (bridge) { ctx.fillStyle = '#6d4b2f'; ctx.fillRect(bridge.x + 35, bridge.y + 35, 70, 95); if (!isBridgeUnlocked()) { ctx.fillStyle = '#d65b38'; for (let i = 0; i < 4; i++) ctx.fillRect(bridge.x + 40 + i * 18, bridge.y + 40, 9, 85); text('BRIDGE CLOSED · DAY 1', bridge.x + bridge.w / 2, bridge.y + bridge.h + 14, 12, '#ffd76d'); } }
  const teaser = currentMap.interactables.find(({ id }) => id === 'back40TeaserMessage'); if (teaser && isBridgeUnlocked()) { ctx.fillStyle = '#f5e6b8'; ctx.fillRect(teaser.x, teaser.y, teaser.w, teaser.h); ctx.strokeStyle = '#d65b38'; ctx.lineWidth = 4; ctx.strokeRect(teaser.x, teaser.y, teaser.w, teaser.h); text('UNDER CONSTRUCTION', teaser.x + teaser.w / 2, teaser.y + 27, 11, '#a43f28'); text('BACK 40 COMING SOON!', teaser.x + teaser.w / 2, teaser.y + 47, 10, '#a43f28'); }
  const cliffSign = currentMap.interactables.find(({ id }) => id === 'cliffSign'); if (cliffSign && !drawSprite(ctx, assets, 'cliffSign', cliffSign)) { ctx.fillStyle = '#fff'; ctx.fillRect(cliffSign.x, cliffSign.y, cliffSign.w, 92); ctx.strokeStyle = '#111'; ctx.lineWidth = 4; ctx.strokeRect(cliffSign.x, cliffSign.y, cliffSign.w, 92); text('BEWARE', cliffSign.x + 37, cliffSign.y + 21, 10, '#e33'); text('of', cliffSign.x + 37, cliffSign.y + 38, 9, '#e33'); text('CLIFF!', cliffSign.x + 37, cliffSign.y + 57, 11, '#e33'); }
  const flagpole = currentMap.interactables.find(({ id }) => id === 'flagpole'); if (flagpole) { ctx.fillStyle = '#d8dfd2'; ctx.fillRect(flagpole.x + 18, flagpole.y, 5, flagpole.h); ctx.fillStyle = '#f5e6b8'; ctx.fillRect(flagpole.x + 7, flagpole.y + flagpole.h - 8, 28, 8); ctx.fillStyle = '#d6533d'; ctx.beginPath(); ctx.moveTo(flagpole.x + 23, flagpole.y + 8); ctx.lineTo(flagpole.x + 60, flagpole.y + 20); ctx.lineTo(flagpole.x + 23, flagpole.y + 34); ctx.fill(); text('FLAGPOLE', flagpole.x + 21, flagpole.y + flagpole.h + 14, 10, '#fff3ae'); }
  currentMap.interactables.filter(({ kind }) => kind === 'task-location').forEach(spot => { ctx.strokeStyle = '#f8e278'; ctx.lineWidth = 4; ctx.strokeRect(spot.x, spot.y, spot.w, spot.h); text(spot.label, spot.x + spot.w / 2, spot.y - 8, 10, '#fff3ae'); });
}
function drawActors() {
  currentMap.hazards.forEach(hazard => { if (hazard.assetId && drawSprite(ctx, assets, hazard.assetId, hazard)) { text(hazard.label, hazard.x + hazard.w / 2, hazard.y - 5, 10, '#e9dcaf'); return; } ctx.globalAlpha = .7; ctx.fillStyle = hazard.kind === 'mud' ? '#69553c' : hazard.kind === 'wet' || hazard.kind === 'water' ? '#68a9c7' : '#738044'; ctx.beginPath(); ctx.ellipse(hazard.x + hazard.w / 2, hazard.y + hazard.h / 2, hazard.w / 2, hazard.h / 2, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; });
  currentMap.items.filter(({ done }) => !done).forEach(item => { if (item.assetId && drawSprite(ctx, assets, item.assetId, item)) { text(item.label, item.x + item.w / 2, item.y - 6, 10, '#fff3ae'); return; } ctx.fillStyle = item.id === 'crate' ? '#c58a45' : '#ffe16b'; ctx.fillRect(item.x, item.y, item.w, item.h); });
  currentMap.npcs.forEach(npc => { ctx.fillStyle = npc.id === 'cliff' ? '#342c43' : npc.id === 'crazyjoe' ? '#cf6f38' : '#386d95'; ctx.beginPath(); ctx.arc(npc.x + npc.w / 2, npc.y + 10, 10, 0, 7); ctx.fill(); ctx.fillRect(npc.x, npc.y + 18, npc.w, npc.h - 18); text(npc.label, npc.x + npc.w / 2, npc.y - 7, 11, npc.id === 'cliff' ? '#b8a5c7' : '#fff'); });
  if (!drawSprite(ctx, assets, 'player', player, { width: 24, height: 38, offsetY: 4 })) { ctx.fillStyle = '#edb13d'; ctx.beginPath(); ctx.arc(player.x + 12, player.y + 9, 10, 0, 7); ctx.fill(); ctx.fillStyle = '#d95637'; ctx.fillRect(player.x, player.y + 18, 24, 12); } text('YOU', player.x + 12, player.y - 6, 10, '#fff');
}
function drawAboveActors() {
  if (currentMap.terrainStyle === 'outdoor') currentMap.buildings.forEach(drawBuildingRoof);
  currentMap.buildings.forEach(drawBuildingSign);
}
function drawObjectiveArrow() {
  if (dialogueOpen || inspectionOpen) return;
  const task = activeTask();
  const resolved = task && resolveObjectiveTarget(task);
  if (!resolved || resolved.mapId !== currentMap.id) return;

  const playerCenter = { x: player.x + player.w / 2, y: player.y + player.h / 2 };
  const targetCenter = { x: resolved.target.x + resolved.target.w / 2, y: resolved.target.y + resolved.target.h / 2 };
  const dx = targetCenter.x - playerCenter.x, dy = targetCenter.y - playerCenter.y;
  const distance = Math.hypot(dx, dy);
  const targetScreen = { x: targetCenter.x - camera.x, y: targetCenter.y - camera.y };
  const closeDistance = 180;
  if (distance <= closeDistance) return;

  const inset = 42;
  const arrowX = Math.max(inset, Math.min(canvas.width - inset, targetScreen.x));
  const arrowY = Math.max(inset, Math.min(canvas.height - inset, targetScreen.y));
  const angle = Math.atan2(dy, dx);
  ctx.save(); ctx.translate(arrowX, arrowY); ctx.rotate(angle);
  ctx.fillStyle = '#19301d'; ctx.beginPath(); ctx.moveTo(19, 0); ctx.lineTo(-11, -14); ctx.lineTo(-5, 0); ctx.lineTo(-11, 14); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffd65a'; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -10); ctx.lineTo(-3, 0); ctx.lineTo(-8, 10); ctx.closePath(); ctx.fill(); ctx.restore();

  ctx.font = '900 11px Nunito';
  const labelWidth = Math.min(150, ctx.measureText(resolved.label).width + 14);
  const labelX = Math.max(labelWidth / 2 + 4, Math.min(canvas.width - labelWidth / 2 - 4, arrowX));
  const labelY = Math.max(17, Math.min(canvas.height - 7, arrowY + 27));
  ctx.fillStyle = '#19301de8'; ctx.fillRect(labelX - labelWidth / 2, labelY - 14, labelWidth, 18);
  text(resolved.label, labelX, labelY, 11, '#fff3ae');
}
function drawTitleScreen() {
  const { total, settled } = loadingProgress;
  const ratio = total ? settled / total : 0;
  const centerX = canvas.width / 2;
  ctx.fillStyle = '#102d20'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#173b2a'; ctx.fillRect(36, 34, canvas.width - 72, canvas.height - 68);
  ctx.strokeStyle = '#477c46'; ctx.lineWidth = 5; ctx.strokeRect(44, 42, canvas.width - 88, canvas.height - 84);
  text('CAMP QUEST', centerX, 190, 54, '#ffd65a');
  text('SERVICE CREW', centerX, 245, 40, '#fff8df');
  text('Brigade Camp at Stony Glen', centerX, 285, 20, '#9bd16f');
  ctx.fillStyle = '#081d13'; ctx.fillRect(centerX - 250, 345, 500, 30);
  ctx.fillStyle = '#ffd65a'; ctx.fillRect(centerX - 244, 351, 488 * ratio, 18);
  text(gamePhase === 'loading' ? `Loading ${settled}/${total}…` : 'Camp is ready!', centerX, 410, 18);
  text(loadingTip, centerX, 460, 16, '#cde5b1');
  if (gamePhase === 'ready') {
    text('Tap to Start', centerX, 530, 28, '#ffd65a');
    text('Press Enter, Space, or Click to Start', centerX, 565, 15, '#fff8df');
  }
}
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (gamePhase !== 'playing') { drawTitleScreen(); return; }
  ctx.save(); ctx.translate(-camera.x, -camera.y);
  drawGroundBackground();
  drawTerrainDecor();
  drawBelowActors();
  drawActors();
  drawAboveActors();
  ctx.restore(); // DOM HUD, dialogue, inspection, and controls remain the UI/overlay layer.
  drawObjectiveArrow();
}
function startGame() {
  if (gamePhase !== 'ready') return;
  gamePhase = 'playing'; keys.clear(); actionQueued = false;
  document.querySelector('#game-shell')!.classList.remove('title-phase');
  showDialogue(mainCamp.npcs[0], dialogue.opening[0]); refreshUI();
}

let last = performance.now(); function loop(now: number) { const dt = Math.min((now - last) / 1000, .04); last = now; update(dt); if (gamePhase === 'playing' && toastTimer > 0 && (toastTimer -= dt) <= 0) ui.toast.classList.add('hidden'); draw(); requestAnimationFrame(loop); }
const keyMap: Record<string, string> = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
addEventListener('keydown', event => {
  if (gamePhase !== 'playing') { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); startGame(); } return; }
  if (keyMap[event.key]) { keys.add(keyMap[event.key]); event.preventDefault(); }
  if ([' ', 'e', 'E'].includes(event.key)) { actionQueued = true; event.preventDefault(); }
  if (event.key === 'Escape') { closeDialogue(); closeInspection(); }
});
addEventListener('keyup', event => { if (keyMap[event.key]) keys.delete(keyMap[event.key]); });
canvas.addEventListener('pointerdown', event => { if (gamePhase !== 'playing') { event.preventDefault(); startGame(); } });
document.querySelectorAll<HTMLButtonElement>('[data-dir]').forEach(button => { const dir = button.dataset.dir!; const on = (event: Event) => { event.preventDefault(); if (gamePhase !== 'playing') return; keys.add(dir); button.classList.add('pressed'); }, off = () => { keys.delete(dir); button.classList.remove('pressed'); }; button.addEventListener('pointerdown', on); button.addEventListener('pointerup', off); button.addEventListener('pointercancel', off); button.addEventListener('pointerleave', off); });
document.querySelector('#close-inspection')!.addEventListener('click', closeInspection); ui.inspection.addEventListener('click', event => { if (event.target === ui.inspection) closeInspection(); });
document.querySelector('#action-button')!.addEventListener('pointerdown', event => { event.preventDefault(); if (gamePhase === 'playing') actionQueued = true; }); document.querySelector('#checklist-button')!.addEventListener('click', () => { if (gamePhase === 'playing') ui.checklist.classList.toggle('open'); }); document.querySelector('#close-checklist')!.addEventListener('click', () => ui.checklist.classList.remove('open'));
document.querySelector('#game-shell')!.classList.add('title-phase');
refreshUI(); requestAnimationFrame(loop);
assets.loadAll(npcPortraitPaths, progress => { loadingProgress = progress; }).then(() => { gamePhase = 'ready'; });
