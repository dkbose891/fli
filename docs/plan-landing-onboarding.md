# Make the product explain itself: landing page + auto-demo + info drawer (refined)

## Context

Open the deployed site and nothing says what the tool is or what to do first — a comprehension problem, not cosmetics. Audiences weighted equally: recruiters/interviewers (30–60s, resume link) and real users. Vehicle: landing page (story) + "Show me" auto-demo (product demos itself) + info drawer. Designed in code with screenshot iteration. Refined by a code-grounded planning pass; implement on a branch cut from current local `main`.

**Verified ground truth de-risking the demo:** `normaliseQuery('26 Calvert Avenue Killara NSW')` produces exactly the cached key in `data/addressr-cache.json` (and the `GANSW705091266` detail key); `data/nsw-cache.json`'s 16 entries cover the full analyse fan-out at the Calvert point. **The only live call in the demo is the one Gemini analyse.** Also: `public/` is empty — `docs/architecture.svg` must be copied to `public/architecture.svg`; `app/layout.tsx` metadata still says "NSW Property Agent" (fix to "NSW Place Analyser").

## 1. Route split — `/` landing, `/app` app, thin server wrappers

- `components/AppShell.tsx` (new, `'use client'`): entire current `app/page.tsx` body moves here + demo/drawer wiring; accepts `demo: boolean`.
- `app/app/page.tsx` (new, server): `const { demo } = await searchParams; return <AppShell demo={demo === '1'} />` — server prop avoids the Next 15 `useSearchParams` Suspense bailout.
- `app/page.tsx` (rewritten, server): landing, zero client JS beyond Next runtime — **MapLibre chunk must not appear in `/` first-load JS** (check build route table).
- `app/layout.tsx`: title "NSW Place Analyser", sharpened description.
- Rejected: route groups (indirection for two pages), landing-as-overlay (recruiters pay the map bundle before reading a word). Old deep links to `/` landing on the story is desired — one click to the app.

## 2. Landing sections + copy (iterate via screenshots; dark theme, globals.css vars, 1-col under 720px)

1. **Hero** — H1 "Ask anything about any block of land in NSW." Sub: "Click a parcel or type an address. An AI agent pulls live NSW government data — zoning, hazards, land value, schools, development potential — and explains it on the map. Nothing stored." CTAs: primary **"Watch the 30-second demo" → /app?demo=1**; secondary "Open the analyser" → /app.
2. **Three cards** — Ask in plain English (one agent, eleven live government tools) · Live data, nothing stored (cites NSW Spatial, ePlanning, Valuer General, DA tracking; fetched per question) · See it on the map (layers draw as you ask; map ops deterministic, zero AI tokens).
3. **How it's built** (recruiter payoff, keep high) — `public/architecture.svg` + "Next.js 15 on Cloud Run · Gemini 2.5 Flash on Vertex AI (native function calling, parallel tools) · MapLibre GL · read-through demo caches · no API keys in the browser." Link to repo/README.
4. **Honesty block** — not legal/valuation advice; VG land values ≠ market prices; DA coverage varies by council; NSW only.
5. **Footer** — cadastre CC-BY attribution + author link.

## 3. Auto-demo

- **Shared resolution path**: extract SearchBar `pick()` logic (components/SearchBar.tsx:45-71) into `lib/resolveAddress.ts` → `resolveAddress(query) → { parcel: ParcelRef, geo: FeatureCollection }` (search → first match → detail → NSW bounds check → parcel fetch). SearchBar and demo both use it. `DEMO_ADDRESS = '26 Calvert Avenue Killara NSW'`; move `ANALYSE_PROMPT` from Chat.tsx to `lib/prompts.ts` (one prompt, one cache-shaped behaviour).
- **Orchestration in AppShell**: state machine `idle → searching → selecting → analysing → done | error`. Entry: `?demo=1` (run-once `useRef` guard, then `router.replace('/app')` so refresh doesn't re-bill Gemini) or "Show me" button in Chat empty state. Steps: `resolveAddress(DEMO_ADDRESS)` → existing `onSelectParcel` (map flies, overlays eager-load from cache) → ~1s beat → `autoPrompt` prop into Chat + `onAutoPromptDone(ok)` callback (Chat `useEffect` feeds existing `send()`). Suppress `offerAnalysis` popover during the run.
- **Narration banner** above chat: (1) "Demo — searching '26 Calvert Ave, Killara'…" (2) "Lot found. Highlighting it and pulling zoning, bushfire, flood and boundaries — direct government calls, zero AI tokens." (3) "Asking the Gemini agent for the full report — the only AI call in this demo…" (4) "That's the product. Click any parcel or search your own address. **Replay** · **What is this?**" (opens drawer). Dismissible.
- **Failure handling**: 15s timeout per step → banner: "The live services didn't answer — this demo runs against real NSW endpoints. **Try again** · **Explore on your own**" (clears demo state; app usable). Analyse failure via `onAutoPromptDone(false)` (Chat renders its own error bubble; banner offers Retry).
- **Back-to-start**: fixed "← About" link top-left of map on `/app` → `/`.

## 4. Info drawer

- Trigger: "?" in the **Chat header** (stable position). Slides over chat column; Esc/backdrop/× closes. `components/InfoDrawer.tsx`, presentational, `{ open, onClose, onAsk(q) }` — `onAsk` reuses the demo's `autoPrompt` channel and closes drawer.
- Content: What this is (2 sentences) → Use it in 3 moves → Six clickable sample questions (zoning, land value + sales, catchments, DAs, bushfire/flood, potential) → Where answers come from (linked sources, "fetched live, nothing stored") → Honest limits (same four as landing) → built-by + repo link.
- No auto-open — demo + empty state carry onboarding.

## 5. Chat empty state + suggestions

- Sub-line: "Live NSW planning, hazard, value and school data — in plain English."
- Empty state: primary **"▶ Show me (30-sec demo)"**, then context-aware suggestions: no parcel → address-carrying questions; parcel selected → contextual breadth (worth/sales, catchments, DAs, build potential). Kills the dead-end of offering "Is this parcel bushfire prone?" with nothing selected.

## 6. Doc sync

- `PRODUCT-V2.md` workstream 1 reframed: comprehension-first onboarding shipped; Tailwind/shadcn demoted to later polish. Workstream 2 untouched. Regenerate `study-docs/PRODUCT-V2.docx` locally (gitignored, don't commit).
- README: "First visit" paragraph (`/` vs `/app`, the demo).

## 7. Verification (in order)

1. New vitest guards (node env, no jsdom): (a) `normaliseQuery(DEMO_ADDRESS)` key present in `data/addressr-cache.json`; (b) detail pid key present; (c) `resolveAddress` sequencing with mocked fetch incl. NSW-bounds rejection. Cache misses become test failures.
2. `npm test` all green.
3. `npm run build` clean; `/` first-load JS excludes MapLibre chunk.
4. Headed screenshots: landing 1440×900 + 390×844; `/app` default; `/app?demo=1` mid-narration and final report card; drawer open + sample-question click; "← About" round trip.
5. Failure drill: demo with `/api/chat` forced to fail → banner error + Retry, app still usable.
6. 30-second story check: cold visitor on `/` → full report card in ≤2 clicks.
7. Commit locally on feature branch; **no redeploy without approval**.
