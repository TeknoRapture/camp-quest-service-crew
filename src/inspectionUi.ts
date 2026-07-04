export type InspectionUiElements = {
  overlay: Element;
  image: HTMLImageElement;
  title: Element;
  caption: Element;
  fallback: Element;
  closeButton: Element;
};

export type InspectionUiController = {
  open(title: string, imageUrl: string, caption: string): void;
  close(): void;
  isOpen(): boolean;
};

export type InspectionUiOptions = {
  onOpen?: () => void;
  onClose?: () => void;
};

export function createInspectionUi(elements: InspectionUiElements, options: InspectionUiOptions = {}): InspectionUiController {
  let open = false;

  function close() {
    open = false;
    elements.overlay.classList.add('hidden');
    options.onClose?.();
  }

  function show(title: string, imageUrl: string, caption: string) {
    open = true;
    elements.title.textContent = title;
    elements.caption.textContent = caption;
    elements.image.classList.remove('hidden');
    elements.fallback.classList.add('hidden');
    elements.image.alt = title;
    elements.fallback.textContent = `${title} image unavailable`;
    elements.image.onerror = () => {
      elements.image.classList.add('hidden');
      elements.fallback.classList.remove('hidden');
    };
    elements.image.src = imageUrl;
    elements.overlay.classList.remove('hidden');
    options.onOpen?.();
  }

  elements.closeButton.addEventListener('click', close);
  elements.overlay.addEventListener('click', event => {
    if (event.target === elements.overlay) close();
  });

  return {
    open: show,
    close,
    isOpen: () => open,
  };
}
