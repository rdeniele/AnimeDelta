/**
 * Small in-memory TTL cache. Intentionally process-local (no Redis dependency) since this is
 * a single-instance personal deployment; swap the storage if that changes.
 *
 * Do NOT use this for provider-issued media URLs that are meant to expire quickly/once —
 * pass a short `ttlMs` (or skip caching) for those instead of reusing search/metadata TTLs.
 */
interface Entry<T> {
  value: T;
  expiresAt: number;
}

export class CacheManager {
  private store = new Map<string, Entry<unknown>>();

  get<T>(key: string): T | undefined {
    const e = this.store.get(key);
    if (!e) return undefined;
    if (e.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return e.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): T {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  /** Returns the cached value if still fresh, otherwise computes, caches, and returns it. */
  async getOrSet<T>(key: string, ttlMs: number, compute: () => Promise<T>): Promise<T> {
    const hit = this.get<T>(key);
    if (hit !== undefined) return hit;
    const value = await compute();
    this.set(key, value, ttlMs);
    return value;
  }

  size(): number {
    return this.store.size;
  }
}

/** Reasonable default TTLs (Section 6 of the resolver spec). */
export const CACHE_TTL = {
  search: 5 * 60 * 1000, // 5 min — query results change rarely within a session
  animeDetails: 30 * 60 * 1000, // 30 min — metadata is near-static
  episodes: 15 * 60 * 1000, // 15 min — new episodes appear periodically
  resolvedSource: 60 * 1000, // 1 min — short-lived on purpose; never cache long for media URLs
} as const;

/** Shared cache instance for the provider/resolver layer. */
export const cache = new CacheManager();
