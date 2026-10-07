import { db } from "../lib/db.js";
import { cardSelect, toCard } from "./anime.js";

export type ListStatusValue = "WATCHING" | "PLAN_TO_WATCH" | "COMPLETED" | "DROPPED";

export async function saveProgress(
  userId: string,
  input: { episodeId: string; progressSeconds: number; durationSeconds: number },
) {
  const ep = await db.episode.findUnique({ where: { id: input.episodeId }, select: { animeId: true } });
  if (!ep) return null;
  const completed = input.durationSeconds > 0 && input.progressSeconds / input.durationSeconds >= 0.92;
  const row = await db.watchProgress.upsert({
    where: { userId_episodeId: { userId, episodeId: input.episodeId } },
    update: { progressSeconds: input.progressSeconds, durationSeconds: input.durationSeconds, completed },
    create: { userId, animeId: ep.animeId, ...input, completed },
  });
  // Watching an episode puts the anime on the list unless the user already filed it.
  await db.watchlist.upsert({
    where: { userId_animeId: { userId, animeId: ep.animeId } },
    update: {},
    create: { userId, animeId: ep.animeId, status: "WATCHING" },
  });
  return row;
}

const progressInclude = {
  anime: { select: cardSelect },
  episode: { select: { id: true, episodeNumber: true, title: true, thumbnail: true, season: { select: { number: true } } } },
} as const;

/** Most recent progress per anime (latest episode touched). */
async function latestPerAnime(userId: string, where: object, take: number) {
  const rows = await db.watchProgress.findMany({
    where: { userId, ...where },
    orderBy: { updatedAt: "desc" },
    include: progressInclude,
    take: 200,
  });
  const seen = new Set<string>();
  const out = [];
  for (const r of rows) {
    if (seen.has(r.animeId)) continue;
    seen.add(r.animeId);
    out.push({
      id: r.id,
      animeId: r.animeId,
      episodeId: r.episodeId,
      progressSeconds: r.progressSeconds,
      durationSeconds: r.durationSeconds,
      completed: r.completed,
      updatedAt: r.updatedAt,
      anime: toCard(r.anime),
      episode: { ...r.episode, seasonNumber: r.episode.season?.number ?? 1 },
    });
    if (out.length >= take) break;
  }
  return out;
}

export const continueWatching = (userId: string) => latestPerAnime(userId, { completed: false, progressSeconds: { gt: 5 } }, 20);
export const history = (userId: string) => latestPerAnime(userId, {}, 100);

export async function removeHistoryItem(userId: string, animeId: string) {
  await db.watchProgress.deleteMany({ where: { userId, animeId } });
}
export async function clearHistory(userId: string) {
  await db.watchProgress.deleteMany({ where: { userId } });
}

export async function getList(userId: string, status?: ListStatusValue) {
  const rows = await db.watchlist.findMany({
    where: { userId, ...(status ? { status } : {}) },
    orderBy: { updatedAt: "desc" },
    include: { anime: { select: cardSelect } },
  });
  return rows.map((r) => ({ animeId: r.animeId, status: r.status, createdAt: r.createdAt, anime: toCard(r.anime) }));
}

export async function setListStatus(userId: string, animeId: string, status: ListStatusValue) {
  return db.watchlist.upsert({
    where: { userId_animeId: { userId, animeId } },
    update: { status },
    create: { userId, animeId, status },
  });
}

export async function removeFromList(userId: string, animeId: string) {
  await db.watchlist.deleteMany({ where: { userId, animeId } });
}
