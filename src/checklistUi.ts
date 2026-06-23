import { getVisibleObjectivesForQuest, getVisibleQuests } from './questEngine';
import type { ObjectiveDefinition, QuestDefinition, QuestId, QuestRuntimeState } from './content/types';

type ChecklistUiElements = {
  checklist: HTMLElement;
  tasks: HTMLElement;
  checklistButton: HTMLButtonElement;
  closeButton: Element;
  scrollUpButton: HTMLButtonElement;
  scrollDownButton: HTMLButtonElement;
};

type ChecklistUiOptions = {
  elements: ChecklistUiElements;
  quests: QuestDefinition[];
  getQuestState: () => QuestRuntimeState;
  isObjectiveComplete: (questId: string, objectiveId: string) => boolean;
  isObjectiveUnlocked: (questId: string, objective: ObjectiveDefinition) => boolean;
  isQuestTrackable: (quest: QuestDefinition) => boolean;
  onTrackQuest: (questId: QuestId) => void;
  onOpenChanged: (open: boolean) => void;
  canToggleOpen?: () => boolean;
};

export type ChecklistUiController = {
  refresh: () => void;
  setOpen: (open: boolean) => void;
  isOpen: () => boolean;
  updateScrollButtons: () => void;
};

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

const preventControlDefault = (event: Event) => event.preventDefault();

export function createChecklistUi(options: ChecklistUiOptions): ChecklistUiController {
  const { elements, quests } = options;
  const collapsedChecklistRows = new Set<string>();

  function progressForQuests(groupQuests: QuestDefinition[]) {
    let complete = 0, total = 0;
    const questState = options.getQuestState();
    for (const quest of groupQuests) {
      for (const objective of getVisibleObjectivesForQuest(questState, quest)) {
        if (objective.required === false || objective.isOptional) continue;
        total++;
        if (options.isObjectiveComplete(quest.id, objective.id)) complete++;
      }
    }
    return total ? `${complete}/${total}` : '';
  }

  function checklistToggle(key: string, label: string, depth: number, questsForProgress: QuestDefinition[]) {
    const collapsed = collapsedChecklistRows.has(key);
    const progress = progressForQuests(questsForProgress);
    const rowClass = depth === 0 ? 'quest-category-row' : 'questline-row';
    return `<li class="checklist-row checklist-toggle ${rowClass} depth-${depth}" data-action="toggle-checklist" data-key="${escapeHtml(key)}" role="button" tabindex="0"><span class="twisty">${collapsed ? '▸' : '▾'}</span><span>${escapeHtml(label)}</span>${progress ? `<b>${progress}</b>` : ''}</li>`;
  }

  function checklistQuestRow(quest: QuestDefinition, depth: number) {
    const trackable = options.isQuestTrackable(quest);
    const questState = options.getQuestState();
    const tracked = questState.trackedQuestId === quest.id && trackable;
    const progress = progressForQuests([quest]);
    const secret = quest.category === 'hidden' ? 'Secret Found: ' : '';
    return `<li class="checklist-row quest-row depth-${depth}${tracked ? ' tracked' : ''}${trackable ? ' trackable' : ''}" data-action="track-quest" data-quest-id="${escapeHtml(quest.id)}" role="${trackable ? 'button' : 'listitem'}" ${trackable ? 'tabindex="0"' : ''}><span class="twisty"></span><span>${tracked ? '★ ' : ''}${escapeHtml(secret + quest.title)}</span>${tracked ? '<em>Tracked</em>' : ''}${progress ? `<b>${progress}</b>` : ''}</li>`;
  }

  function renderChecklist() {
    const questState = options.getQuestState();
    const visibleQuests = [...getVisibleQuests(quests, questState)].sort((a, b) => categoryOrder(a.category) - categoryOrder(b.category) || (a.questlineId ?? '').localeCompare(b.questlineId ?? '') || (a.sequence ?? 9999) - (b.sequence ?? 9999) || a.title.localeCompare(b.title));
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
          for (const objective of getVisibleObjectivesForQuest(questState, quest)) {
            const classes = ['checklist-row', 'objective-row', 'depth-3'];
            if (options.isObjectiveComplete(quest.id, objective.id)) classes.push('done');
            else if (!options.isObjectiveUnlocked(quest.id, objective)) classes.push('locked');
            const trackable = options.isQuestTrackable(quest);
            rows.push(`<li class="${classes.join(' ')}${trackable ? ' trackable' : ''}" data-action="track-quest" data-quest-id="${escapeHtml(quest.id)}" role="${trackable ? 'button' : 'listitem'}" ${trackable ? 'tabindex="0"' : ''}><span>${escapeHtml(objective.label)}</span></li>`);
          }
        }
      }
    }
    return rows.join('');
  }

  function updateScrollButtons() {
    const canScroll = elements.tasks.scrollHeight > elements.tasks.clientHeight + 1;
    elements.scrollUpButton.disabled = !canScroll || elements.tasks.scrollTop <= 0;
    elements.scrollDownButton.disabled = !canScroll || elements.tasks.scrollTop + elements.tasks.clientHeight >= elements.tasks.scrollHeight - 1;
  }

  function refresh() {
    elements.tasks.innerHTML = renderChecklist();
    updateScrollButtons();
  }

  function setOpen(open: boolean) {
    elements.checklist.classList.toggle('open', open);
    elements.checklist.setAttribute('aria-hidden', String(!open));
    elements.checklistButton.setAttribute('aria-expanded', String(open));
    options.onOpenChanged(open);
    requestAnimationFrame(updateScrollButtons);
  }

  function isOpen() {
    return elements.checklist.classList.contains('open');
  }

  const scrollChecklist = (direction: 1 | -1) => elements.tasks.scrollBy({ top: direction * 120, behavior: 'smooth' });

  const activateChecklistRow = (target: EventTarget | null) => {
    const row = target instanceof HTMLElement ? target.closest<HTMLElement>('[data-action]') : undefined;
    if (!row) return false;
    if (row.dataset.action === 'toggle-checklist' && row.dataset.key) {
      if (collapsedChecklistRows.has(row.dataset.key)) collapsedChecklistRows.delete(row.dataset.key);
      else collapsedChecklistRows.add(row.dataset.key);
      refresh();
      return true;
    }
    if (row.dataset.action === 'track-quest' && row.dataset.questId) {
      options.onTrackQuest(row.dataset.questId);
      return true;
    }
    return false;
  };

  elements.tasks.addEventListener('scroll', updateScrollButtons, { passive: true });
  elements.tasks.addEventListener('click', event => { if (activateChecklistRow(event.target)) event.preventDefault(); });
  elements.tasks.addEventListener('keydown', event => {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key !== 'Enter' && keyboardEvent.key !== ' ') return;
    if (activateChecklistRow(event.target)) event.preventDefault();
  });
  elements.scrollUpButton.addEventListener('pointerdown', event => { event.preventDefault(); scrollChecklist(-1); });
  elements.scrollDownButton.addEventListener('pointerdown', event => { event.preventDefault(); scrollChecklist(1); });
  elements.scrollUpButton.addEventListener('contextmenu', preventControlDefault);
  elements.scrollDownButton.addEventListener('contextmenu', preventControlDefault);
  elements.checklistButton.addEventListener('click', () => { if (options.canToggleOpen?.() ?? true) setOpen(!isOpen()); });
  elements.closeButton.addEventListener('click', () => setOpen(false));

  return { refresh, setOpen, isOpen, updateScrollButtons };
}
