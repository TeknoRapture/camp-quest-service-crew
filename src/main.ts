import './style.css';
import { AssetLoader, type AssetId, type AssetProgress } from './assets';
import { drawSprite } from './sprites';
import { dialogue, dialogueTopics } from './content/dialogue';
import { getValidDialogueTopics, getValidNextDialogueTopics, meaningfulDialogueTopics, topLevelDialogueTopics, validateDialogueTopics, type DialogueContext } from './dialogueEngine';
import { maps, mainCamp } from './content/maps';
import { chooseLoadingTip } from './content/loadingTips';
import { blockedBridge } from './content/locations';
import { genericNpcPortrait, npcPortraitPaths } from './content/npcs';
import { skills } from './content/skills';
import { quests } from './content/quests';
import { applyQuestRewards, createQuestState, getTrackedObjective, getVisibleObjectivesForQuest, getVisibleQuests, handleNpcQuestInteraction, handleQuestEvent, isObjectiveComplete as isQuestObjectiveComplete, isObjectiveUnlocked as isQuestObjectiveUnlocked, validateQuestDefinitions, type NpcQuestInteractionResult } from './questEngine';
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
  points: document.querySelector('#points')!, best: document.querySelector('#best')!, tasks: document.querySelector('#tasks')!,
  dialogue: document.querySelector<HTMLElement>('#dialogue')!, speaker: document.querySelector('#speaker')!, text: document.querySelector('#dialogue-text')!,
  portraitPanel: document.querySelector('#portrait-panel')!, portrait: document.querySelector<HTMLImageElement>('#dialogue-portrait')!,
  choices: document.createElement('div'), hint: document.querySelector('#dialogue small')!,
  toast: document.querySelector('#toast')!, checklist: document.querySelector('#checklist')!,
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
const keys = new Set<string>();
type MobileControlMode = 'dpad' | 'joystick';
const CONTROL_MODE_STORAGE_KEY = 'campQuestControlMode';
let mobileControlMode: MobileControlMode = 'dpad';
const joystickInput = { pointerId: null as number | null, active: false, centerX: 0, centerY: 0, vectorX: 0, vectorY: 0 };
let actionQueued = false, dialogueOpen = false, inspectionOpen = false, toastTimer = 0, hazardTick = 0, transitionCooldown = 0;
let blockedSkillMessageCooldown = 0, lastBlockedTerrainId = '';
type DialogueUiState = { mode: 'closed' } | { mode: 'choosingTopic'; speaker: DialogueSpeaker; topics: DialogueTopic[]; selectedIndex: number } | { mode: 'showingResponse'; speaker: DialogueSpeaker; topicId?: string; response: string; followUpTopics?: DialogueTopic[]; selectedIndex?: number };
let dialogueUiState: DialogueUiState = { mode: 'closed' };
const collapsedChecklistRows = new Set<string>();
const state = {
  inventory: { items: {} as Record<string, number> }, largePickupOrder: [] as string[], rewardedPickups: new Set<string>(), delivered: false, bridge: false,
  quests: createQuestState(quests),
  dialogue: { flags: {} as Record<string, boolean | string | number>, seenTopicIds: new Set<string>() },
  skills: { nature: false, swimming: false, climbing: false } as Record<SkillId, boolean>,
};
ui.choices.className = 'dialogue-choices';
ui.choices.setAttribute('aria-label', 'Dialogue topics');
ui.text.insertAdjacentElement('afterend', ui.choices);

