import type { ObjectiveDefinition, ObjectiveId, QuestDefinition, QuestEvent, QuestEventResult, QuestId, QuestPrerequisite, QuestReward, QuestRuntimeState, QuestStatus } from './content/types';

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
  if (quest.hiddenUntilDiscovered && !questState.discoveredQuestIds.has(quest.id)) return false;
  const status = questState.questStatuses[quest.id] ?? 'locked';
  return status === 'active' || status === 'completed' || status === 'available' || Boolean(quest.previewWhenLocked);
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
    if (!isQuestActive(questState, quest) || !isQuestVisible(questState, quest)) continue;
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
