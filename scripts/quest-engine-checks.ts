function assertEqual(actual: unknown, expected: unknown) {
  if (actual !== expected) throw new Error(`Expected ${String(expected)}, got ${String(actual)}`);
}
function assertDeepEmpty(actual: unknown[]) {
  if (actual.length !== 0) throw new Error(`Expected empty array, got ${JSON.stringify(actual)}`);
}
import { createQuestState, getBlockingProgressionQuests, getTrackedObjective, isQuestVisible, isRequiredForProgression, validateQuestDefinitions } from '../src/questEngine.js';
import type { NPCDefinition, QuestDefinition } from '../src/content/types.js';

const baseQuest = (id: string, category: QuestDefinition['category'] = 'main'): QuestDefinition => ({
  id,
  title: id,
  category,
  startsActive: true,
  objectives: [{ id: 'shared', label: 'Shared objective id', type: 'questFlag', flag: `${id}Flag` }],
});

assertEqual(validateQuestDefinitions([{ ...baseQuest('a'), objectives: [{ id: 'x', label: 'One', type: 'questFlag', flag: 'a' }, { id: 'x', label: 'Two', type: 'questFlag', flag: 'b' }] }]).some(issue => issue.level === 'error'), true);
assertEqual(validateQuestDefinitions([baseQuest('a'), baseQuest('b')]).some(issue => issue.message.includes('Duplicate objective')), false);
assertEqual(validateQuestDefinitions([{ ...baseQuest('a'), objectives: [{ id: 'x', label: 'X', type: 'questFlag', flag: 'x', prerequisiteObjectiveIds: ['missing'] }] }]).some(issue => issue.message.includes('prerequisite')), true);
assertEqual(validateQuestDefinitions([{ ...baseQuest('a'), prerequisites: [{ type: 'questCompleted', questId: 'missing' }] }]).some(issue => issue.message.includes('missing quest')), true);
assertEqual(validateQuestDefinitions([{ ...baseQuest('a'), rewards: [{ type: 'activateQuest', questId: 'missing' }] }]).some(issue => issue.message.includes('missing quest')), true);

const hidden = baseQuest('hidden', 'hidden');
const side = baseQuest('side', 'side');
const main = baseQuest('main', 'main');
assertEqual(isRequiredForProgression(main), true);
assertEqual(isRequiredForProgression(side), false);
assertEqual(isRequiredForProgression(hidden), false);
const state = createQuestState([hidden, side, main]);
assertEqual(isQuestVisible(state, hidden), false);
state.questStatuses.hidden = 'completed';
state.completedQuestIds.add('hidden');
assertEqual(isQuestVisible(state, hidden), true);
assertDeepEmpty(getBlockingProgressionQuests([hidden, side], state));
assertEqual(getTrackedObjective([hidden], state)?.quest.id === 'hidden', false);

const npc: NPCDefinition = { id: 'coop', label: 'Coop', dialogueId: 'coop', x: 0, y: 0, w: 1, h: 1, quests: { offersQuestIds: ['main'] } };
assertEqual(validateQuestDefinitions([main], { npcs: [npc] }).some(issue => issue.level === 'error'), false);
assertEqual(validateQuestDefinitions([main], { npcs: [{ ...npc, quests: { offersQuestIds: ['missing'] } }] }).some(issue => issue.npcId === 'coop'), true);
console.log('Quest engine checks passed.');
