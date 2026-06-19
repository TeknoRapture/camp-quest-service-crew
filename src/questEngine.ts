import type { InteractableDefinition, ItemDefinition, MapDefinition, NPCDefinition, ObjectiveDefinition, ObjectiveId, QuestDefinition, QuestEvent, QuestEventResult, QuestId, QuestPrerequisite, QuestReward, QuestRuntimeState, QuestStatus } from './content/types';

export interface NpcQuestState {
  availableQuests: QuestDefinition[];
  completableQuests: QuestDefinition[];
  involvedActiveQuests: QuestDefinition[];
  hasAvailableQuest: boolean;
  hasCompletableQuest: boolean;
  hasInvolvedActiveQuest: boolean;
}

export interface NpcQuestInteractionResult extends QuestEventResult {
  npcQuestStateBefore: NpcQuestState;
  npcQuestStateAfter: NpcQuestState;
  offeredQuestIds: QuestId[];
  startedQuestIds: QuestId[];
  turnInQuestIds: QuestId[];
}

export function createQuestState(quests: QuestDefinition[]): QuestRuntimeState {
  const questStatuses: Record<QuestId, QuestStatus> = {};
  const completedObjectiveIdsByQuest: Record<QuestId, Set<ObjectiveId>> = {};
  const discoveredQuestIds = new Set<QuestId>();
  const activeQuestIds = new Set<QuestId>();
  const completedQuestIds = new Set<QuestId>();

  for (const quest of quests) {
    completedObjectiveIdsByQuest[quest.id] = new Set<ObjectiveId>();
    if (quest.startsActive) {
      questStatuses[quest.id] = 'active';
      activeQuestIds.add(quest.id);
      discoveredQuestIds.add(quest.id);
    } else {
      questStatuses[quest.id] = 'locked';
    }
  }

  return { questStatuses, completedObjectiveIdsByQuest, discoveredQuestIds, activeQuestIds, completedQuestIds, flags: {} };
}

export function isRequiredForProgression(quest: QuestDefinition) {
  if (quest.requiredForProgression !== undefined) return quest.requiredForProgression;
  return quest.category === 'main';
}

export function getBlockingProgressionQuests(quests: QuestDefinition[], questState: QuestRuntimeState) {
  return quests.filter(quest => isRequiredForProgression(quest) && !isQuestCompleted(questState, quest));
}

export function isProgressionBlocked(quests: QuestDefinition[], questState: QuestRuntimeState) {
  return getBlockingProgressionQuests(quests, questState).length > 0;
}

function prerequisiteMet(questState: QuestRuntimeState, prerequisite: QuestPrerequisite) {
  switch (prerequisite.type) {
    case 'questCompleted': return questState.completedQuestIds.has(prerequisite.questId) || questState.questStatuses[prerequisite.questId] === 'completed';
    case 'objectiveCompleted': return isObjectiveComplete(questState, prerequisite.questId, prerequisite.objectiveId);
    case 'flag': return questState.flags[prerequisite.flag] === (prerequisite.value ?? true);
  }
}

function prerequisitesMet(questState: QuestRuntimeState, quest: QuestDefinition) {
  return (quest.prerequisites ?? []).every(prerequisite => prerequisiteMet(questState, prerequisite));
}

function eventsMatch(actual: QuestEvent, expected: QuestEvent) {
  return Object.entries(expected).every(([key, value]) => actual[key as keyof QuestEvent] === value);
}

function triggerMatches(event: QuestEvent, quest: QuestDefinition, triggerKey: 'discoveryTrigger' | 'startTrigger') {
  const trigger = quest[triggerKey];
  return Boolean(trigger && trigger.type === 'event' && eventsMatch(event, trigger.event));
}

export function canQuestBeActivated(questState: QuestRuntimeState, quest: QuestDefinition) {
  return questState.questStatuses[quest.id] !== 'active' && !isQuestCompleted(questState, quest);
}

export function canQuestBeDiscovered(questState: QuestRuntimeState, quest: QuestDefinition) {
  return !questState.discoveredQuestIds.has(quest.id) && !isQuestCompleted(questState, quest);
}

