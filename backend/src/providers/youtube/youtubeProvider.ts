import { env } from "../../lib/env.js";
import type { AnimeDTO, EpisodeDTO, MetadataProvider, SeasonDTO } from "../types.js";
import type { SeriesPreview } from "../../library/preview.js";

/**
 * Metadata adapter for official YouTube channels, via the YouTube Data API v3.
 * Each playlist becomes a series and each video an episode. Playback is done in the app with
 * YouTube's own embedded player (only videos the owner allows to be embedded are imported);
 * nothing is downloaded, proxied or re-hosted.
 *
 * Config: YOUTUBE_API_KEY (backend only) and YOUTUBE_CHANNELS (comma-separated @handles).
 */
const API = "https://www.googleapis.com/youtube/v3";

/* eslint-disable @typescript-eslint/no-explicit-any */
async function yt<T = any>(path: string, params: Record<string, string>): Promise<T> {
  if (!env.youtubeApiKey) throw new Error("YOUTUBE_API_KEY is not set");
  const qs = new URLSearchParams({ ...params, key: env.youtubeApiKey });
  const res = await fetch(`${API}/${path}?${qs}`);
  if (!res.ok) {
    const msg = (await res.json().catch(() => null))?.error?.message ?? res.statusText;
    throw new Error(`YouTube API ${res.status}: ${msg}`);
  }
  return (await res.json()) as T;
}

const best = (t: any): string | null => (t?.maxres ?? t?.standard ?? t?.high ?? t?.medium ?? t?.default)?.url ?? null;

function isoMinutes(iso: string | undefined): number | null {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso ?? "");
  if (!m) return null;
  return Math.max(1, Math.round((+(m[1] ?? 0) * 3600 + +(m[2] ?? 0) * 60 + +(m[3] ?? 0)) / 60));
}

function seasonOf(d: Date): AnimeDTO["season"] {
  const m = d.getUTCMonth();
  return m < 3 ? "WINTER" : m < 6 ? "SPRING" : m < 9 ? "SUMMER" : "FALL";
}

/** Playlist/video titles on these channels carry bilingual text and channel tags; keep the English part. */
export function cleanTitle(raw: string): string {
  const first = raw.split(/[｜|]/)[0];
  const cleaned = first
    .replace(/[【[][^】\]]*(ani-?one|muse|asia|limited|free|english|sub|eng)[^】\]]*[】\]]/gi, " ")
    .replace(/\((?:limited-time|limited)[^)]*\)/gi, " ")
    .replace(/[《》【】]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || raw.trim();
}

