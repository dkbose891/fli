# AGENTS.md

## Cursor Cloud specific instructions

This is a single-service **Next.js 15 (App Router) / React 19** app — the "NSW Place Analyser". Dependencies are plain npm (`package-lock.json`); the update script runs `npm ci`. Node 20+ is required (Node 22 is present on the VM and works).

### Services and how to run them

- **One service: the Next.js dev server.** Run `npm run dev` (serves on `http://localhost:3000`). Commands are the standard `package.json` scripts (`dev`, `build`, `start`, `test`).
- Start it in a background/tmux terminal, not in `install`/update — a dev server must not run during dependency setup.

### Two functional paths (important gotcha)

The app has two independent backends, and only one needs credentials:

1. **Deterministic layer/map path — no credentials needed.** Clicking a parcel and toggling layers (`parcels/zoning/bushfire/flood/suburbs`) hit `GET /api/layer/[name]` which proxies **live NSW government ArcGIS services** over the public internet. This works out of the box and is the reliable way to demo the app end-to-end. Example: `curl "http://localhost:3000/api/layer/parcels?point=151.2093,-33.8688"`. Occasional single-request 502s from the upstream NSW services are transient — just retry.
2. **Chat agent path — Gemini auth is dual-mode** (`lib/agent.ts` `createGenAI()`):
   - If `GEMINI_API_KEY` is set → **Gemini Developer API** (AI Studio). Prefer putting the key in a gitignored `.env.local` (or inject it as a Cloud Agent secret). For new API-key projects, `gemini-2.5-flash` may be blocked — use `GEMINI_MODEL=gemini-flash-latest` (or another listed model). The key also needs active AI Studio billing/credits.
   - Else → **Vertex AI + Application Default Credentials** using `GOOGLE_CLOUD_PROJECT` / `GOOGLE_CLOUD_LOCATION` from `.env` (see `.env.example`).
   - Without either, chat returns a 500; map/layers still work. Unit tests mock the Gemini client, so tests never need credentials.

### Testing

- `npm test` runs Vitest (`tests/**/*.test.ts`); all external services (ArcGIS, Wikipedia, Gemini) are mocked, so tests are hermetic and need no network or credentials.
- Typecheck with `npx tsc --noEmit`.
- There is **no lint script and no ESLint config** in this repo — do not assume `npm run lint` exists. (Avoid running `next lint`, which would try to interactively scaffold ESLint.)

### Env

- Copy `.env.example` to `.env`. For chat: either set `GEMINI_API_KEY` (Developer API) or configure Vertex ADC + `GOOGLE_CLOUD_PROJECT`. The map/layer path needs no env vars. Never commit `.env` / `.env.local`.
