import type { AssetId } from '../assets';

/** Shared shapes for safely editing the static game content modules. */
export interface Rect { x: number; y: number; w: number; h: number; }
export interface Thing extends Rect { id: string; label: string; color?: string; done?: boolean; }
export interface Point { x: number; y: number; }
export interface MapSpawn extends Point { id: string; }
export interface PortraitSet { default?: string; happy?: string; serious?: string; surprised?: string; }
export interface DialogueSpeaker { displayName?: string; label?: string; accent?: string; portraits?: PortraitSet; }
export type Dialogue = Record<string, readonly string[]>;
export type QuestId = string;
export type ObjectiveId = string;
export interface NPCQuestGiverMetadata {
  offersQuestIds?: QuestId[];
  turnsInQuestIds?: QuestId[];
  involvedQuestIds?: QuestId[];
  questGiver?: boolean;
}
export interface NPCDefinition extends Thing { displayName?: string; accent?: string; portraits?: PortraitSet; dialogueId: string; quests?: NPCQuestGiverMetadata; }
export type QuestCategory = 'main' | 'side' | 'hidden' | 'tutorial';
export type QuestStatus = 'locked' | 'available' | 'active' | 'completed';
export type ObjectiveTargetType = 'item' | 'npc' | 'interactable' | 'exit' | 'zone' | 'location';
export type ObjectiveType = 'talkToNpc' | 'findItem' | 'possessItem' | 'deliverItem' | 'completeInteraction' | 'inspectInteractable' | 'enterArea' | 'reachLocation' | 'cleanTarget' | 'questFlag';
export interface ObjectiveTarget { type: ObjectiveTargetType; id: string; mapId?: string; label?: string; }
interface ObjectiveBase {
  id: ObjectiveId;
  label: string;
  required?: boolean;
  prerequisiteObjectiveIds?: ObjectiveId[];
  visibleWhenLocked?: boolean;
  isOptional?: boolean;
  target?: ObjectiveTarget;
  arrowTarget?: ObjectiveTarget;
  rewards?: QuestReward[];
  /** Optional line to show when this objective completes through a matching talk/interact event. */
  completionDialogue?: string;
}

export interface TalkToNpcObjective extends ObjectiveBase { type: 'talkToNpc'; npcId: string; mapId?: string; }
export interface FindItemObjective extends ObjectiveBase { type: 'findItem'; itemId: string; mapId?: string; }
export interface PossessItemObjective extends ObjectiveBase { type: 'possessItem'; itemId: string; mapId?: string; }
export interface DeliverItemObjective extends ObjectiveBase { type: 'deliverItem'; itemId: string; interactableId: string; mapId?: string; }
export interface CompleteInteractionObjective extends ObjectiveBase { type: 'completeInteraction'; interactableId: string; mapId?: string; }
export interface InspectInteractableObjective extends ObjectiveBase { type: 'inspectInteractable'; interactableId: string; mapId?: string; }
export interface EnterAreaObjective extends ObjectiveBase { type: 'enterArea'; mapId: string; }
export interface ReachLocationObjective extends ObjectiveBase { type: 'reachLocation'; locationId: string; mapId?: string; }
export interface CleanTargetObjective extends ObjectiveBase { type: 'cleanTarget'; targetId: string; mapId?: string; }
export interface QuestFlagObjective extends ObjectiveBase { type: 'questFlag'; flag: string; }
export type ObjectiveDefinition = TalkToNpcObjective | FindItemObjective | PossessItemObjective | DeliverItemObjective | CompleteInteractionObjective | InspectInteractableObjective | EnterAreaObjective | ReachLocationObjective | CleanTargetObjective | QuestFlagObjective;
export interface QuestDefinition {
  id: QuestId;
  title: string;
  summary?: string;
  category: QuestCategory;
  questlineId?: string;
  parentQuestId?: QuestId;
  sequence?: number;
  requiredForProgression?: boolean;
  hiddenUntilDiscovered?: boolean;
  startsActive?: boolean;
  previewWhenLocked?: boolean;
  prerequisites?: QuestPrerequisite[];
  discoveryTrigger?: QuestTrigger;
  /** Toast shown by the generic quest event flow when this quest is first discovered. */
  discoveryMessage?: string;
  startTrigger?: QuestTrigger;
  objectives: ObjectiveDefinition[];
  rewards?: QuestReward[];
}
export type QuestPrerequisite = { type: 'questCompleted'; questId: QuestId } | { type: 'objectiveCompleted'; questId: QuestId; objectiveId: ObjectiveId } | { type: 'flag'; flag: string; value?: boolean | string | number };
export type QuestTrigger = { type: 'event'; event: QuestEvent };
export type QuestReward =
  | { type: 'addScore'; amount: number }
  | { type: 'showToast'; text: string }
  | { type: 'setFlag'; flag: string; value?: boolean | string | number }
  | { type: 'activateQuest'; questId: QuestId }
  | { type: 'discoverQuest'; questId: QuestId }
  | { type: 'unlockGate'; gateId: string }
  | { type: 'unlockSkill'; skillId: SkillId };
