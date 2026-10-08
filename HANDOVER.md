# Handover

Working notes for picking this project up cold (new AI session or new context window).
Keep this updated as things change; delete sections once they're stale rather than letting them rot.

## What this project is

AnimeDelta: a backend (`backend/`, Express + Prisma + Postgres/Supabase) and a mobile app
(`mobile/`, Expo) for browsing and watching anime. Metadata and video come from pluggable
providers (`backend/src/providers/registry.ts`):
- `METADATA_PROVIDER`: `mock` | `jikan` | `youtube` | `none`
- `VIDEO_PROVIDER`: `mock` | `library` (serves `MediaSource` rows you added yourself)

Current local config (`backend/.env.local`, not committed): `METADATA_PROVIDER=youtube`,
`VIDEO_PROVIDER=library`. The YouTube provider pulls episodes from official channels
(`YOUTUBE_CHANNELS`) via the Data API; the library provider only ever serves URLs that were
explicitly registered as a `MediaSource`.

## 2026-10-08 session: resolver layer (structured errors, normalization, cache, debug, tests)

User asked for an "Anime Source Resolver" architecture referencing a GoGoAnime-style scraper
repo (`keerthivasansa/animos`) as inspiration. Flagged that animos-style "providers" only work
by scraping unlicensed streaming sites (no authorized version exists), and that this repo
already has the legitimate version of the same idea (`METADATA_PROVIDER`/`VIDEO_PROVIDER`,
Jikan for metadata, `library`/`mock` for video — see HANDOVER's kickassanime note below for why
that line matters). User chose "extend existing providers" rather than add any new scraping
targets. No new video/metadata source was added; `VIDEO_PROVIDER` is still only `mock`/`library`.

What was added, all additive (no renames; mobile needed zero changes — verified `npx tsc
--noEmit` clean in `mobile/` before and after):
- `providers/errors.ts` — `ProviderError` + 8 codes (`SOURCE_NOT_FOUND`, `PROVIDER_UNAVAILABLE`,
  `EPISODE_NOT_FOUND`, `UNSUPPORTED_FORMAT`, `ACCESS_RESTRICTED`, `DRM_PROTECTED`,
  `INVALID_RESPONSE`, `NETWORK_ERROR`); wired into `lib/http.ts`'s `errorHandler` so routes just
  throw it and get the right HTTP status + `{success:false, error:{code,message}}` body.
- `providers/types.ts` — added optional fields only: `VideoSource.type/isM3U8/language/headers`,
  `VideoQuality.type`, `SubtitleTrack.format`. Nothing existing renamed/removed.
- `resolver/mediaNormalizer.ts` — pure functions inferring HLS/DASH/MP4/other from URL/mimeType,
  normalizing a raw `VideoSource`, and flattening to the `{url,type,quality}` /
  `{url,language}` envelope shape the user's spec asked for.
