# AnimeDelta

A personal, original anime streaming app: an Expo (React Native) mobile client plus a standalone REST API.
Not affiliated with any streaming service. Media comes only from the video provider you configure
(files or streams you have the rights to use). There is no scraping, DRM circumvention or ad removal.

```
mobile/   Expo SDK 57, Expo Router, NativeWind v5, Zustand, TanStack Query, expo-video
backend/  Express 5, Prisma 7 + PostgreSQL (Supabase-compatible), Zod, node-cron
```

## Backend setup (Supabase Postgres)

```bash
cd backend
cp .env.example .env      # fill DATABASE_URL, DIRECT_URL, ADMIN_TOKEN
npm install
npx prisma migrate deploy # uses DIRECT_URL (non-pooled) if set
npm run db:seed           # offline mock catalog (39 anime, ~560 episodes)
npm run dev               # http://localhost:4000
```

- `DATABASE_URL`: Supabase "Transaction pooler" (port 6543) for the running API.
- `DIRECT_URL`: direct connection or "Session pooler" (port 5432), used for migrations.
- `DATABASE_SSL=true` for Supabase.
- `ADMIN_TOKEN` enables `/api/admin/*` (send as `x-admin-token`); leave empty to disable.

### Providers
Metadata, video and subtitles are separate interfaces in `backend/src/providers/types.ts`, selected in `registry.ts`.

| Env | Values |
| --- | --- |
| `METADATA_PROVIDER` | `mock` (offline) or `jikan` (public Jikan API, throttled) |
| `VIDEO_PROVIDER` | `mock` (open-licensed Big Buck Bunny) or `library` (media sources you add) |

Add a source you have rights to: `POST /api/admin/media-sources {episodeId, url, quality}` (and `/api/admin/subtitles`).
Sync (`SyncService`: `syncAnime/syncEpisodes/syncSeasons/syncMetadata`) runs on `SYNC_CRON` and via `POST /api/admin/sync`; runs are stored in `SyncRun`.

### Resolver layer
`backend/src/resolver/sourceResolver.ts` sits between the provider registry and `services/episodes.ts`:
it normalizes whatever a `VideoProvider`/`SubtitleProvider` returns into a consistent shape
(`type`: `hls`/`dash`/`mp4`/`other`, `isM3U8`, flat `sources`/`subtitles` lists), caches resolved
sources briefly (`cache/cacheManager.ts`, default 60s — short on purpose, since media URLs can
expire), and turns failures into structured errors (`providers/errors.ts`:
`SOURCE_NOT_FOUND`, `PROVIDER_UNAVAILABLE`, `EPISODE_NOT_FOUND`, `UNSUPPORTED_FORMAT`,
`ACCESS_RESTRICTED`, `DRM_PROTECTED`, `INVALID_RESPONSE`, `NETWORK_ERROR`) instead of throwing
raw errors. It never implements scraping/DRM bypass itself — a provider that can't legitimately
resolve a source should throw one of these codes, not work around the restriction.

Recent provider activity (request URL, status, detected media type/quality, subtitles — with
auth headers/tokens/cookies redacted) is visible at `GET /api/admin/debug/events` (admin token
required); `POST /api/admin/debug/events/clear` resets it. `npm run test` runs the resolver/cache/
mock-provider test suite (Node's built-in test runner, no external services required).

## Mobile

```bash
cd mobile
npm install
npx expo start            # press a for Android, i for iOS, w for web
```

The app finds the API at `http://<dev-machine>:4000` automatically in dev. For other setups set `EXPO_PUBLIC_API_URL`.
Only public variables are used in the app; database and provider secrets stay on the backend.

## Checks
`npx tsc --noEmit` in both folders; `npm run lint` in `mobile`.

## Adding your own content (links)

1. `cd backend && cp catalog/library.example.json catalog/library.json` (this file is git-ignored)
2. Edit `catalog/library.json`: one entry per series with a title and a list of episode links.
   Links can be YouTube watch URLs (embeddable videos from channels that allow it), direct
   `.mp4`/`.m3u8` URLs you host, with optional WebVTT subtitle URLs per episode.
3. `npm run catalog:check` validates the file. `npm run catalog:import` writes it to the database
   (safe to re-run; the file is the source of truth for links).
4. Set on Vercel and in `backend/.env.local`: `VIDEO_PROVIDER=library` and `METADATA_PROVIDER=none`
   (so the scheduled sync doesn't re-add placeholder or remote data). Run `npm run db:clear-mock`
   once to delete the placeholder catalog.

Only add links to media you own or are allowed to use.