export type QuestEvent =
  | { type: 'itemPickedUp'; itemId: string; mapId: string }
  | { type: 'itemDelivered'; itemId: string; interactableId: string; mapId: string }
  | { type: 'npcTalked'; npcId: string; mapId: string }
  | { type: 'mapEntered'; mapId: string; spawnId?: string }
  | { type: 'interactableInspected'; interactableId: string; mapId: string }
  | { type: 'interactionCompleted'; interactableId: string; mapId: string }
  | { type: 'locationReached'; locationId: string; mapId: string }
  | { type: 'cleanTargetCompleted'; targetId: string; mapId: string }
  | { type: 'questFlagSet'; flag: string };
export interface QuestEventResult { completedObjectives: { questId: QuestId; objectiveId: ObjectiveId }[]; completedQuests: QuestId[]; activatedQuests: QuestId[]; discoveredQuests: QuestId[]; rewards: QuestReward[]; messages: string[]; }
export interface QuestRuntimeState {
  questStatuses: Record<QuestId, QuestStatus>;
  completedObjectiveIdsByQuest: Record<QuestId, Set<ObjectiveId>>;
  discoveredQuestIds: Set<QuestId>;
  activeQuestIds: Set<QuestId>;
  completedQuestIds: Set<QuestId>;
  trackedQuestId?: QuestId;
  flags: Record<string, boolean | string | number>;
}
export type SkillId = 'nature' | 'swimming' | 'climbing';
export interface SkillDefinition { id: SkillId; label: string; missingSkillMessage: string; }
export interface ItemDefinition extends Thing {
  assetId?: AssetId;
  description?: string;
  carryType?: 'large' | 'tray' | 'small';
  carrySize?: 1 | 2;
  stackLimit?: number;
  inventoryLabel?: string;
  displayInInventory?: boolean;
  /** Future-ready cleaning rule metadata; the current pickup-only gameplay does not enforce item use. */
  useRestriction?: 'bathroom-only' | 'normal-floor-only';
}
export interface InteractableDefinition extends Thing {
  kind: 'inspection' | 'delivery-zone' | 'message' | 'map-exit' | 'task-location';
  title?: string;
  assetId?: AssetId;
  caption?: string;
  message?: string;
  targetMapId?: string;
  targetSpawnId?: string;
  /** Open exits can transition on overlap; omitted or action exits remain available for gated doors. */
  activation?: 'automatic' | 'action';
}
export interface HazardDefinition extends Thing {
  kind: 'mud' | 'mosquitoes' | 'wet' | 'water' | 'snake' | 'mouse' | 'raccoon' | 'spider' | 'vulture' | 'bee' | 'wasp';
  assetId?: AssetId;
  /** Skill required by a future special interaction such as taming, calming, or redirecting wildlife. */
  interactionSkill?: SkillId;
  missingSkillMessage?: string;
  /** Optional periodic energy damage and content-driven mitigation. */
  energyDamage?: number;
  damageInterval?: number;
  damageMessage?: string;
  mitigationSkill?: SkillId;
  mitigationMultiplier?: number;
}
export interface DoorwayDefinition {
  side: 'bottom' | 'top' | 'left' | 'right';
  /** Distance from the building's left edge for top/bottom doors, or top edge for left/right doors. */
  offset: number;
  width: number;
  /** Visual doorway depth. This is independent from the building's walkable front-overlap strip. */
  depth?: number;
}
export interface LocationDefinition extends Thing {
  /** Optional visible doorway; map-exit activation determines whether it is open, locked, or action-gated. */
  doorway?: DoorwayDefinition;
  /** Optional per-building override for the walkable strip along the lower/front edge. */
  frontOverlap?: number;
}
export interface TerrainFeature extends Rect {
  id: string;
  kind: 'road' | 'field' | 'woods' | 'gorge' | 'stream' | 'lake' | 'tile' | 'shower';
  label?: string;
  /** Blocking terrain with a required skill becomes traversable once that skill is available. */
  blocksMovement?: boolean;
  requiredSkill?: SkillId;
  missingSkillMessage?: string;
}
export interface NamedZone extends Rect { id: string; label: string; }

/** A small, content-first map definition. Add future interiors with another definition and paired map-exit interactables. */
export interface MapDefinition {
  id: string;
  displayName: string;
  size: { w: number; h: number };
  background: string;
  terrainStyle: 'outdoor' | 'interior';
  /** Default walkable depth along the lower/front edge of buildings; walls remain unaffected. */
  buildingFrontOverlap?: number;
  terrain: TerrainFeature[];
  buildings: LocationDefinition[];
  walls: Rect[];
  exits: InteractableDefinition[];
  npcs: NPCDefinition[];
  items: ItemDefinition[];
  hazards: HazardDefinition[];
  interactables: InteractableDefinition[];
  zones: NamedZone[];
  spawns: MapSpawn[];
}
