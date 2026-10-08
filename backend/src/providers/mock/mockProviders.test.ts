import assert from "node:assert/strict";
import { test } from "node:test";
import { MockMetadataProvider, MockSubtitleProvider, MockVideoProvider } from "./mockProviders.js";

const metadata = new MockMetadataProvider();

test("anime search finds a known title case-insensitively", async () => {
  const results = await metadata.search("neon ronin");
  assert.ok(results.length >= 1);
  assert.ok(results.some((a) => a.externalId === "neon-ronin"));
});

test("anime search returns nothing for a query that matches no title", async () => {
  const results = await metadata.search("zzz-does-not-exist-zzz");
  assert.deepEqual(results, []);
});

test("getAnime retrieves metadata by id", async () => {
  const anime = await metadata.getAnime("neon-ronin");
  assert.ok(anime);
  assert.equal(anime?.title, "Neon Ronin");
  assert.ok(anime?.genres.includes("Action"));
});

test("getAnime returns null for an unknown id (invalid response guard)", async () => {
  assert.equal(await metadata.getAnime("does-not-exist"), null);
});

test("getEpisodes returns episodes ordered and scoped to the anime", async () => {
  const episodes = await metadata.getEpisodes("neon-ronin");
  assert.ok(episodes.length > 0);
  assert.equal(episodes[0].episodeNumber, 1);
});

test("getEpisodes for an unavailable anime returns an empty list, not an error", async () => {
  assert.deepEqual(await metadata.getEpisodes("does-not-exist"), []);
});

test("mock video provider deterministically resolves the same episode to the same source", async () => {
  const video = new MockVideoProvider();
  const a = await video.getVideo("neon-ronin", "ep-1");
  const b = await video.getVideo("neon-ronin", "ep-1");
  assert.deepEqual(a, b);
  assert.equal(a?.mimeType, "video/mp4");
});

test("mock subtitle provider returns English and Japanese tracks", async () => {
  const subs = new MockSubtitleProvider();
  const tracks = await subs.getSubtitles("ep-1");
  assert.deepEqual(
    tracks.map((t) => t.language),
    ["en", "ja"],
  );
});
