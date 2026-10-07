import { db } from "../lib/db.js";
import { cardSelect, toCard } from "./anime.js";

const day = 24 * 3600 * 1000;

export async function releasesOn(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start.getTime() + day);
  const [episodes, premieres] = await Promise.all([
    db.episode.findMany({
      where: { releaseDate: { gte: start, lt: end } },
      orderBy: { releaseDate: "asc" },
      select: {
        id: true,
        episodeNumber: true,
        title: true,
        thumbnail: true,
        releaseDate: true,
        anime: { select: { id: true, title: true, coverImage: true } },
      },
      take: 100,
    }),
    db.anime.findMany({ where: { startDate: { gte: start, lt: end } }, select: cardSelect, take: 50 }),
  ]);
  return { date: start.toISOString().slice(0, 10), episodes, premieres: premieres.map(toCard) };
}

/** Number of releases per day for the month, used for calendar dots. */
export async function monthSummary(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  const rows = await db.episode.findMany({
    where: { releaseDate: { gte: start, lt: end } },
    select: { releaseDate: true },
  });
  const counts: Record<string, number> = {};
  for (const r of rows) {
    const k = r.releaseDate!.toISOString().slice(0, 10);
    counts[k] = (counts[k] ?? 0) + 1;
  }
  return counts;
}
