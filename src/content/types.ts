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
export interface TaskDefinition { id: string; label: string; }
export interface ItemDefinition extends Thing {
  assetId?: AssetId;
  description?: string;
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
  kind: 'mud' | 'mosquitoes' | 'wet' | 'water' | 'snake' | 'mouse' | 'raccoon';
  assetId?: AssetId;
}
export interface DoorwayDefinition {
  side: 'bottom' | 'top' | 'left' | 'right';
  /** Distance from the building's left edge for top/bottom doors, or top edge for left/right doors. */
  offset: number;
  width: number;
}
export interface CollisionInset { top?: number; right?: number; bottom?: number; left?: number; }
export interface LocationDefinition extends Thing {
  /** Optional open doorway kept aligned with the rendered door and generated building collision. */
  doorway?: DoorwayDefinition;
  /** Depth to inset collision on a building side so the doorway can be entered naturally. */
  collisionInset?: CollisionInset;
}
export interface TerrainFeature extends Rect {
  id: string;
  kind: 'road' | 'field' | 'woods' | 'gorge' | 'stream' | 'lake' | 'tile' | 'shower';
  label?: string;
}
export interface NamedZone extends Rect { id: string; label: string; }

/** A small, content-first map definition. Add future interiors with another definition and paired map-exit interactables. */
export interface MapDefinition {
  id: string;
  displayName: string;
  size: { w: number; h: number };
  background: string;
  terrainStyle: 'outdoor' | 'interior';
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