function activateQuest(questState: QuestRuntimeState, quest: QuestDefinition) {
  if (!canQuestBeActivated(questState, quest)) return false;
  questState.questStatuses[quest.id] = 'active';
  questState.activeQuestIds.add(quest.id);
  questState.discoveredQuestIds.add(quest.id);
  return true;
}

function discoverQuest(questState: QuestRuntimeState, quest: QuestDefinition) {
  if (!canQuestBeDiscovered(questState, quest)) return false;
  questState.discoveredQuestIds.add(quest.id);
  if (questState.questStatuses[quest.id] === 'locked') questState.questStatuses[quest.id] = 'available';
  return true;
}

export function isQuestActive(questState: QuestRuntimeState, quest: QuestDefinition) {
  return questState.questStatuses[quest.id] === 'active';
}

export function isQuestCompleted(questState: QuestRuntimeState, quest: QuestDefinition) {
  return questState.questStatuses[quest.id] === 'completed' || questState.completedQuestIds.has(quest.id);
}

export function isQuestVisible(questState: QuestRuntimeState, quest: QuestDefinition) {
  if (quest.category === 'hidden') return isHiddenQuestVisibleInChecklist(questState, quest);
  if (quest.hiddenUntilDiscovered && !questState.discoveredQuestIds.has(quest.id)) return false;
  const status = questState.questStatuses[quest.id] ?? 'locked';
  return status === 'active' || status === 'completed' || status === 'available' || Boolean(quest.previewWhenLocked);
}

export function isHiddenQuestVisibleInChecklist(questState: QuestRuntimeState, quest: QuestDefinition) {
  return quest.category === 'hidden' && isQuestCompleted(questState, quest);
}

export function shouldShowQuestInChecklist(questState: QuestRuntimeState, quest: QuestDefinition) {
  return isQuestVisible(questState, quest);
}

export function getVisibleQuests(quests: QuestDefinition[], questState: QuestRuntimeState) {
  return quests.filter(quest => isQuestVisible(questState, quest));
}

export function isObjectiveComplete(questState: QuestRuntimeState, questId: QuestId, objectiveId: ObjectiveId) {
  return Boolean(questState.completedObjectiveIdsByQuest[questId]?.has(objectiveId));
}

export function isObjectiveUnlocked(questState: QuestRuntimeState, quest: QuestDefinition, objective: ObjectiveDefinition) {
  return (objective.prerequisiteObjectiveIds ?? []).every(objectiveId => isObjectiveComplete(questState, quest.id, objectiveId));
}

export function getUnlockedObjectivesForQuest(questState: QuestRuntimeState, quest: QuestDefinition) {
  return quest.objectives.filter(objective => isObjectiveUnlocked(questState, quest, objective));
}

export function getVisibleObjectivesForQuest(questState: QuestRuntimeState, quest: QuestDefinition) {
  if (!isQuestVisible(questState, quest)) return [];
  return quest.objectives.filter(objective => isObjectiveUnlocked(questState, quest, objective) || objective.visibleWhenLocked);
}

export function getActiveObjectiveForQuest(questState: QuestRuntimeState, quest: QuestDefinition) {
  if (!isQuestActive(questState, quest)) return undefined;
  return quest.objectives.find(objective => !isObjectiveComplete(questState, quest.id, objective.id) && isObjectiveUnlocked(questState, quest, objective));
}

