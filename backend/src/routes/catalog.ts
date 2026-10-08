import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { env } from "../lib/env.js";
import { HttpError, idParam, parse } from "../lib/http.js";
import {
  cardSelect,
  filterSchema,
  getAnimeDetail,
  listAnime,
  listGenres,
  newAnime,
  relatedAnime,
  seasonAnime,
  toCard,
} from "../services/anime.js";
import { monthSummary, releasesOn } from "../services/calendar.js";
import { episodesForAnime, latestEpisodes, playbackInfo } from "../services/episodes.js";
import { recommender } from "../services/recommendations.js";
import { continueWatching } from "../services/watch.js";

export const catalog = Router();

catalog.get("/home", async (req, res) => {
  const take = (orderBy: object, where: object = {}, n = 15) =>
    db.anime.findMany({ where, select: cardSelect, orderBy, take: n }).then((r) => r.map(toCard));
  // "Airing" = officially airing OR got a new episode in the last 30 days (video channels never set a status).
  const recent = { OR: [{ status: "AIRING" as const }, { episodes: { some: { releaseDate: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000), lte: new Date() } } } }] };
  const playable = { episodes: { some: {} } };
  const [hero, recentlyAdded, trending, popularSeason, airing, fresh, recentlyUpdated, latest, recommended, cont, genres] =
    await Promise.all([
      take({ popularity: "desc" }, { bannerImage: { not: null }, ...playable }, 5),
      take({ createdAt: "desc" }, playable),
      take({ popularity: "desc" }, playable),
      take({ popularity: "desc" }, recent),
      take({ startDate: "desc" }, recent),
      take({ startDate: { sort: "desc", nulls: "last" } }, playable),
      take({ updatedAt: "desc" }, playable),
      latestEpisodes(15),
      recommender.recommend(req.userId, 15),
      req.userId ? continueWatching(req.userId) : Promise.resolve([]),
      listGenres(),
    ]);
  res.json({ hero, continueWatching: cont, recentlyAdded, latestEpisodes: latest, trending, popularSeason, airing, newAnime: fresh, recommended, recentlyUpdated, genres });
});

catalog.get("/anime", async (req, res) => {
  res.json(await listAnime(parse(filterSchema, req.query)));
});

// Must be declared before /anime/:id
catalog.get("/anime/new", async (_req, res) => {
  res.json(await newAnime());
});

catalog.get("/anime/:id", async (req, res) => {
  const a = await getAnimeDetail(parse(idParam, req.params.id));
  if (!a) throw new HttpError(404, "Anime not found");
  res.json(a);
});

catalog.get("/anime/:id/episodes", async (req, res) => {
  const id = parse(idParam, req.params.id);
  res.json({ seasons: await episodesForAnime(id, req.userId) });
});

catalog.get("/anime/:id/seasons", async (req, res) => {
  res.json(await db.season.findMany({ where: { animeId: parse(idParam, req.params.id) }, orderBy: { number: "asc" } }));
});

catalog.get("/anime/:id/related", async (req, res) => {
  res.json(await relatedAnime(parse(idParam, req.params.id)));
});

catalog.get("/genres", async (_req, res) => {
  res.json(await listGenres());
});

catalog.get("/seasons/:year/:season", async (req, res) => {
  const p = parse(
    z.object({ year: z.coerce.number().int().min(1950).max(2100), season: z.enum(["winter", "spring", "summer", "fall"]) }),
    req.params,
  );
  const genre = typeof req.query.genre === "string" ? req.query.genre.slice(0, 40) : undefined;
  res.json({ items: await seasonAnime(p.year, p.season, genre) });
});

catalog.get("/calendar/month/:ym", async (req, res) => {
  const m = /^(\d{4})-(\d{2})$/.exec(req.params.ym);
  if (!m) throw new HttpError(400, "Expected YYYY-MM");
  res.json(await monthSummary(Number(m[1]), Number(m[2])));
});

catalog.get("/calendar/:date", async (req, res) => {
  const d = new Date(`${req.params.date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(req.params.date) || Number.isNaN(d.getTime())) throw new HttpError(400, "Expected YYYY-MM-DD");
  res.json(await releasesOn(d));
});

catalog.get("/episodes/latest", async (_req, res) => {
  res.json(await latestEpisodes(30));
});

catalog.get("/episodes/:id/playback", async (req, res) => {
  const info = await playbackInfo(parse(idParam, req.params.id), req.userId);
  if (!info) throw new HttpError(404, "Episode not found");
  // Point self-hosted subtitle URLs at whatever host the client used to reach us (LAN IP, emulator, prod).
  const origin = `${req.protocol}://${req.get("host")}`;
  info.subtitles = info.subtitles.map((s) => ({ ...s, url: s.url.replace(env.apiUrl, origin) }));
  res.json(info);
});

catalog.get("/recommendations", async (req, res) => {
  res.json({ items: await recommender.recommend(req.userId, 20) });
});
