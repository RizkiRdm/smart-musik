import { getDB } from '../storage/db';

class AssetLoaderService {
  private static instance: AssetLoaderService;

  private constructor() {}

  public static getInstance(): AssetLoaderService {
    if (!AssetLoaderService.instance) {
      AssetLoaderService.instance = new AssetLoaderService();
    }
    return AssetLoaderService.instance;
  }

  /**
   * Loads an asset from cache or fetches it from the server.
   * @param key Unique key for the asset in the cache.
   * @param url URL to fetch the asset from if it's not cached.
   * @param version Version of the asset.
   */
  public async loadAsset(key: string, url: string, version: string): Promise<ArrayBuffer | Uint8Array> {
    const db = await getDB();
    
    // 1. Check IDB cache
    const cached = await db.get('asset_cache', key);
    if (cached && cached.version === version) {
      console.log(`Asset cache HIT for ${key}`);
      return cached.data;
    }

    // 2. Cache MISS: Fetch from server
    console.log(`Asset cache MISS for ${key}. Fetching from ${url}...`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch asset: ${url} (${response.statusText})`);
    }

    const data = await response.arrayBuffer();
    
    // 3. Store in IDB
    await db.put('asset_cache', {
      key,
      data,
      cachedAt: Date.now(),
      version
    });

    return data;
  }

  public async loadModel(): Promise<ArrayBuffer> {
    const buffer = await this.loadAsset('model:smart_eq_v1', '/model/smart_eq_model.bin', 'v1');
    return buffer as ArrayBuffer;
  }

  public async loadAutoEQDB(): Promise<Uint8Array | null> {
    try {
      const buffer = await this.loadAsset('autoeq:db_v1', '/autoeq.db', 'v1');
      return new Uint8Array(buffer);
    } catch (err) {
      console.warn('AutoEQ DB not found at /autoeq.db, skipping...', err);
      return null;
    }
  }
}

export const assetLoaderService = AssetLoaderService.getInstance();
