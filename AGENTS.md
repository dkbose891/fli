# AGENTS.md

## Cursor Cloud specific instructions

This is a single-service **Next.js 15 (App Router) / React 19** app — the "NSW Place Analyser". Dependencies are plain npm (`package-lock.json`); the update script runs `npm ci`. Node 20+ is required (Node 22 is present on the VM and works).

### Services and how to run them

- **One service: the Next.js dev server.** Run `npm run dev` (serves on `http://localhost:3000`). Commands are the standard `package.json` scripts (`dev`, `build`, `start`, `test`).
- Start it in a background/tmux terminal, not in `install`/update — a dev server must not run during dependency setup.

### Two functional paths (important gotcha)

The app has two independent backends, and only one needs credentials:

1. **Deterministic layer/map path — no credentials needed.** Clicking a parcel and toggling layers (`parcels/zoning/bushfire/flood/suburbs`) hit `GET /api/layer/[name]` which proxies **live NSW government ArcGIS services** over the public internet. This works out of the box and is the reliable way to demo the app end-to-end. Example: `curl "http://localhost:3000/api/layer/parcels?point=151.2093,-33.8688"`. Occasional single-request 502s from the upstream NSW services are transient — just retry.
2. **Chat agent path — requires Google Cloud.** `POST /api/chat` uses `@google/genai` in **Vertex AI** mode via **Application Default Credentials** (no key files). It needs a real `GOOGLE_CLOUD_PROJECT` (see `.env.example`) plus `gcloud auth application-default login` with Vertex AI enabled. Without those, chat returns a 500; the map/layers still work. Unit tests mock the Gemini client, so tests never need GCP.

### Testing

- `npm test` runs Vitest (`tests/**/*.test.ts`); all external services (ArcGIS, Wikipedia, Gemini) are mocked, so tests are hermetic and need no network or credentials.
- Typecheck with `npx tsc --noEmit`.
- There is **no lint script and no ESLint config** in this repo — do not assume `npm run lint` exists. (Avoid running `next lint`, which would try to interactively scaffold ESLint.)

### Env

- Copy `.env.example` to `.env`. Only `GOOGLE_CLOUD_PROJECT` matters for chat; the map/layer path needs no env vars.
