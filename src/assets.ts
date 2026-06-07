export const assetPaths = {
  player: 'assets/player.svg',
  cliffSign: 'assets/cliff-sign.svg',
  mop: 'assets/mop.svg',
  mosquitoes: 'assets/mosquitoes.svg',
  cliffSignInspection: 'reference/beware-of-cliff-sign.png',
} as const;

export type AssetId = keyof typeof assetPaths;

type AssetRecord = {
  image: HTMLImageElement;
  promise: Promise<HTMLImageElement>;
  loaded: boolean;
  failed: boolean;
};

export class AssetLoader {
  private assets = new Map<AssetId, AssetRecord>();

  constructor(private readonly baseUrl = './') {}

  url(id: AssetId) {
    return `${this.baseUrl}${assetPaths[id]}`;
  }

  load(id: AssetId) {
    const existing = this.assets.get(id);
    if (existing) return existing.promise;

    const image = new Image();
    const record = { image, loaded: false, failed: false } as AssetRecord;
    record.promise = new Promise<HTMLImageElement>((resolve) => {
      image.onload = () => {
        record.loaded = true;
        resolve(image);
      };
      image.onerror = () => {
        record.failed = true;
        console.warn(`Camp Quest asset failed to load: ${this.url(id)}`);
        resolve(image);
      };
    });
    this.assets.set(id, record);
    image.src = this.url(id);
    return record.promise;
  }

  loadAll(ids: AssetId[] = Object.keys(assetPaths) as AssetId[]) {
    return Promise.all(ids.map((id) => this.load(id)));
  }

  get(id: AssetId) {
    const asset = this.assets.get(id);
    return asset?.loaded && !asset.failed ? asset.image : undefined;
  }
}
