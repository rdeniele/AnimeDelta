import { LIST_LABELS, SEASON_LABELS, type AnimeCard } from "@/types";

export function fmtTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${r}` : `${m}:${r}`;
}

export function metaLine(a: AnimeCard): string {
  const parts: string[] = [a.type === "MOVIE" ? "Movie" : a.type];
  if (a.year) parts.push(String(a.year));
  if (a.type !== "MOVIE" && a.episodeCount) parts.push(`${a.episodeCount} Episodes`);
  return parts.join(" • ");
}

export function seasonLabel(a: { season: AnimeCard["season"]; year: number | null }): string {
  return a.season && a.year ? `${SEASON_LABELS[a.season]} ${a.year}` : "—";
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function pct(progress: number, duration: number): number {
  return duration > 0 ? Math.min(1, Math.max(0, progress / duration)) : 0;
}

export const listLabel = (s: keyof typeof LIST_LABELS) => LIST_LABELS[s];

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function currentSeason(d = new Date()): "WINTER" | "SPRING" | "SUMMER" | "FALL" {
  const m = d.getMonth();
  return m < 3 ? "WINTER" : m < 6 ? "SPRING" : m < 9 ? "SUMMER" : "FALL";
}
