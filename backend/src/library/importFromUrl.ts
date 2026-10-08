import { z } from "zod";
import type { EpisodePreview, SeriesPreview } from "./preview.js";

/**
 * Generic "paste a link" importer for the admin's own site/server: fetches a URL the admin
 * controls and reads an episode list out of it. Two formats are understood:
 *  - JSON: either a bare array of episode URLs/objects, or `{ title?, cover?, studio?, episodes: [...] }`
 *    (the same episode shape `library-series` already accepts: a plain URL string, or
 *    `{ url, title?, description?, thumbnail?, duration? }`).
 *  - Plain text: one video URL per line (anything else is ignored).
 * Nothing is scraped — the admin's own server decides what the feed contains.
 */
const MAX_BYTES = 2_000_000;
const MAX_EPISODES = 500;

const urlSchema = z.url({ protocol: /^https?$/ }).max(2000);

const episodeItem = z.union([
  urlSchema,
  z.object({
    url: urlSchema,
    title: z.string().max(200).optional(),
    description: z.string().max(1000).optional(),
    thumbnail: urlSchema.optional(),
    duration: z.number().int().min(1).max(600).optional(),
  }),
]);

const feedSchema = z.union([
  z.array(episodeItem).min(1).max(MAX_EPISODES),
  z.object({
    title: z.string().max(200).optional(),
    cover: urlSchema.optional(),
    studio: z.string().max(120).optional(),
    episodes: z.array(episodeItem).min(1).max(MAX_EPISODES),
  }),
]);

function toEpisodePreview(e: z.infer<typeof episodeItem>, n: number): EpisodePreview {
  if (typeof e === "string") return { url: e, title: `Episode ${n}`, description: "", thumbnail: null, duration: null };
  return { url: e.url, title: e.title ?? `Episode ${n}`, description: e.description ?? "", thumbnail: e.thumbnail ?? null, duration: e.duration ?? null };
}

/** Blocks the obvious local/private targets. Not a complete SSRF defense (no DNS-rebind or
 * redirect-target re-check), but this endpoint is admin-token gated, same trust level as the
 * rest of /api/admin — this just stops an accidental or careless paste. */
function assertPublicHost(hostname: string) {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "0.0.0.0" || h.endsWith(".localhost")) {
    throw new Error("That URL points at a local address, which isn't allowed.");
  }
  if (/^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\.|^169\.254\./.test(h)) {
    throw new Error("That URL points at a private network address, which isn't allowed.");
  }
}

export async function fetchSeriesPreviewFromUrl(rawUrl: string): Promise<SeriesPreview> {
  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    throw new Error("That's not a valid URL.");
  }
  if (!/^https?:$/.test(target.protocol)) throw new Error("Only http(s) URLs are supported.");
  assertPublicHost(target.hostname);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  let res: globalThis.Response;
  try {
    res = await fetch(target, { signal: controller.signal, redirect: "follow", headers: { accept: "application/json, text/plain, */*" } });
  } catch {
    throw new Error("Couldn't reach that URL (timed out or connection failed).");
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) throw new Error(`That URL returned ${res.status} ${res.statusText}.`);

  const contentLength = Number(res.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BYTES) throw new Error("That response is too large.");
  const text = await res.text();
  if (text.length > MAX_BYTES) throw new Error("That response is too large.");

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Not JSON — fall through to the plain-text/line-list path below.
  }

  if (parsed !== null) {
    const r = feedSchema.safeParse(parsed);
    if (!r.success) {
      throw new Error(
        "That URL returned JSON, but not in a shape I understand — expected an array of episode URLs, or { title?, episodes: [...] }.",
      );
    }
    const data = r.data;
    const episodesRaw = Array.isArray(data) ? data : data.episodes;
    return {
      title: Array.isArray(data) ? "" : (data.title ?? ""),
      cover: Array.isArray(data) ? null : (data.cover ?? null),
      studio: Array.isArray(data) ? null : (data.studio ?? null),
      episodes: episodesRaw.map((e, i) => toEpisodePreview(e, i + 1)),
    };
  }

  const episodes: EpisodePreview[] = [];
  for (const line of text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)) {
    const u = urlSchema.safeParse(line);
    if (u.success) episodes.push({ url: u.data, title: `Episode ${episodes.length + 1}`, description: "", thumbnail: null, duration: null });
    if (episodes.length >= MAX_EPISODES) break;
  }
  if (!episodes.length) {
    throw new Error(
      "Couldn't find any episode links at that URL — expected JSON (an episode list, or { title?, episodes: [...] }) or plain text with one video link per line.",
    );
  }
  return { title: "", cover: null, studio: null, episodes };
}
