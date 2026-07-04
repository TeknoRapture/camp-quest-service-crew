import './style.css';
import { AssetLoader, type AssetId, type AssetProgress } from './assets';
import { drawSprite } from './sprites';
import { dialogue, dialogueTopics } from './content/dialogue';
import { getValidDialogueTopics, getValidNextDialogueTopics, meaningfulDialogueTopics, topLevelDialogueTopics, validateDialogueTopics, type DialogueContext } from './dialogueEngine';
import { maps, mainCamp } from './content/maps';
import { chooseLoadingTip } from './content/loadingTips';
import { createChecklistUi, type ChecklistUiController } from './checklistUi';
import { createInputController, type InputController } from './input';
import { routeWorldInteraction } from './interactionRouter';
import { createInventoryHelpers } from './inventory';
import { createWorldItems } from './worldItems';
import { createHudUi, type HudUiController } from './hudUi';
import { createInspectionUi, type InspectionUiController } from './inspectionUi';
import { blockedBridge } from './content/locations';
import { genericNpcPortrait, npcPortraitPaths } from './content/npcs';
import { skills } from './content/skills';
import { quests } from './content/quests';
import { applyQuestRewards, createQuestState, getTrackedObjective, handleNpcQuestInteraction, handleQuestEvent, isObjectiveComplete as isQuestObjectiveComplete, isObjectiveUnlocked as isQuestObjectiveUnlocked, validateQuestDefinitions, type NpcQuestInteractionResult } from './questEngine';
import type { DialogueEffect, DialogueSpeaker, DialogueTopic, InteractableDefinition, LocationDefinition, MapDefinition, NPCDefinition, ObjectiveDefinition, ObjectiveTargetType, QuestDefinition, QuestEvent, QuestEventResult, QuestId, Rect, SkillId, TerrainFeature, Thing } from './content/types';

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const ctx = canvas.getContext('2d')!;
const assets = new AssetLoader();
type GamePhase = 'loading' | 'ready' | 'playing';
let gamePhase: GamePhase = 'loading';
let loadingProgress: AssetProgress = { total: 0, settled: 0, loaded: 0, failed: 0 };
const loadingTip = chooseLoadingTip();
const ui = {
  objective: document.querySelector('#objective')!, energy: document.querySelector<HTMLElement>('#energy-bar')!,
  points: document.querySelector('#points')!, best: document.querySelector('#best')!, tasks: document.querySelector<HTMLElement>('#tasks')!,
  dialogue: document.querySelector<HTMLElement>('#dialogue')!, speaker: document.querySelector('#speaker')!, text: document.querySelector('#dialogue-text')!,
  portraitPanel: document.querySelector('#portrait-panel')!, portrait: document.querySelector<HTMLImageElement>('#dialogue-portrait')!,
  choices: document.createElement('div'), hint: document.querySelector('#dialogue small')!,
  toast: document.querySelector('#toast')!, checklist: document.querySelector<HTMLElement>('#checklist')!,
  inspection: document.querySelector('#image-inspection')!, inspectionImage: document.querySelector<HTMLImageElement>('#inspection-image')!,
  inspectionTitle: document.querySelector('#inspection-title')!, inspectionCaption: document.querySelector('#inspection-caption')!,
  inspectionFallback: document.querySelector('#inspection-fallback')!,
  carrySummary: document.querySelector('#carry-summary')!, dropButton: document.querySelector<HTMLButtonElement>('#drop-button')!,
  fullscreenButton: document.querySelector<HTMLButtonElement>('#fullscreen-button')!,
  controlModeToggle: document.querySelector<HTMLButtonElement>('#control-mode-toggle')!,
  joystick: document.querySelector<HTMLElement>('#joystick')!, joystickBase: document.querySelector<HTMLElement>('#joystick-base')!, joystickKnob: document.querySelector<HTMLElement>('#joystick-knob')!,
  checklistScrollUp: document.querySelector<HTMLButtonElement>('#checklist-scroll-up')!,
  checklistScrollDown: document.querySelector<HTMLButtonElement>('#checklist-scroll-down')!,
};

