import assert from "node:assert/strict";
import { test } from "node:test";
import { inferMediaType, inferSubtitleFormat, normalizeVideoSource, toFlatSources, toFlatSubtitles } from "./mediaNormalizer.js";

test("inferMediaType detects HLS from extension and mimeType", () => {
  assert.equal(inferMediaType("https://x.test/a/master.m3u8"), "hls");
  assert.equal(inferMediaType("https://x.test/a/video", "application/vnd.apple.mpegurl"), "hls");
});

test("inferMediaType detects DASH and MP4", () => {
  assert.equal(inferMediaType("https://x.test/a.mpd"), "dash");
  assert.equal(inferMediaType("https://x.test/a.mp4?token=abc"), "mp4");
});

test("inferMediaType falls back to other for unknown containers", () => {
  assert.equal(inferMediaType("https://x.test/a.ism"), "other");
});

test("inferSubtitleFormat recognizes vtt/srt/ass", () => {
  assert.equal(inferSubtitleFormat("https://x.test/en.vtt"), "vtt");
  assert.equal(inferSubtitleFormat("https://x.test/en.srt"), "srt");
  assert.equal(inferSubtitleFormat("https://x.test/en.ass"), "ass");
  assert.equal(inferSubtitleFormat("https://x.test/en.xyz"), "other");
});

test("normalizeVideoSource fills in type/isM3U8 without mutating required fields", () => {
  const src = normalizeVideoSource({ url: "https://x.test/a.m3u8", qualities: [{ label: "1080p", url: "https://x.test/1080.m3u8" }] });
  assert.equal(src.type, "hls");
  assert.equal(src.isM3U8, true);
  assert.equal(src.qualities[0].type, "hls");
});

test("normalizeVideoSource defaults an empty qualities list to the top-level url", () => {
  const src = normalizeVideoSource({ url: "https://x.test/a.mp4", qualities: [] });
  assert.equal(src.qualities.length, 1);
  assert.equal(src.qualities[0].url, "https://x.test/a.mp4");
  assert.equal(src.type, "mp4");
});

test("toFlatSources/toFlatSubtitles produce the Section 5 envelope shape", () => {
  const normalized = normalizeVideoSource({ url: "https://x.test/a.m3u8", qualities: [{ label: "1080p", url: "https://x.test/1080.m3u8" }] });
  const flat = toFlatSources(normalized);
  assert.deepEqual(flat, [{ url: "https://x.test/1080.m3u8", type: "hls", quality: "1080p" }]);

  const subs = toFlatSubtitles([{ language: "en", label: "English", url: "https://x.test/en.vtt" }]);
  assert.deepEqual(subs, [{ url: "https://x.test/en.vtt", language: "English" }]);
});
