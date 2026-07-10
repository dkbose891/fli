# Research: FDE-Level Learning Plan (built on fli)

**Premise:** fli is not just a portfolio piece — it's the curriculum. Every layer of it maps to something a Google Cloud GenAI Forward Deployed Engineer is expected to know. This doc is the map: what to review in the current build (Part 1A), what to learn next in cloud AI engineering (1B), what the FDE role actually demands (1C, research-verified), how the *product's conversation* should evolve and what each evolution teaches (Part 2), and how to learn all of it with AI as a tutor instead of a crutch (Part 3).

---

## Part 1A — The architecture you already run (review before learning anything new)

You deployed this. Now be able to whiteboard it and defend every choice — that's the FDE bar. Layer by layer, with the doc to study and the depth needed:

| Layer | In fli | Study | Depth |
|---|---|---|---|
| **Frontend framework** | Next.js 15 App Router, React 19, `output:'standalone'` | Next.js docs: App Router, Route Handlers, `next build` standalone | Explain server vs client components, why API routes need `runtime='nodejs'` |
| **Map rendering** | MapLibre GL via react-map-gl; GeoJSON sources/layers; flyTo | MapLibre docs: sources, layers, expressions | Read enough to add a layer type without copying ours |
| **Geospatial data** | ArcGIS REST `query`/`identify`, Esri JSON → GeoJSON (`@terraformer/arcgis`), WGS84 vs Web Mercator, point-intersect vs envelope | ArcGIS REST API reference (query-feature-service-layer); GeoJSON spec (RFC 7946) | Deep — this is your differentiating domain skill |
| **The agent** | `lib/agent.ts`: tool declarations, dispatch, multi-step loop, parallel calls, context injection | Gemini function-calling docs; your own code (annotate it) | Total — you wrote it; be able to rewrite it |
| **LLM SDK** | `@google/genai` in Vertex mode, ADC auth | SDK README + Vertex quickstart | Know both auth modes (API key vs Vertex/ADC) and why we chose ADC |
| **Resilience patterns** | timeout+retry (`lib/arcgis.ts`), hedged fallback (SIX mirror in `cadastre.ts`), read-through caches (`nswcache.ts`, `addressr.ts`) | Google SRE book ch. on handling overload; "hedged requests" (Dean & Barroso, *The Tail at Scale*) | Explain WHY hedging beats serial fallback — interview gold |
| **Container** | Multi-stage Dockerfile, standalone output, PORT=8080 | Docker multi-stage docs; Next standalone deploy guide | Trace what's in the final image and why data/*.json ships |
| **Cloud Run** | source deploy, revisions, traffic, `--allow-unauthenticated`, env vars, `--update-secrets` | Cloud Run docs: how it works (request-based autoscaling, concurrency, cold starts, CPU throttling) | Deep — this is THE Google serverless runtime; know scaling knobs and pricing model |
| **Identity & auth** | ADC locally, service-account identity on Cloud Run, zero key files | Google Cloud auth docs: ADC resolution order; IAM roles vs members | Deep — auth is the first thing broken at every customer site |
| **Secrets** | Secret Manager + `--update-secrets` injection | Secret Manager docs: versions, accessor role, audit logs | Explain why this beats env vars and where rotation fits |
| **Build/deploy** | Cloud Build via `gcloud run deploy --source` | Cloud Build docs (what buildpacks vs Dockerfile source deploys do) | Know what actually happened when you ran that command |
| **Testing** | vitest, mocking at the module boundary, fixture-cached API shapes | Your `tests/` directory | Be able to defend "mock at the source boundary, never mid-stack" |

**Exercise that proves review is done:** draw the full request path for "Analyse this parcel" — browser → Cloud Run → agent loop → 12 parallel upstream calls → caches → Gemini → report card — from memory, with failure modes at each hop. An FDE draws this on a customer's whiteboard weekly.

---

