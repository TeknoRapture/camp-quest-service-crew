import type { AssetId, AssetLoader } from './assets';

type SpriteOptions = {
  padding?: number;
  offsetX?: number;
  offsetY?: number;
  width?: number;
  height?: number;
};

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  assets: AssetLoader,
  id: AssetId,
  destination: { x: number; y: number; w: number; h: number },
  options: SpriteOptions = {},
) {
  const image = assets.get(id);
  if (!image) return false;

  const padding = options.padding ?? 0;
  const width = options.width ?? destination.w - padding * 2;
  const height = options.height ?? destination.h - padding * 2;
  const x = destination.x + (destination.w - width) / 2 + (options.offsetX ?? 0);
  const y = destination.y + (destination.h - height) / 2 + (options.offsetY ?? 0);
  ctx.drawImage(image, x, y, width, height);
  return true;
}
