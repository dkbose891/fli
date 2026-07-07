# Study Guide — Making the NSW Place Analyser Smarter

The agent today is a single Gemini function-calling loop over live NSW spatial services. It answers "what is at this point" questions well, but it knows nothing about the *market* (prices, trends, demographics) and has no memory, planning, or evaluation. This guide lists what to study to close those gaps, grouped by theme, each with why it matters for this app.

## 1. Agent engineering (make the loop smarter)

- **Google Agent Development Kit (ADK)** — https://google.github.io/adk-docs/
  The v2 roadmap item. Supervisor/worker hierarchies, workflow agents, sessions and memory. Study the multi-agent patterns page first — it maps directly onto "draft a pitch / build a shortlist / deep-research a suburb" workflow agents.
- **Gemini function calling guide** — https://ai.google.dev/gemini-api/docs/function-calling
  Parallel calls, forced tool use (`tool_config` modes), compositional calling. The app already fans out parallel calls; forced-mode and `ANY` mode help make tool selection more reliable.
- **ReAct: Synergizing Reasoning and Acting in Language Models** — https://arxiv.org/abs/2210.03629
  The pattern behind the agent loop. Understanding it helps you decide when to add explicit reasoning steps vs more tools.
- **Reflexion (self-reflection for agents)** — https://arxiv.org/abs/2303.11366
  How agents critique their own tool results and retry — useful for handling flaky/empty ArcGIS responses instead of giving up.
- **Anthropic: Building effective agents** — https://www.anthropic.com/research/building-effective-agents
  Vendor-neutral patterns (routing, orchestrator-workers, evaluator-optimizer). The best short read on when NOT to add a multi-agent system.
- **Vertex AI Gen AI evaluation service** — https://cloud.google.com/vertex-ai/generative-ai/docs/models/evaluation-overview
  For the roadmap's eval harness: build a question taxonomy (zoning / hazard / size / out-of-scope) and score tool-choice + groundedness per release.
- **promptfoo** — https://promptfoo.dev/docs/intro
  Lightweight local eval runner — quicker to wire into `npm test` than the Vertex service; good first step.

## 2. Property-market data & domain knowledge (make it smart about the market)

- **NSW Valuer General land values** — https://www.valuergeneral.nsw.gov.au/land_values
  Free bulk land value data (unimproved values per property). The single highest-value dataset to add: turns "what is this parcel" into "what is it worth (unimproved)".
- **NSW bulk property sales information** — https://valuation.property.nsw.gov.au/embed/propertySalesInformation
  Weekly/annual sales dumps (price, date, address). Basis for "what did nearby properties sell for" — the most-asked market question.
- **ABS Census QuickStats & SEIFA** — https://www.abs.gov.au/census/find-census-data/quickstats
  Suburb-level demographics and socio-economic indexes. Feed as a suburb-profile tool so the agent can answer "what kind of area is this".
- **NSW school catchment finder data** — https://education.nsw.gov.au/schooling/school-finder (dataset: https://data.cese.nsw.gov.au/)
  School catchments move property decisions; it's an ArcGIS-style layer like the ones already wired in.
- **Transport for NSW Open Data** — https://opendata.transport.nsw.gov.au/
  Stops, stations, travel times — "how far to the station" tools.
- **NSW Planning Portal / ePlanning APIs** — https://www.planningportal.nsw.gov.au/opendata
  The official catalogue of the services this app already scrapes — find DA (development application) feeds here to answer "what's being built nearby".
- **Understanding LEP / DCP planning instruments** — https://www.planning.nsw.gov.au/plans-for-your-area
  Domain knowledge, not an API: what zoning codes (R2, B4…), FSR, and height controls actually permit. Needed to make the agent's zoning answers *interpretive*, not just descriptive.
- **Commercial API landscape (CoreLogic, Domain, PriceFinder)** — https://developer.corelogic.asia/ · https://developer.domain.com.au/
  Where valuations/listings actually live. All paid; Domain has a free tier worth prototyping "current listings nearby" against.

## 3. Retrieval & grounding (answer broader questions honestly)

- **Vertex AI grounding with Google Search** — https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/ground-with-google-search
  One-flag replacement/upgrade for the Wikipedia tool: grounded general-knowledge answers with citations.
- **RAG fundamentals** — https://cloud.google.com/vertex-ai/generative-ai/docs/rag-engine/rag-overview
  For ingesting LEP/DCP PDFs and council policies so "can I build a duplex here" gets a document-grounded answer.
- **Vertex AI embeddings + vector search** — https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings
  Build suburb profiles once (census + sales + POI), embed them, retrieve by similarity — "find me suburbs like Killara but cheaper".

## 4. Geospatial engineering (deeper spatial answers)

- **ArcGIS REST API query reference** — https://developers.arcgis.com/rest/services-reference/enterprise/query-feature-service-layer/
  The query language behind every data tool in `lib/sources/`. Learn `spatialRel` options, buffers, and pagination to unlock "what's within 500m" questions.
- **Turf.js** — https://turfjs.org/
  Client/server-side geometry: buffers, area, distance, point-in-polygon. Enables derived answers (block frontage, distance to flood extent) without new API calls.
- **G-NAF (Geoscape address data)** — https://geoscape.com.au/data/g-naf/
  The national address dataset behind Addressr. Understanding PIDs and geocode reliability codes explains what the search results actually mean (see `reliability` in `data/addressr-cache.json`).
- **Addressr internals** — https://github.com/mountain-pass/addressr
  The service powering the search bar. Read the self-hosting docs before ever moving off RapidAPI (needs OpenSearch + a G-NAF load; only worth it on an always-on VM).

## Suggested order

1. Anthropic "building effective agents" + ReAct (an afternoon) — sharpens judgement before you build.
2. Valuer General land values + bulk sales (weekend project) — one new tool each, immediate "market smarts".
3. promptfoo eval over a 20-question taxonomy — so every later change is measurable.
4. ADK multi-agent patterns — only after evals exist, per the v2 roadmap.