## Part 1B — AI engineering on Google Cloud (the next ring outward)

Ordered path; each item names the doc and the fli-shaped exercise that cements it.

1. **Vertex AI platform map** — https://cloud.google.com/vertex-ai/docs — models & Model Garden, quotas, regional availability (you already hit this: flash-lite missing in australia-southeast1), pricing. *Exercise:* price out fli at 1k analyses/day.
2. **Gemini function calling, properly** — https://ai.google.dev/gemini-api/docs/function-calling — modes (AUTO/ANY/NONE), parallel + compositional calling, schema design. *Exercise:* force-mode the analyse flow so tool selection is deterministic (workflow, not agent — cheaper and more reliable).
3. **Context caching + long context** — https://cloud.google.com/vertex-ai/generative-ai/docs/context-cache/context-cache-overview — *Exercise:* cache the system prompt + tool schemas; measure token savings.
4. **Grounding with Google Search** — https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/ground-with-google-search — *Exercise:* replace the Wikipedia tool, compare answer quality with citations.
5. **Embeddings + Vector Search** — https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings — *Exercise:* embed suburb profiles, answer "suburbs like Killara but cheaper".
6. **RAG Engine** — https://cloud.google.com/vertex-ai/generative-ai/docs/rag-engine/rag-overview — *Exercise:* ingest the Ku-ring-gai LEP/DCP PDFs; make "can I build a duplex here?" document-grounded.
7. **ADK + Agent Engine** — https://google.github.io/adk-docs/ + https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/overview — the managed path for when agents get complex (this is your stated trajectory). See `tutorial-ai-workflows.md` for the full framework study plan — do that guide's Week 2 here.
8. **Evaluation** — Vertex gen-AI eval service https://cloud.google.com/vertex-ai/generative-ai/docs/models/evaluation-overview + promptfoo locally — *Exercise:* 20-question taxonomy (zoning/hazard/value/schools/out-of-scope), score every release. **This is the single most FDE-relevant skill on this list** — customers always ask "how do you know it's right?"
9. **Observability for GenAI** — Cloud Logging/Trace/Monitoring on Cloud Run + token/latency/cost per request — *Exercise:* structured-log every tool call (name, ms, tokens); build one dashboard.
10. **Safety & security** — prompt-injection thinking (your tools take model-generated SQL-ish `where` clauses — trace that path!), Vertex safety filters, Model Armor, DLP for PII. *Exercise:* red-team your own `query_parcel` where-clause tool.
11. **Data platform basics** — BigQuery (load the VG bulk sales file you couldn't query live; now you CAN answer trend questions), Firestore (Part 2's saved properties), Pub/Sub + Cloud Scheduler (alerts).
12. **Credential-shaped proof** — Professional Machine Learning Engineer cert (https://cloud.google.com/learn/certification/machine-learning-engineer) now includes heavy GenAI coverage; Google Cloud Skills Boost GenAI paths (https://www.cloudskillsboost.google/) for guided labs. A cert isn't the goal but it forces coverage of corners you'd skip.

---

## Part 1C — What's expected from a Google Cloud GenAI FDE (verified sources)

*Every link below was fetched and adversarially verified (3-vote) by a deep-research pass — these are real postings/articles saying what's claimed.*

### The primary sources: Google's own FDE job postings (read these first, repeatedly)

- **Forward Deployed Engineer, GenAI, Google Cloud** — https://www.google.com/about/careers/applications/jobs/results/137593729115398854-forward-deployed-engineer-gen-ai-google-cloud
- **Forward Deployed Engineer III, Generative AI** — https://www.google.com/about/careers/applications/jobs/results/127965694384841414-forward-deployed-engineer-iii-generative-ai-google-cloud
- **Forward Deployed Engineer, Generative AI** — https://www.google.com/about/careers/applications/jobs/results/91100648979735238-forward-deployed-engineer-generative-ai-google-cloud

What they literally say (verified quotes):
- The role is an **"embedded builder"** who will *"code, debug, and jointly ship bespoke agentic solutions directly within the customer's environment"* — explicitly contrasted with *"traditional advisory roles"* (solutions architects). Builder, not advisor.
- Minimum bar (FDE III): *"5 years of experience with software development using Python or similar"*, *"architecting AI systems on cloud platforms (e.g., GCP)"*, *"taking production-grade AI-driven solutions from conception to launch for customers"*, *"leading technical discovery sessions"*, and *"building pipelines … using both vector databases and retrieval-augmented generation (RAG)-like architectures"*.
- Preferred: *"multi-agent systems using frameworks (e.g., LangGraph, CrewAI, ADK) and patterns (e.g., ReAct, self-reflection, hierarchical delegation)"* and *"LLM-native metrics (e.g., tokens/sec, cost-per-request) and techniques for optimizing state management and granular tracing"*.
- Day-to-day: shipping *"production-grade agentic workflows (e.g., multi-agent systems, model context protocol (MCP) servers) that drive measurable return on investment"*, coding integrations against customers' live infrastructure, and *"build[ing] high-performance evaluation pipelines and observability frameworks"* for accuracy/safety/latency — plus converting field patterns into product feedback.

**Read that against fli:** the posting's preferred-qualifications list is almost verbatim this repo's v2 roadmap (ReAct/self-reflection/hierarchical delegation, ADK, tokens-per-second and cost-per-request observability, eval harness) plus MCP. Your gap analysis writes itself: you have the agent, the cloud deploy, the domain-data pipelines, and the resilience story; you're missing **multi-agent/ADK experience, an MCP server, RAG + vector search, and the eval/observability pipeline** — which is exactly Parts 1B(5–9) and 2B of this document. Scale of hiring: Google listed **59 FDE roles** across the US, London, Paris, Hong Kong (https://www.channeldive.com/news/google-cloud-forward-deployed-engineering-jobs/820176/) — this is a real go-to-market motion, not a one-off req.

### The role's DNA: Palantir (who coined it)

- **A Day in the Life of a Palantir FDSE** — https://blog.palantir.com/a-day-in-the-life-of-a-palantir-forward-deployed-software-engineer-45ef2de257b1 — the canonical description. Key ideas, verified: FDSEs *"focus on enabling many capabilities for a single customer"* (inverting product engineering's one-capability-for-many); the defining working mode is a *"rapid cycle between creating solutions and seeing them in action … iterating hand-in-hand with a customer"*; and unlike consultants they *"pull most of the pieces together out-of-the-box"* from the platform rather than rebuilding per client. Substitute "Vertex/ADK" for "Foundry" and this is the Google job.
- **Palantir FDSE posting** — https://jobs.lever.co/palantir/dab396d4-2f14-4796-aac0-0d82883dccf0 — Palantir positions FDSE as the blueprint other FDE programs derive from: small autonomous teams owning architecture, large-scale data wrangling with AI, custom applications, and stakeholder engagement from engineers to executives.

### The AI-era version: OpenAI

- **The OpenAI Deployment Company** — https://openai.com/business/the-openai-deployment-company/ — OpenAI built a whole FDE unit; its framing is the clearest statement of why the role exists in AI: bespoke systems inside real enterprise environments, where *security models, permissions, governance, compliance and legacy infrastructure are core constraints, not edge cases*; high ambiguity; ship value early, iterate to scale.
- **OpenAI FDE posting** — https://openai.com/careers/forward-deployed-engineer-(fde)-sf-san-francisco/ — the hiring bar rhymes with Google's: 5+ years incl. customer-facing work, production full-stack coding (Python/JS), hands-on LLM systems. Sharpest line for interview prep: success is measured by **"production adoption, measurable workflow impact, and eval-driven feedback"** — not demos, not sales. Note also: heavy travel/embedding expectations are normal for the role family.

### How to use these

1. Diff yourself against the Google minimum + preferred lists quarterly; let the gaps drive which Part 1B/2B item you do next.
2. Rehearse the Palantir loop — build → deploy → observe *with the user in the room* — every time you demo fli to anyone.
3. Steal OpenAI's success metric as your project's north star: would a real buyer *adopt* this, and can you *prove* impact with evals? Those two questions are the interview.

---

## Part 2 — The product as a conversation (and what each step teaches an FDE)

### 2A. Where the conversation is today, honestly

One shape: *select a thing → interrogate the thing*. Single-turn Q&A with one piece of state (`selectedParcel`). The analyse card is a great party trick, but a real buyer's session is a **journey**, not a query. What's missing, as conversation structures:

1. **Discovery turns** — "where are the nearby schools?", "what's around here?" The data tools exist (POI, catchments); the conversation doesn't lead the user to them. Needs: suggested follow-up chips generated from what was just answered ("Want the catchment boundaries on the map?"), and map annotations as conversational output (pins the agent placed, not just polygons).
2. **Anaphora across entities** — "and what about the one next door?" Today `this/here` = one parcel. Needs a conversation state that holds *multiple* referents ("the first one", "the cheaper one").
3. **Comparison** — "compare this with 31 Calvert Ave" (a real sale from our own data!). Needs: two-parcel state + a comparison report card. Highest-value cheap win in this whole section.
4. **Constraint search (inverted queries)** — today: place → facts. A buyer's real question: facts → places. "Find R2 blocks over 900 m² near Killara High's catchment with land value under $3M." This is multi-step agent orchestration (query fan-out, filtering, ranking) — exactly the "complex agent" future you predicted, and the reason ADK/LangGraph exist.
5. **Saved properties & research memory** — "save this one", "what did I look at last week?", "add a note: too close to the highway". Needs: identity (Identity Platform / Firebase Auth), persistence (Firestore: users → saved_parcels → notes/snapshots), and a UI shelf. This breaks the "no storage" principle *deliberately* — user data ≠ source data; the honesty principle survives.
6. **Journeys / stateful research** — a shortlist that accumulates, a "compare my top 3", an exportable research report. Conversation becomes a project the user returns to.
7. **Proactive turns** — "a DA was just lodged 200 m from your saved property." Agent speaks first: Cloud Scheduler → re-query → diff → notify. This is where "app" becomes "agent" in the real sense.
8. **Education turns** — "what does R2 actually mean for me?" → RAG over LEP/DCP documents, answers grounded in the actual instrument, cited. Converts jargon-dumping into advice-shaped answers (with the legal caveats we already print).

### 2B. Feature → GCP service → FDE skill (the learning map)

| Conversation feature | Build on | FDE skill it teaches | Docs |
|---|---|---|---|
| Comparison + multi-referent state | typed conversation state, no new infra | context engineering, state design | Anthropic "effective agents"; your own agent.ts |
| Suggested follow-ups | one extra cheap Gemini call or heuristics | UX of agents, cost discipline | Gemini docs (structured output) |
| Saved properties + notes | **Firestore** + **Identity Platform** | data modelling, authn/authz, multi-tenancy | firebase.google.com/docs/firestore, /auth |
| Research journeys / sessions | Firestore + (later) Agent Engine **sessions & memory bank** | session/memory architecture | Agent Engine memory docs |
| Constraint search | ADK workflow agents (fan-out/filter/rank) | agent orchestration — the "complex agent" leap | ADK workflow-agents docs |
| Proactive DA alerts | **Cloud Scheduler + Pub/Sub** + notification channel | event-driven cloud architecture | cloud.google.com/scheduler, /pubsub |
| Education turns (LEP RAG) | **RAG Engine** + eval harness | RAG design + the "is it right?" answer | RAG Engine docs + eval service |
| Sales trends ("is Killara heating up?") | **BigQuery** + VG bulk sales load | data engineering, SQL at scale | BigQuery docs |
| All of the above in front of a customer | demo script + observability dashboard | the actual FDE job | — |

**Sequencing recommendation:** comparison (days) → saved properties + auth (first real full-stack GCP build) → constraint search on ADK (the "complex agent" milestone) → alerts → RAG. Each is demo-able alone; each extends the FDE story.

### 2C. FDE expectations applied to Part 2

The pattern across FDE writing (full sources in 1C): the role = **engineer who ships production-grade proof inside a customer's messy reality, fast**. Part 2 is designed as rehearsal for exactly that:

- Every feature lands against *real, flaky, undocumented* government APIs — the same energy as customer data sources (you've already lived this: SYM_CODE, string dates, null areas, Telstra outages).
- Every feature must be demo-able in one sitting — FDE work is judged in demos.
- Every feature needs the "how do you know it's right / safe / affordable" answer ready — evals, observability, cost per request.
- Skills/docs to prioritise from the FDE lens: Cloud Run + IAM (fluency), ADK/Agent Engine (Google's strategic agent stack), Vertex eval + grounding (trust questions), BigQuery (every enterprise asks), Firestore/Identity (user-facing state), and the soft skill of narrating an architecture live.

---

## Part 3 — Learning WITH AI (stop prompting, start training)

The failure mode you named — "prompting the fuck out of it all the time" — is outsourcing the thinking. The fix is a protocol, not willpower: use AI in *tutor roles* where the model asks and checks, and reserve *doer roles* for things you've already learned once.

**Techniques and tools:**
- **NotebookLM** (https://notebooklm.google.com) — load a doc set (Cloud Run docs, ADK docs, this repo's md files) and study *against sources*: grounded answers, audio overviews for commutes, auto-generated quizzes. Very on-brand to know deeply for a Google role.
- **Socratic/learning modes** — Claude's learning style or an explicit prompt: *"Act as a tutor. Never give the answer first. Ask me to predict, then correct me."* Use it on every doc in Part 1B.
- **Explain-back protocol (Feynman with teeth)** — after studying X, explain it to the AI *from memory* and have it grade the explanation and probe the gaps: "Here's my understanding of Cloud Run cold starts… attack it."
- **Prediction-first code reading** — before asking AI what code does, write your prediction, then ask it to diff your prediction against reality. Works brilliantly on `lib/agent.ts` and every framework quickstart.
- **Spaced repetition, AI-generated** — after each study session, have the model emit 5–10 Anki-style cards from what YOU got wrong; review weekly. (Anki + an LLM beats either alone.)
- **Build-to-learn** — every Part 1B/2B item ends in a running artefact in fli or a scratch repo. Reading about Firestore ≠ knowing Firestore; the saved-properties feature is the flashcard.
- **AI as adversary** — before "shipping" a study topic, ask the model to interview you as a skeptical Google hiring panel: "Grill me on my agent's failure modes for 10 questions."
- **Karpathy on learning** — his note that learning must feel effortful, and shortcuts ("summarize this for me") produce the *feeling* of knowledge without the substance: https://x.com/karpathy/status/1756380066580455557 — pin it above the desk.

**The weekly loop (repeat until hired):**
1. **Mon–Tue — Read** one Part 1B item, NotebookLM-grounded, tutor-mode questions as you go.
2. **Wed–Thu — Build** its fli exercise. AI in doer-mode is allowed *only* for boilerplate you can already write.
3. **Fri — Explain back** from memory; AI grades and generates cards from the gaps.
4. **Weekend — Demo**: 5-minute recorded walkthrough of the week's build, as if to a customer. Painful, and precisely the FDE muscle.

---

*Companion docs: `tutorial.md` (data/domain resources) · `tutorial-ai-workflows.md` (agent frameworks deep-dive) · `PRODUCT.md` (product roadmap).*
