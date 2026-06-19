import type { NPCDefinition, ObjectiveDefinition, ObjectiveId, QuestDefinition, QuestEvent, QuestEventResult, QuestId, QuestPrerequisite, QuestReward, QuestRuntimeState, QuestStatus } from './content/types';

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
  return quest.requiredForProgression ?? quest.category === 'main';
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

function activateQuest(questState: QuestRuntimeState, quest: QuestDefinition) {
  if (questState.questStatuses[quest.id] === 'active' || questState.questStatuses[quest.id] === 'completed') return false;
  questState.questStatuses[quest.id] = 'active';
  questState.activeQuestIds.add(quest.id);
  questState.discoveredQuestIds.add(quest.id);
  return true;
}

function discoverQuest(questState: QuestRuntimeState, quest: QuestDefinition) {
  if (questState.discoveredQuestIds.has(quest.id)) return false;
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

export function getVisibleObjectivesForQuest(questState: QuestRuntimeState, quest: QuestDefinition) {
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

function isQuestReadyToComplete(questState: QuestRuntimeState, quest: QuestDefinition) {
  return quest.objectives.every(objective => objective.required === false || objective.isOptional || isObjectiveComplete(questState, quest.id, objective.id));
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
  const result: QuestEventResult = { completedObjectives: [], completedQuests: [], activatedQuests: [], discoveredQuests: [], rewards: [], messages: [] };

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
    if (isQuestReadyToComplete(questState, quest) && completeQuest(questState, quest)) {
      result.completedQuests.push(quest.id);
      if (quest.rewards) result.rewards.push(...quest.rewards);
    }
  }

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
    case 'activateQuest': questState.questStatuses[reward.questId] = 'active'; questState.activeQuestIds.add(reward.questId); questState.discoveredQuestIds.add(reward.questId); break;
    case 'discoverQuest': questState.discoveredQuestIds.add(reward.questId); if (!questState.questStatuses[reward.questId] || questState.questStatuses[reward.questId] === 'locked') questState.questStatuses[reward.questId] = 'available'; break;
    case 'unlockGate': questState.flags[`gate:${reward.gateId}`] = true; handlers.unlockGate?.(reward.gateId); break;
    case 'unlockSkill': questState.flags[`skill:${reward.skillId}`] = true; handlers.unlockSkill?.(reward.skillId); break;
  }
}

export function validateQuestDefinitions(quests: QuestDefinition[], npcs: readonly NPCDefinition[] = []) {
  const issues: string[] = [];
  const questIds = new Set<QuestId>();
  for (const quest of quests) {
    if (questIds.has(quest.id)) issues.push(`Duplicate quest id: ${quest.id}`);
    questIds.add(quest.id);

    const objectiveIds = new Set<ObjectiveId>();
    for (const objective of quest.objectives) {
      if (objectiveIds.has(objective.id)) issues.push(`Duplicate objective id "${objective.id}" in quest "${quest.id}"`);
      objectiveIds.add(objective.id);
    }
    for (const objective of quest.objectives) {
      for (const prerequisiteId of objective.prerequisiteObjectiveIds ?? []) {
        if (!objectiveIds.has(prerequisiteId)) issues.push(`Quest "${quest.id}" objective "${objective.id}" references missing prerequisite objective "${prerequisiteId}"`);
      }
      for (const reward of objective.rewards ?? []) {
        if ((reward.type === 'activateQuest' || reward.type === 'discoverQuest') && !questIds.has(reward.questId) && !quests.some(candidate => candidate.id === reward.questId)) issues.push(`Quest "${quest.id}" objective "${objective.id}" reward references missing quest "${reward.questId}"`);
      }
    }
    for (const reward of quest.rewards ?? []) {
      if ((reward.type === 'activateQuest' || reward.type === 'discoverQuest') && !questIds.has(reward.questId) && !quests.some(candidate => candidate.id === reward.questId)) issues.push(`Quest "${quest.id}" reward references missing quest "${reward.questId}"`);
    }
  }

  for (const npc of npcs) {
    const referencedQuestIds = [...(npc.quests?.offersQuestIds ?? []), ...(npc.quests?.turnsInQuestIds ?? []), ...(npc.quests?.involvedQuestIds ?? [])];
    for (const questId of referencedQuestIds) {
      if (!questIds.has(questId)) issues.push(`NPC "${npc.id}" quest metadata references missing quest "${questId}"`);
    }
  }

  return issues;
}
