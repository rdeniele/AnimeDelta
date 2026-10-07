import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { AsyncStorage } from "@/lib/storage";
import type { AnimeCard } from "@/types";

export type ThemePref = "dark" | "light" | "system";
export type QualityPref = "auto" | "high" | "low";

interface PrefsState {
  theme: ThemePref;
  subtitleLang: string; // "off" or a language code
  autoplayNext: boolean;
  quality: QualityPref;
  notifyEpisodes: boolean;
  notifyNewAnime: boolean;
  notifyRecommendations: boolean;
  searchHistory: string[];
  recentlyViewed: AnimeCard[];
  set: (p: Partial<Omit<PrefsState, "set" | "addSearch" | "clearSearches" | "viewAnime">>) => void;
  addSearch: (q: string) => void;
  clearSearches: () => void;
  viewAnime: (a: AnimeCard) => void;
}

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      theme: "dark",
      subtitleLang: "en",
      autoplayNext: true,
      quality: "auto",
      notifyEpisodes: true,
      notifyNewAnime: false,
      notifyRecommendations: false,
      searchHistory: [],
      recentlyViewed: [],
      set: (p) => set(p),
      addSearch: (q) =>
        set((s) => ({ searchHistory: [q, ...s.searchHistory.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 10) })),
      clearSearches: () => set({ searchHistory: [] }),
      viewAnime: (a) => set((s) => ({ recentlyViewed: [a, ...s.recentlyViewed.filter((x) => x.id !== a.id)].slice(0, 20) })),
    }),
    { name: "animedelta.prefs", storage: createJSONStorage(() => AsyncStorage) },
  ),
);