let currentMap: MapDefinition = mainCamp;
const start = currentMap.spawns.find(({ id }) => id === 'start')!;
const player = { x: start.x, y: start.y, w: 24, h: 30, speed: 185, energy: 100, points: 0 };
const camera = { x: 0, y: 0 };
const minimumGameplayViewport = { w: 320, h: 240 };
const bottomSafeViewportComfortPadding = { min: 24, preferredRatio: 0.05, max: 48 };
type SafeGameplayViewport = { x: number; y: number; w: number; h: number; bottomInset: number; bottomComfortPadding: number };
type CanvasContentRect = { left: number; top: number; right: number; bottom: number; width: number; height: number };
// TEMPORARY DEV/TESTING ONLY: set to false or remove when top-map water/gorge/climbing gates should use normal progression again.
const DEV_UNLOCK_TERRAIN_SKILLS = true;
function clampNumber(value: number, min: number, max: number) { return Math.max(min, Math.min(max, value)); }
function bottomComfortPadding(viewportHeight: number) {
  return clampNumber(viewportHeight * bottomSafeViewportComfortPadding.preferredRatio, bottomSafeViewportComfortPadding.min, bottomSafeViewportComfortPadding.max);
}
function clampCameraAxis(mapSize: number, viewportSize: number, desired: number) {
  if (mapSize <= viewportSize) return (mapSize - viewportSize) / 2;
  return Math.max(0, Math.min(mapSize - viewportSize, desired));
}
function renderedCanvasContentRect(): CanvasContentRect {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(rect.width / Math.max(1, canvas.width), rect.height / Math.max(1, canvas.height));
  const width = canvas.width * scale, height = canvas.height * scale;
  const left = rect.left + (rect.width - width) / 2, top = rect.top + (rect.height - height) / 2;
  return { left, top, right: left + width, bottom: top + height, width, height };
}
function visibleElementRect(element: HTMLElement) {
  const style = getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return;
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;
  return rect;
}
function bottomGameplayOverlayInset() {
  const contentRect = renderedCanvasContentRect();
  const cssToGameY = canvas.height / Math.max(1, contentRect.height);
  const overlaySelectors = [
    '#carry-summary', '.carry-summary',
    '#portrait-guidance:not(.dismissed)', '.right-control-gutter', '.left-control-gutter', 'footer', '.hud', '.objective',
  ];
  const seen = new Set<HTMLElement>();
  const bottomUiHeightCssPx = overlaySelectors.reduce((inset, selector) => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
    for (const element of elements) {
      if (seen.has(element) || element === canvas) continue;
      seen.add(element);
      const rect = visibleElementRect(element);
      if (!rect) continue;
      const overlapsCanvasContent = rect.bottom > contentRect.top && rect.top < contentRect.bottom && rect.right > contentRect.left && rect.left < contentRect.right;
      if (!overlapsCanvasContent) continue;
      const coveredCssPixels = Math.max(0, contentRect.bottom - Math.max(contentRect.top, rect.top));
      inset = Math.max(inset, coveredCssPixels);
    }
    return inset;
  }, 0);
  const bottomUiHeightGamePx = bottomUiHeightCssPx * cssToGameY;
  return clampNumber(bottomUiHeightGamePx, 0, canvas.height - minimumGameplayViewport.h);
}
let safeViewport: SafeGameplayViewport = { x: 0, y: 0, w: canvas.width, h: canvas.height, bottomInset: 0, bottomComfortPadding: 0 };
function recalculateSafeViewport() {
  const contentRect = renderedCanvasContentRect();
  const cssToGameX = canvas.width / Math.max(1, contentRect.width);
  const cssToGameY = canvas.height / Math.max(1, contentRect.height);
  const bottomInset = bottomGameplayOverlayInset();
  const measuredViewportHeight = Math.min(canvas.height, contentRect.height * cssToGameY) - bottomInset;
  const bottomPadding = bottomComfortPadding(measuredViewportHeight);
  safeViewport = {
    x: 0,
    y: 0,
    w: Math.max(minimumGameplayViewport.w, Math.min(canvas.width, contentRect.width * cssToGameX)),
    h: Math.max(minimumGameplayViewport.h, measuredViewportHeight - bottomPadding),
    bottomInset,
    bottomComfortPadding: bottomPadding,
  };
  return safeViewport;
}
function gameplayViewport(): SafeGameplayViewport { return safeViewport; }
function recalculateLayoutAndCamera() { recalculateSafeViewport(); updateCamera(); }
let layoutTimeout: number | undefined;
function scheduleLayoutRecalculation() {
  recalculateLayoutAndCamera();
  requestAnimationFrame(() => {
    recalculateLayoutAndCamera();
    requestAnimationFrame(recalculateLayoutAndCamera);
  });
  if (layoutTimeout !== undefined) window.clearTimeout(layoutTimeout);
  layoutTimeout = window.setTimeout(recalculateLayoutAndCamera, 180);
}
function updateCamera() {
  const viewport = gameplayViewport();
  camera.x = clampCameraAxis(currentMap.size.w, viewport.w, player.x + player.w / 2 - viewport.w / 2);
  camera.y = clampCameraAxis(currentMap.size.h, viewport.h, player.y + player.h / 2 - viewport.h / 2);
}
let input: InputController;
let checklistUi: ChecklistUiController;
let hudUi: HudUiController;
let inspectionUi: InspectionUiController;
let actionQueued = false, dialogueOpen = false, toastTimer = 0, hazardTick = 0, transitionCooldown = 0;
let blockedSkillMessageCooldown = 0, lastBlockedTerrainId = '';
type DialogueUiState = { mode: 'closed' } | { mode: 'choosingTopic'; speaker: DialogueSpeaker; topics: DialogueTopic[]; selectedIndex: number } | { mode: 'showingResponse'; speaker: DialogueSpeaker; topicId?: string; response: string; followUpTopics?: DialogueTopic[]; selectedIndex?: number };
let dialogueUiState: DialogueUiState = { mode: 'closed' };
const state = {
  inventory: { items: {} as Record<string, number>, largePickupOrder: [] as string[] }, rewardedPickups: new Set<string>(), delivered: false, bridge: false,
  quests: createQuestState(quests),
  dialogue: { flags: {} as Record<string, boolean | string | number>, seenTopicIds: new Set<string>() },
  skills: { nature: false, swimming: false, climbing: false } as Record<SkillId, boolean>,
};
ui.choices.className = 'dialogue-choices';
ui.choices.setAttribute('aria-label', 'Dialogue topics');
ui.text.insertAdjacentElement('afterend', ui.choices);

