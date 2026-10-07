import type {
  AnimeDTO,
  EpisodeDTO,
  MetadataProvider,
  SeasonDTO,
  SubtitleProvider,
  SubtitleTrack,
  VideoProvider,
  VideoSource,
} from "../types.js";
import { env } from "../../lib/env.js";
import { buildCatalog, buildEpisodes } from "./catalog.js";

export class MockMetadataProvider implements MetadataProvider {
  readonly name = "mock";
  private catalog = () => buildCatalog();

  async search(query: string) {
    const q = query.toLowerCase();
    return this.catalog().filter((a) =>
      [a.title, a.nativeTitle ?? "", ...a.synonyms].some((t) => t.toLowerCase().includes(q)),
    );
  }
  async getAnime(id: string) {
    return this.catalog().find((a) => a.externalId === id) ?? null;
  }
  async getEpisodes(id: string): Promise<EpisodeDTO[]> {
    const a = await this.getAnime(id);
    return a ? buildEpisodes(a) : [];
  }
  async getSeasons(id: string): Promise<SeasonDTO[]> {
    const eps = await this.getEpisodes(id);
    const nums = [...new Set(eps.map((e) => e.seasonNumber))];
    return nums.map((n) => ({ number: n, title: `Season ${n}` }));
  }
  async getSeasonAnime(year: number, season: string): Promise<AnimeDTO[]> {
    return this.catalog().filter((a) => a.year === year && a.season === season.toUpperCase());
  }
  async listAnime(page: number) {
    const all = this.catalog();
    const size = 20;
    return { items: all.slice((page - 1) * size, page * size), hasMore: page * size < all.length };
  }
}

/** Public, freely-licensed sample videos used only for development. */
const DEFAULT_SAMPLES = [
  // Blender Foundation "Big Buck Bunny" (open movie, CC-BY) hosted on archive.org
  "https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4",
];
const configured = (process.env.MOCK_VIDEO_URLS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const SAMPLES = configured.length ? configured : DEFAULT_SAMPLES;

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

export class MockVideoProvider implements VideoProvider {
  readonly name = "mock";
  async getVideo(animeId: string, episodeId: string): Promise<VideoSource | null> {
    const url = SAMPLES[hash(animeId + episodeId) % SAMPLES.length];
    return {
      url,
      mimeType: "video/mp4",
      qualities: [{ label: "Auto", url }],
      introStart: 5,
      introEnd: 35,
    };
  }
}

export class MockSubtitleProvider implements SubtitleProvider {
  readonly name = "mock";
  async getSubtitles(episodeId: string): Promise<SubtitleTrack[]> {
    return [
      { language: "en", label: "English", url: `${env.apiUrl}/api/subtitles/mock/${episodeId}/en.vtt` },
      { language: "ja", label: "Japanese", url: `${env.apiUrl}/api/subtitles/mock/${episodeId}/ja.vtt` },
    ];
  }
}

/** Generates a simple WebVTT file for the mock subtitle tracks. */
export function mockVtt(lang: "en" | "ja"): string {
  const lines =
    lang === "en"
      ? ["Previously, on the show…", "This is a sample English subtitle.", "Subtitles are standard WebVTT.", "Pick another language in the player menu."]
      : ["前回のあらすじ…", "これは日本語の字幕サンプルです。", "字幕は標準のWebVTT形式です。", "プレーヤーのメニューで言語を切り替えられます。"];
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `00:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.000`.replace(/^00:00:/, "00:00:");
  };
  const cues: string[] = [];
  for (let i = 0; i < 60; i++) {
    const t = i * 5;
    cues.push(`${i + 1}\n${fmt(t)} --> ${fmt(t + 4)}\n${lines[i % lines.length]}`);
  }
  return `WEBVTT\n\n${cues.join("\n\n")}\n`;
}