const allItems = Object.values(maps).flatMap(map => map.items);
const allNpcs = Object.values(maps).flatMap(map => map.npcs);
const questValidationIssues = validateQuestDefinitions(quests, { npcs: allNpcs, items: allItems, maps });
if (questValidationIssues.length) console.warn('Quest definition validation issues:', questValidationIssues);
const dialogueValidationIssues = validateDialogueTopics(dialogueTopics, { npcs: allNpcs, quests, items: allItems, maps });
if (dialogueValidationIssues.length) console.warn('Dialogue topic validation issues:', dialogueValidationIssues);
const itemById = (id: string) => allItems.find(item => item.id === id);
const itemCount = (id: string) => state.inventory.items[id] ?? 0;
const hasItem = (id: string) => itemCount(id) > 0;
const carryType = (id: string) => itemById(id)?.carryType ?? 'small';
const carrySize = (id: string) => itemById(id)?.carrySize ?? 1;
const largeUnitsUsed = () => Object.entries(state.inventory.items).reduce((sum, [id, quantity]) => sum + (carryType(id) === 'large' ? carrySize(id) * quantity : 0), 0);
function canCarry(id: string) { return carryType(id) !== 'large' || largeUnitsUsed() + carrySize(id) <= 2; }
function addItem(id: string) { state.inventory.items[id] = itemCount(id) + 1; if (carryType(id) === 'large') state.largePickupOrder.push(id); }
function removeItem(id: string) { if (itemCount(id) <= 1) delete state.inventory.items[id]; else state.inventory.items[id]--; state.largePickupOrder = state.largePickupOrder.filter(carriedId => carriedId !== id || hasItem(id)); }
function visibleLabels(type: 'large' | 'tray' | 'small') { return Object.entries(state.inventory.items).flatMap(([id, quantity]) => { const item = itemById(id); if (!item || carryType(id) !== type || item.displayInInventory === false) return []; return Array(quantity).fill(item.inventoryLabel ?? item.label); }); }

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
function objective() { return activeTask()?.objective.label ?? 'Report to the Rally Circle'; }
function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}
function titleCaseQuestline(id: string) {
  return id.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[-_]+/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}
function questlineLabel(id: string) {
  const labels: Record<string, string> = {
    campErrands: 'Camp Errands',
    cliffTeaser: 'Cliff Mysteries',
    morningServiceCrew: 'Service Crew Duties',
  };
  return labels[id] ?? titleCaseQuestline(id);
}
function categoryLabel(category: QuestDefinition['category']) {
  const labels: Record<QuestDefinition['category'], string> = { main: 'Main', tutorial: 'Tutorial', side: 'Side', hidden: 'Secret Found' };
  return labels[category];
}
function categoryOrder(category: QuestDefinition['category']) {
  return ({ main: 0, tutorial: 1, side: 2, hidden: 3 })[category];
}
function progressForQuests(groupQuests: QuestDefinition[]) {
  let complete = 0, total = 0;
  for (const quest of groupQuests) {
    for (const objective of getVisibleObjectivesForQuest(state.quests, quest)) {
      if (objective.required === false || objective.isOptional) continue;
      total++;
      if (isObjectiveComplete(quest.id, objective.id)) complete++;
    }
  }
  return total ? `${complete}/${total}` : '';
}
function isQuestTrackable(quest: QuestDefinition) {
  return state.quests.questStatuses[quest.id] === 'active' && Boolean(getTrackedObjective([quest], state.quests));
}
function checklistToggle(key: string, label: string, depth: number, questsForProgress: QuestDefinition[]) {
  const collapsed = collapsedChecklistRows.has(key);
  const progress = progressForQuests(questsForProgress);
  const rowClass = depth === 0 ? 'quest-category-row' : 'questline-row';
  return `<li class="checklist-row checklist-toggle ${rowClass} depth-${depth}" data-action="toggle-checklist" data-key="${escapeHtml(key)}" role="button" tabindex="0"><span class="twisty">${collapsed ? '▸' : '▾'}</span><span>${escapeHtml(label)}</span>${progress ? `<b>${progress}</b>` : ''}</li>`;
}
function checklistQuestRow(quest: QuestDefinition, depth: number) {
  const trackable = isQuestTrackable(quest);
  const tracked = state.quests.trackedQuestId === quest.id && trackable;
  const progress = progressForQuests([quest]);
  const secret = quest.category === 'hidden' ? 'Secret Found: ' : '';
  return `<li class="checklist-row quest-row depth-${depth}${tracked ? ' tracked' : ''}${trackable ? ' trackable' : ''}" data-action="track-quest" data-quest-id="${escapeHtml(quest.id)}" role="${trackable ? 'button' : 'listitem'}" ${trackable ? 'tabindex="0"' : ''}><span class="twisty"></span><span>${tracked ? '★ ' : ''}${escapeHtml(secret + quest.title)}</span>${tracked ? '<em>Tracked</em>' : ''}${progress ? `<b>${progress}</b>` : ''}</li>`;
}
function renderChecklist() {
  const visibleQuests = [...getVisibleQuests(quests, state.quests)].sort((a, b) => categoryOrder(a.category) - categoryOrder(b.category) || (a.questlineId ?? '').localeCompare(b.questlineId ?? '') || (a.sequence ?? 9999) - (b.sequence ?? 9999) || a.title.localeCompare(b.title));
  const rows: string[] = [];
  const categories = [...new Set(visibleQuests.map(quest => quest.category))].sort((a, b) => categoryOrder(a) - categoryOrder(b));
  for (const category of categories) {
    const categoryQuests = visibleQuests.filter(quest => quest.category === category);
    const categoryKey = `category:${category}`;
    rows.push(checklistToggle(categoryKey, categoryLabel(category), 0, categoryQuests));
    if (collapsedChecklistRows.has(categoryKey)) continue;
    const questlines = [...new Set(categoryQuests.map(quest => quest.questlineId ?? 'misc'))].sort((a, b) => questlineLabel(a).localeCompare(questlineLabel(b)));
    for (const questlineId of questlines) {
      const questlineQuests = categoryQuests.filter(quest => (quest.questlineId ?? 'misc') === questlineId);
      const questlineKey = `questline:${category}:${questlineId}`;
      rows.push(checklistToggle(questlineKey, questlineLabel(questlineId), 1, questlineQuests));
      if (collapsedChecklistRows.has(questlineKey)) continue;
      for (const quest of questlineQuests) {
        rows.push(checklistQuestRow(quest, 2));
        for (const objective of getVisibleObjectivesForQuest(state.quests, quest)) {
          const classes = ['checklist-row', 'objective-row', 'depth-3'];
          if (isObjectiveComplete(quest.id, objective.id)) classes.push('done');
          else if (!isObjectiveUnlocked(quest.id, objective)) classes.push('locked');
          const trackable = isQuestTrackable(quest);
          rows.push(`<li class="${classes.join(' ')}${trackable ? ' trackable' : ''}" data-action="track-quest" data-quest-id="${escapeHtml(quest.id)}" role="${trackable ? 'button' : 'listitem'}" ${trackable ? 'tabindex="0"' : ''}><span>${escapeHtml(objective.label)}</span></li>`);
        }
      }
    }
  }
  return rows.join('');
}
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
function updateChecklistScrollButtons() {
  const canScroll = ui.tasks.scrollHeight > ui.tasks.clientHeight + 1;
  ui.checklistScrollUp.disabled = !canScroll || ui.tasks.scrollTop <= 0;
  ui.checklistScrollDown.disabled = !canScroll || ui.tasks.scrollTop + ui.tasks.clientHeight >= ui.tasks.scrollHeight - 1;
}

