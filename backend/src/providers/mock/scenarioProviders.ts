import { ProviderError } from "../errors.js";
import type { SubtitleProvider, SubtitleTrack, VideoProvider, VideoSource } from "../types.js";

/**
 * Configurable fakes for exercising the resolver without any network access — used only by
 * tests (Section 9 of the resolver spec: "Create mock providers so the resolver can be tested
 * without relying on external websites").
 */
export class ScenarioVideoProvider implements VideoProvider {
  readonly name: string;
  constructor(
    private behavior: (animeId: string, episodeId: string) => Promise<VideoSource | null>,
    name = "scenario-video",
  ) {
    this.name = name;
  }
  getVideo(animeId: string, episodeId: string): Promise<VideoSource | null> {
    return this.behavior(animeId, episodeId);
  }
}

export class ScenarioSubtitleProvider implements SubtitleProvider {
  readonly name: string;
  constructor(
    private tracks: SubtitleTrack[] | (() => Promise<SubtitleTrack[]>),
    name = "scenario-subtitle",
  ) {
    this.name = name;
  }
  async getSubtitles(): Promise<SubtitleTrack[]> {
    return typeof this.tracks === "function" ? this.tracks() : this.tracks;
  }
}

export const sampleHlsSource: VideoSource = {
  url: "https://example.test/stream/master.m3u8",
  mimeType: "application/vnd.apple.mpegurl",
  qualities: [
    { label: "1080p", url: "https://example.test/stream/1080p.m3u8" },
    { label: "720p", url: "https://example.test/stream/720p.m3u8" },
  ],
  introStart: 5,
  introEnd: 35,
};

export const sampleMp4Source: VideoSource = {
  url: "https://example.test/video.mp4",
  mimeType: "video/mp4",
  qualities: [{ label: "Auto", url: "https://example.test/video.mp4" }],
};

export const sampleSubtitles: SubtitleTrack[] = [
  { language: "en", label: "English", url: "https://example.test/subs/en.vtt" },
  { language: "ja", label: "Japanese", url: "https://example.test/subs/ja.srt" },
];

/** Mirrors the app's existing YouTube-embed source shape (`mimeType: "video/youtube"`,
 * `importLibrary.ts`'s `mimeFor`) — a legitimate "other" container that must resolve fine. */
export const sampleYoutubeSource: VideoSource = {
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  mimeType: "video/youtube",
  qualities: [],
};

export const hlsVideoProvider = () => new ScenarioVideoProvider(async () => sampleHlsSource, "mock-hls");
export const mp4VideoProvider = () => new ScenarioVideoProvider(async () => sampleMp4Source, "mock-mp4");
export const youtubeVideoProvider = () => new ScenarioVideoProvider(async () => sampleYoutubeSource, "mock-youtube");
export const subtitleProvider = () => new ScenarioSubtitleProvider(sampleSubtitles, "mock-subtitles");
export const emptySubtitleProvider = () => new ScenarioSubtitleProvider([], "mock-no-subtitles");

/** Episode exists but has no registered source — resolver should surface SOURCE_NOT_FOUND. */
export const unavailableVideoProvider = () => new ScenarioVideoProvider(async () => null, "mock-unavailable");

/** Simulates a source that needs DRM this app will never implement. */
export const drmVideoProvider = () =>
  new ScenarioVideoProvider(async () => {
    throw ProviderError.drmProtected();
  }, "mock-drm");

/** Simulates a provider whose API is down/unreachable. */
export const unavailableProviderVideoProvider = () =>
  new ScenarioVideoProvider(async () => {
    throw ProviderError.providerUnavailable();
  }, "mock-provider-down");

/** Simulates a provider throwing an un-typed error (network blip, bug, etc.) that the
 * resolver must still wrap into a structured ProviderError rather than leaking raw. */
export const crashingVideoProvider = () =>
  new ScenarioVideoProvider(async () => {
    throw new Error("connection reset");
  }, "mock-crashing");

/** Simulates a provider that recognizes its own source as one this player can't handle (e.g. a
 * proprietary/DRM-wrapped manifest) and says so itself, rather than the resolver guessing from
 * the URL — plenty of legitimate sources (YouTube embeds, .webm/.mkv files) don't match
 * hls/dash/mp4 by extension either, so "unrecognized extension" alone must never mean rejected. */
export const unsupportedFormatVideoProvider = () =>
  new ScenarioVideoProvider(async () => {
    throw ProviderError.unsupportedFormat();
  }, "mock-unsupported-format");

/** A source that is only valid for a moment, to exercise cache-expiry behavior. Each call
 * returns a URL embedding a fresh call counter so tests can tell whether the resolver served a
 * cached value or re-resolved. */
export function expiringVideoProvider() {
  let calls = 0;
  return new ScenarioVideoProvider(async () => {
    calls += 1;
    return { url: `https://example.test/expiring/${calls}.mp4`, mimeType: "video/mp4", qualities: [] };
  }, "mock-expiring");
}
