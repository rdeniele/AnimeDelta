import { db, Prisma } from "../lib/db.js";
import { getSubtitleProvider, getVideoProvider } from "../providers/registry.js";
import { isProviderError } from "../providers/errors.js";
import { resolveEpisodeSource } from "../resolver/sourceResolver.js";

const episodeSelect = {
  id: true,
  animeId: true,
  seasonId: true,
  episodeNumber: true,
  title: true,
  description: true,
  thumbnail: true,
  releaseDate: true,
  duration: true,
} satisfies Prisma.EpisodeSelect;

/** Episodes grouped by season, with the user's progress merged in when available. */
export async function episodesForAnime(animeId: string, userId?: string) {
  const [seasons, episodes, progress] = await Promise.all([
    db.season.findMany({ where: { animeId }, orderBy: { number: "asc" } }),
    db.episode.findMany({
      where: { animeId },
      select: episodeSelect,
      orderBy: [{ season: { number: "asc" } }, { episodeNumber: "asc" }],
    }),
    userId
      ? db.watchProgress.findMany({ where: { userId, animeId } })
      : Promise.resolve([]),
  ]);
  const prog = new Map(progress.map((p) => [p.episodeId, p]));
  const withProgress = episodes.map((e) => {
    const p = prog.get(e.id);
    return {
      ...e,
      progressSeconds: p?.progressSeconds ?? 0,
      durationSeconds: p?.durationSeconds ?? 0,
      completed: p?.completed ?? false,
    };
  });
  const grouped = seasons.map((s) => ({
    id: s.id,
    number: s.number,
    title: s.title,
    episodes: withProgress.filter((e) => e.seasonId === s.id),
  }));
  const loose = withProgress.filter((e) => !e.seasonId);
  if (loose.length) grouped.push({ id: "none", number: 0, title: "Episodes", episodes: loose });
  return grouped;
}

export async function latestEpisodes(limit = 20) {
  const rows = await db.episode.findMany({
    where: { releaseDate: { lte: new Date() } },
    orderBy: { releaseDate: "desc" },
    take: limit,
    select: {
      ...episodeSelect,
      anime: { select: { id: true, title: true, coverImage: true, bannerImage: true } },
    },
  });
  return rows;
}

/** Everything the player needs for one episode, resolved through the provider abstraction. */
export async function playbackInfo(episodeId: string, userId?: string) {
  const ep = await db.episode.findUnique({
    where: { id: episodeId },
    select: { ...episodeSelect, season: { select: { number: true } }, anime: { select: { id: true, title: true } } },
  });
  if (!ep) return null;

  const ordered = await db.episode.findMany({
    where: { animeId: ep.animeId },
    orderBy: [{ season: { number: "asc" } }, { episodeNumber: "asc" }],
    select: { id: true, episodeNumber: true, title: true },
  });
  const idx = ordered.findIndex((e) => e.id === ep.id);

  const [resolved, progress] = await Promise.all([
    resolveEpisodeSource({
      animeId: ep.animeId,
      episode: { id: ep.id, number: ep.episodeNumber },
      videoProvider: getVideoProvider(),
      subtitleProvider: getSubtitleProvider(),
    }).catch((err) => {
      // Structured resolution failures (SOURCE_NOT_FOUND, DRM_PROTECTED, ...) degrade to
      // "video unavailable" for this endpoint rather than failing the whole request; anything
      // unexpected still propagates to the route's error handler.
      if (isProviderError(err)) return null;
      throw err;
    }),
    userId ? db.watchProgress.findUnique({ where: { userId_episodeId: { userId, episodeId } } }) : null,
  ]);
  const video = resolved?.video ?? null;
  const subtitles = resolved?.subtitleTracks ?? (await getSubtitleProvider().getSubtitles(ep.id).catch(() => []));

  return {
    episode: ep,
    video, // null → "Video unavailable"
    subtitles,
    previous: idx > 0 ? ordered[idx - 1] : null,
    next: idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : null,
    progress: progress
      ? { progressSeconds: progress.progressSeconds, durationSeconds: progress.durationSeconds, completed: progress.completed }
      : null,
  };
}