function refreshUI() {
  ui.energy.style.width = `${player.energy}%`; ui.points.textContent = `${player.points} SP`;
  const best = Number(safeStorageGet('campQuestBest') || 0); ui.best.textContent = `BEST ${Math.max(best, player.points)}`;
  ui.objective.textContent = `${currentMap.displayName}: ${objective()}`;
  ui.tasks.innerHTML = renderChecklist();
  updateChecklistScrollButtons();
  const large = visibleLabels('large'), tray = visibleLabels('tray'), small = visibleLabels('small');
  const hands = large.length === 1 && carrySize(state.largePickupOrder.at(-1) ?? '') === 2 ? `${large[0]} (both hands)` : `${large[0] ?? 'empty'} | ${large[1] ?? 'empty'}`;
  ui.carrySummary.textContent = [`Hands: ${hands}`, tray.length ? `Tray: ${tray.join(', ')}` : '', small.length ? `Small: ${small.join(', ')}` : ''].filter(Boolean).join(' · ');
  ui.dropButton.disabled = state.largePickupOrder.length === 0;
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
  return { npc, mapId: currentMap.id, npcs: allNpcs, quests, questState: state.quests, dialogueState: state.dialogue, heldItemCount: itemCount };
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
function safeStorageGet(key: string) { try { return localStorage.getItem(key); } catch { return null; } }
function safeStorageSet(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* Ignore storage failures; controls keep their in-memory fallback. */ } }
function validControlMode(value: string | null): MobileControlMode { return value === 'joystick' ? 'joystick' : 'dpad'; }
function award(points: number) { player.points += points; safeStorageSet('campQuestBest', String(Math.max(player.points, Number(safeStorageGet('campQuestBest') || 0)))); }
function switchMap(exit: InteractableDefinition) {
  const nextMap = exit.targetMapId ? maps[exit.targetMapId] : undefined;
  const spawn = nextMap?.spawns.find(({ id }) => id === exit.targetSpawnId);
  if (!nextMap || !spawn) { toast('That route is not ready yet.'); return; }
  currentMap = nextMap; player.x = spawn.x; player.y = spawn.y; keys.clear(); transitionCooldown = .45;
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
  if (inspectionOpen) { closeInspection(); return; }
  if (dialogueOpen) { if (!selectHighlightedTopic()) closeDialogue(); return; }

  const nearbyExit = currentMap.exits.find(exit => exit.activation !== 'automatic' && dist(player, exit) < 85);
  if (nearbyExit) { switchMap(nearbyExit); return; }
  const nearbyInteractable = [...currentMap.interactables].sort((a, b) => dist(player, a) - dist(player, b))[0];
  if (nearbyInteractable && dist(player, nearbyInteractable) < 105) {
    if (nearbyInteractable.kind === 'inspection' && nearbyInteractable.title && nearbyInteractable.assetId) {
      processQuestEvent({ type: 'interactableInspected', interactableId: nearbyInteractable.id, mapId: currentMap.id });
      refreshUI();
      inspectImage(nearbyInteractable.title, nearbyInteractable.assetId, nearbyInteractable.caption ?? nearbyInteractable.label); return;
    }
    if (nearbyInteractable.id === 'back40TeaserMessage') { completeBridgeObjective(); return; }
    if (nearbyInteractable.kind === 'message' || nearbyInteractable.kind === 'task-location') {
      const message = nearbyInteractable.id === 'blockedBridgeMessage' && isBridgeUnlocked()
        ? 'The bridge inspection is complete. Cross carefully for a tiny peek at the Back 40!'
        : nearbyInteractable.message ?? nearbyInteractable.label;
      toast(message); return;
    }
    if (nearbyInteractable.kind === 'delivery-zone' && !state.delivered) {
      const deliverableItemId = Object.keys(state.inventory.items).find(itemId => quests.some(quest => quest.objectives.some(objective => objective.type === 'deliverItem' && objective.itemId === itemId && objective.interactableId === nearbyInteractable.id)));
      if (!deliverableItemId) return;
      const deliveryReady = quests.some(quest => quest.objectives.some(objective => objective.type === 'deliverItem' && objective.itemId === deliverableItemId && objective.interactableId === nearbyInteractable.id && isObjectiveUnlocked(quest.id, objective)));
      if (!deliveryReady) { toast('Hang onto that crate until the supply hunt is checked off.'); return; }
      const result = processQuestEvent({ type: 'itemDelivered', itemId: deliverableItemId, interactableId: nearbyInteractable.id, mapId: currentMap.id });
      if (!result.completedObjectives.length) return;
      state.delivered = true; removeItem(deliverableItemId); toast('Crate delivered! +100 SP'); refreshUI(); return;
    }
  }
  const npc = currentMap.npcs.filter(({ id }) => id !== 'cliff').sort((a, b) => dist(player, a) - dist(player, b))[0];
  if (npc && dist(player, npc) < 80) {
    startNpcDialogue(npc); return;
  }
  const item = currentMap.items.filter(({ done }) => !done).sort((a, b) => dist(player, a) - dist(player, b))[0];
  if (item && dist(player, item) < 70) {
    if (!canCarry(item.id)) { toast(carrySize(item.id) === 2 ? 'That takes both hands, champ. Set down a bulky supply first.' : 'Your hands are full! Set down a bulky supply first.'); return; }
    item.done = true; addItem(item.id);
    const result = processQuestEvent({ type: 'itemPickedUp', itemId: item.id, mapId: currentMap.id });
    const firstPickup = result.completedObjectives.length > 0 && !state.rewardedPickups.has(item.id); if (firstPickup) state.rewardedPickups.add(item.id);
    toast(`${item.label} recovered!${firstPickup ? ' +50 SP' : ''}`); refreshUI(); return;
  }
  toast('Nothing useful nearby. Service Crew Rule #2: check the weirdest place first.');
}
function controlsBlocked() { return gamePhase !== 'playing' || dialogueOpen || inspectionOpen || ui.checklist.classList.contains('open'); }
function resetJoystick() {
  joystickInput.pointerId = null; joystickInput.active = false; joystickInput.centerX = 0; joystickInput.centerY = 0; joystickInput.vectorX = 0; joystickInput.vectorY = 0;
  ui.joystickBase.style.setProperty('--base-x', '0px'); ui.joystickBase.style.setProperty('--base-y', '0px');
  ui.joystickKnob.style.setProperty('--knob-x', '0px'); ui.joystickKnob.style.setProperty('--knob-y', '0px');
}
function applyControlMode(mode: MobileControlMode, save = false) {
  mobileControlMode = mode; resetJoystick();
  const shell = document.querySelector('#game-shell')!;
  shell.classList.toggle('control-mode-dpad', mode === 'dpad'); shell.classList.toggle('control-mode-joystick', mode === 'joystick');
  ui.controlModeToggle.textContent = `Controls: ${mode === 'dpad' ? 'D-pad' : 'Joystick'}`;
  ui.controlModeToggle.setAttribute('aria-label', `Current movement controls: ${mode === 'dpad' ? 'D-pad' : 'Joystick'}. Tap to switch.`);
  if (save) safeStorageSet(CONTROL_MODE_STORAGE_KEY, mode); scheduleLayoutRecalculation();
}
function dropLastLargeItem() {
  const id = state.largePickupOrder.at(-1); if (!id) { toast('No bulky supply to set down.'); return; }
  const item = itemById(id); if (!item) return;
  removeItem(id); item.done = false; item.x = Math.max(5, Math.min(currentMap.size.w - item.w - 5, player.x + player.w + 18)); item.y = Math.max(5, Math.min(currentMap.size.h - item.h - 5, player.y));
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
  if (dialogueOpen || inspectionOpen || ui.checklist.classList.contains('open')) { resetJoystick(); return; }
  const digitalX = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0), digitalY = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0);
  const usingDigital = digitalX !== 0 || digitalY !== 0; const x = usingDigital ? digitalX : joystickInput.vectorX, y = usingDigital ? digitalY : joystickInput.vectorY; const len = Math.hypot(x, y) || 1;
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
  gamePhase = 'playing'; keys.clear(); actionQueued = false;
  document.querySelector('#game-shell')!.classList.remove('title-phase');
  showDialogue(mainCamp.npcs[0], dialogue.opening[0]); refreshUI(); scheduleLayoutRecalculation();
}

