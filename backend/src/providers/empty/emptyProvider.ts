import type { MetadataProvider } from "../types.js";

/** No remote metadata: sync becomes a no-op so hand-added library entries are never touched. */
export class EmptyMetadataProvider implements MetadataProvider {
  readonly name = "none";
  async search() {
    return [];
  }
  async getAnime() {
    return null;
  }
  async getEpisodes() {
    return [];
  }
  async getSeasons() {
    return [];
  }
  async getSeasonAnime() {
    return [];
  }
  async listAnime() {
    return { items: [], hasMore: false };
  }
}