export function getTrackedObjective(quests: QuestDefinition[], questState: QuestRuntimeState) {
  const visibleQuests = getVisibleQuests(quests, questState);
  const trackedQuest = questState.trackedQuestId ? visibleQuests.find(quest => quest.id === questState.trackedQuestId && isQuestActive(questState, quest)) : undefined;
  const trackedObjective = trackedQuest && getActiveObjectiveForQuest(questState, trackedQuest);
  if (trackedQuest && trackedObjective) return { quest: trackedQuest, objective: trackedObjective };

  const requiredMain = visibleQuests.find(quest => quest.category === 'main' && isRequiredForProgression(quest) && getActiveObjectiveForQuest(questState, quest));
  if (requiredMain) return { quest: requiredMain, objective: getActiveObjectiveForQuest(questState, requiredMain)! };

  const tutorial = visibleQuests.find(quest => quest.category === 'tutorial' && getActiveObjectiveForQuest(questState, quest));
  if (tutorial) return { quest: tutorial, objective: getActiveObjectiveForQuest(questState, tutorial)! };

  const optional = visibleQuests.find(quest => getActiveObjectiveForQuest(questState, quest));
  if (optional) return { quest: optional, objective: getActiveObjectiveForQuest(questState, optional)! };

  return undefined;
}

function findNpc(npcId: string, npcs: readonly NPCDefinition[]) {
  return npcs.find(npc => npc.id === npcId);
}

function questByIds(questIds: readonly QuestId[] | undefined, quests: readonly QuestDefinition[]) {
  if (!questIds?.length) return [];
  const requested = new Set(questIds);
  return quests.filter(quest => requested.has(quest.id));
}

function questCanAppearAsNpcOffer(questState: QuestRuntimeState, quest: QuestDefinition) {
  if (isQuestCompleted(questState, quest) || isQuestActive(questState, quest)) return false;
  if (quest.category === 'hidden' && !questState.discoveredQuestIds.has(quest.id)) return false;
  return true;
}

export function canNpcOfferQuest(npcId: string, npcs: readonly NPCDefinition[], quest: QuestDefinition, questState: QuestRuntimeState) {
  const npc = findNpc(npcId, npcs);
  if (!npc?.quests?.offersQuestIds?.includes(quest.id)) return false;
  if (!questCanAppearAsNpcOffer(questState, quest)) return false;
  return prerequisitesMet(questState, quest);
}

export function canNpcCompleteQuest(npcId: string, npcs: readonly NPCDefinition[], quest: QuestDefinition, questState: QuestRuntimeState) {
  const npc = findNpc(npcId, npcs);
  if (!npc?.quests?.turnsInQuestIds?.includes(quest.id)) return false;
  return isQuestActive(questState, quest) && !isQuestCompleted(questState, quest) && isQuestReadyToComplete(questState, quest);
}

export function getAvailableQuestsForNpc(npcId: string, npcs: readonly NPCDefinition[], quests: QuestDefinition[], questState: QuestRuntimeState) {
  const npc = findNpc(npcId, npcs);
  return questByIds(npc?.quests?.offersQuestIds, quests).filter(quest => canNpcOfferQuest(npcId, npcs, quest, questState));
}

export function getCompletableQuestsForNpc(npcId: string, npcs: readonly NPCDefinition[], quests: QuestDefinition[], questState: QuestRuntimeState) {
  const npc = findNpc(npcId, npcs);
  return questByIds(npc?.quests?.turnsInQuestIds, quests).filter(quest => canNpcCompleteQuest(npcId, npcs, quest, questState));
}

export function getInvolvedQuestsForNpc(npcId: string, npcs: readonly NPCDefinition[], quests: QuestDefinition[], questState: QuestRuntimeState) {
  const npc = findNpc(npcId, npcs);
  return questByIds(npc?.quests?.involvedQuestIds, quests).filter(quest => isQuestActive(questState, quest) && isQuestVisible(questState, quest));
}

export function getNpcQuestState(npcId: string, npcs: readonly NPCDefinition[], quests: QuestDefinition[], questState: QuestRuntimeState): NpcQuestState {
  const availableQuests = getAvailableQuestsForNpc(npcId, npcs, quests, questState);
  const completableQuests = getCompletableQuestsForNpc(npcId, npcs, quests, questState);
  const involvedActiveQuests = getInvolvedQuestsForNpc(npcId, npcs, quests, questState);
  return {
    availableQuests,
    completableQuests,
    involvedActiveQuests,
    hasAvailableQuest: availableQuests.length > 0,
    hasCompletableQuest: completableQuests.length > 0,
    hasInvolvedActiveQuest: involvedActiveQuests.length > 0,
  };
}