- `resolver/sourceResolver.ts` — the actual "Provider → Episode → Source Resolver → Playable
  Media Source" layer: calls the video/subtitle provider, normalizes, caches briefly (60s
  default — deliberately short since media URLs can expire), records a debug event, and maps
  any thrown/returned null into the right `ProviderError`. **Caught a real regression before
  shipping**: an early version auto-rejected any source whose inferred `type` was `"other"` as
  `UNSUPPORTED_FORMAT`. That broke the app's existing YouTube-embed episodes (`mimeType:
  "video/youtube"`, see `importLibrary.ts`'s `mimeFor`), which don't match hls/dash/mp4 by
  extension but play fine via `YouTubeEpisodePlayer.tsx`. Fixed by never inferring
  "unsupported" from the URL/extension alone — only a provider that *knows* a source can't be
  played (DRM-wrapped manifest, etc.) should throw `ProviderError.unsupportedFormat()`/
  `.drmProtected()` itself. Verified against the real local DB (not just mocks): hit
  `/api/episodes/:id/playback` for an actual YouTube-sourced episode before and after the fix.
- `cache/cacheManager.ts` — generic in-memory TTL cache + `CACHE_TTL` presets (search 5m,
  anime details 30m, episodes 15m, resolved source 60s). Wired into `JikanMetadataProvider`
  (`search`/`getAnime`/`getEpisodes`) and `sourceResolver`.
- `debug/inspector.ts` — in-memory ring buffer of provider events with header/URL redaction
  (`authorization`, cookies, tokens, API keys, `?token=`/`?key=` query params all redacted
  before anything is ever recorded). Exposed at `GET /api/admin/debug/events` (admin-token
  protected, same `requireAdmin` middleware as everything else in `routes/admin.ts`).
- `providers/mock/scenarioProviders.ts` — configurable fake `VideoProvider`/`SubtitleProvider`
  implementations for tests only (HLS, MP4, DRM-protected, provider-down, untyped-crash,
  unsupported-format, unavailable-episode, expiring/cache-test). Not used by the registry.
- `services/episodes.ts`'s `playbackInfo` now goes through `resolveEpisodeSource` instead of
  calling the video/subtitle providers directly, so normalization/caching/debug-logging apply
  there too; a `ProviderError` still degrades to `video: null` ("Video unavailable") exactly
  like before, it's just typed now instead of an implicit null-check.
- Tests: `npm run test` (new script) runs `node --import tsx --test` over
  `cache/cacheManager.test.ts`, `resolver/mediaNormalizer.test.ts`,
  `resolver/sourceResolver.test.ts`, `providers/mock/mockProviders.test.ts` — 28 tests, no
  external network calls. Added because Node 24 (this repo's runtime) has `node:test` built in;
  no new test-framework dependency was added.

Verified: `npm run typecheck` clean in `backend/`, `npm run test` 28/28 passing, mobile
typecheck clean and unaffected (mobile hand-duplicates its own types in `mobile/src/types.ts`
with no shared/generated types — see note in that file's history — so backend-only additive
fields need no mobile change, but a future rename would need manual updates there too).

## 2026-10-08 session: sync was refreshing thumbnails but not videos

**Fixed.** In `syncEpisodes` (`backend/src/sync/syncService.ts`), an existing episode's
`title`/`description`/`thumbnail` were updated on every sync, but its `MediaSource` (the
actual playable video) was only ever *added* if the provider's URL wasn't already stored —
never replaced. Since `LibraryVideoProvider.getVideo` serves the oldest source by
`createdAt`, a channel re-uploading/changing a video meant the thumbnail updated but the
old, possibly stale video kept playing forever; the new URL just sat there unused.

Changed it to replace-on-change instead of add-only: if the provider's current URL differs
from what's stored, delete existing sources for that episode and create the new one. This
matches how `importLibrary()` already treats hand-edited catalog entries ("the file is the
source of truth for links") — now the provider sync does the same. **User's explicit
instruction: do this every time** — the app's purpose is watching anime, not browsing a
list with pretty pictures, so video content must stay as fresh as the metadata on every
sync run, not just on demand.

Checked the live DB for fallout from the old behavior before pushing: zero episodes had
more than one `MediaSource` row, so there was nothing to backfill/clean up.

## 2026-10-08 session: admin UI for adding anime/sources

Added a small admin web page at `backend/public/admin.html` (+ `admin.js`) so series and
episode video sources can be added through a form instead of hand-editing
`catalog/library.json` and running `npm run catalog:import`. It's static (served by
`express.static("public")` locally, and automatically by Vercel in prod since
`outputDirectory` is already `public`) and talks to the existing `/api/admin/*` routes using
an `X-Admin-Token` header (value lives in `.env.local` → `ADMIN_TOKEN`, never commit it).

Two flows on the page:
1. **Add a series** — title/description/genres/episodes (URL list) → new
   `POST /api/admin/library-series` (`backend/src/routes/admin.ts`), which just validates the
   body against the single-series Zod schema exported from
   `backend/src/library/importLibrary.ts` (`export const series = ...`) and calls the same
   `importLibrary({ series: [body] })` the CLI importer uses. No new import logic was written;
   this just exposes the existing one over HTTP.
2. **Attach a source to an existing episode** — searches `GET /api/anime?q=` (public, no
   token), lists episodes via `GET /api/anime/:id/episodes` (public), then posts to the
   pre-existing `POST /api/admin/media-sources` / `POST /api/admin/subtitles` endpoints.

Verified end-to-end against the real local Supabase DB: created a throwaway test series
(`ZZZ-ADMIN-UI-TEST-DELETE-ME`) through the form, confirmed exactly one anime + one episode
were created, then deleted it with a one-off script. No test data was left behind.

To preview locally: `backend` is now a named config in `.claude/launch.json` (port 4000) —
but see the port-4000 gotcha below. Load `/admin.html` once the server's up.

### Known gotchas found while testing (not fixed, just observed)

- **Port 4000 may already be in use by an unrelated local tool.** During this session, port
  4000 was occupied by a completely different app — a "Video Source Inspector" that scans
  third-party streaming sites (kickassanime.com.es) for video APIs. That is **not** part of
  this repo. If you hit this again, don't assume it's AnimeDelta's backend; check
  `get_page_text`/title before trusting it, and run the real dev server on a different port
  (`PORT=4100 npm run dev` from `backend/`) if needed.
- **`Anime.episodeCount` can be stale/wrong relative to actual `Episode` rows.** Spot-checked
  "Pokemon Brilliant Diamond & Pokemon Shining Pearl" via the admin UI: the anime card reports
  `episodeCount: 7`, but `GET /api/anime/:id/episodes` returns zero real episodes. Likely a
  side effect of the "prune empty series" logic mentioned in commit `34ef595` not also
  clearing/recomputing `episodeCount`, or a sync that removed episodes without updating the
  counter. Didn't chase this further — it's pre-existing and unrelated to the admin UI work,
  but worth a look if "episode count doesn't match what's playable" comes up again.
- A YouTube sync (`SyncRun` row, provider `youtube`) was observed still running
  (`finishedAt: null`) throughout this session, started at server boot time. Episode counts
  will keep climbing on their own while that's active — don't mistake it for something the
  admin UI caused.

### Possible next steps (not requested yet, just obvious follow-ups)

- The admin page has no way to *view or delete* existing media sources/subtitles for an
  episode, only add new ones (there's no DELETE route for either in `admin.ts` yet).
- No auth UI affordance for "token saved" — it's silently persisted to `localStorage` on
  every keystroke; fine for a single-operator local tool, wouldn't scale to multiple admins.

## 2026-10-08 session: "paste a link, get all episodes" import on the admin page

User wanted to paste one anime URL into the admin UI and have every episode added automatically
instead of typing each episode URL into the "Add a series" form by hand. First pass was
YouTube-only; user then clarified they don't mean only YouTube — specifically, a URL on a
site/server they control (not scraping arbitrary third-party streaming sites, which would hit
the same licensing issue as the kickassanime/animos note above).

Two new "fetch episodes from a link" importers, both feeding the same preview shape
(`backend/src/library/preview.ts`: `SeriesPreview`/`EpisodePreview` — `{title, cover, studio,
episodes: [{url, title, description, thumbnail, duration}]}`) into the existing "Add a series"
form so it's a preview-then-save flow (nothing is written to the DB until the admin hits "Save
series", which still goes through the unchanged `POST /api/admin/library-series`):

1. **YouTube playlist** — paste any public playlist URL (or a video URL with `&list=`), not
   just the configured `YOUTUBE_CHANNELS`. `backend/src/providers/youtube/youtubeProvider.ts`:
   `extractPlaylistId()` pulls the playlist ID out of the URL; `fetchPlaylistEpisodes()` is the
   existing channel-sync logic extracted so it's shared instead of duplicated; `getEpisodes()`
   (used by the registry/sync) now just calls it. `fetchPlaylistPreview()` is new — looks up the
   playlist by ID (`playlists?id=`, not `channelId=`, since this isn't necessarily one of the
   configured channels) and maps to `SeriesPreview`. Still filters to embeddable videos only,
   same restriction as channel sync.
2. **Generic URL** (`backend/src/library/importFromUrl.ts`, new file) — for a URL the admin
   controls. Fetches it server-side and accepts either JSON (a bare array of episode
   URLs/objects, or `{title?, cover?, studio?, episodes: [...]}`, reusing the same lenient
   per-episode shape `importLibrary.ts`'s `series` schema already accepts) or plain text (one
   video link per line). 10s timeout, 2MB response cap, 500-episode cap. Blocks
   localhost/private-network hostnames before fetching (`assertPublicHost`) — not a complete
   SSRF defense (no DNS-rebind check, no re-check after redirects), but this endpoint is behind
   the same `requireAdmin`/`ADMIN_TOKEN` gate as the rest of `/api/admin`, so it's deliberately
   just "stop an accidental paste", not hardened against a malicious admin.

Both land on `POST /api/admin/youtube-playlist` and `POST /api/admin/import-url`
(`backend/src/routes/admin.ts`), and `backend/public/admin.html`/`admin.js` got a second
"paste a link" field; `admin.js`'s `applySeriesPreview()` is the one function both buttons call
to fill the form (title/cover/banner/studio only if not already typed, episode rows always
replaced).

Verified live against the real YouTube API (a real Muse Asia playlist — fetched, saved, checked
the 3 episodes landed correctly in the DB, then deleted the test series) and against a real
external JSON endpoint for the generic importer (confirmed the field-mapping and that extra
JSON keys are ignored), plus confirmed the localhost guard actually rejects
`http://localhost:4000/...`. `npm run typecheck` clean throughout.
