export type AnimeStatus = "AIRING" | "FINISHED" | "UPCOMING" | "CANCELLED";
export type AnimeType = "TV" | "MOVIE" | "OVA" | "ONA" | "SPECIAL";
export type AnimeSeason = "WINTER" | "SPRING" | "SUMMER" | "FALL";
export type ListStatus = "WATCHING" | "PLAN_TO_WATCH" | "COMPLETED" | "DROPPED";
export type SortKey = "recentlyAdded" | "recentlyUpdated" | "newest" | "oldest" | "az" | "za" | "rating" | "popular";

export interface AnimeCard {
  id: string;
  title: string;
  englishTitle: string | null;
  nativeTitle: string | null;
  coverImage: string | null;
  bannerImage: string | null;
  description: string;
  year: number | null;
  season: AnimeSeason | null;
  status: AnimeStatus;
  type: AnimeType;
  rating: number | null;
  episodeCount: number | null;
  duration: number | null;
  genres: string[];
}

export interface AnimeDetail extends AnimeCard {
  synonyms: string[];
  studio: string | null;
  month: number | null;
  seasons: { id: string; number: number; title: string }[];
}

export interface Episode {
  id: string;
  animeId: string;
  seasonId: string | null;
  episodeNumber: number;
  title: string;
  description: string;
  thumbnail: string | null;
  releaseDate: string | null;
  duration: number | null;
  progressSeconds: number;
  durationSeconds: number;
  completed: boolean;
}

export interface SeasonEpisodes {
  id: string;
  number: number;
  title: string;
  episodes: Episode[];
}

export interface LatestEpisode {
  id: string;
  animeId: string;
  episodeNumber: number;
  title: string;
  thumbnail: string | null;
  releaseDate: string | null;
  anime: { id: string; title: string; coverImage: string | null; bannerImage: string | null };
}

export interface ProgressItem {
  id: string;
  animeId: string;
  episodeId: string;
  progressSeconds: number;
  durationSeconds: number;
  completed: boolean;
  updatedAt: string;
  anime: AnimeCard;
  episode: { id: string; episodeNumber: number; title: string; thumbnail: string | null; seasonNumber: number };
}

export interface ListItem {
  animeId: string;
  status: ListStatus;
  createdAt: string;
  anime: AnimeCard;
}

export interface Genre {
  id: number;
  name: string;
  count: number;
}

export interface HomeData {
  hero: AnimeCard[];
  continueWatching: ProgressItem[];
  recentlyAdded: AnimeCard[];
  latestEpisodes: LatestEpisode[];
  trending: AnimeCard[];
  popularSeason: AnimeCard[];
  airing: AnimeCard[];
  newAnime: AnimeCard[];
  recommended: AnimeCard[];
  recentlyUpdated: AnimeCard[];
  genres: Genre[];
}

export interface Paged<T> {
  items: T[];
  page: number;
  total: number;
  hasMore: boolean;
}

export interface SubtitleTrack {
  language: string;
  label: string;
  url: string;
}

export interface Playback {
  episode: {
    id: string;
    animeId: string;
    episodeNumber: number;
    title: string;
    season: { number: number } | null;
    anime: { id: string; title: string };
  };
  video: {
    url: string;
    mimeType?: string | null;
    qualities: { label: string; url: string }[];
    introStart?: number | null;
    introEnd?: number | null;
  } | null;
  subtitles: SubtitleTrack[];
  previous: { id: string; episodeNumber: number; title: string } | null;
  next: { id: string; episodeNumber: number; title: string } | null;
  progress: { progressSeconds: number; durationSeconds: number; completed: boolean } | null;
}

export interface NewAnimeData {
  today: AnimeCard[];
  week: AnimeCard[];
  month: AnimeCard[];
  recentlyAdded: AnimeCard[];
  recentlyUpdated: AnimeCard[];
  upcoming: AnimeCard[];
}

export interface DayReleases {
  date: string;
  episodes: {
    id: string;
    episodeNumber: number;
    title: string;
    thumbnail: string | null;
    releaseDate: string | null;
    anime: { id: string; title: string; coverImage: string | null };
  }[];
  premieres: AnimeCard[];
}

export interface Filters {
  genres: string[];
  year?: number;
  month?: number;
  season?: AnimeSeason;
  status?: AnimeStatus;
  type?: AnimeType;
  minRating?: number;
  sort: SortKey;
}

export const LIST_LABELS: Record<ListStatus, string> = {
  WATCHING: "Watching",
  PLAN_TO_WATCH: "Plan to Watch",
  COMPLETED: "Completed",
  DROPPED: "Dropped",
};
export const STATUS_LABELS: Record<AnimeStatus, string> = {
  AIRING: "Currently Airing",
  FINISHED: "Finished",
  UPCOMING: "Upcoming",
  CANCELLED: "Cancelled",
};
export const SORT_LABELS: Record<SortKey, string> = {
  recentlyAdded: "Recently Added",
  recentlyUpdated: "Recently Updated",
  newest: "Newest",
  oldest: "Oldest",
  az: "A-Z",
  za: "Z-A",
  rating: "Highest Rated",
  popular: "Most Popular",
};
export const SEASON_LABELS: Record<AnimeSeason, string> = { WINTER: "Winter", SPRING: "Spring", SUMMER: "Summer", FALL: "Fall" };
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