function completeObjective(questState: QuestRuntimeState, quest: QuestDefinition, objective: ObjectiveDefinition) {
  const completed = questState.completedObjectiveIdsByQuest[quest.id] ?? new Set<ObjectiveId>();
  questState.completedObjectiveIdsByQuest[quest.id] = completed;
  if (completed.has(objective.id)) return false;
  completed.add(objective.id);
  return true;
}

export function isQuestReadyToComplete(questState: QuestRuntimeState, quest: QuestDefinition) {
  return quest.objectives.every(objective => objective.required === false || objective.isOptional || isObjectiveComplete(questState, quest.id, objective.id));
}

export function canQuestBeCompleted(questState: QuestRuntimeState, quest: QuestDefinition) {
  return isQuestActive(questState, quest) && !isQuestCompleted(questState, quest) && isQuestReadyToComplete(questState, quest);
}

function completeQuest(questState: QuestRuntimeState, quest: QuestDefinition) {
  if (isQuestCompleted(questState, quest)) return false;
  questState.questStatuses[quest.id] = 'completed';
  questState.activeQuestIds.delete(quest.id);
  questState.completedQuestIds.add(quest.id);
  return true;
}

function eventMatchesObjective(event: QuestEvent, objective: ObjectiveDefinition) {
  switch (objective.type) {
    case 'talkToNpc': return event.type === 'npcTalked' && event.npcId === objective.npcId && (!objective.mapId || objective.mapId === event.mapId);
    case 'findItem': return event.type === 'itemPickedUp' && event.itemId === objective.itemId && (!objective.mapId || objective.mapId === event.mapId);
    case 'possessItem': return event.type === 'itemPickedUp' && event.itemId === objective.itemId && (!objective.mapId || objective.mapId === event.mapId);
    case 'deliverItem': return event.type === 'itemDelivered' && event.itemId === objective.itemId && event.interactableId === objective.interactableId && (!objective.mapId || objective.mapId === event.mapId);
    case 'completeInteraction': return event.type === 'interactionCompleted' && event.interactableId === objective.interactableId && (!objective.mapId || objective.mapId === event.mapId);
    case 'inspectInteractable': return event.type === 'interactableInspected' && event.interactableId === objective.interactableId && (!objective.mapId || objective.mapId === event.mapId);
    case 'enterArea': return event.type === 'mapEntered' && event.mapId === objective.mapId;
    case 'reachLocation': return event.type === 'locationReached' && event.locationId === objective.locationId && (!objective.mapId || objective.mapId === event.mapId);
    case 'cleanTarget': return event.type === 'cleanTargetCompleted' && event.targetId === objective.targetId && (!objective.mapId || objective.mapId === event.mapId);
    case 'questFlag': return event.type === 'questFlagSet' && event.flag === objective.flag;
  }
}

export function handleQuestEvent(questState: QuestRuntimeState, quests: QuestDefinition[], event: QuestEvent): QuestEventResult {
  const result: QuestEventResult = { completedObjectives: [], completedQuests: [], activatedQuests: [], discoveredQuests: [], rewards: [], messages: [], ignoredEvents: [], noOp: true };

  for (const quest of quests) {
    if (triggerMatches(event, quest, 'discoveryTrigger') && prerequisitesMet(questState, quest) && discoverQuest(questState, quest)) {
      result.discoveredQuests.push(quest.id);
      if (quest.discoveryMessage) result.messages.push(quest.discoveryMessage);
    }
    if ((triggerMatches(event, quest, 'startTrigger') || questState.questStatuses[quest.id] === 'available') && prerequisitesMet(questState, quest) && activateQuest(questState, quest)) result.activatedQuests.push(quest.id);
  }

  for (const quest of quests) {
    if (!isQuestActive(questState, quest)) continue;
    for (const objective of quest.objectives) {
      if (isObjectiveComplete(questState, quest.id, objective.id) || !isObjectiveUnlocked(questState, quest, objective)) continue;
      if (!eventMatchesObjective(event, objective)) continue;
      if (!completeObjective(questState, quest, objective)) continue;
      result.completedObjectives.push({ questId: quest.id, objectiveId: objective.id });
      if (objective.rewards) result.rewards.push(...objective.rewards);
    }
    if (canQuestBeCompleted(questState, quest) && completeQuest(questState, quest)) {
      result.completedQuests.push(quest.id);
      if (quest.rewards) result.rewards.push(...quest.rewards);
    }
  }

  result.noOp = result.completedObjectives.length === 0 && result.completedQuests.length === 0 && result.activatedQuests.length === 0 && result.discoveredQuests.length === 0 && result.rewards.length === 0 && result.messages.length === 0;
  if (result.noOp) result.ignoredEvents.push(`No quest state changed for event ${event.type}.`);
  return result;
}

