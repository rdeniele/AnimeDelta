import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { db } from "../lib/db.js";
import { hashToken, HttpError, idParam, newToken, parse, requireAuth } from "../lib/http.js";
import { cardSelect, listAnime, toCard } from "../services/anime.js";
import {
  clearHistory,
  continueWatching,
  getList,
  history,
  removeFromList,
  removeHistoryItem,
  saveProgress,
  setListStatus,
} from "../services/watch.js";

export const user = Router();

const listStatus = z.enum(["WATCHING", "PLAN_TO_WATCH", "COMPLETED", "DROPPED"]);

/**
 * Anonymous device accounts: the app registers once and keeps the token in SecureStore.
 * The User table already has email/passwordHash/googleId so email + Google sign-in can be
 * layered on later without a migration of existing data.
 */
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
user.post("/auth/anonymous", authLimiter, async (req, res) => {
  const { username } = parse(z.object({ username: z.string().trim().min(1).max(30).default("Otaku") }), req.body ?? {});
  const token = newToken();
  const u = await db.user.create({ data: { username, tokenHash: hashToken(token) }, select: { id: true, username: true } });
  res.status(201).json({ token, user: u });
});

user.get("/auth/me", requireAuth, async (req, res) => {
  const u = await db.user.findUnique({ where: { id: req.userId }, select: { id: true, username: true, createdAt: true } });
  if (!u) throw new HttpError(401, "Authentication required");
  res.json(u);
});

user.patch("/auth/me", requireAuth, async (req, res) => {
  const { username } = parse(z.object({ username: z.string().trim().min(1).max(30) }), req.body);
  res.json(await db.user.update({ where: { id: req.userId }, data: { username }, select: { id: true, username: true } }));
});

/* ---- search ---- */
user.get("/search", async (req, res) => {
  const q = parse(z.string().trim().min(1).max(100), req.query.q);
  const page = parse(z.coerce.number().int().min(1).max(100).default(1), req.query.page);
  res.json(await listAnime({ q, genres: [], sort: "popular", page, limit: 24 }));
});

user.get("/search/popular", async (_req, res) => {
  const rows = await db.anime.findMany({ orderBy: { popularity: "desc" }, take: 8, select: { title: true } });
  res.json(rows.map((r) => r.title));
});

user.get("/search/history", requireAuth, async (req, res) => {
  const rows = await db.searchHistory.findMany({ where: { userId: req.userId }, orderBy: { createdAt: "desc" }, take: 10 });
  res.json(rows.map((r) => r.query));
});

user.post("/search/history", requireAuth, async (req, res) => {
  const { query } = parse(z.object({ query: z.string().trim().min(1).max(100) }), req.body);
  await db.searchHistory.upsert({
    where: { userId_query: { userId: req.userId!, query } },
    update: { createdAt: new Date() },
    create: { userId: req.userId!, query },
  });
  res.status(204).end();
});

user.delete("/search/history", requireAuth, async (req, res) => {
  await db.searchHistory.deleteMany({ where: { userId: req.userId } });
  res.status(204).end();
});

/* ---- watch progress / history ---- */
user.post("/watch-progress", requireAuth, async (req, res) => {
  const body = parse(
    z.object({
      episodeId: idParam,
      progressSeconds: z.number().int().min(0).max(86400),
      durationSeconds: z.number().int().min(0).max(86400),
    }),
    req.body,
  );
  const row = await saveProgress(req.userId!, body);
  if (!row) throw new HttpError(404, "Episode not found");
  res.json({ completed: row.completed });
});

user.get("/watch-progress", requireAuth, async (req, res) => {
  const kind = req.query.kind === "history" ? "history" : "continue";
  res.json(kind === "history" ? await history(req.userId!) : await continueWatching(req.userId!));
});

user.delete("/watch-progress", requireAuth, async (req, res) => {
  await clearHistory(req.userId!);
  res.status(204).end();
});

user.delete("/watch-progress/:animeId", requireAuth, async (req, res) => {
  await removeHistoryItem(req.userId!, parse(idParam, req.params.animeId));
  res.status(204).end();
});

/* ---- watchlist ---- */
user.get("/watchlist", requireAuth, async (req, res) => {
  const status = req.query.status ? parse(listStatus, req.query.status) : undefined;
  res.json(await getList(req.userId!, status));
});

user.post("/watchlist", requireAuth, async (req, res) => {
  const body = parse(z.object({ animeId: idParam, status: listStatus.default("PLAN_TO_WATCH") }), req.body);
  const exists = await db.anime.findUnique({ where: { id: body.animeId }, select: { id: true } });
  if (!exists) throw new HttpError(404, "Anime not found");
  const row = await setListStatus(req.userId!, body.animeId, body.status);
  res.status(201).json({ animeId: row.animeId, status: row.status });
});

user.delete("/watchlist/:animeId", requireAuth, async (req, res) => {
  await removeFromList(req.userId!, parse(idParam, req.params.animeId));
  res.status(204).end();
});

/* ---- notifications (infrastructure; delivery is done by a worker with Expo push) ---- */
user.post("/notifications/token", requireAuth, async (req, res) => {
  const body = parse(z.object({ token: z.string().min(10).max(300), platform: z.enum(["ios", "android"]) }), req.body);
  await db.pushToken.upsert({
    where: { token: body.token },
    update: { userId: req.userId!, platform: body.platform },
    create: { userId: req.userId!, ...body },
  });
  res.status(204).end();
});

const prefsSchema = z.object({ newEpisodes: z.boolean(), newAnime: z.boolean(), recommendations: z.boolean() });
user.get("/notifications/prefs", requireAuth, async (req, res) => {
  const p = await db.notificationPrefs.findUnique({ where: { userId: req.userId! } });
  res.json(p ?? { newEpisodes: true, newAnime: false, recommendations: false });
});
user.put("/notifications/prefs", requireAuth, async (req, res) => {
  const data = parse(prefsSchema, req.body);
  res.json(
    await db.notificationPrefs.upsert({ where: { userId: req.userId! }, update: data, create: { userId: req.userId!, ...data } }),
  );
});

export { cardSelect, toCard };
