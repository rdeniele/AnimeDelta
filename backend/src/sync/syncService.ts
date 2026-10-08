import { db } from "../lib/db.js";
import { getMetadataProvider } from "../providers/registry.js";
import type { AnimeDTO, MetadataProvider } from "../providers/types.js";

export interface SyncStats {
  animeAdded: number;
  animeUpdated: number;
  episodesAdded: number;
  errors: string[];
}

export interface SyncOptions {
  /** Epoch ms after which a sync step stops early (used by serverless cron to stay in its time limit). */
  deadline?: number;
}
const expired = (o?: SyncOptions) => o?.deadline != null && Date.now() > o.deadline;

const emptyStats = (): SyncStats => ({ animeAdded: 0, animeUpdated: 0, episodesAdded: 0, errors: [] });

function animeData(a: AnimeDTO) {
  return {
    title: a.title,
    englishTitle: a.englishTitle ?? null,
    nativeTitle: a.nativeTitle ?? null,
    synonyms: a.synonyms,
    description: a.description,
    coverImage: a.coverImage ?? null,
    bannerImage: a.bannerImage ?? null,
    year: a.year ?? null,
    month: a.month ?? null,
    season: a.season ?? null,
    status: a.status,
    type: a.type,
    rating: a.rating ?? null,
    popularity: a.popularity,
    duration: a.duration ?? null,
    episodeCount: a.episodeCount ?? null,
    studio: a.studio ?? null,
    startDate: a.startDate ?? null,
  };
}

async function setGenres(animeId: string, names: string[]) {
  const genres = await Promise.all(
    [...new Set(names)].map((name) => db.genre.upsert({ where: { name }, update: {}, create: { name } })),
  );
  await db.animeGenre.deleteMany({ where: { animeId } });
  if (genres.length) {
    await db.animeGenre.createMany({ data: genres.map((g) => ({ animeId, genreId: g.id })), skipDuplicates: true });
  }
}

/** Insert/update one anime; returns whether it was newly created. */
export async function upsertAnime(a: AnimeDTO): Promise<{ id: string; created: boolean }> {
  const existing = await db.anime.findUnique({ where: { externalId: a.externalId }, select: { id: true } });
  const data = animeData(a);
  const row = existing
    ? await db.anime.update({ where: { id: existing.id }, data })
    : await db.anime.create({ data: { ...data, externalId: a.externalId } });
  await setGenres(row.id, a.genres);
  return { id: row.id, created: !existing };
}

/** Discover new anime from the provider catalog. */
export async function syncAnime(provider: MetadataProvider = getMetadataProvider(), opts?: SyncOptions): Promise<SyncStats> {
  const stats = emptyStats();
  for (let page = 1; page < 50 && !expired(opts); page++) {
    try {
      const { items, hasMore } = await provider.listAnime(page);
      for (const a of items) {
        const { created } = await upsertAnime(a);
        if (created) stats.animeAdded++;
        else stats.animeUpdated++;
      }
      if (!hasMore) break;
    } catch (e) {
      stats.errors.push(`syncAnime page ${page}: ${(e as Error).message}`);
      break;
    }
  }
  return stats;
}

/** Refresh seasons (cours) for known anime. */
export async function syncSeasons(provider: MetadataProvider = getMetadataProvider(), opts?: SyncOptions): Promise<SyncStats> {
  const stats = emptyStats();
  const list = await db.anime.findMany({ where: { externalId: { not: null } }, select: { id: true, externalId: true } });
  for (const a of list) {
    if (expired(opts)) break;
    try {
      for (const s of await provider.getSeasons(a.externalId!)) {
        await db.season.upsert({
          where: { animeId_number: { animeId: a.id, number: s.number } },
          update: { title: s.title },
          create: { animeId: a.id, number: s.number, title: s.title },
        });
      }
    } catch (e) {
      stats.errors.push(`syncSeasons ${a.externalId}: ${(e as Error).message}`);
    }
  }
  return stats;
}

/**
 * Add new episodes and refresh release dates. Resumable: anime are processed least-recently-synced
 * first and stamped when done, so a time-boxed run (serverless cron) continues where it stopped.
 * Finished anime are re-checked weekly, others every 12 hours.
 */
