import type { MediaType, SubtitleTrack, VideoQuality, VideoSource } from "../providers/types.js";

/** Infers HLS/DASH/MP4/other from a URL and/or mimeType. Pure, provider-agnostic. */
export function inferMediaType(url: string, mimeType?: string | null): MediaType {
  const m = (mimeType ?? "").toLowerCase();
  if (m.includes("mpegurl") || m.includes("m3u8")) return "hls";
  if (m.includes("dash+xml") || m.includes("mpd")) return "dash";
  if (m.includes("mp4")) return "mp4";

  const u = url.toLowerCase().split("?")[0];
  if (u.endsWith(".m3u8")) return "hls";
  if (u.endsWith(".mpd")) return "dash";
  if (u.endsWith(".mp4") || u.endsWith(".m4v")) return "mp4";
  return "other";
}

export function inferSubtitleFormat(url: string): NonNullable<SubtitleTrack["format"]> {
  const u = url.toLowerCase().split("?")[0];
  if (u.endsWith(".vtt")) return "vtt";
  if (u.endsWith(".srt")) return "srt";
  if (u.endsWith(".ass") || u.endsWith(".ssa")) return "ass";
  return "other";
}

/** Fills in the additive `type`/`isM3U8` fields on a VideoSource and its qualities, without
 * mutating the input or touching any field a provider already set explicitly. */
export function normalizeVideoSource(raw: VideoSource): VideoSource {
  const type = raw.type ?? inferMediaType(raw.url, raw.mimeType);
  const qualities: VideoQuality[] = (raw.qualities.length ? raw.qualities : [{ label: "Auto", url: raw.url }]).map(
    (q) => ({ ...q, type: q.type ?? inferMediaType(q.url) }),
  );
  return {
    ...raw,
    type,
    isM3U8: raw.isM3U8 ?? type === "hls",
    qualities,
  };
}

export function normalizeSubtitle(raw: SubtitleTrack): SubtitleTrack {
  return { ...raw, format: raw.format ?? inferSubtitleFormat(raw.url) };
}

/** Flat `{url, type, quality}` entries for clients that want a source list rather than the
 * `VideoSource` shape with nested qualities (Section 3/5 of the resolver spec). */
export interface FlatSource {
  url: string;
  type: MediaType;
  quality: string;
  language?: string;
  headers?: Record<string, string>;
}

export function toFlatSources(normalized: VideoSource): FlatSource[] {
  return normalized.qualities.map((q) => ({
    url: q.url,
    type: q.type ?? inferMediaType(q.url),
    quality: q.label,
    ...(normalized.language ? { language: normalized.language } : {}),
    ...(normalized.headers ? { headers: normalized.headers } : {}),
  }));
}

export interface FlatSubtitle {
  url: string;
  language: string;
}

export function toFlatSubtitles(subs: SubtitleTrack[]): FlatSubtitle[] {
  return subs.map((s) => ({ url: s.url, language: s.label || s.language }));
}
