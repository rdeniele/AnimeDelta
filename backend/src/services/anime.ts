import { z } from "zod";
import { db, Prisma } from "../lib/db.js";

export const cardSelect = {
  id: true,
  title: true,
  englishTitle: true,
  nativeTitle: true,
  coverImage: true,
  bannerImage: true,
  description: true,
  year: true,
  season: true,
  status: true,
  type: true,
  rating: true,
  episodeCount: true,
  duration: true,
  genres: { select: { genre: { select: { name: true } } } },
} satisfies Prisma.AnimeSelect;

type CardRow = Prisma.AnimeGetPayload<{ select: typeof cardSelect }>;

export function toCard(a: CardRow) {
  const { genres, ...rest } = a;
  return { ...rest, genres: genres.map((g) => g.genre.name) };
}
export type AnimeCard = ReturnType<typeof toCard>;

export const SORTS = {
  recentlyAdded: { createdAt: "desc" },
  recentlyUpdated: { updatedAt: "desc" },
  newest: { startDate: { sort: "desc", nulls: "last" } },
  oldest: { startDate: { sort: "asc", nulls: "last" } },
  az: { title: "asc" },
  za: { title: "desc" },
  rating: { rating: { sort: "desc", nulls: "last" } },
  popular: { popularity: "desc" },
} as const satisfies Record<string, Prisma.AnimeOrderByWithRelationInput>;

const csv = z
  .string()
  .optional()
  .transform((v) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 10) : []));

export const filterSchema = z.object({
  q: z.string().trim().max(100).optional(),
  genres: csv,
  year: z.coerce.number().int().min(1950).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  season: z.enum(["WINTER", "SPRING", "SUMMER", "FALL"]).optional(),
  status: z.enum(["AIRING", "FINISHED", "UPCOMING", "CANCELLED"]).optional(),
  type: z.enum(["TV", "MOVIE", "OVA", "ONA", "SPECIAL"]).optional(),
  studio: z.string().trim().max(80).optional(),
  minRating: z.coerce.number().min(0).max(10).optional(),
  sort: z.enum(Object.keys(SORTS) as [keyof typeof SORTS]).default("popular"),
  page: z.coerce.number().int().min(1).max(500).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(24),
});
export type AnimeFilters = z.infer<typeof filterSchema>;

export function buildWhere(f: Partial<AnimeFilters>): Prisma.AnimeWhereInput {
  const and: Prisma.AnimeWhereInput[] = [];
  if (f.q) {
    const q = f.q;
    const asYear = /^\d{4}$/.test(q) ? Number(q) : null;
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { englishTitle: { contains: q, mode: "insensitive" } },
        { nativeTitle: { contains: q, mode: "insensitive" } },
        { synonyms: { has: q } },
        { studio: { contains: q, mode: "insensitive" } },
        { genres: { some: { genre: { name: { contains: q, mode: "insensitive" } } } } },
        ...(asYear ? [{ year: asYear }] : []),
      ],
    });
  }
  // Genres are combined with AND: "Action + Fantasy" returns anime that have both.
  for (const g of f.genres ?? []) {
    and.push({ genres: { some: { genre: { name: { equals: g, mode: "insensitive" } } } } });
  }
  if (f.year) and.push({ year: f.year });
  if (f.month) and.push({ month: f.month });
  if (f.season) and.push({ season: f.season });
  if (f.status) and.push({ status: f.status });
  if (f.type) and.push({ type: f.type });
  if (f.studio) and.push({ studio: { contains: f.studio, mode: "insensitive" } });
  if (f.minRating) and.push({ rating: { gte: f.minRating } });
  return and.length ? { AND: and } : {};
}

export async function listAnime(f: AnimeFilters) {
  const where = buildWhere(f);
  const [rows, total] = await Promise.all([
    db.anime.findMany({
      where,
      select: cardSelect,
      orderBy: [SORTS[f.sort], { id: "asc" }],
      skip: (f.page - 1) * f.limit,
      take: f.limit,
    }),
    db.anime.count({ where }),
  ]);
  return { items: rows.map(toCard), page: f.page, total, hasMore: f.page * f.limit < total };
}

export async function getAnimeDetail(id: string) {
  const a = await db.anime.findUnique({
    where: { id },
    include: {
      genres: { select: { genre: { select: { name: true } } } },
      seasons: { orderBy: { number: "asc" } },
    },
  });
  if (!a) return null;
  const { genres, ...rest } = a;
  return { ...rest, genres: genres.map((g) => g.genre.name) };
}

export async function relatedAnime(id: string, limit = 12) {
  const a = await db.anime.findUnique({ where: { id }, select: { genres: { select: { genreId: true } } } });
  if (!a) return [];
  const rows = await db.anime.findMany({
    where: { id: { not: id }, genres: { some: { genreId: { in: a.genres.map((g) => g.genreId) } } } },
    select: cardSelect,
    orderBy: { popularity: "desc" },
    take: limit,
  });
  return rows.map(toCard);
}

export async function listGenres() {
  const rows = await db.genre.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, _count: { select: { anime: true } } },
  });
  return rows.filter((g) => g._count.anime > 0).map((g) => ({ id: g.id, name: g.name, count: g._count.anime }));
}

export async function seasonAnime(year: number, season: string, genre?: string) {
  const where = buildWhere({
    year,
    season: season.toUpperCase() as AnimeFilters["season"],
    genres: genre ? [genre] : [],
  });
  const rows = await db.anime.findMany({ where, select: cardSelect, orderBy: { popularity: "desc" }, take: 100 });
  return rows.map(toCard);
}

/** Buckets for the "New Anime" screen. */
export async function newAnime() {
  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = 24 * 3600 * 1000;
  const weekAgo = new Date(startOfDay.getTime() - 7 * day);
  const monthAgo = new Date(startOfDay.getTime() - 30 * day);
  const take = 20;
  const q = (where: Prisma.AnimeWhereInput, orderBy: Prisma.AnimeOrderByWithRelationInput) =>
    db.anime.findMany({ where, select: cardSelect, orderBy, take }).then((r) => r.map(toCard));
  // Windows are based on when an episode/video was released (what "new" means for video channels
  // and weekly shows alike), not on the series' original start date.
  const released = (from: Date, to: Date): Prisma.AnimeWhereInput => ({
    episodes: { some: { releaseDate: { gte: from, lt: to } } },
  });
  const tomorrow = new Date(startOfDay.getTime() + day);
  const playable: Prisma.AnimeWhereInput = { episodes: { some: {} } };
  const [today, week, month, recentlyAdded, recentlyUpdated, upcoming] = await Promise.all([
    q(released(startOfDay, tomorrow), { updatedAt: "desc" }),
    q(released(weekAgo, tomorrow), { popularity: "desc" }),
    q(released(monthAgo, tomorrow), { popularity: "desc" }),
    q(playable, { createdAt: "desc" }),
    q(playable, { updatedAt: "desc" }),
    q({ OR: [{ status: "UPCOMING" }, { episodes: { some: { releaseDate: { gte: tomorrow } } } }] }, { startDate: "asc" }),
  ]);
  return { today, week, month, recentlyAdded, recentlyUpdated, upcoming };
}
