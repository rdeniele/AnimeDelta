import { env } from "../../lib/env.js";
import { cache, CACHE_TTL } from "../../cache/cacheManager.js";
import { recordEvent } from "../../debug/inspector.js";
import { ProviderError } from "../errors.js";
import type {
  AnimeDTO,
  AnimeSeasonDTO,
  AnimeStatusDTO,
  AnimeTypeDTO,
  EpisodeDTO,
  MetadataProvider,
  SeasonDTO,
} from "../types.js";

/**
 * Metadata adapter for the public Jikan REST API (https://docs.api.jikan.moe).
 * Uses the documented API only, with a conservative request throttle to respect its rate limits.
 * Set METADATA_API_URL (default https://api.jikan.moe/v4) and optional METADATA_API_KEY.
 */
const MIN_INTERVAL_MS = 450;
let lastCall = 0;

async function throttledGet<T>(path: string): Promise<T | null> {
  const wait = lastCall + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCall = Date.now();
  const base = (env.metadataApiUrl || "https://api.jikan.moe/v4").replace(/\/$/, "");
  const url = `${base}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: env.metadataApiKey ? { Authorization: `Bearer ${env.metadataApiKey}` } : {},
    });
  } catch (err) {
    const e = ProviderError.networkError(`Could not reach the metadata API: ${(err as Error).message}`);
    recordEvent({ provider: "jikan", operation: "throttledGet", requestUrl: url, method: "GET", error: { code: e.code, message: e.message } });
    throw e;
  }
  recordEvent({
    provider: "jikan",
    operation: "throttledGet",
    requestUrl: url,
    method: "GET",
    status: res.status,
    contentType: res.headers.get("content-type"),
  });
  if (res.status === 404) return null;
  if (res.status === 429) throw ProviderError.providerUnavailable("Metadata API rate limit reached; try again later.");
  if (!res.ok) throw ProviderError.invalidResponse(`Metadata API error ${res.status} for ${path}`);
  try {
    return (await res.json()) as T;
  } catch {
    throw ProviderError.invalidResponse(`Metadata API returned a non-JSON response for ${path}`);
  }
}

/** Wraps a cache key with the provider name so TTLs/clears never collide with other providers. */
const key = (op: string, ...parts: string[]) => `jikan:${op}:${parts.join(":")}`;

/* eslint-disable @typescript-eslint/no-explicit-any */
const TYPES: Record<string, AnimeTypeDTO> = { TV: "TV", Movie: "MOVIE", OVA: "OVA", ONA: "ONA", Special: "SPECIAL" };

function mapStatus(s?: string): AnimeStatusDTO {
  if (s === "Currently Airing") return "AIRING";
  if (s === "Not yet aired") return "UPCOMING";
  return "FINISHED";
}

function mapAnime(a: any): AnimeDTO {
  const from = a.aired?.from ? new Date(a.aired.from) : null;
  const img = a.images?.jpg?.large_image_url ?? a.images?.jpg?.image_url ?? null;
  const minutes = /(\d+)\s*min/.exec(a.duration ?? "")?.[1];
  return {
    externalId: String(a.mal_id),
    title: a.title_english || a.title,
    englishTitle: a.title_english,
    nativeTitle: a.title_japanese,
    synonyms: [a.title, ...(a.title_synonyms ?? [])].filter(Boolean),
    description: a.synopsis ?? "",
    coverImage: img,
    bannerImage: a.trailer?.images?.maximum_image_url ?? img,
    year: a.year ?? from?.getUTCFullYear() ?? null,
    month: from ? from.getUTCMonth() + 1 : null,
    season: a.season ? (String(a.season).toUpperCase() as AnimeSeasonDTO) : null,
    status: mapStatus(a.status),
    type: TYPES[a.type] ?? "TV",
    rating: a.score ?? null,
    popularity: a.members ?? 0,
    duration: minutes ? Number(minutes) : null,
    episodeCount: a.episodes ?? null,
    studio: a.studios?.[0]?.name ?? null,
    startDate: from,
    genres: [...(a.genres ?? []), ...(a.themes ?? [])].map((g: any) => g.name),
  };
}

export class JikanMetadataProvider implements MetadataProvider {
  readonly name = "jikan";

  async search(query: string) {
    return cache.getOrSet(key("search", query.toLowerCase()), CACHE_TTL.search, async () => {
      const r = await throttledGet<any>(`/anime?q=${encodeURIComponent(query)}&limit=20&sfw=true`);
      return (r?.data ?? []).map(mapAnime);
    });
  }
  async getAnime(id: string) {
    return cache.getOrSet(key("anime", id), CACHE_TTL.animeDetails, async () => {
      const r = await throttledGet<any>(`/anime/${encodeURIComponent(id)}/full`);
      return r?.data ? mapAnime(r.data) : null;
    });
  }
  async getEpisodes(id: string): Promise<EpisodeDTO[]> {
    return cache.getOrSet(key("episodes", id), CACHE_TTL.episodes, async () => {
      const out: EpisodeDTO[] = [];
      for (let page = 1; page <= 5; page++) {
        const r = await throttledGet<any>(`/anime/${encodeURIComponent(id)}/episodes?page=${page}`);
        for (const e of r?.data ?? []) {
          out.push({
            seasonNumber: 1,
            episodeNumber: e.mal_id,
            title: e.title ?? `Episode ${e.mal_id}`,
            description: "",
            releaseDate: e.aired ? new Date(e.aired) : null,
          });
        }
        if (!r?.pagination?.has_next_page) break;
      }
      return out;
    });
  }
  async getSeasons(): Promise<SeasonDTO[]> {
    return [{ number: 1, title: "Season 1" }];
  }
  async getSeasonAnime(year: number, season: string) {
    const r = await throttledGet<any>(`/seasons/${year}/${season.toLowerCase()}?limit=25&sfw=true`);
    return (r?.data ?? []).map(mapAnime);
  }
  async listAnime(page: number) {
    const r = await throttledGet<any>(`/seasons/now?page=${page}&limit=25&sfw=true`);
    return { items: (r?.data ?? []).map(mapAnime), hasMore: Boolean(r?.pagination?.has_next_page) && page < 4 };
  }
}
