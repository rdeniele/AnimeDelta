import { db } from "../lib/db.js";
import { cardSelect, toCard } from "./anime.js";

/**
 * Simple, replaceable recommender. Signals: genres of anime the user watched (weighted by
 * recency), completed or listed anime, popularity and rating. Candidates the user already
 * has are excluded. Swap by implementing `Recommender` and changing `recommender` below.
 */
export interface Recommender {
  recommend(userId: string | undefined, limit: number): Promise<ReturnType<typeof toCard>[]>;
}

class GenreAffinityRecommender implements Recommender {
  async recommend(userId: string | undefined, limit: number) {
    const weights = new Map<string, number>();
    const owned = new Set<string>();

    if (userId) {
      const [progress, list] = await Promise.all([
        db.watchProgress.findMany({
          where: { userId },
          orderBy: { updatedAt: "desc" },
          take: 30,
          select: { animeId: true, completed: true, anime: { select: { genres: { select: { genre: { select: { name: true } } } } } } },
        }),
        db.watchlist.findMany({
          where: { userId },
          select: { animeId: true, status: true, anime: { select: { genres: { select: { genre: { select: { name: true } } } } } } },
        }),
      ]);
      const add = (genres: { genre: { name: string } }[], w: number) =>
        genres.forEach((g) => weights.set(g.genre.name, (weights.get(g.genre.name) ?? 0) + w));
      progress.forEach((p, i) => {
        owned.add(p.animeId);
        add(p.anime.genres, (p.completed ? 3 : 2) * (1 - i / 40)); // recent first
      });
      list.forEach((l) => {
        owned.add(l.animeId);
        if (l.status !== "DROPPED") add(l.anime.genres, l.status === "COMPLETED" ? 3 : 1.5);
      });
    }

    const candidates = await db.anime.findMany({
      where: { id: { notIn: [...owned] } },
      select: { ...cardSelect, popularity: true },
      orderBy: { popularity: "desc" },
      take: 200,
    });
    const maxPop = Math.max(1, ...candidates.map((c) => c.popularity));

    const scored = candidates.map((c) => {
      const names = c.genres.map((g) => g.genre.name);
      // Pair bonus favours combos like Action+Fantasy over two unrelated matches.
      const hits = names.filter((n) => weights.has(n));
      const genreScore = hits.reduce((s, n) => s + (weights.get(n) ?? 0), 0) + (hits.length > 1 ? hits.length : 0);
      const score = genreScore * 10 + (c.popularity / maxPop) * 5 + (c.rating ?? 0);
      return { c, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(({ c }) => {
      const { popularity: _p, ...rest } = c;
      return toCard(rest);
    });
  }
}

export const recommender: Recommender = new GenreAffinityRecommender();