let last = performance.now(); function loop(now: number) { const dt = Math.min((now - last) / 1000, .04); last = now; update(dt); if (gamePhase === 'playing' && toastTimer > 0 && (toastTimer -= dt) <= 0) ui.toast.classList.add('hidden'); draw(); requestAnimationFrame(loop); }
const keyMap: Record<string, string> = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
addEventListener('keydown', event => {
  if (gamePhase !== 'playing') { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); startGame(); } return; }
  if (dialogueUiState.mode === 'choosingTopic' || (dialogueUiState.mode === 'showingResponse' && dialogueUiState.followUpTopics?.length)) {
    if (['ArrowUp', 'w', 'W'].includes(event.key)) { updateTopicSelection(-1); event.preventDefault(); return; }
    if (['ArrowDown', 's', 'S'].includes(event.key)) { updateTopicSelection(1); event.preventDefault(); return; }
    if (['Enter', ' ', 'e', 'E'].includes(event.key)) { selectHighlightedTopic(); event.preventDefault(); return; }
  }
  if (dialogueOpen && ['Enter', ' ', 'e', 'E'].includes(event.key)) { closeDialogue(); event.preventDefault(); return; }
  if (keyMap[event.key]) { keys.add(keyMap[event.key]); event.preventDefault(); }
  if (['q', 'Q'].includes(event.key)) { dropLastLargeItem(); event.preventDefault(); }
  if ([' ', 'e', 'E'].includes(event.key)) { actionQueued = true; event.preventDefault(); }
  if (event.key === 'Escape') { closeDialogue(); closeInspection(); }
});
addEventListener('keyup', event => { if (keyMap[event.key]) keys.delete(keyMap[event.key]); });
canvas.addEventListener('pointerdown', event => { if (gamePhase !== 'playing') { event.preventDefault(); startGame(); } });
const directionButtons = document.querySelectorAll<HTMLButtonElement>('[data-dir]');
const actionButton = document.querySelector<HTMLButtonElement>('#action-button')!;
const preventControlDefault = (event: Event) => event.preventDefault();
function updateJoystickFromPointer(event: PointerEvent) {
  if (mobileControlMode !== 'joystick' || !joystickInput.active || event.pointerId !== joystickInput.pointerId) return;
  event.preventDefault();
  if (controlsBlocked()) { resetJoystick(); return; }
  const radius = Math.max(42, Math.min(ui.joystick.clientWidth, ui.joystick.clientHeight) * .38);
  const deadZone = radius * .22;
  const dx = event.clientX - joystickInput.centerX, dy = event.clientY - joystickInput.centerY;
  const distance = Math.hypot(dx, dy), clampedDistance = Math.min(radius, distance);
  const knobX = distance ? dx / distance * clampedDistance : 0, knobY = distance ? dy / distance * clampedDistance : 0;
  ui.joystickKnob.style.setProperty('--knob-x', `${knobX}px`); ui.joystickKnob.style.setProperty('--knob-y', `${knobY}px`);
  if (distance < deadZone) { joystickInput.vectorX = 0; joystickInput.vectorY = 0; return; }
  joystickInput.vectorX = distance ? dx / distance : 0; joystickInput.vectorY = distance ? dy / distance : 0;
}
function startJoystick(event: PointerEvent) {
  event.preventDefault();
  if (mobileControlMode !== 'joystick' || controlsBlocked() || joystickInput.pointerId !== null) return;
  joystickInput.pointerId = event.pointerId; joystickInput.active = true;
  const rect = ui.joystick.getBoundingClientRect();
  joystickInput.centerX = event.clientX; joystickInput.centerY = event.clientY;
  const defaultCenterX = rect.left + rect.width / 2, defaultCenterY = rect.top + rect.height / 2;
  if (Math.hypot(event.clientX - defaultCenterX, event.clientY - defaultCenterY) < Math.min(rect.width, rect.height) * .36) { joystickInput.centerX = defaultCenterX; joystickInput.centerY = defaultCenterY; }
  ui.joystickBase.style.setProperty('--base-x', `${joystickInput.centerX - defaultCenterX}px`); ui.joystickBase.style.setProperty('--base-y', `${joystickInput.centerY - defaultCenterY}px`);
  try { ui.joystick.setPointerCapture(event.pointerId); } catch { /* Pointer capture is best-effort. */ }
  updateJoystickFromPointer(event);
}
function stopJoystick(event?: PointerEvent) {
  if (event) { event.preventDefault(); if (joystickInput.pointerId !== null && event.pointerId !== joystickInput.pointerId) return; }
  resetJoystick();
}
directionButtons.forEach(button => {
  const dir = button.dataset.dir!;
  const on = (event: PointerEvent) => { event.preventDefault(); if (gamePhase !== 'playing') return; keys.add(dir); button.classList.add('pressed'); };
  const off = (event: PointerEvent) => { event.preventDefault(); keys.delete(dir); button.classList.remove('pressed'); };
  button.addEventListener('pointerdown', on);
  button.addEventListener('pointerup', off);
  button.addEventListener('pointercancel', off);
  button.addEventListener('pointerleave', off);
  button.addEventListener('contextmenu', preventControlDefault);
});
ui.joystick.addEventListener('pointerdown', startJoystick);
ui.joystick.addEventListener('pointermove', updateJoystickFromPointer);
ui.joystick.addEventListener('pointerup', stopJoystick);
ui.joystick.addEventListener('pointercancel', stopJoystick);
ui.joystick.addEventListener('lostpointercapture', stopJoystick);
ui.joystick.addEventListener('contextmenu', preventControlDefault);
ui.controlModeToggle.addEventListener('click', () => applyControlMode(mobileControlMode === 'dpad' ? 'joystick' : 'dpad', true));
ui.controlModeToggle.addEventListener('contextmenu', preventControlDefault);
ui.dropButton.addEventListener('pointerdown', event => { event.preventDefault(); if (gamePhase === 'playing') dropLastLargeItem(); });
actionButton.addEventListener('pointerdown', event => { event.preventDefault(); if (gamePhase === 'playing') actionQueued = true; });
actionButton.addEventListener('pointerup', preventControlDefault);
actionButton.addEventListener('pointercancel', preventControlDefault);
actionButton.addEventListener('pointerleave', preventControlDefault);
actionButton.addEventListener('contextmenu', preventControlDefault);
ui.fullscreenButton.addEventListener('click', () => requestGameFullscreen(true));
document.addEventListener('fullscreenchange', updateFullscreenButtonState);
document.querySelector('#close-inspection')!.addEventListener('click', closeInspection); ui.inspection.addEventListener('click', event => { if (event.target === ui.inspection) closeInspection(); });
const checklistButton = document.querySelector<HTMLButtonElement>('#checklist-button')!;
const setChecklistOpen = (open: boolean) => {
  ui.checklist.classList.toggle('open', open);
  ui.checklist.setAttribute('aria-hidden', String(!open));
  checklistButton.setAttribute('aria-expanded', String(open));
  resetJoystick();
  requestAnimationFrame(updateChecklistScrollButtons);
};
const scrollChecklist = (direction: 1 | -1) => ui.tasks.scrollBy({ top: direction * 120, behavior: 'smooth' });
ui.tasks.addEventListener('scroll', updateChecklistScrollButtons, { passive: true });
const activateChecklistRow = (target: EventTarget | null) => {
  const row = target instanceof HTMLElement ? target.closest<HTMLElement>('[data-action]') : undefined;
  if (!row) return false;
  if (row.dataset.action === 'toggle-checklist' && row.dataset.key) {
    if (collapsedChecklistRows.has(row.dataset.key)) collapsedChecklistRows.delete(row.dataset.key);
    else collapsedChecklistRows.add(row.dataset.key);
    refreshUI(); return true;
  }
  if (row.dataset.action === 'track-quest' && row.dataset.questId) {
    trackQuest(row.dataset.questId); return true;
  }
  return false;
};
ui.tasks.addEventListener('click', event => { if (activateChecklistRow(event.target)) event.preventDefault(); });
ui.tasks.addEventListener('keydown', event => {
  const keyboardEvent = event as KeyboardEvent;
  if (keyboardEvent.key !== 'Enter' && keyboardEvent.key !== ' ') return;
  if (activateChecklistRow(event.target)) event.preventDefault();
});
ui.checklistScrollUp.addEventListener('pointerdown', event => { event.preventDefault(); scrollChecklist(-1); });
ui.checklistScrollDown.addEventListener('pointerdown', event => { event.preventDefault(); scrollChecklist(1); });
ui.checklistScrollUp.addEventListener('contextmenu', preventControlDefault);
ui.checklistScrollDown.addEventListener('contextmenu', preventControlDefault);
checklistButton.addEventListener('click', () => { if (gamePhase === 'playing') setChecklistOpen(!ui.checklist.classList.contains('open')); });
document.querySelector('#close-checklist')!.addEventListener('click', () => setChecklistOpen(false));
const clearHeldDirections = () => { keys.clear(); directionButtons.forEach(button => button.classList.remove('pressed')); resetJoystick(); scheduleLayoutRecalculation(); };
addEventListener('resize', clearHeldDirections);
addEventListener('orientationchange', clearHeldDirections);
document.querySelector('#dismiss-portrait-guidance')!.addEventListener('click', () => { document.querySelector('#portrait-guidance')!.classList.add('dismissed'); scheduleLayoutRecalculation(); });
applyControlMode(validControlMode(safeStorageGet(CONTROL_MODE_STORAGE_KEY)));
document.querySelector('#game-shell')!.classList.add('title-phase');
recalculateLayoutAndCamera(); refreshUI(); requestAnimationFrame(loop);
assets.loadAll(npcPortraitPaths, progress => { loadingProgress = progress; }).then(() => { gamePhase = 'ready'; });
