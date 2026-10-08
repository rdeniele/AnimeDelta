/** Shape returned by any "fetch episodes from a link" importer (YouTube playlist, or a generic
 * URL) — the admin "Add a series" form prefills itself from exactly this shape, regardless of
 * where the episodes actually came from. */
export interface EpisodePreview {
  url: string;
  title: string;
  description: string;
  thumbnail: string | null;
  duration: number | null;
}

export interface SeriesPreview {
  title: string;
  cover: string | null;
  studio: string | null;
  episodes: EpisodePreview[];
}
