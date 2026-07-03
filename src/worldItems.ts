import type { ItemDefinition, MapDefinition, Rect } from './content/types';

type MapCollection = Record<string, MapDefinition>;

type DropItemOptions = {
  mapId: string;
  mapSize: MapDefinition['size'];
  near: Rect;
};

function cloneItem(item: ItemDefinition): ItemDefinition {
  return { ...item };
}

export function createWorldItems(maps: MapCollection) {
  const allItemTemplates = Object.values(maps).flatMap(map => map.items);
  const itemById = (id: string) => allItemTemplates.find(item => item.id === id);
  const runtimeItemsByMapId: Record<string, ItemDefinition[]> = Object.fromEntries(
    Object.values(maps).map(map => [map.id, map.items.map(cloneItem)]),
  );

  function itemsForMap(mapId: string) {
    return runtimeItemsByMapId[mapId] ?? (runtimeItemsByMapId[mapId] = []);
  }

  function dropItemOnMap(id: string, { mapId, mapSize, near }: DropItemOptions) {
    const template = itemById(id);
    if (!template) return;
    const items = itemsForMap(mapId);
    const item = items.find(candidate => candidate.id === id && candidate.done) ?? (() => {
      const dropped = cloneItem(template);
      items.push(dropped);
      return dropped;
    })();
    item.done = false;
    item.x = Math.max(5, Math.min(mapSize.w - item.w - 5, near.x + near.w + 18));
    item.y = Math.max(5, Math.min(mapSize.h - item.h - 5, near.y));
    return item;
  }

  return {
    allItemTemplates,
    itemById,
    itemsForMap,
    dropItemOnMap,
  };
}
