import { MONTHS, SEASON_LABELS, SORT_LABELS, STATUS_LABELS, type Filters } from "@/types";

export const DEFAULT_FILTERS: Filters = { genres: [], sort: "popular" };

export const FALLBACK_GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller",
];

export function yearOptions(): number[] {
  const now = new Date().getFullYear();
  return Array.from({ length: now + 1 - 2010 + 1 }, (_, i) => now + 1 - i);
}

export interface FilterChip {
  key: string;
  label: string;
  remove: (f: Filters) => Filters;
}

/** Active filters as removable chips (sort is shown on the Sort button instead). */
export function activeChips(f: Filters): FilterChip[] {
  const chips: FilterChip[] = f.genres.map((g) => ({
    key: `g-${g}`,
    label: g,
    remove: (x) => ({ ...x, genres: x.genres.filter((y) => y !== g) }),
  }));
  if (f.year) chips.push({ key: "year", label: String(f.year), remove: (x) => ({ ...x, year: undefined }) });
  if (f.month) chips.push({ key: "month", label: MONTHS[f.month - 1], remove: (x) => ({ ...x, month: undefined }) });
  if (f.season) chips.push({ key: "season", label: SEASON_LABELS[f.season], remove: (x) => ({ ...x, season: undefined }) });
  if (f.status) chips.push({ key: "status", label: STATUS_LABELS[f.status], remove: (x) => ({ ...x, status: undefined }) });
  if (f.type) chips.push({ key: "type", label: f.type === "MOVIE" ? "Movie" : f.type, remove: (x) => ({ ...x, type: undefined }) });
  if (f.minRating) chips.push({ key: "rating", label: `${f.minRating}+`, remove: (x) => ({ ...x, minRating: undefined }) });
  return chips;
}

export const activeCount = (f: Filters) => activeChips(f).length;
export const sortLabel = (f: Filters) => SORT_LABELS[f.sort];
