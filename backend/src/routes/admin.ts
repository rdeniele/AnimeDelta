import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { HttpError, idParam, parse, requireAdmin } from "../lib/http.js";
import { env } from "../lib/env.js";
import { runFullSync } from "../sync/syncService.js";
import { importLibrary, series } from "../library/importLibrary.js";

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
