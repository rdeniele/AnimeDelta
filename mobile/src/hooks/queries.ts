import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { toast } from "@/store/ui";
import type {
  AnimeCard,
  AnimeDetail,
  DayReleases,
  Filters,
  Genre,
  HomeData,
  ListItem,
  ListStatus,
  NewAnimeData,
  Paged,
  Playback,
  ProgressItem,
  SeasonEpisodes,
} from "@/types";

export function filterQuery(f: Partial<Filters> & { q?: string }, page: number, limit = 24): string {
  const p = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (f.q) p.set("q", f.q);
  if (f.genres?.length) p.set("genres", f.genres.join(","));
  if (f.year) p.set("year", String(f.year));
  if (f.month) p.set("month", String(f.month));
  if (f.season) p.set("season", f.season);
  if (f.status) p.set("status", f.status);
  if (f.type) p.set("type", f.type);
  if (f.minRating) p.set("minRating", String(f.minRating));
  if (f.sort) p.set("sort", f.sort);
  return p.toString();
}

/** Session-dependent data waits for the anonymous account to exist. */
const useHasSession = () => Boolean(useAuth((s) => s.token));

export const useHome = () => {
  const hasSession = useHasSession();
  return useQuery({ queryKey: ["home", hasSession], queryFn: () => api<HomeData>("/home") });
};

export const useAnimeDetail = (id: string) =>
  useQuery({ queryKey: ["anime", id], queryFn: () => api<AnimeDetail>(`/anime/${id}`) });

export const useEpisodes = (id: string) => {
  const hasSession = useHasSession();
  return useQuery({
    queryKey: ["episodes", id, hasSession],
    queryFn: () => api<{ seasons: SeasonEpisodes[] }>(`/anime/${id}/episodes`).then((r) => r.seasons),
  });
};

export const useRelated = (id: string) =>
  useQuery({ queryKey: ["related", id], queryFn: () => api<AnimeCard[]>(`/anime/${id}/related`) });

export const useGenres = () =>
  useQuery({ queryKey: ["genres"], queryFn: () => api<Genre[]>("/genres"), staleTime: 24 * 3600 * 1000 });

export function useBrowse(filters: Filters, q = "", enabled = true) {
  return useInfiniteQuery({
    queryKey: ["browse", filters, q],
    enabled,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api<Paged<AnimeCard>>(q ? `/search?q=${encodeURIComponent(q)}&page=${pageParam}` : `/anime?${filterQuery(filters, pageParam)}`),
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    placeholderData: keepPreviousData,
  });
}

export const usePopularSearches = () =>
  useQuery({ queryKey: ["popularSearches"], queryFn: () => api<string[]>("/search/popular"), staleTime: 3600 * 1000 });

export const useSeasonAnime = (year: number, season: string, genre?: string) =>
  useQuery({
    queryKey: ["season", year, season, genre ?? "all"],
    queryFn: () =>
      api<{ items: AnimeCard[] }>(`/seasons/${year}/${season.toLowerCase()}${genre ? `?genre=${encodeURIComponent(genre)}` : ""}`).then(
        (r) => r.items,
      ),
    placeholderData: keepPreviousData,
  });

export const useNewAnime = () => useQuery({ queryKey: ["newAnime"], queryFn: () => api<NewAnimeData>("/anime/new") });

export const useDayReleases = (date: string) =>
  useQuery({ queryKey: ["calendar", date], queryFn: () => api<DayReleases>(`/calendar/${date}`) });

export const useMonthSummary = (ym: string) =>
  useQuery({ queryKey: ["calendarMonth", ym], queryFn: () => api<Record<string, number>>(`/calendar/month/${ym}`) });

export const usePlayback = (episodeId: string) =>
  useQuery({
    queryKey: ["playback", episodeId],
    queryFn: () => api<Playback>(`/episodes/${episodeId}/playback`),
    gcTime: 0,
    staleTime: 0,
  });

/* ---- personal data ---- */

export const useMyList = () => {
  const hasSession = useHasSession();
  return useQuery({ queryKey: ["list"], enabled: hasSession, queryFn: () => api<ListItem[]>("/watchlist") });
};

export const useHistory = () => {
  const hasSession = useHasSession();
  return useQuery({
    queryKey: ["history"],
    enabled: hasSession,
    queryFn: () => api<ProgressItem[]>("/watch-progress?kind=history"),
  });
};

export function useListStatusMap(): Map<string, ListStatus> {
  const { data } = useMyList();
  return new Map((data ?? []).map((i) => [i.animeId, i.status]));
}

/** Optimistic add / change status. */
export function useSetListStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { anime: AnimeCard; status: ListStatus }) =>
      api("/watchlist", { method: "POST", body: { animeId: v.anime.id, status: v.status } }),
    onMutate: async ({ anime, status }) => {
      await qc.cancelQueries({ queryKey: ["list"] });
      const prev = qc.getQueryData<ListItem[]>(["list"]);
      const without = (prev ?? []).filter((i) => i.animeId !== anime.id);
      qc.setQueryData<ListItem[]>(["list"], [{ animeId: anime.id, status, createdAt: new Date().toISOString(), anime }, ...without]);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(["list"], ctx?.prev);
      toast("Couldn't update My List", "error");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["list"] }),
  });
}

export function useRemoveFromList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (animeId: string) => api(`/watchlist/${animeId}`, { method: "DELETE" }),
    onMutate: async (animeId) => {
      await qc.cancelQueries({ queryKey: ["list"] });
      const prev = qc.getQueryData<ListItem[]>(["list"]);
      qc.setQueryData<ListItem[]>(["list"], (prev ?? []).filter((i) => i.animeId !== animeId));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(["list"], ctx?.prev);
      toast("Couldn't update My List", "error");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["list"] }),
  });
}

export function useRemoveHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (animeId: string) => api(`/watch-progress/${animeId}`, { method: "DELETE" }),
    onMutate: async (animeId) => {
      const prev = qc.getQueryData<ProgressItem[]>(["history"]);
      qc.setQueryData<ProgressItem[]>(["history"], (prev ?? []).filter((i) => i.animeId !== animeId));
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(["history"], ctx?.prev),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["history"] });
      void qc.invalidateQueries({ queryKey: ["home"] });
    },
  });
}

export function useClearHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api("/watch-progress", { method: "DELETE" }),
    onSuccess: () => {
      qc.setQueryData(["history"], []);
      void qc.invalidateQueries({ queryKey: ["home"] });
      void qc.invalidateQueries({ queryKey: ["episodes"] });
      toast("Watch history cleared", "success");
    },
    onError: () => toast("Couldn't clear history", "error"),
  });
}
