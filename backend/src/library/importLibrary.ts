import { z } from "zod";
import { db } from "../lib/db.js";

/**
 * Imports catalog/library.json: series you add by hand, each with episode links.
 * Only add links to media you own or are allowed to use (your own files/CDN, or videos a
 * channel allows to be embedded). Links are stored as media sources; nothing is fetched or copied.
 */
const url = z.url({ protocol: /^https?$/ }).max(2000);

const subtitle = z.object({ language: z.string().min(2).max(10), label: z.string().min(1).max(40), url });
const episode = z.union([
  url.transform((u) => ({ url: u }) as { url: string; title?: string; description?: string; thumbnail?: string; duration?: number; subtitles?: z.infer<typeof subtitle>[] }),
  z.object({
    url,
    title: z.string().max(200).optional(),
    description: z.string().max(1000).optional(),
    thumbnail: url.optional(),
    duration: z.number().int().min(1).max(600).optional(),
    subtitles: z.array(subtitle).optional(),
  }),
]);

export const series = z.object({
  title: z.string().min(1).max(200),
  nativeTitle: z.string().max(200).optional(),
  description: z.string().max(4000).default(""),
  cover: url.optional(),
  banner: url.optional(),
  year: z.number().int().min(1950).max(2100).optional(),
  season: z.enum(["WINTER", "SPRING", "SUMMER", "FALL"]).optional(),
  status: z.enum(["AIRING", "FINISHED", "UPCOMING", "CANCELLED"]).default("FINISHED"),
  type: z.enum(["TV", "MOVIE", "OVA", "ONA", "SPECIAL"]).default("TV"),
  rating: z.number().min(0).max(10).optional(),
  studio: z.string().max(120).optional(),
  genres: z.array(z.string().min(1).max(40)).default([]),
  episodes: z.array(episode).min(1),
});

export const librarySchema = z.object({ series: z.array(series).min(1) });
export type LibraryFile = z.infer<typeof librarySchema>;

const slug = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 80);

export function youTubeId(u: string): string | null {
  return /[?&]v=([\w-]{11})/.exec(u)?.[1] ?? /youtu\.be\/([\w-]{11})/.exec(u)?.[1] ?? /youtube\.com\/(?:embed|shorts)\/([\w-]{11})/.exec(u)?.[1] ?? null;
}

export function mimeFor(u: string): string {
  if (youTubeId(u)) return "video/youtube";
  if (/\.m3u8(\?|$)/i.test(u)) return "application/x-mpegURL";
  if (/\.webm(\?|$)/i.test(u)) return "video/webm";
  return "video/mp4";
}

export interface ImportResult {
  series: number;
  episodes: number;
  created: number;
}

export async function importLibrary(file: LibraryFile, dryRun = false): Promise<ImportResult> {
  const out: ImportResult = { series: 0, episodes: 0, created: 0 };
  for (const s of file.series) {
    out.series++;
    out.episodes += s.episodes.length;
    if (dryRun) continue;

    const firstId = youTubeId(s.episodes[0].url);
    const art = s.cover ?? (firstId ? `https://i.ytimg.com/vi/${firstId}/hqdefault.jpg` : null);
    const externalId = `lib:${slug(s.title)}`;
    const data = {
      title: s.title,
      englishTitle: s.title,
      nativeTitle: s.nativeTitle ?? null,
      description: s.description,
      coverImage: art,
      bannerImage: s.banner ?? art,
      year: s.year ?? null,
      season: s.season ?? null,
      status: s.status,
      type: s.type,
      rating: s.rating ?? null,
      studio: s.studio ?? null,
      episodeCount: s.episodes.length,
      startDate: s.year ? new Date(Date.UTC(s.year, 0, 1)) : null,
      popularity: 5000,
    };
    const existing = await db.anime.findUnique({ where: { externalId }, select: { id: true } });
    const anime = existing
      ? await db.anime.update({ where: { id: existing.id }, data })
      : await db.anime.create({ data: { ...data, externalId } });

    await db.animeGenre.deleteMany({ where: { animeId: anime.id } });
    for (const name of new Set(s.genres)) {
      const g = await db.genre.upsert({ where: { name }, update: {}, create: { name } });
      await db.animeGenre.create({ data: { animeId: anime.id, genreId: g.id } });
    }

    const season = await db.season.upsert({
      where: { animeId_number: { animeId: anime.id, number: 1 } },
      update: {},
      create: { animeId: anime.id, number: 1, title: "Season 1" },
    });

    for (const [i, e] of s.episodes.entries()) {
      const n = i + 1;
      const vid = youTubeId(e.url);
      const row = {
        title: e.title ?? `Episode ${n}`,
        description: e.description ?? "",
        thumbnail: e.thumbnail ?? (vid ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : null),
        duration: e.duration ?? null,
      };
      const found = await db.episode.findFirst({ where: { animeId: anime.id, seasonId: season.id, episodeNumber: n }, select: { id: true } });
      let episodeId = found?.id;
      if (found) await db.episode.update({ where: { id: found.id }, data: row });
      else {
        episodeId = (await db.episode.create({ data: { ...row, animeId: anime.id, seasonId: season.id, episodeNumber: n, releaseDate: new Date() } })).id;
        out.created++;
      }
      // The file is the source of truth for links and subtitles.
      await db.mediaSource.deleteMany({ where: { episodeId } });
      await db.mediaSource.create({ data: { episodeId: episodeId!, url: e.url, quality: "auto", mimeType: mimeFor(e.url) } });
      await db.subtitle.deleteMany({ where: { episodeId } });
      if (e.subtitles?.length) await db.subtitle.createMany({ data: e.subtitles.map((t) => ({ ...t, episodeId: episodeId! })) });
    }
  }
  return out;
}