export function handleNpcQuestInteraction(questState: QuestRuntimeState, npcs: readonly NPCDefinition[], quests: QuestDefinition[], npcId: string, mapId: string): NpcQuestInteractionResult {
  const npcQuestStateBefore = getNpcQuestState(npcId, npcs, quests, questState);
  const offeredQuestIds = npcQuestStateBefore.availableQuests.map(quest => quest.id);
  const eventResult = handleQuestEvent(questState, quests, { type: 'npcTalked', npcId, mapId });
  const startedQuestIds: QuestId[] = [...eventResult.activatedQuests];

  for (const quest of npcQuestStateBefore.availableQuests) {
    if (activateQuest(questState, quest)) startedQuestIds.push(quest.id);
  }

  const npcQuestStateAfter = getNpcQuestState(npcId, npcs, quests, questState);
  const turnInQuestIds = npcQuestStateBefore.completableQuests.map(quest => quest.id);
  return { ...eventResult, npcQuestStateBefore, npcQuestStateAfter, offeredQuestIds, startedQuestIds, turnInQuestIds };
}

export function applyQuestRewards(questState: QuestRuntimeState, result: QuestEventResult, handlers: { addScore?: (amount: number) => void; showToast?: (text: string) => void; unlockSkill?: (skillId: string) => void; unlockGate?: (gateId: string) => void } = {}) {
  for (const reward of result.rewards) applyQuestReward(questState, reward, handlers);
  for (const message of result.messages) handlers.showToast?.(message);
}

function applyQuestReward(questState: QuestRuntimeState, reward: QuestReward, handlers: { addScore?: (amount: number) => void; showToast?: (text: string) => void; unlockSkill?: (skillId: string) => void; unlockGate?: (gateId: string) => void }) {
  switch (reward.type) {
    case 'addScore': handlers.addScore?.(reward.amount); break;
    case 'showToast': handlers.showToast?.(reward.text); break;
    case 'setFlag': questState.flags[reward.flag] = reward.value ?? true; break;
    case 'activateQuest': {
      const rewardQuest = { id: reward.questId } as QuestDefinition;
      if (canQuestBeActivated(questState, rewardQuest)) {
        questState.questStatuses[reward.questId] = 'active';
        questState.activeQuestIds.add(reward.questId);
        questState.discoveredQuestIds.add(reward.questId);
      }
      break;
    }
    case 'discoverQuest': {
      const rewardQuest = { id: reward.questId } as QuestDefinition;
      if (canQuestBeDiscovered(questState, rewardQuest)) {
        questState.discoveredQuestIds.add(reward.questId);
        if (!questState.questStatuses[reward.questId] || questState.questStatuses[reward.questId] === 'locked') questState.questStatuses[reward.questId] = 'available';
      }
      break;
    }
    case 'unlockGate': questState.flags[`gate:${reward.gateId}`] = true; handlers.unlockGate?.(reward.gateId); break;
    case 'unlockSkill': questState.flags[`skill:${reward.skillId}`] = true; handlers.unlockSkill?.(reward.skillId); break;
  }
}

export interface QuestValidationIssue {
  level: 'error' | 'warning';
  message: string;
  questId?: QuestId;
  objectiveId?: ObjectiveId;
  npcId?: string;
  targetId?: string;
}

