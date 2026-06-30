import type { AssetId } from './assets';
import type { InteractableDefinition, ItemDefinition, MapDefinition, NPCDefinition, ObjectiveDefinition, QuestDefinition, QuestEvent, QuestEventResult, Rect } from './content/types';

type WorldInteractionState = {
  inventory: { items: Record<string, number> };
  rewardedPickups: Set<string>;
  delivered: boolean;
};

export type WorldInteractionContext = {
  currentMap: MapDefinition;
  player: Rect;
  state: WorldInteractionState;
  quests: QuestDefinition[];
  currentItems: () => ItemDefinition[];
  dist: (a: Rect, b: Rect) => number;
  carrySize: (id: string) => number;
  canCarry: (id: string) => boolean;
  addItem: (id: string) => void;
  removeItem: (id: string) => void;
  isBridgeUnlocked: () => boolean;
  isObjectiveUnlocked: (questId: string, objective: ObjectiveDefinition) => boolean;
  processQuestEvent: (event: QuestEvent) => QuestEventResult;
  switchMap: (exit: InteractableDefinition) => void;
  completeBridgeObjective: () => boolean;
  tryCleanTarget: (target: InteractableDefinition) => boolean;
  startNpcDialogue: (npc: NPCDefinition) => void;
  inspectImage: (title: string, assetId: AssetId, caption: string) => void;
  toast: (text: string) => void;
  refreshUI: () => void;
};

export function routeWorldInteraction(context: WorldInteractionContext) {
  const {
    currentMap,
    player,
    state,
    quests,
    currentItems,
    dist,
    carrySize,
    canCarry,
    addItem,
    removeItem,
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
  } = context;

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
    if (tryCleanTarget(nearbyInteractable)) return;
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
  const item = currentItems().filter(({ done }) => !done).sort((a, b) => dist(player, a) - dist(player, b))[0];
  if (item && dist(player, item) < 70) {
    if (!canCarry(item.id)) { toast(carrySize(item.id) === 2 ? 'That takes both hands, champ. Set down a bulky supply first.' : 'Your hands are full! Set down a bulky supply first.'); return; }
    item.done = true; addItem(item.id);
    const result = processQuestEvent({ type: 'itemPickedUp', itemId: item.id, mapId: currentMap.id });
    const firstPickup = result.completedObjectives.length > 0 && !state.rewardedPickups.has(item.id); if (firstPickup) state.rewardedPickups.add(item.id);
    toast(`${item.label} recovered!${firstPickup ? ' +50 SP' : ''}`); refreshUI(); return;
  }
  toast('Nothing useful nearby. Service Crew Rule #2: check the weirdest place first.');
}