/** Short source label shown as the "genre" chip, e.g. "GUNDAM CHANNEL INTL" -> "Gundam". */
export function channelLabel(title: string): string {
  const t = title
    .replace(/\s*powered by.*$/i, "")
    .replace(/\s*[!]?\s*on\s+TMS.*$/i, " TMS")
    .replace(/\b(Asia|ENG|Official|Channel|INTL|International)\b/gi, "")
    .replace(/[!]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return title;
  return t === t.toUpperCase() ? t.charAt(0) + t.slice(1).toLowerCase() : t;
}

export const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

/** Pulls a playlist ID out of a playlist URL, a video URL with `&list=`, or a bare ID pasted directly. */
export function extractPlaylistId(input: string): string | null {
  const trimmed = input.trim();
  try {
    const u = new URL(trimmed);
    return u.searchParams.get("list");
  } catch {
    return /^[\w-]{10,40}$/.test(trimmed) ? trimmed : null;
  }
}

/** Every embeddable video in a playlist, in playlist order. Shared by channel sync and the
 * admin "paste a playlist link" import — same API calls, same embeddable filter either way. */
export async function fetchPlaylistEpisodes(playlistId: string): Promise<EpisodeDTO[]> {
  const items: { id: string; title: string; description: string; thumb: string | null; at: string | null }[] = [];
  let token: string | undefined;
  for (let i = 0; i < 4; i++) {
    const r = await yt("playlistItems", {
      part: "snippet,contentDetails",
      playlistId,
      maxResults: "50",
      ...(token ? { pageToken: token } : {}),
    });
    for (const it of r.items ?? []) {
      const id = it.contentDetails?.videoId;
      if (!id || it.snippet?.title === "Private video" || it.snippet?.title === "Deleted video") continue;
      items.push({
        id,
        title: cleanTitle(it.snippet.title),
        description: it.snippet.description ?? "",
        thumb: best(it.snippet.thumbnails),
        at: it.contentDetails.videoPublishedAt ?? it.snippet.publishedAt ?? null,
      });
    }
    token = r.nextPageToken;
    if (!token) break;
  }
  // Keep only videos the owner allows to embed, and read their durations.
  const info = new Map<string, { minutes: number | null; embeddable: boolean }>();
  for (let i = 0; i < items.length; i += 50) {
    const ids = items.slice(i, i + 50).map((x) => x.id).join(",");
    const r = await yt("videos", { part: "contentDetails,status", id: ids });
    for (const v of r.items ?? []) {
      info.set(v.id, { minutes: isoMinutes(v.contentDetails?.duration), embeddable: !!v.status?.embeddable });
    }
  }
  return items
    .filter((x) => info.get(x.id)?.embeddable)
    .map((x, n) => ({
      seasonNumber: 1,
      episodeNumber: n + 1,
      title: x.title,
      description: x.description.slice(0, 600),
      thumbnail: x.thumb,
      releaseDate: x.at ? new Date(x.at) : null,
      duration: info.get(x.id)?.minutes ?? null,
      mediaUrl: watchUrl(x.id),
    }));
}

/** Looks up a playlist by ID and fetches all its (embeddable) episodes, for the admin's
 * "paste a playlist link" import — any public playlist, not just the configured channels.
 * Shaped as {url, title, ...} (not EpisodeDTO's `mediaUrl`) to match what the "Add a series"
 * form's episode rows and the library-series import both expect. */
export async function fetchPlaylistPreview(playlistId: string): Promise<SeriesPreview> {
  const pl = await yt("playlists", { part: "snippet,contentDetails", id: playlistId });
  const p = pl.items?.[0];
  if (!p) throw new Error("Playlist not found. It may be private, deleted, or the link may be wrong.");
  const episodes = await fetchPlaylistEpisodes(playlistId);
  return {
    title: cleanTitle(p.snippet.title),
    cover: best(p.snippet.thumbnails),
    studio: p.snippet.channelTitle ?? null,
    episodes: episodes.map((e) => ({
      url: e.mediaUrl!,
      title: e.title,
      description: e.description,
      thumbnail: e.thumbnail ?? null,
      duration: e.duration ?? null,
    })),
  };
}

export class YouTubeMetadataProvider implements MetadataProvider {
  readonly name = "youtube";
  private cache: AnimeDTO[] | null = null;

  private async channels() {
    const out: { id: string; title: string }[] = [];
    for (const raw of env.youtubeChannels) {
      const handle = raw.startsWith("@") ? raw : `@${raw}`;
      const r = await yt("channels", { part: "snippet", forHandle: handle });
      const c = r.items?.[0];
      if (c) out.push({ id: c.id, title: c.snippet.title });
    }
    return out;
  }

  private toAnime(p: any, channelTitle: string): AnimeDTO {
    const published = new Date(p.snippet.publishedAt);
    const art = best(p.snippet.thumbnails);
    const count = p.contentDetails?.itemCount ?? 0;
    return {
      externalId: p.id,
      title: cleanTitle(p.snippet.title),
      englishTitle: cleanTitle(p.snippet.title),
      synonyms: [],
      description: p.snippet.description || `Official release from ${channelTitle}.`,
      coverImage: art,
      bannerImage: art,
      year: published.getUTCFullYear(),
      month: published.getUTCMonth() + 1,
      season: seasonOf(published),
      status: "FINISHED",
      type: count === 1 ? "MOVIE" : "TV",
      rating: null,
      popularity: 0,
      duration: null,
      episodeCount: count,
      studio: channelTitle,
      startDate: published,
      genres: [channelLabel(channelTitle)],
    };
  }

  private async load(): Promise<AnimeDTO[]> {
    if (this.cache) return this.cache;
    const all: AnimeDTO[] = [];
    for (const ch of await this.channels()) {
      let token: string | undefined;
      for (let i = 0; i < 4; i++) {
        const r = await yt("playlists", {
          part: "snippet,contentDetails",
          channelId: ch.id,
          maxResults: "50",
          ...(token ? { pageToken: token } : {}),
        });
        for (const p of r.items ?? []) if ((p.contentDetails?.itemCount ?? 0) > 0) all.push(this.toAnime(p, ch.title));
        token = r.nextPageToken;
        if (!token) break;
      }
    }
    // Newer playlists first so they rank higher in "trending".
    all.sort((a, b) => (b.startDate?.getTime() ?? 0) - (a.startDate?.getTime() ?? 0));
    all.forEach((a, i) => (a.popularity = Math.max(1, 10000 - i * 10)));
    return (this.cache = all);
  }

  async search(query: string) {
    const q = query.toLowerCase();
    return (await this.load()).filter((a) => a.title.toLowerCase().includes(q));
  }
  async getAnime(id: string) {
    return (await this.load()).find((a) => a.externalId === id) ?? null;
  }
  async getEpisodes(playlistId: string): Promise<EpisodeDTO[]> {
    return fetchPlaylistEpisodes(playlistId);
  }
  async getSeasons(): Promise<SeasonDTO[]> {
    return [{ number: 1, title: "Season 1" }];
  }
  async getSeasonAnime(year: number, season: string) {
    return (await this.load()).filter((a) => a.year === year && a.season === season.toUpperCase());
  }
  async listAnime() {
    return { items: await this.load(), hasMore: false };
  }
}
