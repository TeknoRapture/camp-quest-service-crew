import type { ItemDefinition } from './content/types';

export type CarriedItemCounts = Record<string, number>;

export type CarriedInventoryState = {
  items: CarriedItemCounts;
  largePickupOrder: string[];
};

export type CarriedInventoryHelpers = ReturnType<typeof createInventoryHelpers>;
export type InventoryItemLookup = (id: string) => ItemDefinition | undefined;
export type InventoryCarryType = NonNullable<ItemDefinition['carryType']>;

export function createInventoryHelpers(state: CarriedInventoryState, itemById: InventoryItemLookup) {
  const itemCount = (id: string) => state.items[id] ?? 0;
  const hasItem = (id: string) => itemCount(id) > 0;
  const carryType = (id: string): InventoryCarryType => itemById(id)?.carryType ?? 'small';
  const carrySize = (id: string) => itemById(id)?.carrySize ?? 1;
  const largeUnitsUsed = () => Object.entries(state.items).reduce((sum, [id, quantity]) => sum + (carryType(id) === 'large' ? carrySize(id) * quantity : 0), 0);

  function canCarry(id: string) { return carryType(id) !== 'large' || largeUnitsUsed() + carrySize(id) <= 2; }

  function addItem(id: string) {
    state.items[id] = itemCount(id) + 1;
    if (carryType(id) === 'large') state.largePickupOrder.push(id);
  }

  function removeItem(id: string) {
    if (itemCount(id) <= 1) delete state.items[id];
    else state.items[id]--;
    state.largePickupOrder = state.largePickupOrder.filter(carriedId => carriedId !== id || hasItem(id));
  }

  function visibleLabels(type: InventoryCarryType) {
    return Object.entries(state.items).flatMap(([id, quantity]) => {
      const item = itemById(id);
      if (!item || carryType(id) !== type || item.displayInInventory === false) return [];
      return Array(quantity).fill(item.inventoryLabel ?? item.label);
    });
  }

  const carriedItemIds = () => Object.keys(state.items);
  const lastLargeItemId = () => state.largePickupOrder.at(-1);
  const canDropLargeItem = () => state.largePickupOrder.length > 0;

  return {
    itemCount,
    hasItem,
    carryType,
    carrySize,
    largeUnitsUsed,
    canCarry,
    addItem,
    removeItem,
    visibleLabels,
    carriedItemIds,
    lastLargeItemId,
    canDropLargeItem,
  };
}
