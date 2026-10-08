import { cache, CACHE_TTL } from "../cache/cacheManager.js";
import { recordEvent } from "../debug/inspector.js";
import { isProviderError, ProviderError } from "../providers/errors.js";
import type { SubtitleProvider, SubtitleTrack, VideoProvider, VideoSource } from "../providers/types.js";
import { normalizeSubtitle, normalizeVideoSource, toFlatSources, toFlatSubtitles } from "./mediaNormalizer.js";

export interface ResolveEpisodeSourceInput {
  animeId: string;
  episode: { id: string; number: number };
  videoProvider: VideoProvider;
  subtitleProvider: SubtitleProvider;
  /** Set false to bypass the resolved-source cache (e.g. a manual "refresh" action). */
  useCache?: boolean;
}

export interface ResolvedEpisodeSource {
  success: true;
  episode: { id: string; number: number };
  sources: ReturnType<typeof toFlatSources>;
  subtitles: ReturnType<typeof toFlatSubtitles>;
  /** Full normalized VideoSource, for clients that want qualities/intro markers/headers too. */
  video: VideoSource;
  /** Subtitle tracks in the richer `{language, label, url, format}` shape (vs. the flat `subtitles` above). */
  subtitleTracks: SubtitleTrack[];
}

/**
 * The single place that turns `Provider -> Episode -> raw source` into the normalized
 * `Playable Media Source` the player consumes (Section 3 of the resolver spec). Never talks to
 * a provider directly from routes/services — always go through here so caching, normalization
 * and structured errors stay consistent across providers.
 */
export async function resolveEpisodeSource(input: ResolveEpisodeSourceInput): Promise<ResolvedEpisodeSource> {
  const { animeId, episode, videoProvider, subtitleProvider } = input;
  const useCache = input.useCache ?? true;
  const cacheKey = `source:${videoProvider.name}:${animeId}:${episode.id}`;

  let raw: VideoSource | null;
  try {
    raw = useCache
      ? await cache.getOrSet(cacheKey, CACHE_TTL.resolvedSource, () => videoProvider.getVideo(animeId, episode.id))
      : await videoProvider.getVideo(animeId, episode.id);
  } catch (err) {
    cache.delete(cacheKey);
    if (isProviderError(err)) {
      recordEvent({ provider: videoProvider.name, operation: "getVideo", animeId, episodeId: episode.id, error: { code: err.code, message: err.message } });
      throw err;
    }
    const wrapped = ProviderError.networkError(`${videoProvider.name} video provider failed: ${(err as Error).message}`);
    recordEvent({ provider: videoProvider.name, operation: "getVideo", animeId, episodeId: episode.id, error: { code: wrapped.code, message: wrapped.message } });
    throw wrapped;
  }

  if (!raw) {
    const err = ProviderError.sourceNotFound();
    recordEvent({ provider: videoProvider.name, operation: "getVideo", animeId, episodeId: episode.id, error: { code: err.code, message: err.message } });
    throw err;
  }

  // `type: "other"` is not itself a rejection — plenty of legitimate sources (YouTube embeds via
  // `mimeType: "video/youtube"`, .webm/.mkv direct files the native player handles fine) don't
  // match hls/dash/mp4 by extension. A provider that *knows* a source can't be played (e.g. a
  // DRM-wrapped manifest) should throw `ProviderError.unsupportedFormat()`/`.drmProtected()`
  // itself rather than the resolver guessing from the URL.
  const normalized = normalizeVideoSource(raw);

  let subtitles: SubtitleTrack[];
  try {
    subtitles = (await subtitleProvider.getSubtitles(episode.id)).map(normalizeSubtitle);
  } catch (err) {
    if (isProviderError(err)) throw err;
    throw ProviderError.networkError(`${subtitleProvider.name} subtitle provider failed: ${(err as Error).message}`);
  }

  recordEvent({
    provider: videoProvider.name,
    operation: "getVideo",
    animeId,
    episodeId: episode.id,
    mediaType: normalized.type,
    sourceUrl: normalized.url,
    quality: normalized.qualities.map((q) => q.label),
    subtitles: subtitles.map((s) => ({ language: s.language, url: s.url })),
  });

  return {
    success: true,
    episode,
    sources: toFlatSources(normalized),
    subtitles: toFlatSubtitles(subtitles),
    video: normalized,
    subtitleTracks: subtitles,
  };
}