export async function syncEpisodes(provider: MetadataProvider = getMetadataProvider(), opts?: SyncOptions): Promise<SyncStats> {
  const stats = emptyStats();
  const list = await db.anime.findMany({
    where: { externalId: { not: null } },
    orderBy: [{ episodesSyncedAt: { sort: "asc", nulls: "first" } }, { popularity: "desc" }],
    select: { id: true, externalId: true, status: true, episodesSyncedAt: true },
  });
  const now = Date.now();
  for (const a of list) {
    if (expired(opts)) break;
    const ttl = a.status === "FINISHED" ? 7 * 24 * 3600 * 1000 : 12 * 3600 * 1000;
    if (a.episodesSyncedAt && now - a.episodesSyncedAt.getTime() < ttl) continue;
    try {
      const seasons = await db.season.findMany({ where: { animeId: a.id } });
      const bySeason = new Map(seasons.map((s) => [s.number, s.id]));
      for (const e of await provider.getEpisodes(a.externalId!)) {
        let seasonId = bySeason.get(e.seasonNumber);
        if (!seasonId) {
          const s = await db.season.upsert({
            where: { animeId_number: { animeId: a.id, number: e.seasonNumber } },
            update: {},
            create: { animeId: a.id, number: e.seasonNumber, title: `Season ${e.seasonNumber}` },
          });
          seasonId = s.id;
          bySeason.set(e.seasonNumber, seasonId);
        }
        const found = await db.episode.findFirst({
          where: { animeId: a.id, seasonId, episodeNumber: e.episodeNumber },
          select: { id: true },
        });
        const data = {
          title: e.title,
          description: e.description,
          thumbnail: e.thumbnail ?? null,
          releaseDate: e.releaseDate ?? null,
          duration: e.duration ?? null,
        };
        let episodeId = found?.id;
        if (found) await db.episode.update({ where: { id: found.id }, data });
        else {
          episodeId = (await db.episode.create({ data: { ...data, animeId: a.id, seasonId, episodeNumber: e.episodeNumber } })).id;
          stats.episodesAdded++;
        }
        // Providers that supply a playable URL (official embeds) get it registered as a media source.
        if (e.mediaUrl && episodeId) {
          const has = await db.mediaSource.findFirst({ where: { episodeId, url: e.mediaUrl }, select: { id: true } });
          if (!has) await db.mediaSource.create({ data: { episodeId, url: e.mediaUrl, quality: "auto", mimeType: "video/youtube" } });
        }
      }
      await db.anime.update({ where: { id: a.id }, data: { episodesSyncedAt: new Date() } });
    } catch (err) {
      stats.errors.push(`syncEpisodes ${a.externalId}: ${(err as Error).message}`);
    }
  }
  return stats;
}

/** Removes provider-imported anime that were synced but have no playable episodes (e.g. embedding disabled). */
export async function pruneEmpty(): Promise<number> {
  const r = await db.anime.deleteMany({
    where: {
      externalId: { not: null },
      NOT: { externalId: { startsWith: "lib:" } },
      episodesSyncedAt: { not: null },
      episodes: { none: {} },
    },
  });
  return r.count;
}

/** Refresh ratings, genres, status and other metadata for anime that are still changing. */
export async function syncMetadata(provider: MetadataProvider = getMetadataProvider(), opts?: SyncOptions): Promise<SyncStats> {
  const stats = emptyStats();
  const list = await db.anime.findMany({
    where: { externalId: { not: null }, status: { in: ["AIRING", "UPCOMING"] } },
    select: { externalId: true },
  });
  for (const a of list) {
    if (expired(opts)) break;
    try {
      const fresh = await provider.getAnime(a.externalId!);
      if (!fresh) continue;
      await upsertAnime(fresh);
      stats.animeUpdated++;
    } catch (e) {
      stats.errors.push(`syncMetadata ${a.externalId}: ${(e as Error).message}`);
    }
  }
  return stats;
}

/** Runs the whole pipeline and records a SyncRun for the admin API. */
export async function runFullSync(provider: MetadataProvider = getMetadataProvider(), opts?: SyncOptions): Promise<SyncStats> {
  const run = await db.syncRun.create({ data: { provider: provider.name } });
  const total = emptyStats();
  for (const step of [syncAnime, syncSeasons, syncEpisodes, syncMetadata]) {
    try {
      const s = await step(provider, opts);
      total.animeAdded += s.animeAdded;
      total.animeUpdated += s.animeUpdated;
      total.episodesAdded += s.episodesAdded;
      total.errors.push(...s.errors);
    } catch (e) {
      total.errors.push(`${step.name}: ${(e as Error).message}`);
    }
  }
  await pruneEmpty().catch((e) => total.errors.push(`pruneEmpty: ${(e as Error).message}`));
  await db.syncRun.update({
    where: { id: run.id },
    data: { ...total, errors: total.errors.slice(0, 50), finishedAt: new Date() },
  });
  return total;
}
