import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { api, errorMessage } from "@/lib/api";
import { toast } from "@/store/ui";
import type { AnimeCard, SeasonEpisodes } from "@/types";
import { useListStatusMap, useRemoveFromList, useSetListStatus } from "./queries";

/** Resume the in-progress episode, else the one after the last completed, else episode 1. */
export function pickEpisode(seasons: SeasonEpisodes[]) {
  const all = seasons.flatMap((s) => s.episodes);
  if (all.length === 0) return null;
  const inProgress = [...all].reverse().find((e) => !e.completed && e.progressSeconds > 5);
  if (inProgress) return inProgress;
  const lastDone = all.map((e) => e.completed).lastIndexOf(true);
  return all[Math.min(lastDone + 1, all.length - 1)];
}

export function useWatchNow() {
  const router = useRouter();
  const qc = useQueryClient();
  return async (animeId: string) => {
    try {
      const seasons = await qc.fetchQuery({
        queryKey: ["episodes", animeId, true],
        queryFn: () => api<{ seasons: SeasonEpisodes[] }>(`/anime/${animeId}/episodes`).then((r) => r.seasons),
        staleTime: 0,
      });
      const ep = pickEpisode(seasons);
      if (!ep) return toast("No episodes available yet", "info");
      router.push(`/player/${animeId}/${ep.id}`);
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };
}

/** Toggle membership; tap adds as Plan to Watch, tap again removes. */
export function useToggleList(anime: AnimeCard) {
  const status = useListStatusMap().get(anime.id);
  const add = useSetListStatus();
  const remove = useRemoveFromList();
  return {
    status,
    toggle: () => {
      if (status) {
        remove.mutate(anime.id);
        toast("Removed from My List");
      } else {
        add.mutate({ anime, status: "PLAN_TO_WATCH" });
        toast("Added to My List", "success");
      }
    },
  };
}
