import { getNpcQuestState, isObjectiveComplete, isObjectiveUnlocked, isQuestCompleted } from './questEngine';
import type { DialogueCondition, DialogueTopic, DialogueTopicId, ItemDefinition, MapDefinition, NPCDefinition, QuestDefinition, QuestRuntimeState } from './content/types';

export interface DialogueRuntimeState { flags: Record<string, boolean | string | number>; seenTopicIds: Set<DialogueTopicId>; }

export interface DialogueContext {
  npc: NPCDefinition;
  mapId: string;
  npcs: readonly NPCDefinition[];
  quests: QuestDefinition[];
  questState: QuestRuntimeState;
  dialogueState: DialogueRuntimeState;
  heldItemCount: (itemId: string) => number;
}

export interface DialogueValidationIssue { level: 'error' | 'warning'; message: string; topicId?: string; targetId?: string; }

function expectedValue(value: boolean | string | number | undefined) { return value ?? true; }
function applyInvert(value: boolean, invert?: boolean) { return invert ? !value : value; }
function questById(quests: readonly QuestDefinition[], questId: string) { return quests.find(quest => quest.id === questId); }

export function dialogueConditionMet(condition: DialogueCondition, context: DialogueContext) {
  const npcId = 'npcId' in condition && condition.npcId ? condition.npcId : context.npc.id;
  let matched = false;
  switch (condition.type) {
    case 'always': matched = true; break;
    case 'questStatus': matched = context.questState.questStatuses[condition.questId] === condition.status; break;
    case 'questCompleted': {
      const quest = questById(context.quests, condition.questId);
      matched = Boolean(quest && isQuestCompleted(context.questState, quest));
      break;
    }
    case 'objectiveCompleted': matched = isObjectiveComplete(context.questState, condition.questId, condition.objectiveId); break;
    case 'objectiveUnlocked': {
      const quest = questById(context.quests, condition.questId);
      const objective = quest?.objectives.find(candidate => candidate.id === condition.objectiveId);
      matched = Boolean(quest && objective && isObjectiveUnlocked(context.questState, quest, objective));
      break;
    }
    case 'questFlag': matched = context.questState.flags[condition.flag] === expectedValue(condition.value); break;
    case 'dialogueFlag': matched = context.dialogueState.flags[condition.flag] === expectedValue(condition.value); break;
    case 'itemHeld': matched = context.heldItemCount(condition.itemId) > 0; break;
    case 'npcHasAvailableQuest': matched = getNpcQuestState(npcId, context.npcs, context.quests, context.questState).hasAvailableQuest; break;
    case 'npcHasCompletableQuest': matched = getNpcQuestState(npcId, context.npcs, context.quests, context.questState).hasCompletableQuest; break;
  }
  return applyInvert(matched, condition.invert);
}

