import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { HttpError, idParam, parse, requireAdmin } from "../lib/http.js";
import { env } from "../lib/env.js";
import { runFullSync } from "../sync/syncService.js";
import { importLibrary, series } from "../library/importLibrary.js";
import { clearEvents, getEvents } from "../debug/inspector.js";
import { cache } from "../cache/cacheManager.js";
import { extractPlaylistId, fetchPlaylistPreview } from "../providers/youtube/youtubeProvider.js";
import { fetchSeriesPreviewFromUrl } from "../library/importFromUrl.js";

export const admin = Router();
admin.use(requireAdmin);

admin.get("/stats", async (_req, res) => {
  const [anime, episodes, airing, lastSync, recent] = await Promise.all([
    db.anime.count(),
    db.episode.count(),
    db.anime.count({ where: { status: "AIRING" } }),
    db.syncRun.findFirst({ orderBy: { startedAt: "desc" } }),
    db.anime.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, title: true, createdAt: true } }),
  ]);
  res.json({
    anime,
    episodes,
    airing,
    lastSync,
    recent,
    providers: { metadata: env.metadataProvider, video: env.videoProvider },
  });
});

let syncing = false;
admin.post("/sync", async (_req, res) => {
  if (syncing) throw new HttpError(409, "A sync is already running");
  syncing = true;
  runFullSync().finally(() => (syncing = false));
  res.status(202).json({ started: true });
});

/** Create or update one series with its episode sources (same shape as a catalog/library.json entry). */
admin.post("/library-series", async (req, res) => {
  const body = parse(series, req.body);
  res.status(201).json(await importLibrary({ series: [body] }));
});

/** Given any YouTube playlist link (or a video link that has `&list=...`), fetch the playlist's
 * title/thumbnail and every embeddable video in it, shaped to drop straight into the "Add a
 * series" form — so the admin pastes one link instead of adding each episode by hand. Nothing
 * is saved here; the admin still reviews and hits "Save series" (POST /library-series). */
admin.post("/youtube-playlist", async (req, res) => {
  const { url } = parse(z.object({ url: z.string().min(1).max(2000) }), req.body);
  const playlistId = extractPlaylistId(url);
  if (!playlistId) {
    throw new HttpError(
      400,
      "Couldn't find a playlist in that link. Paste a YouTube playlist URL (youtube.com/playlist?list=...) or a video URL that includes &list=...",
    );
  }
  try {
    const preview = await fetchPlaylistPreview(playlistId);
    res.json(preview);
  } catch (e) {
    throw new HttpError(502, e instanceof Error ? e.message : "Failed to fetch that playlist from YouTube.");
  }
});

/** Generic version of the above for a URL you control: your own server returns JSON (an episode
 * list, or { title?, episodes: [...] }) or a plain-text list of video links, one per line, and
 * this fetches and shapes it the same way the YouTube playlist import does. */
admin.post("/import-url", async (req, res) => {
  const { url } = parse(z.object({ url: z.string().min(1).max(2000) }), req.body);
  try {
    res.json(await fetchSeriesPreviewFromUrl(url));
  } catch (e) {
    throw new HttpError(502, e instanceof Error ? e.message : "Failed to fetch that URL.");
  }
});

/** Register a media source you have the rights to use for an episode. */
admin.post("/media-sources", async (req, res) => {
  const body = parse(
    z.object({
      episodeId: idParam,
      url: z.url({ protocol: /^https?$/ }).max(2000),
      quality: z.string().max(20).default("auto"),
      mimeType: z.string().max(60).optional(),
      note: z.string().max(200).optional(),
    }),
    req.body,
  );
  res.status(201).json(await db.mediaSource.create({ data: body }));
});

/** Developer/debug view of recent provider activity (Section 8). Secrets are redacted before
 * events are ever recorded, so nothing extra needs to happen here. */
admin.get("/debug/events", async (_req, res) => {
  res.json({ events: getEvents(), cacheSize: cache.size() });
});
admin.post("/debug/events/clear", async (_req, res) => {
  clearEvents();
  res.status(204).end();
});

admin.post("/subtitles", async (req, res) => {
  const body = parse(
    z.object({
      episodeId: idParam,
      language: z.string().min(2).max(10),
      label: z.string().min(1).max(40),
      url: z.url({ protocol: /^https?$/ }).max(2000),
    }),
    req.body,
  );
  res.status(201).json(await db.subtitle.create({ data: body }));
});
