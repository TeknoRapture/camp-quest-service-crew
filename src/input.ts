export type Direction = 'up' | 'down' | 'left' | 'right';
export type MobileControlMode = 'dpad' | 'joystick';
export type MovementVector = { x: number; y: number };

type DialogueKeyboardState =
  | { mode: 'closed' }
  | { mode: 'choosingTopic' }
  | { mode: 'showingResponse'; hasFollowUpTopics: boolean };

type InputControllerElements = {
  canvas: HTMLCanvasElement;
  shell: Element;
  directionButtons: Iterable<HTMLButtonElement>;
  actionButton: HTMLButtonElement;
  dropButton: HTMLButtonElement;
  controlModeToggle: HTMLButtonElement;
  joystick: HTMLElement;
  joystickBase: HTMLElement;
  joystickKnob: HTMLElement;
};

type InputControllerOptions = {
  elements: InputControllerElements;
  isPlaying: () => boolean;
  controlsBlocked: () => boolean;
  onStartGame: () => void;
  onAction: () => void;
  onDrop: () => void;
  onEscape: () => void;
  getDialogueKeyboardState: () => DialogueKeyboardState;
  onDialogueSelectionDelta: (delta: -1 | 1) => void;
  onDialogueSelect: () => boolean;
  onDialogueClose: () => void;
  onLayoutMayNeedUpdate: () => void;
};

export type InputController = {
  getMovementVector: () => MovementVector;
  clearMovementInput: () => void;
  resetJoystick: () => void;
  getMobileControlMode: () => MobileControlMode;
  setMobileControlMode: (mode: MobileControlMode, save?: boolean) => void;
};

const CONTROL_MODE_STORAGE_KEY = 'campQuestControlMode';
const keyMap: Record<string, Direction> = {
  ArrowUp: 'up',
  w: 'up',
  W: 'up',
  ArrowDown: 'down',
  s: 'down',
  S: 'down',
  ArrowLeft: 'left',
  a: 'left',
  A: 'left',
  ArrowRight: 'right',
  d: 'right',
  D: 'right',
};

function safeStorageGet(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function safeStorageSet(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* Ignore storage failures; controls keep their in-memory fallback. */ }
}

function validControlMode(value: string | null): MobileControlMode {
  return value === 'dpad' ? 'dpad' : 'joystick';
}

const preventControlDefault = (event: Event) => event.preventDefault();

