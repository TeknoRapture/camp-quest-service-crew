declare const process: { exit(code?: number): never };
import { dialogueTopics } from '../src/content/dialogue.js';
import { maps } from '../src/content/maps/index.js';
import { npcs } from '../src/content/npcs.js';
import { quests } from '../src/content/quests.js';
import { validateDialogueTopics } from '../src/dialogueEngine.js';

const issues = validateDialogueTopics(dialogueTopics, { maps, npcs, quests });
for (const issue of issues) {
  const details = [issue.topicId && `topic=${issue.topicId}`, issue.targetId && `target=${issue.targetId}`].filter(Boolean).join(' ');
  console[issue.level === 'error' ? 'error' : 'warn'](`${issue.level.toUpperCase()}: ${issue.message}${details ? ` (${details})` : ''}`);
}
if (issues.some(issue => issue.level === 'error')) process.exit(1);
console.log(`Dialogue validation passed with ${issues.length} warning(s).`);