const worldItems = createWorldItems(maps);
const allItems = worldItems.allItemTemplates;
const allNpcs = Object.values(maps).flatMap(map => map.npcs);
const questValidationIssues = validateQuestDefinitions(quests, { npcs: allNpcs, items: allItems, maps });
if (questValidationIssues.length) console.warn('Quest definition validation issues:', questValidationIssues);
const dialogueValidationIssues = validateDialogueTopics(dialogueTopics, { npcs: allNpcs, quests, items: allItems, maps });
if (dialogueValidationIssues.length) console.warn('Dialogue topic validation issues:', dialogueValidationIssues);
const itemById = worldItems.itemById;
function currentItems() { return worldItems.itemsForMap(currentMap.id); }
const inventory = createInventoryHelpers(state.inventory, itemById);

function buildingCollisionRect(building: LocationDefinition): Rect {
  const frontOverlap = Math.max(0, Math.min(building.h, building.frontOverlap ?? currentMap.buildingFrontOverlap ?? 0));
  return { x: building.x, y: building.y, w: building.w, h: building.h - frontOverlap };
}
function isBridgeUnlocked() { return quests.some(quest => quest.objectives.some(objective => objective.type === 'completeInteraction' && objective.interactableId === 'back40TeaserMessage' && (isObjectiveComplete(quest.id, objective.id) || isObjectiveUnlocked(quest.id, objective)))); }
function obstacles() { return [...currentMap.buildings.map(buildingCollisionRect), ...currentMap.walls.filter(wall => wall !== blockedBridge || !isBridgeUnlocked())]; }
function hasSkill(skillId: SkillId) { return DEV_UNLOCK_TERRAIN_SKILLS && (skillId === 'swimming' || skillId === 'climbing') ? true : state.skills[skillId]; }
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
function isObjectiveComplete(questId: string, objectiveId: string) { return isQuestObjectiveComplete(state.quests, questId, objectiveId); }
function isObjectiveUnlocked(questId: string, objective: ObjectiveDefinition) {
  const quest = quests.find(candidate => candidate.id === questId);
  return quest ? isQuestObjectiveUnlocked(state.quests, quest, objective) : false;
}
function activeTask() { return getTrackedObjective(quests, state.quests); }
function isQuestTrackable(quest: QuestDefinition) {
  return state.quests.questStatuses[quest.id] === 'active' && Boolean(getTrackedObjective([quest], state.quests));
}
function objective() { return activeTask()?.objective.label ?? 'Report to the Rally Circle'; }
function trackQuest(questId: QuestId) {
  const quest = quests.find(candidate => candidate.id === questId);
  if (!quest || !isQuestTrackable(quest)) return;
  state.quests.trackedQuestId = state.quests.trackedQuestId === questId ? undefined : questId;
  refreshUI();
}
function processQuestEvent(event: QuestEvent) {
  const result = handleQuestEvent(state.quests, quests, event);
  applyQuestRewards(state.quests, result, { addScore: award, showToast: toast, unlockSkill: skillId => { if (skillId in state.skills) state.skills[skillId as SkillId] = true; } });
  return result;
}
function processNpcQuestInteraction(npc: NPCDefinition) {
  const result = handleNpcQuestInteraction(state.quests, allNpcs, quests, npc.id, currentMap.id);
  applyQuestRewards(state.quests, result, { addScore: award, showToast: toast, unlockSkill: skillId => { if (skillId in state.skills) state.skills[skillId as SkillId] = true; } });
  return result;
}

function completedObjectiveDialogue(result: QuestEventResult) {
  for (const completed of result.completedObjectives) {
    const quest = quests.find(candidate => candidate.id === completed.questId);
    const objective = quest?.objectives.find(candidate => candidate.id === completed.objectiveId);
    if (objective?.completionDialogue) return objective.completionDialogue;
  }
}

function npcHasCompletedTalkObjective(npc: NPCDefinition) {
  return quests.some(quest => quest.objectives.some(objective => objective.type === 'talkToNpc' && objective.npcId === npc.id && isObjectiveComplete(quest.id, objective.id)));
}

function resolveNpcDialogue(npc: NPCDefinition, result: NpcQuestInteractionResult) {
  const completionLine = completedObjectiveDialogue(result);
  if (completionLine) return completionLine;
  const lines = dialogue[npc.dialogueId] ?? [];
  if (result.completedQuests.length > 0 && lines[1]) return lines[1];
  if (result.startedQuestIds.length > 0 && lines[1]) return lines[1];
  if (npcHasCompletedTalkObjective(npc) && lines[1]) return lines[1];
  return lines[0] ?? 'Service Crew is on it!';
}

function completeBridgeObjective() {
  if (state.bridge || !isBridgeUnlocked()) return false;
  const result = processQuestEvent({ type: 'interactionCompleted', interactableId: 'back40TeaserMessage', mapId: currentMap.id });
  if (!result.completedObjectives.length) return false;
  state.bridge = true; toast('Under Construction: Back 40 coming soon! +50 SP'); refreshUI(); return true;
}

