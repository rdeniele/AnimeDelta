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
