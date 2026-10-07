export type AnimeStatusDTO = "AIRING" | "FINISHED" | "UPCOMING" | "CANCELLED";
export type AnimeTypeDTO = "TV" | "MOVIE" | "OVA" | "ONA" | "SPECIAL";
export type AnimeSeasonDTO = "WINTER" | "SPRING" | "SUMMER" | "FALL";

/** Provider-neutral anime record. `externalId` is the id inside the provider. */
export interface AnimeDTO {
  externalId: string;
  title: string;
  englishTitle?: string | null;
  nativeTitle?: string | null;
  synonyms: string[];
  description: string;
  coverImage?: string | null;
  bannerImage?: string | null;
  year?: number | null;
  month?: number | null;
  season?: AnimeSeasonDTO | null;
  status: AnimeStatusDTO;
  type: AnimeTypeDTO;
  rating?: number | null;
  popularity: number;
  duration?: number | null;
  episodeCount?: number | null;
  studio?: string | null;
  startDate?: Date | null;
  genres: string[];
}

export interface SeasonDTO {
  number: number;
  title: string;
}

export interface EpisodeDTO {
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  description: string;
  thumbnail?: string | null;
  releaseDate?: Date | null;
  duration?: number | null;
}

export interface MetadataProvider {
  readonly name: string;
  search(query: string): Promise<AnimeDTO[]>;
  getAnime(externalId: string): Promise<AnimeDTO | null>;
  getEpisodes(externalId: string): Promise<EpisodeDTO[]>;
  getSeasons(externalId: string): Promise<SeasonDTO[]>;
  getSeasonAnime(year: number, season: string): Promise<AnimeDTO[]>;
  /** Catalog pages used by the sync job to discover new anime. */
  listAnime(page: number): Promise<{ items: AnimeDTO[]; hasMore: boolean }>;
}

export interface VideoQuality {
  label: string;
  url: string;
}

export interface VideoSource {
  url: string;
  mimeType?: string | null;
  qualities: VideoQuality[];
  /** Intro window in seconds, when known, enabling "Skip intro". */
  introStart?: number | null;
  introEnd?: number | null;
}

export interface VideoProvider {
  readonly name: string;
  getVideo(animeId: string, episodeId: string): Promise<VideoSource | null>;
}

export interface SubtitleTrack {
  language: string;
  label: string;
  url: string;
}

export interface SubtitleProvider {
  readonly name: string;
  getSubtitles(episodeId: string): Promise<SubtitleTrack[]>;
}
