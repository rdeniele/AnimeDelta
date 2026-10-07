import { db } from "../../lib/db.js";
import type { SubtitleProvider, SubtitleTrack, VideoProvider, VideoSource } from "../types.js";

/**
 * Serves only media sources the owner has registered (admin API → MediaSource table),
 * i.e. files/streams they have rights to use. It never resolves third-party sites.
 */
export class LibraryVideoProvider implements VideoProvider {
  readonly name = "library";
  async getVideo(_animeId: string, episodeId: string): Promise<VideoSource | null> {
    const sources = await db.mediaSource.findMany({ where: { episodeId }, orderBy: { createdAt: "asc" } });
    if (sources.length === 0) return null;
    return {
      url: sources[0].url,
      mimeType: sources[0].mimeType,
      qualities: sources.map((s) => ({ label: s.quality, url: s.url })),
    };
  }
}

export class LibrarySubtitleProvider implements SubtitleProvider {
  readonly name = "library";
  async getSubtitles(episodeId: string): Promise<SubtitleTrack[]> {
    const rows = await db.subtitle.findMany({ where: { episodeId } });
    return rows.map((s) => ({ language: s.language, label: s.label, url: s.url }));
  }
}
