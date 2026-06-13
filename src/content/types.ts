import type { AssetId } from '../assets';

/** Shared shapes for safely editing the static game content modules. */
export interface Rect { x: number; y: number; w: number; h: number; }
export interface Thing extends Rect { id: string; label: string; color?: string; done?: boolean; }
export interface Point { x: number; y: number; }
export interface MapSpawn extends Point { id: string; }
export interface PortraitSet { default?: string; happy?: string; serious?: string; surprised?: string; }
export interface DialogueSpeaker { displayName?: string; label?: string; accent?: string; portraits?: PortraitSet; }
export interface NPCDefinition extends Thing { displayName?: string; accent?: string; portraits?: PortraitSet; dialogueId: string; }
export type Dialogue = Record<string, readonly string[]>;
export type ObjectiveTargetType = 'item' | 'npc' | 'interactable' | 'exit' | 'zone' | 'location';
export interface TaskDefinition {
  id: string;
  label: string;
  targetType?: ObjectiveTargetType;
  targetId?: string;
  targetMapId?: string;
  targetLabel?: string;
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