function cleanTargetObjectiveFor(targetId: string) {
  return quests.flatMap(quest => quest.objectives.map(objective => ({ quest, objective })))
    .find(({ objective }) => objective.type === 'cleanTarget' && objective.targetId === targetId && (!objective.mapId || objective.mapId === currentMap.id));
}
function tryCleanTarget(target: InteractableDefinition) {
  const match = cleanTargetObjectiveFor(target.id);
  if (!match) return false;
  if (isObjectiveComplete(match.quest.id, match.objective.id)) { toast('Already clean! This spot is ready for inspection and/or dramatic sparkle noises.'); return true; }
  if (!inventory.hasItem('bathroomMop')) { toast('You need the blue bathroom mop for this job.'); return true; }
  if (state.quests.questStatuses[match.quest.id] !== 'active' || !isObjectiveUnlocked(match.quest.id, match.objective)) {
    toast('This cleaning spot is on the checklist, but Coop has not released that job yet. Finish the current supply steps first.'); return true;
  }
  const result = processQuestEvent({ type: 'cleanTargetCompleted', targetId: target.id, mapId: currentMap.id });
  if (!result.completedObjectives.length) { toast('This spot resisted the paperwork. Try the current checklist target first.'); return true; }
  refreshUI(); return true;
}
function resolveObjectiveTarget(task: ObjectiveDefinition) {
  const objectiveTarget = task.arrowTarget ?? task.target;
  if (!objectiveTarget) return;
  const targetMap = maps[objectiveTarget.mapId ?? mainCamp.id];
  if (!targetMap) return;
  const collections: Record<ObjectiveTargetType, Thing[]> = {
    item: targetMap.items, npc: targetMap.npcs, interactable: targetMap.interactables, exit: targetMap.exits, zone: targetMap.zones, location: targetMap.buildings,
  };
  const target = collections[objectiveTarget.type].find(({ id }) => id === objectiveTarget.id);
  if (!target) return;
  return { target, mapId: targetMap.id, label: objectiveTarget.label ?? target.label };
}
function refreshUI() {
  const lastLargeItemId = inventory.lastLargeItemId();
  hudUi.refreshHud({
    energy: player.energy,
    points: player.points,
    best: Number(safeStorageGet('campQuestBest') || 0),
    mapDisplayName: currentMap.displayName,
    objective: objective(),
    largeLabels: inventory.visibleLabels('large'),
    trayLabels: inventory.visibleLabels('tray'),
    smallLabels: inventory.visibleLabels('small'),
    lastLargeItemId,
    lastLargeCarrySize: inventory.carrySize(lastLargeItemId ?? ''),
    canDropLargeItem: inventory.canDropLargeItem(),
  });
  checklistUi.refresh();
}
function setDialogueSpeaker(speaker: DialogueSpeaker) {
  const displayName = speaker.displayName ?? speaker.label ?? 'Camp Staff';
  dialogueOpen = true; ui.speaker.textContent = displayName;
  ui.dialogue.style.setProperty('--dialogue-accent', speaker.accent ?? '#a43f28');
  ui.dialogue.classList.remove('portrait-missing'); ui.portraitPanel.classList.remove('hidden'); ui.portrait.alt = `Portrait of ${displayName}`;
  ui.portrait.onerror = () => { ui.dialogue.classList.add('portrait-missing'); ui.portraitPanel.classList.add('hidden'); ui.portrait.removeAttribute('src'); };
  ui.portrait.src = speaker.portraits?.default ?? genericNpcPortrait; ui.dialogue.classList.remove('hidden');
}
function renderDialogueTopicButtons(topics: DialogueTopic[], onSelect: (topic: DialogueTopic) => void) {
  ui.choices.replaceChildren(...topics.map((topic, index) => {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = topic.label; button.dataset.topicId = topic.id;
    button.addEventListener('click', () => onSelect(topic));
    if (index === 0) button.classList.add('selected');
    return button;
  }));
  if (topics.length) focusDialogueChoice(0);
}
function showDialogue(speaker: DialogueSpeaker, text: string, topicId?: string, followUpTopics: DialogueTopic[] = []) {
  setDialogueSpeaker(speaker); dialogueUiState = { mode: 'showingResponse', speaker, topicId, response: text, followUpTopics, selectedIndex: 0 };
  ui.text.textContent = text;
  if (followUpTopics.length) {
    renderDialogueTopicButtons(followUpTopics, topic => runDialogueTopic(speaker, topic, false));
    ui.hint.textContent = 'Choose a follow-up · Escape closes';
  } else {
    ui.choices.replaceChildren(); ui.hint.textContent = 'Tap ACTION to continue';
  }
}
function closeDialogue() { dialogueOpen = false; dialogueUiState = { mode: 'closed' }; ui.choices.replaceChildren(); ui.dialogue.classList.add('hidden'); }
function focusDialogueChoice(index: number) {
  const buttons = Array.from(ui.choices.querySelectorAll<HTMLButtonElement>('button'));
  buttons[index]?.focus({ preventScroll: true });
}
function showTopicChoices(speaker: DialogueSpeaker, topics: DialogueTopic[]) {
  setDialogueSpeaker(speaker); dialogueUiState = { mode: 'choosingTopic', speaker, topics, selectedIndex: 0 };
  ui.text.textContent = 'What do you want to ask?'; ui.hint.textContent = 'Choose a topic · Escape closes';
  renderDialogueTopicButtons(topics, topic => runDialogueTopic(speaker, topic));
}
function updateTopicSelection(delta: 1 | -1) {
  if (dialogueUiState.mode !== 'choosingTopic' && !(dialogueUiState.mode === 'showingResponse' && dialogueUiState.followUpTopics?.length)) return false;
  const topics = dialogueUiState.mode === 'choosingTopic' ? dialogueUiState.topics : dialogueUiState.followUpTopics ?? [];
  const selectedIndex = dialogueUiState.selectedIndex ?? 0;
  const nextIndex = (selectedIndex + delta + topics.length) % topics.length;
  dialogueUiState.selectedIndex = nextIndex;
  Array.from(ui.choices.querySelectorAll<HTMLButtonElement>('button')).forEach((button, index) => button.classList.toggle('selected', index === nextIndex));
  focusDialogueChoice(nextIndex); return true;
}
function selectHighlightedTopic() {
  if (dialogueUiState.mode === 'choosingTopic') { runDialogueTopic(dialogueUiState.speaker, dialogueUiState.topics[dialogueUiState.selectedIndex]); return true; }
  if (dialogueUiState.mode === 'showingResponse' && dialogueUiState.followUpTopics?.length) { runDialogueTopic(dialogueUiState.speaker, dialogueUiState.followUpTopics[dialogueUiState.selectedIndex ?? 0], false); return true; }
  return false;
}
function applyDialogueEffect(effect: DialogueEffect) {
  if (effect.type === 'emitQuestEvent') return processQuestEvent(effect.event);
  if (effect.type === 'runNpcQuestInteraction') {
    const npc = effect.npcId ? allNpcs.find(candidate => candidate.id === effect.npcId) : undefined;
    if (npc) return processNpcQuestInteraction(npc);
    return;
  }
  if (effect.type === 'setDialogueFlag') { state.dialogue.flags[effect.flag] = effect.value ?? true; return; }
  if (effect.type === 'setQuestFlag') { state.quests.flags[effect.flag] = effect.value ?? true; return processQuestEvent({ type: 'questFlagSet', flag: effect.flag }); }
  if (effect.type === 'showToast') { toast(effect.text); return; }
}
function dialogueContext(npc: NPCDefinition): DialogueContext {
  return { npc, mapId: currentMap.id, npcs: allNpcs, quests, questState: state.quests, dialogueState: state.dialogue, heldItemCount: inventory.itemCount };
}
function runDialogueTopic(speaker: DialogueSpeaker, topic: DialogueTopic, allowFollowUps = true) {
  for (const effect of topic.effects ?? []) applyDialogueEffect(effect);
  state.dialogue.seenTopicIds.add(topic.id);
  const npc = 'id' in speaker ? allNpcs.find(candidate => candidate.id === speaker.id) : undefined;
  const followUpTopics = allowFollowUps && npc ? getValidNextDialogueTopics(dialogueTopics, topic, dialogueContext(npc)) : [];
  showDialogue(speaker, topic.response, topic.id, followUpTopics); refreshUI();
}
function startNpcDialogue(npc: NPCDefinition) {
  const topics = getValidDialogueTopics(dialogueTopics, dialogueContext(npc));
  const meaningfulTopics = meaningfulDialogueTopics(topLevelDialogueTopics(topics));
  if (meaningfulTopics.length > 1 || meaningfulTopics.some(topic => topic.nextTopicIds?.length)) { showTopicChoices(npc, meaningfulTopics); return; }
  if (meaningfulTopics.length === 1) { runDialogueTopic(npc, meaningfulTopics[0]); return; }
  const defaultTopic = topics.find(topic => topic.isDefault);
  if (defaultTopic) { runDialogueTopic(npc, defaultTopic); return; }
  const result = processNpcQuestInteraction(npc);
  showDialogue(npc, resolveNpcDialogue(npc, result)); refreshUI();
}
function inspectImage(title: string, assetId: AssetId, caption: string) {
  inspectionUi.open(title, assets.url(assetId), caption);
}
function closeInspection() { inspectionUi.close(); }
function toast(text: string) { hudUi.showToast(text); toastTimer = 2.8; }
function dist(a: Rect, b: Rect) { return Math.hypot(a.x + a.w / 2 - b.x - b.w / 2, a.y + a.h / 2 - b.y - b.h / 2); }
function intersects(a: Rect, b: Rect) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function safeStorageGet(key: string) { try { return localStorage.getItem(key); } catch { return null; } }
function safeStorageSet(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* Ignore storage failures; controls keep their in-memory fallback. */ } }
function award(points: number) { player.points += points; safeStorageSet('campQuestBest', String(Math.max(player.points, Number(safeStorageGet('campQuestBest') || 0)))); }
function switchMap(exit: InteractableDefinition) {
  const nextMap = exit.targetMapId ? maps[exit.targetMapId] : undefined;
  const spawn = nextMap?.spawns.find(({ id }) => id === exit.targetSpawnId);
  if (!nextMap || !spawn) { toast('That route is not ready yet.'); return; }
  currentMap = nextMap; player.x = spawn.x; player.y = spawn.y; input.clearMovementInput(); transitionCooldown = .45;
  processQuestEvent({ type: 'mapEntered', mapId: currentMap.id, spawnId: spawn.id });
  scheduleLayoutRecalculation(); toast(`Entered ${currentMap.displayName}`); refreshUI();
}
function tryAutomaticExit() {
  if (transitionCooldown > 0) return false;
  const exit = currentMap.exits.find(candidate => candidate.activation === 'automatic' && intersects(player, candidate));
  if (!exit) return false;
  switchMap(exit); return true;
}
function interact() {
  if (inspectionUi.isOpen()) { closeInspection(); return; }
  if (dialogueOpen) { if (!selectHighlightedTopic()) closeDialogue(); return; }
  routeWorldInteraction({
    currentMap,
    player,
    state,
    quests,
    currentItems,
    dist,
    inventory,
    isBridgeUnlocked,
    isObjectiveUnlocked,
    processQuestEvent,
    switchMap,
    completeBridgeObjective,
    tryCleanTarget,
    startNpcDialogue,
    inspectImage,
    toast,
    refreshUI,
  });
}
function controlsBlocked() { return gamePhase !== 'playing' || dialogueOpen || inspectionUi.isOpen() || checklistUi.isOpen(); }
function dropLastLargeItem() {
  const id = inventory.lastLargeItemId(); if (!id) { toast('No bulky supply to set down.'); return; }
  const item = worldItems.dropItemOnMap(id, { mapId: currentMap.id, mapSize: currentMap.size, near: player }); if (!item) return;
  inventory.removeItem(id);
  toast(`${item.inventoryLabel ?? item.label} set down. Your mighty Service Crew arms thank you.`); refreshUI();
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
  if (dialogueOpen || inspectionUi.isOpen() || ui.checklist.classList.contains('open')) { input.resetJoystick(); return; }
  const { x, y, magnitude } = input.getMovementVector(); const len = Math.hypot(x, y) || 1;
  const hazard = currentMap.hazards.find(item => intersects(player, item)); const speed = player.speed * magnitude * (hazard && hazard.kind !== 'mosquitoes' ? .55 : 1); move(x / len * speed * dt, y / len * speed * dt);
  if (tryAutomaticExit()) return;
  const bridgeTeaser = currentMap.interactables.find(({ id }) => id === 'back40TeaserMessage');
  if (bridgeTeaser && intersects(player, bridgeTeaser)) completeBridgeObjective();
  hazardTick -= dt;
  if (hazard?.energyDamage && hazardTick <= 0) {
    const multiplier = hazard.mitigationSkill && hasSkill(hazard.mitigationSkill) ? hazard.mitigationMultiplier ?? 1 : 1;
    const damage = hazard.energyDamage * multiplier; player.energy = Math.max(0, player.energy - damage); hazardTick = hazard.damageInterval ?? .5;
    toast(`${hazard.damageMessage ?? hazard.label} Energy -${damage}`); refreshUI();
  }
  updateCamera();
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
    const viewport = gameplayViewport();
    const maxX = Math.min(currentMap.size.w, camera.x + viewport.w + margin);
    const minY = Math.max(55, Math.floor((camera.y - margin) / spacing) * spacing + 55);
    const maxY = Math.min(currentMap.size.h, camera.y + viewport.h + margin);
    const protectedThings: Rect[] = [...currentMap.buildings, ...currentMap.walls, ...currentMap.npcs, ...currentItems(), ...currentMap.interactables, ...currentMap.exits, ...currentMap.hazards];
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
  const flagpole = currentMap.interactables.find(({ id }) => id === 'flagpole'); if (flagpole) {
    ctx.fillStyle = '#d8dfd2'; ctx.fillRect(flagpole.x + 18, flagpole.y, 5, flagpole.h);
    ctx.fillStyle = '#f5e6b8'; ctx.fillRect(flagpole.x + 7, flagpole.y + flagpole.h - 8, 28, 8);
    const flagX = flagpole.x + 23; const flagY = flagpole.y + 8; const flagW = 39; const stripeH = 4;
    ctx.fillStyle = '#f4f0df'; ctx.fillRect(flagX, flagY, flagW, stripeH * 7);
    ctx.fillStyle = '#c83f3f'; for (let stripe = 0; stripe < 7; stripe += 2) ctx.fillRect(flagX, flagY + stripe * stripeH, flagW, stripeH);
    ctx.fillStyle = '#31538b'; ctx.fillRect(flagX, flagY, 16, stripeH * 4);
    ctx.fillStyle = '#fff'; for (let starY = 0; starY < 3; starY++) for (let starX = 0; starX < 3; starX++) ctx.fillRect(flagX + 3 + starX * 5, flagY + 2 + starY * 5, 2, 2);
    ctx.strokeStyle = '#8e3333'; ctx.lineWidth = 1; ctx.strokeRect(flagX, flagY, flagW, stripeH * 7);
    text('FLAGPOLE', flagpole.x + 21, flagpole.y + flagpole.h + 14, 10, '#fff3ae');
  }
  currentMap.interactables.filter(({ kind }) => kind === 'task-location').forEach(spot => { ctx.strokeStyle = '#f8e278'; ctx.lineWidth = 4; ctx.strokeRect(spot.x, spot.y, spot.w, spot.h); text(spot.label, spot.x + spot.w / 2, spot.y - 8, 10, '#fff3ae'); });
}
function drawActors() {
  currentMap.hazards.forEach(hazard => { if (hazard.assetId && drawSprite(ctx, assets, hazard.assetId, hazard)) { text(hazard.label, hazard.x + hazard.w / 2, hazard.y - 5, 10, '#e9dcaf'); return; } ctx.globalAlpha = .7; ctx.fillStyle = hazard.kind === 'mud' ? '#69553c' : hazard.kind === 'wet' || hazard.kind === 'water' ? '#68a9c7' : '#738044'; ctx.beginPath(); ctx.ellipse(hazard.x + hazard.w / 2, hazard.y + hazard.h / 2, hazard.w / 2, hazard.h / 2, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; });
  currentItems().filter(({ done }) => !done).forEach(item => { if (item.assetId && drawSprite(ctx, assets, item.assetId, item)) { text(item.label, item.x + item.w / 2, item.y - 6, 10, '#fff3ae'); return; } ctx.fillStyle = item.id === 'crate' ? '#c58a45' : '#ffe16b'; ctx.fillRect(item.x, item.y, item.w, item.h); });
  currentMap.npcs.forEach(npc => { ctx.fillStyle = npc.id === 'cliff' ? '#342c43' : npc.id === 'crazyjoe' ? '#cf6f38' : '#386d95'; ctx.beginPath(); ctx.arc(npc.x + npc.w / 2, npc.y + 10, 10, 0, 7); ctx.fill(); ctx.fillRect(npc.x, npc.y + 18, npc.w, npc.h - 18); text(npc.label, npc.x + npc.w / 2, npc.y - 7, 11, npc.id === 'cliff' ? '#b8a5c7' : '#fff'); });
  if (!drawSprite(ctx, assets, 'player', player, { width: 24, height: 38, offsetY: 4 })) { ctx.fillStyle = '#edb13d'; ctx.beginPath(); ctx.arc(player.x + 12, player.y + 9, 10, 0, 7); ctx.fill(); ctx.fillStyle = '#d95637'; ctx.fillRect(player.x, player.y + 18, 24, 12); } text('YOU', player.x + 12, player.y - 6, 10, '#fff');
}
function drawAboveActors() {
  if (currentMap.terrainStyle === 'outdoor') currentMap.buildings.forEach(drawBuildingRoof);
  currentMap.buildings.forEach(drawBuildingSign);
}
function drawObjectiveArrow() {
  if (dialogueOpen || inspectionUi.isOpen()) return;
  const task = activeTask();
  const resolved = task && resolveObjectiveTarget(task.objective);
  if (!resolved || resolved.mapId !== currentMap.id) return;

  const playerCenter = { x: player.x + player.w / 2, y: player.y + player.h / 2 };
  const targetCenter = { x: resolved.target.x + resolved.target.w / 2, y: resolved.target.y + resolved.target.h / 2 };
  const dx = targetCenter.x - playerCenter.x, dy = targetCenter.y - playerCenter.y;
  const distance = Math.hypot(dx, dy);
  const viewport = gameplayViewport();
  const targetScreen = { x: viewport.x + targetCenter.x - camera.x, y: viewport.y + targetCenter.y - camera.y };
  const closeDistance = 180;
  if (distance <= closeDistance) return;

  const inset = 42;
  const arrowX = Math.max(viewport.x + inset, Math.min(viewport.x + viewport.w - inset, targetScreen.x));
  const arrowY = Math.max(viewport.y + inset, Math.min(viewport.y + viewport.h - inset, targetScreen.y));
  const angle = Math.atan2(dy, dx);
  ctx.save(); ctx.translate(arrowX, arrowY); ctx.rotate(angle);
  ctx.fillStyle = '#19301d'; ctx.beginPath(); ctx.moveTo(19, 0); ctx.lineTo(-11, -14); ctx.lineTo(-5, 0); ctx.lineTo(-11, 14); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffd65a'; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -10); ctx.lineTo(-3, 0); ctx.lineTo(-8, 10); ctx.closePath(); ctx.fill(); ctx.restore();

  ctx.font = '900 11px Nunito';
  const labelWidth = Math.min(150, ctx.measureText(resolved.label).width + 14);
  const labelX = Math.max(viewport.x + labelWidth / 2 + 4, Math.min(viewport.x + viewport.w - labelWidth / 2 - 4, arrowX));
  const labelY = Math.max(viewport.y + 17, Math.min(viewport.y + viewport.h - 7, arrowY + 27));
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
  const viewport = gameplayViewport();
  ctx.fillStyle = '#071b12'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.beginPath(); ctx.rect(viewport.x, viewport.y, viewport.w, viewport.h); ctx.clip();
  ctx.translate(viewport.x - camera.x, viewport.y - camera.y);
  drawGroundBackground();
  drawTerrainDecor();
  drawBelowActors();
  drawActors();
  drawAboveActors();
  ctx.restore(); // DOM HUD, dialogue, inspection, and controls remain the UI/overlay layer.
  drawObjectiveArrow();
}
async function requestGameFullscreen(showFailureMessage = false) {
  if (document.fullscreenElement) {
    try { await document.exitFullscreen(); } catch { if (showFailureMessage) toast('Could not exit fullscreen. Keep questing!'); }
    return;
  }
  const target = document.querySelector<HTMLElement>('#game-shell') ?? document.documentElement;
  if (!target.requestFullscreen) { if (showFailureMessage) toast('Fullscreen is unavailable here. Keep questing!'); return; }
  try { await target.requestFullscreen(); } catch { if (showFailureMessage) toast('Fullscreen was not allowed. Keep questing!'); }
}
function updateFullscreenButtonState() {
  const isFullscreen = Boolean(document.fullscreenElement);
  ui.fullscreenButton.textContent = isFullscreen ? 'Exit Fullscreen' : '⛶ Fullscreen';
  ui.fullscreenButton.setAttribute('aria-label', isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen');
  scheduleLayoutRecalculation();
}
function startGame() {
  if (gamePhase !== 'ready') return;
  requestGameFullscreen();
  gamePhase = 'playing'; input.clearMovementInput(); actionQueued = false;
  document.querySelector('#game-shell')!.classList.remove('title-phase');
  showDialogue(mainCamp.npcs[0], dialogue.opening[0]); refreshUI(); scheduleLayoutRecalculation();
}

let last = performance.now(); function loop(now: number) { const dt = Math.min((now - last) / 1000, .04); last = now; update(dt); if (gamePhase === 'playing' && toastTimer > 0 && (toastTimer -= dt) <= 0) hudUi.hideToast(); draw(); requestAnimationFrame(loop); }
inspectionUi = createInspectionUi({
  overlay: ui.inspection,
  image: ui.inspectionImage,
  title: ui.inspectionTitle,
  caption: ui.inspectionCaption,
  fallback: ui.inspectionFallback,
  closeButton: document.querySelector('#close-inspection')!,
}, {
  onOpen: () => input.clearMovementInput(),
});
hudUi = createHudUi({
  objective: ui.objective,
  energy: ui.energy,
  points: ui.points,
  best: ui.best,
  carrySummary: ui.carrySummary,
  dropButton: ui.dropButton,
  toast: ui.toast,
});
const directionButtons = document.querySelectorAll<HTMLButtonElement>('[data-dir]');
const actionButton = document.querySelector<HTMLButtonElement>('#action-button')!;
input = createInputController({
  elements: {
    canvas,
    shell: document.querySelector('#game-shell')!,
    directionButtons,
    actionButton,
    dropButton: ui.dropButton,
    controlModeToggle: ui.controlModeToggle,
    joystick: ui.joystick,
    joystickBase: ui.joystickBase,
    joystickKnob: ui.joystickKnob,
  },
  isPlaying: () => gamePhase === 'playing',
  controlsBlocked,
  onStartGame: startGame,
  onAction: () => { actionQueued = true; },
  onDrop: dropLastLargeItem,
  onEscape: () => { closeDialogue(); closeInspection(); },
  getDialogueKeyboardState: () => {
    if (dialogueUiState.mode === 'choosingTopic') return { mode: 'choosingTopic' };
    if (dialogueUiState.mode === 'showingResponse') return { mode: 'showingResponse', hasFollowUpTopics: Boolean(dialogueUiState.followUpTopics?.length) };
    return { mode: 'closed' };
  },
  onDialogueSelectionDelta: updateTopicSelection,
  onDialogueSelect: selectHighlightedTopic,
  onDialogueClose: closeDialogue,
  onLayoutMayNeedUpdate: scheduleLayoutRecalculation,
});
ui.fullscreenButton.addEventListener('click', () => requestGameFullscreen(true));
document.addEventListener('fullscreenchange', updateFullscreenButtonState);
const checklistButton = document.querySelector<HTMLButtonElement>('#checklist-button')!;
checklistUi = createChecklistUi({
  elements: {
    checklist: ui.checklist,
    tasks: ui.tasks,
    checklistButton,
    closeButton: document.querySelector('#close-checklist')!,
    scrollUpButton: ui.checklistScrollUp,
    scrollDownButton: ui.checklistScrollDown,
  },
  quests,
  getQuestState: () => state.quests,
  isObjectiveComplete,
  isObjectiveUnlocked,
  isQuestTrackable,
  onTrackQuest: trackQuest,
  onOpenChanged: () => { input.resetJoystick(); },
  canToggleOpen: () => gamePhase === 'playing',
});
document.querySelector('#dismiss-portrait-guidance')!.addEventListener('click', () => { document.querySelector('#portrait-guidance')!.classList.add('dismissed'); scheduleLayoutRecalculation(); });
document.querySelector('#game-shell')!.classList.add('title-phase');
recalculateLayoutAndCamera(); refreshUI(); requestAnimationFrame(loop);
assets.loadAll(npcPortraitPaths, progress => { loadingProgress = progress; }).then(() => { gamePhase = 'ready'; });
