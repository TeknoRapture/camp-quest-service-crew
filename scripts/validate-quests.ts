declare const process: { exit(code?: number): never };
import { maps } from '../src/content/maps/index.js';
import { npcs } from '../src/content/npcs.js';
import { quests } from '../src/content/quests.js';
import { validateQuestDefinitions } from '../src/questEngine.js';

const issues = validateQuestDefinitions(quests, { maps, npcs });
for (const issue of issues) {
  const details = [issue.questId && `quest=${issue.questId}`, issue.objectiveId && `objective=${issue.objectiveId}`, issue.npcId && `npc=${issue.npcId}`, issue.targetId && `target=${issue.targetId}`].filter(Boolean).join(' ');
  console[issue.level === 'error' ? 'error' : 'warn'](`${issue.level.toUpperCase()}: ${issue.message}${details ? ` (${details})` : ''}`);
}
if (issues.some(issue => issue.level === 'error')) process.exit(1);
console.log(`Quest validation passed with ${issues.length} warning(s).`);
