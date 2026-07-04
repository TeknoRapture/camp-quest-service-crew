import type { InteractableDefinition, MapDefinition, MapSpawn, Rect } from './content/types';

export const MAP_TRANSITION_COOLDOWN_SECONDS = 0.45;

export type MapCollection = Record<string, MapDefinition>;

export interface ResolvedMapTransition {
  exit: InteractableDefinition;
  nextMap: MapDefinition;
  spawn: MapSpawn;
}

export function resolveMapTransition(
  exit: InteractableDefinition,
  maps: MapCollection,
): ResolvedMapTransition | undefined {
  const nextMap = exit.targetMapId ? maps[exit.targetMapId] : undefined;
  const spawn = nextMap?.spawns.find(({ id }) => id === exit.targetSpawnId);
  if (!nextMap || !spawn) return undefined;
  return { exit, nextMap, spawn };
}

export function canUseAutomaticExit(transitionCooldown: number) {
  return transitionCooldown <= 0;
}

export function findAutomaticExit(
  currentMap: MapDefinition,
  player: Rect,
  intersects: (a: Rect, b: Rect) => boolean,
) {
  return currentMap.exits.find(candidate => candidate.activation === 'automatic' && intersects(player, candidate));
}