export interface QuestValidationContext {
  npcs?: readonly NPCDefinition[];
  items?: readonly ItemDefinition[];
  interactables?: readonly InteractableDefinition[];
  maps?: Readonly<Record<string, MapDefinition>> | readonly MapDefinition[];
}

function issue(level: QuestValidationIssue['level'], message: string, details: Omit<QuestValidationIssue, 'level' | 'message'> = {}): QuestValidationIssue {
  return { level, message, ...details };
}

function isBlank(value: unknown) { return typeof value !== 'string' || value.trim().length === 0; }
function validFlagName(flag: string) { return /^[A-Za-z][A-Za-z0-9:._-]*$/.test(flag); }
function mapsArray(maps?: QuestValidationContext['maps']) { return Array.isArray(maps) ? maps : Object.values(maps ?? {}); }

export function validateQuestDefinitions(quests: readonly QuestDefinition[], contextOrNpcs: QuestValidationContext | readonly NPCDefinition[] = {}): QuestValidationIssue[] {
  const context: QuestValidationContext = Array.isArray(contextOrNpcs as NPCDefinition[]) ? { npcs: contextOrNpcs as readonly NPCDefinition[] } : contextOrNpcs as QuestValidationContext;
  const issues: QuestValidationIssue[] = [];
  const questIds = new Set<QuestId>();
  const duplicateQuestIds = new Set<QuestId>();
  const allQuestIds = new Set(quests.map(quest => quest.id).filter(id => !isBlank(id)));
  const mapList = mapsArray(context.maps);
  const npcIds = new Set([...(context.npcs ?? []), ...mapList.flatMap(map => map.npcs)].map(npc => npc.id));
  const itemIds = new Set([...(context.items ?? []), ...mapList.flatMap(map => map.items)].map(item => item.id));
  const interactableIds = new Set([...(context.interactables ?? []), ...mapList.flatMap(map => [...map.interactables, ...map.exits])].map(interactable => interactable.id));
  const mapIds = new Set(mapList.map(map => map.id));
  const questById = new Map(quests.map(quest => [quest.id, quest]));
  const sequenceByQuestline = new Map<string, Map<number, QuestId>>();

  for (const quest of quests) {
    if (isBlank(quest.id)) issues.push(issue('error', 'Quest has an empty id.', { questId: quest.id }));
    if (questIds.has(quest.id)) {
      duplicateQuestIds.add(quest.id);
      issues.push(issue('error', `Duplicate quest id: ${quest.id}`, { questId: quest.id }));
    }
    questIds.add(quest.id);
    if (isBlank(quest.title)) issues.push(issue('error', 'Quest is missing a title.', { questId: quest.id }));
    if ((quest.parentQuestId || quest.sequence !== undefined) && isBlank(quest.questlineId)) issues.push(issue('warning', 'Quest uses parent/sequence fields without a questlineId.', { questId: quest.id }));
    if (quest.questlineId && quest.sequence !== undefined) {
      const sequenceMap = sequenceByQuestline.get(quest.questlineId) ?? new Map<number, QuestId>();
      const existing = sequenceMap.get(quest.sequence);
      if (existing) issues.push(issue('warning', `Questline "${quest.questlineId}" has duplicate sequence ${quest.sequence} on quests "${existing}" and "${quest.id}".`, { questId: quest.id }));
      sequenceMap.set(quest.sequence, quest.id);
      sequenceByQuestline.set(quest.questlineId, sequenceMap);
    }
    if (quest.parentQuestId && !allQuestIds.has(quest.parentQuestId)) issues.push(issue('error', `Quest parentQuestId references missing quest "${quest.parentQuestId}".`, { questId: quest.id, targetId: quest.parentQuestId }));
    if (quest.category === 'hidden' && quest.requiredForProgression === true) issues.push(issue('warning', 'Hidden quest is marked requiredForProgression; hidden quests should usually stay optional.', { questId: quest.id }));
    if (quest.category === 'side' && quest.requiredForProgression === true) issues.push(issue('warning', 'Side quest is marked requiredForProgression; side quests are optional by default.', { questId: quest.id }));

    const objectiveIds = new Set<ObjectiveId>();
    for (const objective of quest.objectives) {
      if (isBlank(objective.id)) issues.push(issue('error', 'Objective has an empty id.', { questId: quest.id, objectiveId: objective.id }));
      if (objectiveIds.has(objective.id)) issues.push(issue('error', `Duplicate objective id "${objective.id}" in quest "${quest.id}".`, { questId: quest.id, objectiveId: objective.id }));
      objectiveIds.add(objective.id);
      if (isBlank(objective.label)) issues.push(issue('error', 'Objective is missing a label.', { questId: quest.id, objectiveId: objective.id }));
    }

    for (const objective of quest.objectives) {
      for (const prerequisiteId of objective.prerequisiteObjectiveIds ?? []) {
        if (!objectiveIds.has(prerequisiteId)) issues.push(issue('error', `Objective prerequisite "${prerequisiteId}" does not exist in quest "${quest.id}".`, { questId: quest.id, objectiveId: objective.id, targetId: prerequisiteId }));
      }
      validateObjectiveTarget(objective, quest.id, issues, { npcIds, itemIds, interactableIds, mapIds });
      for (const reward of objective.rewards ?? []) validateReward(reward, issues, quest.id, objective.id, allQuestIds);
    }
    for (const prerequisite of quest.prerequisites ?? []) validatePrerequisite(prerequisite, issues, quest.id, questById);
    for (const reward of quest.rewards ?? []) validateReward(reward, issues, quest.id, undefined, allQuestIds);
  }

  for (const npc of context.npcs ?? []) validateNpcQuestMetadata(npc, issues, allQuestIds, questById);
  for (const map of mapList) for (const npc of map.npcs) validateNpcQuestMetadata(npc, issues, allQuestIds, questById);

  if (duplicateQuestIds.size > 0) issues.push(issue('warning', 'Duplicate quest ids may hide additional validation issues for the duplicated definitions.'));
  return issues;
}