export function createInputController(options: InputControllerOptions): InputController {
  const { elements } = options;
  const directionButtons = Array.from(elements.directionButtons);
  const keys = new Set<Direction>();
  let mobileControlMode: MobileControlMode = 'joystick';
  const joystickInput = { pointerId: null as number | null, active: false, centerX: 0, centerY: 0, vectorX: 0, vectorY: 0 };

  function resetJoystick() {
    joystickInput.pointerId = null;
    joystickInput.active = false;
    joystickInput.centerX = 0;
    joystickInput.centerY = 0;
    joystickInput.vectorX = 0;
    joystickInput.vectorY = 0;
    elements.joystickBase.style.setProperty('--base-x', '0px');
    elements.joystickBase.style.setProperty('--base-y', '0px');
    elements.joystickKnob.style.setProperty('--knob-x', '0px');
    elements.joystickKnob.style.setProperty('--knob-y', '0px');
  }

  function clearMovementInput() {
    keys.clear();
    directionButtons.forEach(button => button.classList.remove('pressed'));
    resetJoystick();
  }

  function setMobileControlMode(mode: MobileControlMode, save = false) {
    mobileControlMode = mode;
    resetJoystick();
    elements.shell.classList.toggle('control-mode-dpad', mode === 'dpad');
    elements.shell.classList.toggle('control-mode-joystick', mode === 'joystick');
    elements.controlModeToggle.textContent = `Controls: ${mode === 'dpad' ? 'D-pad' : 'Joystick'}`;
    elements.controlModeToggle.setAttribute('aria-label', `Current movement controls: ${mode === 'dpad' ? 'D-pad' : 'Joystick'}. Tap to switch.`);
    if (save) safeStorageSet(CONTROL_MODE_STORAGE_KEY, mode);
    options.onLayoutMayNeedUpdate();
  }

  function getMovementVector(): MovementVector {
    const digitalX = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
    const digitalY = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0);
    const usingDigital = digitalX !== 0 || digitalY !== 0;
    return { x: usingDigital ? digitalX : joystickInput.vectorX, y: usingDigital ? digitalY : joystickInput.vectorY };
  }

  function updateJoystickFromPointer(event: PointerEvent) {
    if (mobileControlMode !== 'joystick' || !joystickInput.active || event.pointerId !== joystickInput.pointerId) return;
    event.preventDefault();
    if (options.controlsBlocked()) { resetJoystick(); return; }
    const radius = Math.max(42, Math.min(elements.joystick.clientWidth, elements.joystick.clientHeight) * .38);
    const deadZone = radius * .22;
    const dx = event.clientX - joystickInput.centerX, dy = event.clientY - joystickInput.centerY;
    const distance = Math.hypot(dx, dy), clampedDistance = Math.min(radius, distance);
    const knobX = distance ? dx / distance * clampedDistance : 0, knobY = distance ? dy / distance * clampedDistance : 0;
    elements.joystickKnob.style.setProperty('--knob-x', `${knobX}px`);
    elements.joystickKnob.style.setProperty('--knob-y', `${knobY}px`);
    if (distance < deadZone) { joystickInput.vectorX = 0; joystickInput.vectorY = 0; return; }
    joystickInput.vectorX = distance ? dx / distance : 0;
    joystickInput.vectorY = distance ? dy / distance : 0;
  }

  function startJoystick(event: PointerEvent) {
    event.preventDefault();
    if (mobileControlMode !== 'joystick' || options.controlsBlocked() || joystickInput.pointerId !== null) return;
    joystickInput.pointerId = event.pointerId;
    joystickInput.active = true;
    const rect = elements.joystick.getBoundingClientRect();
    joystickInput.centerX = event.clientX;
    joystickInput.centerY = event.clientY;
    const defaultCenterX = rect.left + rect.width / 2, defaultCenterY = rect.top + rect.height / 2;
    if (Math.hypot(event.clientX - defaultCenterX, event.clientY - defaultCenterY) < Math.min(rect.width, rect.height) * .36) {
      joystickInput.centerX = defaultCenterX;
      joystickInput.centerY = defaultCenterY;
    }
    elements.joystickBase.style.setProperty('--base-x', `${joystickInput.centerX - defaultCenterX}px`);
    elements.joystickBase.style.setProperty('--base-y', `${joystickInput.centerY - defaultCenterY}px`);
    try { elements.joystick.setPointerCapture(event.pointerId); } catch { /* Pointer capture is best-effort. */ }
    updateJoystickFromPointer(event);
  }

  function stopJoystick(event?: PointerEvent) {
    if (event) {
      event.preventDefault();
      if (joystickInput.pointerId !== null && event.pointerId !== joystickInput.pointerId) return;
    }
    resetJoystick();
  }

  addEventListener('keydown', event => {
    if (!options.isPlaying()) {
      if (['Enter', ' '].includes(event.key)) { event.preventDefault(); options.onStartGame(); }
      return;
    }
    const dialogueState = options.getDialogueKeyboardState();
    if (dialogueState.mode === 'choosingTopic' || (dialogueState.mode === 'showingResponse' && dialogueState.hasFollowUpTopics)) {
      if (['ArrowUp', 'w', 'W'].includes(event.key)) { options.onDialogueSelectionDelta(-1); event.preventDefault(); return; }
      if (['ArrowDown', 's', 'S'].includes(event.key)) { options.onDialogueSelectionDelta(1); event.preventDefault(); return; }
      if (['Enter', ' ', 'e', 'E'].includes(event.key)) { options.onDialogueSelect(); event.preventDefault(); return; }
    }
    if (dialogueState.mode !== 'closed' && ['Enter', ' ', 'e', 'E'].includes(event.key)) {
      options.onDialogueClose();
      event.preventDefault();
      return;
    }
    const direction = keyMap[event.key];
    if (direction) { keys.add(direction); event.preventDefault(); }
    if (['q', 'Q'].includes(event.key)) { options.onDrop(); event.preventDefault(); }
    if ([' ', 'e', 'E'].includes(event.key)) { options.onAction(); event.preventDefault(); }
    if (event.key === 'Escape') options.onEscape();
  });

  addEventListener('keyup', event => {
    const direction = keyMap[event.key];
    if (direction) keys.delete(direction);
  });

  elements.canvas.addEventListener('pointerdown', event => {
    if (!options.isPlaying()) { event.preventDefault(); options.onStartGame(); }
  });

  directionButtons.forEach(button => {
    const dir = button.dataset.dir as Direction;
    const on = (event: PointerEvent) => { event.preventDefault(); if (!options.isPlaying()) return; keys.add(dir); button.classList.add('pressed'); };
    const off = (event: PointerEvent) => { event.preventDefault(); keys.delete(dir); button.classList.remove('pressed'); };
    button.addEventListener('pointerdown', on);
    button.addEventListener('pointerup', off);
    button.addEventListener('pointercancel', off);
    button.addEventListener('pointerleave', off);
    button.addEventListener('contextmenu', preventControlDefault);
  });

  elements.joystick.addEventListener('pointerdown', startJoystick);
  elements.joystick.addEventListener('pointermove', updateJoystickFromPointer);
  elements.joystick.addEventListener('pointerup', stopJoystick);
  elements.joystick.addEventListener('pointercancel', stopJoystick);
  elements.joystick.addEventListener('lostpointercapture', stopJoystick);
  elements.joystick.addEventListener('contextmenu', preventControlDefault);
  elements.controlModeToggle.addEventListener('click', () => setMobileControlMode(mobileControlMode === 'dpad' ? 'joystick' : 'dpad', true));
  elements.controlModeToggle.addEventListener('contextmenu', preventControlDefault);
  elements.dropButton.addEventListener('pointerdown', event => { event.preventDefault(); if (options.isPlaying()) options.onDrop(); });
  elements.actionButton.addEventListener('pointerdown', event => { event.preventDefault(); if (options.isPlaying()) options.onAction(); });
  elements.actionButton.addEventListener('pointerup', preventControlDefault);
  elements.actionButton.addEventListener('pointercancel', preventControlDefault);
  elements.actionButton.addEventListener('pointerleave', preventControlDefault);
  elements.actionButton.addEventListener('contextmenu', preventControlDefault);

  const clearHeldDirections = () => {
    clearMovementInput();
    options.onLayoutMayNeedUpdate();
  };
  addEventListener('resize', clearHeldDirections);
  addEventListener('orientationchange', clearHeldDirections);

  setMobileControlMode(validControlMode(safeStorageGet(CONTROL_MODE_STORAGE_KEY)));

  return {
    getMovementVector,
    clearMovementInput,
    resetJoystick,
    getMobileControlMode: () => mobileControlMode,
    setMobileControlMode,
  };
}
