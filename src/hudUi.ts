export type HudUiElements = {
  objective: Element;
  campTime?: Element | null;
  energy: HTMLElement;
  points: Element;
  best: Element;
  carrySummary: Element;
  dropButton: HTMLButtonElement;
  toast: Element;
};

export type HudUiState = {
  energy: number;
  points: number;
  best: number;
  mapDisplayName: string;
  objective: string;
  campTimeText?: string;
  largeLabels: string[];
  trayLabels: string[];
  smallLabels: string[];
  lastLargeItemId?: string;
  lastLargeCarrySize?: number;
  canDropLargeItem: boolean;
};

export type HudUiController = {
  refreshHud(state: HudUiState): void;
  showToast(text: string): void;
  hideToast(): void;
};

export function createHudUi(elements: HudUiElements): HudUiController {
  function refreshHud(state: HudUiState) {
    elements.energy.style.width = `${state.energy}%`;
    elements.points.textContent = `${state.points} SP`;
    elements.best.textContent = `BEST ${Math.max(state.best, state.points)}`;
    elements.objective.textContent = `${state.mapDisplayName}: ${state.objective}`;
    if (elements.campTime) elements.campTime.textContent = state.campTimeText ?? '';

    const hands = state.largeLabels.length === 1 && state.lastLargeCarrySize === 2
      ? `${state.largeLabels[0]} (both hands)`
      : `${state.largeLabels[0] ?? 'empty'} | ${state.largeLabels[1] ?? 'empty'}`;
    elements.carrySummary.textContent = [
      `Hands: ${hands}`,
      state.trayLabels.length ? `Tray: ${state.trayLabels.join(', ')}` : '',
      state.smallLabels.length ? `Small: ${state.smallLabels.join(', ')}` : '',
    ].filter(Boolean).join(' · ');
    elements.dropButton.disabled = !state.canDropLargeItem;
  }

  function showToast(text: string) {
    elements.toast.textContent = text;
    elements.toast.classList.remove('hidden');
  }

  function hideToast() {
    elements.toast.classList.add('hidden');
  }

  return { refreshHud, showToast, hideToast };
}
