# Product v2 Plan — short version

**Summary:** two workstreams. (1) Make it look like a product, not a hackathon — move to Tailwind + shadcn/ui and iterate visually with a screenshot-MCP loop. (2) Move the AI from our hand-rolled loop onto the Vertex agent stack (ADK → Agent Engine) in two stages, so today's app keeps working while the "complex agent" future gets real infrastructure. Ship (1) first — it's a week and makes every demo better; (2) is staged so each stage is demo-able.

---

## 1. Design refresh

### Current
- Hand-written `styled-jsx` per component, ad-hoc colours via CSS vars, no design system, no component library. Functional, dated. Chat/search/panels all bespoke.

### Proposed stack
| Piece | Choice | Why |
|---|---|---|
| Styling | **Tailwind CSS v4** | utility CSS, kills the styled-jsx blocks, industry default |
| Components | **shadcn/ui** (Radix-based) | proper buttons/cards/dialogs/command-palette, copy-in code we own, dark-mode native |
| Iteration loop | **Playwright MCP** (or the built-in screenshot driver we already use) | agent changes UI → screenshots it → fixes it — visual iteration without you describing pixels |
| Component discovery | **shadcn MCP server** | lets the agent browse/add registry components directly |
| Map look | swap basemap style `liberty` → a muted dark style + restyled layer colours | the map IS the product; a moody basemap makes overlays pop |

**Concrete first moves:** Tailwind in; rebuild Chat as shadcn `Card` + `ScrollArea` + proper message components with markdown rendering; search becomes a `Command` palette (⌘K); layer panel → toggle group with colour chips; report card → real card sections with icons. ~1 week of iterating with screenshots.

---

## 2. Vertex AI architecture

### Current (v1 — works, deployed)

```
Browser (MapLibre + chat)
   │
Next.js on Cloud Run  ──── /api/layer/* ── deterministic proxies ──► NSW ArcGIS / CARTO / Addressr
   │  /api/chat                                                        (read-through caches)
   └─► lib/agent.ts (hand-rolled loop, 11 tools) ──► Gemini 2.5 Flash on Vertex
```
Strengths: cheap, simple, zero-token map ops, resilient (hedge/retry/cache). Limits: no sessions/memory, no evals, single agent, tools locked inside this app.

### Proposed v2.0 — "same app, Vertex-grade" (weeks, low risk)

```
Browser ── Next.js on Cloud Run (UI + deterministic proxies, unchanged)
              │ /api/chat
              ▼
        MCP server (NSW tools: cadastre, planning, valuation, schools, DAs)   ◄── the 11 tools move here
              ▲
        lib/agent.ts loop (kept) + context caching + structured logging
              ▼
        Gemini on Vertex ── Vertex eval service (20-question golden set, run per release)
                            Cloud Trace/Monitoring (tokens, cost-per-request, tool latency)
```
- **MCP server** is the key move: NSW tools become a reusable product (any agent — Claude, Gemini CLI, ADK — can use them). Also literally named in the Google FDE job posting.
- Evals + tracing answer "how do you know it's right/what does it cost" — the two demo questions that matter.

### Proposed v2.1 — "the complex agent" (target state)

```
Browser ── Next.js on Cloud Run (UI + map proxies + Firestore saved-properties)
              │
              ▼
   Vertex AI Agent Engine (managed runtime, sessions + memory bank)
              │
        ADK supervisor agent
        ├── research agent      ── MCP: NSW tools (from v2.0)
        ├── market agent        ── BigQuery (VG bulk sales loaded) + valuation tools
        ├── planning agent      ── RAG Engine (LEP/DCP documents, grounded citations)
        └── report agent        ── assembles the analyse card / comparisons / shortlists
              │
        Gemini on Vertex + eval pipeline (from v2.0) gating deploys
        Cloud Scheduler + Pub/Sub ── proactive DA alerts on saved properties
```
- ADK gives supervisor/worker orchestration (constraint search, comparisons, journeys); Agent Engine gives sessions/memory without us building persistence for conversation state.
- Firestore + Identity Platform carry user-owned state (saved properties, notes) — the deliberate exception to "no storage".
- Next.js stays: frontend + zero-token map path don't change at all.

### Sequencing
1. **Design refresh** (workstream 1) — do first, one week.
2. **v2.0**: MCP server + evals + tracing + context caching — no user-visible risk, big credibility.
3. **v2.1**: ADK supervisor on Agent Engine, one worker at a time (research agent first), then Firestore/saved properties, then alerts.

Costs stay demo-scale throughout: Flash pricing, Agent Engine bills per vCPU-hour used, everything else is free tier at this traffic.
