export const assetPaths = {
  player: 'assets/player.svg',
  cliffSign: 'assets/cliff-sign.svg',
  blueMop: 'assets/blue-mop.svg',
  greenMop: 'assets/green-mop.svg',
  broom: 'assets/broom.svg',
  gloves: 'assets/gloves.svg',
  trashBags: 'assets/trash-bags.svg',
  supplyCrate: 'assets/supply-crate.svg',
  toiletPaper: 'assets/toilet-paper.svg',
  paperTowels: 'assets/paper-towels.svg',
  soapRefill: 'assets/soap-refill.svg',
  mosquitoes: 'assets/mosquitoes.svg',
  mud: 'assets/mud.svg',
  wetFloor: 'assets/wet-floor.svg',
  water: 'assets/water.svg',
  snake: 'assets/snake.svg',
  mouse: 'assets/mouse.svg',
  raccoon: 'assets/raccoon.svg',
  cliffSignInspection: 'reference/beware-of-cliff-sign.png',
} as const;

export type AssetId = keyof typeof assetPaths;
export type AssetProgress = { total: number; settled: number; loaded: number; failed: number };

type AssetRecord = {
  image: HTMLImageElement;
  promise: Promise<HTMLImageElement>;
  loaded: boolean;
  failed: boolean;
};

export class AssetLoader {
  private assets = new Map<string, AssetRecord>();
  private progressListener?: (progress: AssetProgress) => void;

  constructor(private readonly baseUrl = './') {}

  private resolve(path: string) { return `${this.baseUrl}${path}`; }

  url(id: AssetId) { return this.resolve(assetPaths[id]); }

  progress(): AssetProgress {
    const records = [...this.assets.values()];
    return {
      total: records.length,
      settled: records.filter(({ loaded, failed }) => loaded || failed).length,
      loaded: records.filter(({ loaded }) => loaded).length,
      failed: records.filter(({ failed }) => failed).length,
    };
  }

  loadPath(path: string) {
    const url = this.resolve(path);
    const existing = this.assets.get(url);
    if (existing) return existing.promise;

    const image = new Image();
    const record = { image, loaded: false, failed: false } as AssetRecord;
    record.promise = new Promise<HTMLImageElement>((resolve) => {
      image.onload = () => {
        record.loaded = true;
        this.progressListener?.(this.progress());
        resolve(image);
      };
      image.onerror = () => {
        record.failed = true;
        console.warn(`Camp Quest asset failed to load: ${url}`);
        this.progressListener?.(this.progress());
        resolve(image);
      };
    });
    this.assets.set(url, record);
    image.src = url;
    return record.promise;
  }

  load(id: AssetId) { return this.loadPath(assetPaths[id]); }

  loadAll(extraPaths: string[] = [], onProgress?: (progress: AssetProgress) => void) {
    this.progressListener = onProgress;
    const paths = [...new Set([...Object.values(assetPaths), ...extraPaths])];
    const promise = Promise.all(paths.map((path) => this.loadPath(path)));
    this.progressListener?.(this.progress());
    return promise;
  }

  get(id: AssetId) {
    const asset = this.assets.get(this.url(id));
    return asset?.loaded && !asset.failed ? asset.image : undefined;
  }
}