function validatePrerequisite(prerequisite: QuestPrerequisite, issues: QuestValidationIssue[], questId: QuestId, questById: Map<QuestId, QuestDefinition>) {
  if (prerequisite.type === 'flag') {
    if (isBlank(prerequisite.flag) || !validFlagName(prerequisite.flag)) issues.push(issue('error', `Flag prerequisite has an empty or malformed flag name "${prerequisite.flag}".`, { questId, targetId: prerequisite.flag }));
    return;
  }
  const targetQuest = questById.get(prerequisite.questId);
  if (!targetQuest) {
    issues.push(issue('error', `Quest prerequisite references missing quest "${prerequisite.questId}".`, { questId, targetId: prerequisite.questId }));
    return;
  }
  if (prerequisite.type === 'objectiveCompleted' && !targetQuest.objectives.some(objective => objective.id === prerequisite.objectiveId)) {
    issues.push(issue('error', `Quest prerequisite references missing objective "${prerequisite.objectiveId}" on quest "${prerequisite.questId}".`, { questId, objectiveId: prerequisite.objectiveId, targetId: prerequisite.questId }));
  }
}

function validateReward(reward: QuestReward, issues: QuestValidationIssue[], questId: QuestId, objectiveId: ObjectiveId | undefined, questIds: Set<QuestId>) {
  switch (reward.type) {
    case 'activateQuest':
    case 'discoverQuest':
      if (!questIds.has(reward.questId)) issues.push(issue('error', `Reward ${reward.type} references missing quest "${reward.questId}".`, { questId, objectiveId, targetId: reward.questId }));
      break;
    case 'setFlag':
      if (isBlank(reward.flag) || !validFlagName(reward.flag)) issues.push(issue('error', `Reward setFlag has an empty or malformed flag name "${reward.flag}".`, { questId, objectiveId, targetId: reward.flag }));
      break;
    case 'unlockGate':
      if (isBlank(reward.gateId)) issues.push(issue('error', 'Reward unlockGate has an empty gate id.', { questId, objectiveId }));
      break;
    case 'unlockSkill':
      if (isBlank(reward.skillId)) issues.push(issue('error', 'Reward unlockSkill has an empty skill id.', { questId, objectiveId }));
      break;
    case 'addScore':
      if (!Number.isFinite(reward.amount) || reward.amount < 0) issues.push(issue('error', `Reward addScore has malformed amount "${reward.amount}".`, { questId, objectiveId }));
      break;
    case 'showToast':
      if (isBlank(reward.text)) issues.push(issue('warning', 'Reward showToast has empty text.', { questId, objectiveId }));
      break;
    default:
      issues.push(issue('error', `Unsupported reward type "${(reward as { type?: string }).type}".`, { questId, objectiveId }));
  }
}