export function getValidDialogueTopics(topics: readonly DialogueTopic[], context: DialogueContext) {
  return topics
    .filter(topic => topic.npcId === context.npc.id || topic.groupId === context.npc.dialogueId)
    .filter(topic => !((topic.once || topic.hideAfterComplete) && context.dialogueState.seenTopicIds.has(topic.id)))
    .filter(topic => (topic.conditions ?? [{ type: 'always' }]).every(condition => dialogueConditionMet(condition, context)))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

export function meaningfulDialogueTopics(topics: readonly DialogueTopic[]) { return topics.filter(topic => !topic.isDefault); }

export function topLevelDialogueTopics(topics: readonly DialogueTopic[]) {
  const followUpTopicIds = new Set(topics.flatMap(topic => topic.nextTopicIds ?? []));
  return topics.filter(topic => !followUpTopicIds.has(topic.id));
}

export function getValidNextDialogueTopics(topics: readonly DialogueTopic[], topic: DialogueTopic, context: DialogueContext) {
  const nextTopicIds = topic.nextTopicIds ?? [];
  if (!nextTopicIds.length) return [];
  const validTopics = getValidDialogueTopics(topics, context);
  return nextTopicIds
    .map(topicId => validTopics.find(candidate => candidate.id === topicId))
    .filter((candidate): candidate is DialogueTopic => Boolean(candidate));
}

export function validateDialogueTopics(topics: readonly DialogueTopic[], context: { npcs?: readonly NPCDefinition[]; quests?: readonly QuestDefinition[]; items?: readonly ItemDefinition[]; maps?: Record<string, MapDefinition> | readonly MapDefinition[] } = {}) {
  const issues: DialogueValidationIssue[] = [];
  const topicIds = new Set<string>();
  const npcIds = new Set((context.npcs ?? []).map(npc => npc.id));
  const dialogueGroups = new Set((context.npcs ?? []).map(npc => npc.dialogueId));
  const questById = new Map((context.quests ?? []).map(quest => [quest.id, quest]));
  const mapList = Array.isArray(context.maps) ? context.maps : Object.values(context.maps ?? {});
  const itemIds = new Set([...(context.items ?? []), ...mapList.flatMap(map => map.items)].map(item => item.id));

  const validateQuestReference = (topic: DialogueTopic, questId: string, objectiveId?: string) => {
    const quest = questById.get(questId);
    if (!quest) { issues.push({ level: 'error', message: `Dialogue topic references missing quest "${questId}".`, topicId: topic.id, targetId: questId }); return; }
    if (objectiveId && !quest.objectives.some(objective => objective.id === objectiveId)) issues.push({ level: 'error', message: `Dialogue topic references missing objective "${objectiveId}" on quest "${questId}".`, topicId: topic.id, targetId: objectiveId });
  };
  const validateFlag = (topic: DialogueTopic, flag: string) => {
    if (!/^[a-z][a-zA-Z0-9:._-]*$/.test(flag)) issues.push({ level: 'error', message: `Dialogue topic uses malformed flag "${flag}".`, topicId: topic.id, targetId: flag });
  };

  for (const topic of topics) {
    if (!topic.id.trim()) issues.push({ level: 'error', message: 'Dialogue topic has an empty id.' });
    if (topicIds.has(topic.id)) issues.push({ level: 'error', message: `Duplicate dialogue topic id: ${topic.id}`, topicId: topic.id });
    topicIds.add(topic.id);
    if (!topic.npcId && !topic.groupId) issues.push({ level: 'error', message: 'Dialogue topic must specify npcId or groupId.', topicId: topic.id });
    if (topic.npcId && !npcIds.has(topic.npcId)) issues.push({ level: 'error', message: `Dialogue topic references missing NPC "${topic.npcId}".`, topicId: topic.id, targetId: topic.npcId });
    if (topic.groupId && !dialogueGroups.has(topic.groupId)) issues.push({ level: 'warning', message: `Dialogue topic references unused dialogue group "${topic.groupId}".`, topicId: topic.id, targetId: topic.groupId });
    if (!topic.label.trim()) issues.push({ level: 'error', message: 'Dialogue topic has an empty label.', topicId: topic.id });
    if (!topic.response.trim()) issues.push({ level: 'error', message: 'Dialogue topic has an empty response.', topicId: topic.id });
    if (topic.once && topic.repeatable) issues.push({ level: 'warning', message: 'Dialogue topic is both once and repeatable; once will win.', topicId: topic.id });
    for (const nextTopicId of topic.nextTopicIds ?? []) {
      const nextTopic = topics.find(candidate => candidate.id === nextTopicId);
      if (!nextTopic) {
        issues.push({ level: 'error', message: `Dialogue topic references missing nextTopicId "${nextTopicId}".`, topicId: topic.id, targetId: nextTopicId });
      } else if (topic.npcId && nextTopic.npcId && topic.npcId !== nextTopic.npcId) {
        issues.push({ level: 'warning', message: `Dialogue nextTopicId "${nextTopicId}" points to a different NPC.`, topicId: topic.id, targetId: nextTopicId });
      } else if (topic.groupId && nextTopic.groupId && topic.groupId !== nextTopic.groupId) {
        issues.push({ level: 'warning', message: `Dialogue nextTopicId "${nextTopicId}" points to a different dialogue group.`, topicId: topic.id, targetId: nextTopicId });
      }
    }

    for (const condition of topic.conditions ?? []) {
      switch (condition.type) {
        case 'questStatus':
        case 'questCompleted': validateQuestReference(topic, condition.questId); break;
        case 'objectiveCompleted':
        case 'objectiveUnlocked': validateQuestReference(topic, condition.questId, condition.objectiveId); break;
        case 'questFlag':
        case 'dialogueFlag': validateFlag(topic, condition.flag); break;
        case 'itemHeld': if (itemIds.size && !itemIds.has(condition.itemId)) issues.push({ level: 'warning', message: `Dialogue topic references unknown item "${condition.itemId}".`, topicId: topic.id, targetId: condition.itemId }); break;
        case 'npcHasAvailableQuest':
        case 'npcHasCompletableQuest': if (condition.npcId && !npcIds.has(condition.npcId)) issues.push({ level: 'error', message: `Dialogue condition references missing NPC "${condition.npcId}".`, topicId: topic.id, targetId: condition.npcId }); break;
      }
    }
    for (const effect of topic.effects ?? []) {
      if (effect.type === 'setDialogueFlag' || effect.type === 'setQuestFlag') validateFlag(topic, effect.flag);
      if (effect.type === 'emitQuestEvent' && effect.event.type === 'questFlagSet') validateFlag(topic, effect.event.flag);
      if (effect.type === 'runNpcQuestInteraction' && effect.npcId && !npcIds.has(effect.npcId)) issues.push({ level: 'error', message: `Dialogue effect references missing NPC "${effect.npcId}".`, topicId: topic.id, targetId: effect.npcId });
      if (effect.type === 'showToast' && !effect.text.trim()) issues.push({ level: 'warning', message: 'Dialogue showToast effect has empty text.', topicId: topic.id });
    }
  }
  return issues;
}
