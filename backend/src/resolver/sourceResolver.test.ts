import assert from "node:assert/strict";
import { test } from "node:test";
import { cache } from "../cache/cacheManager.js";
import { ProviderError } from "../providers/errors.js";
import {
  crashingVideoProvider,
  drmVideoProvider,
  emptySubtitleProvider,
  expiringVideoProvider,
  hlsVideoProvider,
  mp4VideoProvider,
  sampleSubtitles,
  subtitleProvider,
  unavailableProviderVideoProvider,
  unavailableVideoProvider,
  unsupportedFormatVideoProvider,
  youtubeVideoProvider,
} from "../providers/mock/scenarioProviders.js";
import { resolveEpisodeSource } from "./sourceResolver.js";

const episode = { id: "ep-1", number: 1 };

test("resolves an HLS source with qualities and subtitles", async () => {
  cache.clear();
  const result = await resolveEpisodeSource({
    animeId: "anime-1",
    episode,
    videoProvider: hlsVideoProvider(),
    subtitleProvider: subtitleProvider(),
  });
  assert.equal(result.success, true);
  assert.equal(result.video.type, "hls");
  assert.equal(result.video.isM3U8, true);
  assert.equal(result.sources.length, 2);
  assert.equal(result.sources[0].type, "hls");
  assert.equal(result.subtitles.length, sampleSubtitles.length);
  assert.equal(result.subtitleTracks[0].format, "vtt");
});

test("resolves a direct MP4 source", async () => {
  cache.clear();
  const result = await resolveEpisodeSource({
    animeId: "anime-1",
    episode,
    videoProvider: mp4VideoProvider(),
    subtitleProvider: emptySubtitleProvider(),
  });
  assert.equal(result.video.type, "mp4");
  assert.equal(result.video.isM3U8, false);
  assert.deepEqual(result.subtitles, []);
});

test("a YouTube-embed source (type 'other' by extension) resolves fine, not rejected", async () => {
  cache.clear();
  const result = await resolveEpisodeSource({
    animeId: "anime-1",
    episode,
    videoProvider: youtubeVideoProvider(),
    subtitleProvider: emptySubtitleProvider(),
  });
  assert.equal(result.video.mimeType, "video/youtube");
  assert.equal(result.video.type, "other");
});

test("an episode with no registered source throws SOURCE_NOT_FOUND", async () => {
  cache.clear();
  await assert.rejects(
    resolveEpisodeSource({
      animeId: "anime-1",
      episode,
      videoProvider: unavailableVideoProvider(),
      subtitleProvider: emptySubtitleProvider(),
    }),
    (err: unknown) => err instanceof ProviderError && err.code === "SOURCE_NOT_FOUND",
  );
});

test("a DRM-protected source is reported, never worked around", async () => {
  cache.clear();
  await assert.rejects(
    resolveEpisodeSource({
      animeId: "anime-1",
      episode,
      videoProvider: drmVideoProvider(),
      subtitleProvider: emptySubtitleProvider(),
    }),
    (err: unknown) => err instanceof ProviderError && err.code === "DRM_PROTECTED",
  );
});

test("a provider outage surfaces as PROVIDER_UNAVAILABLE", async () => {
  cache.clear();
  await assert.rejects(
    resolveEpisodeSource({
      animeId: "anime-1",
      episode,
      videoProvider: unavailableProviderVideoProvider(),
      subtitleProvider: emptySubtitleProvider(),
    }),
    (err: unknown) => err instanceof ProviderError && err.code === "PROVIDER_UNAVAILABLE",
  );
});

test("an untyped provider crash is wrapped into NETWORK_ERROR, not leaked raw", async () => {
  cache.clear();
  await assert.rejects(
    resolveEpisodeSource({
      animeId: "anime-1",
      episode,
      videoProvider: crashingVideoProvider(),
      subtitleProvider: emptySubtitleProvider(),
    }),
    (err: unknown) => err instanceof ProviderError && err.code === "NETWORK_ERROR",
  );
});

test("a source format the normalizer can't map is UNSUPPORTED_FORMAT", async () => {
  cache.clear();
  await assert.rejects(
    resolveEpisodeSource({
      animeId: "anime-1",
      episode,
      videoProvider: unsupportedFormatVideoProvider(),
      subtitleProvider: emptySubtitleProvider(),
    }),
    (err: unknown) => err instanceof ProviderError && err.code === "UNSUPPORTED_FORMAT",
  );
});

test("resolved sources are cached briefly, then re-resolved (expiry)", async () => {
  cache.clear();
  const provider = expiringVideoProvider();
  const first = await resolveEpisodeSource({
    animeId: "anime-x",
    episode,
    videoProvider: provider,
    subtitleProvider: emptySubtitleProvider(),
  });
  const second = await resolveEpisodeSource({
    animeId: "anime-x",
    episode,
    videoProvider: provider,
    subtitleProvider: emptySubtitleProvider(),
  });
  assert.equal(first.video.url, second.video.url); // served from cache, not re-resolved

  const third = await resolveEpisodeSource({
    animeId: "anime-x",
    episode,
    videoProvider: provider,
    subtitleProvider: emptySubtitleProvider(),
    useCache: false,
  });
  assert.notEqual(third.video.url, first.video.url); // bypassing cache re-resolves
});