function validateObjectiveTarget(objective: ObjectiveDefinition, questId: QuestId, issues: QuestValidationIssue[], known: { npcIds: Set<string>; itemIds: Set<string>; interactableIds: Set<string>; mapIds: Set<string> }) {
  const requireKnown = (kind: string, id: string | undefined, knownIds: Set<string>) => {
    if (!id) return;
    if (knownIds.size > 0 && !knownIds.has(id)) issues.push(issue('warning', `${kind} objective target "${id}" was not found in known content.`, { questId, objectiveId: objective.id, targetId: id }));
  };
  switch (objective.type) {
    case 'talkToNpc': requireKnown('talkToNpc', objective.npcId, known.npcIds); break;
    case 'findItem':
    case 'possessItem': requireKnown(objective.type, objective.itemId, known.itemIds); break;
    case 'deliverItem': requireKnown('deliverItem item', objective.itemId, known.itemIds); requireKnown('deliverItem interactable', objective.interactableId, known.interactableIds); break;
    case 'completeInteraction':
    case 'inspectInteractable': requireKnown(objective.type, objective.interactableId, known.interactableIds); break;
    case 'enterArea': requireKnown('enterArea', objective.mapId, known.mapIds); break;
    case 'reachLocation': requireKnown('reachLocation', objective.locationId, known.mapIds); break;
    case 'cleanTarget': requireKnown('cleanTarget', objective.targetId, known.interactableIds); break;
    case 'questFlag': if (isBlank(objective.flag) || !validFlagName(objective.flag)) issues.push(issue('error', `Quest flag objective has an empty or malformed flag "${objective.flag}".`, { questId, objectiveId: objective.id, targetId: objective.flag })); break;
  }
}

function validateNpcQuestMetadata(npc: NPCDefinition, issues: QuestValidationIssue[], questIds: Set<QuestId>, questById: Map<QuestId, QuestDefinition>) {
  const metadata = npc.quests;
  if (!metadata) return;
  const checkList = (field: 'offersQuestIds' | 'turnsInQuestIds' | 'involvedQuestIds', ids: readonly QuestId[] | undefined) => {
    const seen = new Set<QuestId>();
    for (const questId of ids ?? []) {
      if (seen.has(questId)) issues.push(issue('error', `NPC quest metadata field ${field} contains duplicate quest "${questId}".`, { npcId: npc.id, targetId: questId }));
      seen.add(questId);
      if (!questIds.has(questId)) issues.push(issue('error', `NPC quest metadata field ${field} references missing quest "${questId}".`, { npcId: npc.id, targetId: questId }));
    }
  };
  checkList('offersQuestIds', metadata.offersQuestIds);
  checkList('turnsInQuestIds', metadata.turnsInQuestIds);
  checkList('involvedQuestIds', metadata.involvedQuestIds);
  for (const questId of metadata.offersQuestIds ?? []) {
    const quest = questById.get(questId);
    if (quest?.category === 'hidden') issues.push(issue('warning', `NPC "${npc.id}" normally offers hidden quest "${questId}".`, { npcId: npc.id, questId, targetId: questId }));
    if (quest?.category === 'hidden' && quest.hiddenUntilDiscovered) issues.push(issue('warning', `NPC "${npc.id}" normally offers completed-only hidden quest "${questId}".`, { npcId: npc.id, questId, targetId: questId }));
  }
}
