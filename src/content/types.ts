import type { AssetId } from '../assets';

/** Shared shapes for safely editing the static game content modules. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Thing extends Rect {
  id: string;
  label: string;
  color?: string;
  done?: boolean;
}

export interface PortraitSet {
  default?: string;
  happy?: string;
  serious?: string;
  surprised?: string;
}

export interface DialogueSpeaker {
  displayName?: string;
  label?: string;
  accent?: string;
  portraits?: PortraitSet;
}

export interface NPCDefinition extends Thing {
  displayName?: string;
  accent?: string;
  portraits?: PortraitSet;
  dialogueId: string;
}

export type Dialogue = Record<string, readonly string[]>;

export interface TaskDefinition {
  id: string;
  label: string;
}

export interface SpritePresentation {
  width?: number;
  height?: number;
  offsetX?: number;
  offsetY?: number;
}

export interface ItemDefinition extends Thing {
  assetId?: AssetId;
  sprite?: SpritePresentation;
}

export interface InteractableDefinition extends Thing {
  kind: 'inspection' | 'delivery-zone';
  title?: string;
  assetId?: AssetId;
  caption?: string;
}

export interface HazardDefinition extends Thing {
  kind: 'mud' | 'mosquitoes' | 'wet';
  assetId?: AssetId;
}

export interface CreatureDefinition extends Thing {
  kind: 'snake' | 'mouse' | 'raccoon';
  assetId: AssetId;
}

export interface LocationDefinition extends Thing {}
