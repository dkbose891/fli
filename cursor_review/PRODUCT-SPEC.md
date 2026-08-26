# FLI Product Specification

**Product:** FLI (formerly NSW Place Analyser)  
**Version:** 1.0 — MVP scope  
**Last updated:** 2026-08-26  
**Status:** Draft for review  
**Research basis:** [homesnoop-fli-coverage.md](./homesnoop-fli-coverage.md), [homesnoop-fli-dataset-sourcing.md](./homesnoop-fli-dataset-sourcing.md), [nationwide-vic-qld-nsw-expansion.md](./nationwide-vic-qld-nsw-expansion.md), [PRODUCT.md](../PRODUCT.md), [PRODUCT-V2.md](../PRODUCT-V2.md)

---

## Executive summary

FLI is evolving from a NSW-only map-and-chat planning tool into a **national buyer property intelligence platform**: a deterministic, government-grounded property report rendered side-by-side with an interactive map and conversational agent.

The product answers one question: *"Should I buy, develop, or walk away from this property — and what does the data actually say?"*

Today FLI covers **13 of 47 Homesnoop report fields** for NSW, with a researched path to **~64% full parity without paid data** and **~98% coverage with honest partials** once Tier 1–2 NSW sources are wired. The strategic bet is to ship a **Homesnoop-class report shell** on top of existing deterministic data tools, differentiate on **planning depth and data honesty** (not fabricated AVMs), and expand **NSW → VIC → QLD** before other states.

FLI is not trying to replace CoreLogic or Domain at launch. It is the **fast, honest, map-native due-diligence layer** that sits between free council PDFs and $50+ per-report competitors — optimized for people who research properties repeatedly and need cited facts, not marketing copy.

---

## Target market

### Primary ICP: Active property investors (NSW-first, expanding to VIC/QLD)

**Profile**
- Age 30–55; 1–5+ investment properties or actively acquiring
- Researches 5–20 properties per acquisition cycle across suburbs
- Comfortable with spreadsheets, yield math, and planning jargon
- Already uses Domain/REA for listings but distrusts single-source valuations

**Geography**
- Phase 1: Greater Sydney + regional NSW
- Phase 2: Melbourne metro + Mornington Peninsula (Homesnoop demo parity)
- Phase 3: SEQ (Brisbane, Gold Coast, Sunshine Coast)

**Use case**
- Screen deals: land value trend, nearby sales, zoning, overlays, development potential
- Compare suburbs: crime, demographics, rent bands, DA activity
- Pre-offer due diligence in hours, not days of council portal digging

**Willingness to pay signals**
- Already pays for property data subscriptions ($30–150/mo: InvestorKit, PriceFinder trials, buyer's agent consults)
- Homesnoop charges ~$50/report; investors run multiple reports per deal
- Values **recurring access** over one-off PDFs — subscription LTV > per-report for this cohort
- FLI's VG 5-year history, FSR/height, and development-potential calculator are investor-native features Homesnoop underweights

**Why primary (not first-home buyers)**
- **Frequency:** investors research continuously; FHBs buy once every 5–10 years
- **WTP:** investors expense research tools; FHBs are price-sensitive and default to free Domain profiles
- **Differentiation:** FLI's honest derived bands and planning depth matter more to deal screening than lifestyle copy
- **Retention:** subscription model requires repeat usage; investors provide it

### Secondary ICP: Independent buyer's agents and mortgage brokers (B2B)

**Profile**
- 5–30 active clients; prepares pre-purchase briefs for buyers
- Needs client-shareable, credible reports without manual council research
- 1–3 seats per practice; may white-label or co-brand

**Use case**
- Generate a property brief before client meetings
- Answer client questions live with map + chat during inspections
- Differentiate service vs agents who only forward Domain links

**Willingness to pay signals**
- Buyer's agents charge $5k–15k+ per engagement; $99–199/mo for unlimited client reports is trivial COGS
- Brokers need property context for loan scenarios (land value, flood/bushfire risk flags)
- B2B = distribution: each agent touches 10–50 buyers/year (FHB funnel without FHB WTP problem)

**Why secondary (not primary at launch)**
- Smaller addressable market; longer sales cycle and support expectations
- Requires PDF export, branding, and multi-seat — post-MVP features
- Validates monetization ceiling once consumer investor PMF is proven

### Explicitly not primary

| Segment | Rationale |
|---|---|
| First-home buyers | Large but one-time, price-sensitive, satisfied by free listing sites for basic needs |
| Councils / planners | Have internal GIS; procurement cycles are slow; not report-buyers |
| Developers (large) | Need consultant-grade feasibility; FLI is pre-consultant screening — tertiary persona |

---

## Problem statement

### What buyers face today

| Alternative | Pain point | FLI opportunity |
|---|---|---|
| **Homesnoop** ($50/report) | National PDF reports but opaque sourcing; no live map; no follow-up chat; stale at next open home | Same report depth + interactive map + conversational drill-down |
| **Domain / REA** | Listing-centric; AVM is marketing; planning overlays shallow; no development potential | Planning-first, government-grounded, honest about gaps |
| **Council PDFs / planning portals** | Fragmented per council; no single address view; jargon-heavy; hours per property | One address → unified report in <60 seconds |
| **Buyer's agents** | Expensive; variable quality; not self-serve at 11pm on a Saturday | Self-serve due diligence at 10% the cost |
| **CoreLogic / Cotality** | Enterprise pricing; not consumer-accessible | Open-data-first with optional Domain upgrade path |

### Core pains FLI solves

1. **Time:** Due diligence scattered across 6+ government portals takes 2–4 hours per property
2. **Trust:** Listing sites inflate AVMs; buyers can't tell what's verified vs inferred
3. **Planning blind spots:** Flood, bushfire, heritage, and overlay impacts are buried in PDF schedules
4. **No iteration:** Static PDFs don't answer "what if I subdivide?" or "show me DAs within 500m"
5. **Investor math gap:** Yield, land-value trend, and comparable sales require manual assembly

---

## Product vision

### The experience

```
┌─────────────────────────────────────────────────────────────┐
│  [Address search]                    NSW · VIC · QLD badge  │
├──────────────────────┬──────────────────────────────────────┤
│                      │  PROPERTY REPORT (deterministic)     │
│   INTERACTIVE MAP    │  ┌─ Property ─────────────────────┐  │
│   · parcel highlight │  │ Lot/plan · area · zoning       │  │
│   · overlay layers   │  ├─ Planning ───────────────────┤  │
│   · click-to-select  │  │ Heritage · flood · bushfire    │  │
│                      │  ├─ Market ──────────────────────┤  │
│                      │  │ VG land value · nearby sales   │  │
│                      │  ├─ Development ─────────────────┤  │
│                      │  │ FSR · height · subdivision    │  │
│                      │  └────────────────────────────────┘  │
│                      │  CHAT (grounded agent)               │
│                      │  "What's the development potential?" │
└──────────────────────┴──────────────────────────────────────┘
```

**Three pillars:**
1. **Deterministic report** — every field traced to a `lib/sources/*` call; no LLM hallucination in the report body
2. **Interactive map** — zero-token layer toggles; click parcel → context for chat
3. **Grounded chat** — agent reasons over tool results; cites sources; never receives raw geometry

### Data honesty boundaries

FLI will **never fabricate** data. Known hard limits (national):

| Field | FLI stance |
|---|---|
| BAL / AS3959 level | Link to state RFS/CFA tools; flag BFPL only |
| Sewer / water on lot | No statewide layer; route to utility Tap-in / paid diagram |
| Bank-grade AVM | Derive VG + nearby-sales band with "not a valuation" label, or Domain paid |
| Address-level rental history | Postcode bond IQR band only; label clearly |
| Title / covenants / mortgages | Cadastre easements (digitised only); LRS title = broker handoff |
| Flight paths (flights/day) | ANEF contour where available; not Airservices N70 frequency |

**Principle:** A visible gap with an honest explanation beats a confident lie.

---

## MVP scope

### In v1 (NSW Tier 1 + report shell)

**Report UI**
- Homesnoop-style sectioned report card (Property · Market · Planning · Environment · Utilities · Transport · Lifestyle)
- Address search → report renders in <60s for NSW addresses
- Map sync: section highlights relevant overlay on map click
- Source attribution footer per section

**Data — Tier 1 ArcGIS (wire next, ~2 weeks)**
- Easements, built character, special character, significant native vegetation
- Landslide risk, historic bushfire footprints
- Road hierarchy, electricity infrastructure (DNSP routing)
- Parks / POI, airport noise (ANEF)
- Frontage (derived from cadastre)

**Data — already live (13 fields)**
- Address, lot/plan, lot area, zoning, school catchments, heritage, flood, bushfire (BFPL)
- Nearby sales, DAs (subject + nearby), VG land value (5yr), development potential

**Data — Tier 2 download/cache (~1 week)**
- BOCSAR crime score, bond postcode rent band, ACARA non-gov schools
- TfNSW cycleways, ABS Census/SEIFA demographics

**Chat**
- Existing agent loop; report sections become tool-call context
- "Explain this section" and "what's missing?" flows

**National foundation (Phase 0, parallel)**
- State boundary detection; Addressr unfiltered for VIC/QLD geocode
- Microsoft roof footprint cache (national)
- Unsupported-state message: "NSW supported; VIC/QLD coming soon"

### Deferred (post-MVP)

| Item | Phase | Rationale |
|---|---|---|
| Domain API integration (listings, suburb stats, AVM) | Tier 3 | Requires commercial negotiation; ship honest partials first |
| VIC adapter (VicPlan + SPEAR) | Phase 2 | After NSW Tier 1–2 complete |
| QLD adapter (QSCF + StatePlanning) | Phase 3 | Third priority |
| PDF export + white-label branding | B2B | Secondary ICP; needs report shell stable |
| User accounts / saved properties (Firestore) | v2.1 | Per PRODUCT-V2.md Agent Engine path |
| Multi-property comparison | P2 | Investor feature; not launch blocker |
| BAL computation engine | Never (link-out only) | No gov API; legal risk |
| Paid title / sewer diagrams | Partner handoff | Per-transaction revenue, not MVP |

### MVP success definition

> A NSW investor can enter an address, receive a 40+ field report grounded in live government data, ask follow-up questions in chat, and see overlays on the map — with every gap explicitly labelled — in under 60 seconds.

---

## Competitive positioning

| Dimension | Homesnoop | Domain / REA | CoreLogic | Council portals | **FLI** |
|---|---|---|---|---|---|
| **Price** | ~$50/report | Free (listing) | Enterprise | Free | Freemium → $29–49/mo |
| **Coverage** | National | Listing states | National | Single council | NSW → VIC → QLD |
| **Planning depth** | Good overlays | Shallow | Moderate | Authoritative but fragmented | Deep (EPI + derive) |
| **Live map** | Static PDF map | Listing map | No | GIS viewer | Interactive MapLibre |
| **Chat / Q&A** | None | None | None | None | Grounded Gemini agent |
| **Development potential** | Not computed | No | No | Manual | **Unique: FSR × area, storeys** |
| **VG land value history** | Not in report | No | Paid | No | **5-year free** |
| **Data honesty** | Opaque | Marketing AVM | N/A | Authoritative | **Cited, gap-labelled** |
| **AVM** | CoreLogic-grade | Domain AVM | CoreLogic | N/A | Derive band or Domain paid |

**Positioning statement:** *FLI is the honest, map-native due-diligence copilot for property investors — government data first, chat when you need to dig deeper.*

---

## User journeys

### Journey 1: Investor researching a property (primary)

**Actor:** Sarah, 38, owns 2 IPs in Western Sydney, scouting a third in Newcastle.

1. Opens FLI Saturday morning; searches "42 Ocean Street, Newcastle NSW 2300"
2. Report loads in 45s: lot 450m², R2 zoning, no flood, BFPL Category 2, VG land value $680k (↑12% over 5yr)
3. Clicks **Market** → sees 4 nearby sales ($1.1M–$1.3M); rental band $520–$680/wk (bond postcode, labelled)
4. Clicks **Development** → FSR 0.5:1 → GFA range 225m²; min lot 450m² → no subdivision hint
5. Asks chat: *"Any DAs approved nearby for dual occupancy?"* → agent queries `dasNear`, lists 2 within 1km
6. Toggles bushfire layer on map; sees BFPL boundary 200m east
7. Saves address (post-MVP); compares with second property Sunday

**Outcome:** Go/no-go decision in 30 minutes vs 3 hours on council portals. Subscribes $39/mo.

### Journey 2: Investor comparing suburbs

**Actor:** James, 45, deciding between Penrith vs Liverpool for next purchase.

1. Searches Penrith suburb centroid address; screenshots Lifestyle section (crime 42/100, IRSAD percentile 35)
2. Searches Liverpool equivalent; crime 58/100, IRSAD percentile 28, higher public housing rate
3. Compares VG land value trends, median nearby sales, DA activity density via chat
4. Asks: *"Which suburb has more development applications in the last 12 months?"*
5. Exports comparison notes (manual copy post-MVP; PDF export in B2B phase)

**Outcome:** Data-driven suburb shortlist without paying for two Homesnoop reports.

### Journey 3: Buyer's agent pre-listing brief (secondary)

**Actor:** Lisa, independent buyer's agent, meeting clients Tuesday.

1. Client sends Domain link for "16 Wedgewood Drive, Rosebud VIC 3939" (post-VIC launch)
2. Lisa generates FLI report; reviews planning overlays (SUZ, ESO, BPA)
3. Shares screen during Zoom: map + report + chat
4. Client asks: *"Is there an easement?"* → Lisa queries chat; FLI shows cadastre easement layer result
5. Lisa adds notes; exports PDF with her logo (B2B feature)

**Outcome:** Professional brief in 10 minutes; client perceives higher service value.

---

## Feature matrix

Homesnoop 47 fields mapped to FLI implementation phases. Status as of 2026-08-20 research.

| # | Section | Field | FLI status | Phase | Notes |
|---|---|---|---|---|---|
| 1 | Property | Street address | **Have** | Live | G-NAF / Addressr |
| 2 | Property | Lot / plan | **Have** | Live | NSW cadastre |
| 3 | Property | Lot area | **Have** | Live | planlotarea / geodesic |
| 4 | Property | Frontage | **Planned** | Tier 1 | Derive from cadastre polygon |
| 5 | Property | Zoning | **Have** | Live | ePlanning EPI |
| 6 | Property | State school catchments | **Have** | Live | DoE CARTO |
| 7 | Property | Beds / baths / cars | **Partial** | Tier 3 | Domain Listings when listed |
| 8 | Property | Building floor area | **Planned** | Tier 4 | Microsoft roof footprint (proxy) |
| 9 | Property | Property features | **Partial** | Tier 3 | Domain listings `features[]` |
| 10 | Market | Subject sale history | **Partial** | Live + Tier 3 | SIX live; Domain for agency/DOM |
| 11 | Market | Subject rental history | **Partial** | Tier 4 | Bond postcode band only |
| 12 | Market | AVM (low/mid/high) | **Partial** | Tier 4 | VG + sales derive; Domain paid |
| 13 | Market | Growth since last sale | **Partial** | Tier 4 | Blocked on honest price band |
| 14 | Market | Rental estimate + yield | **Partial** | Tier 2 + Tier 4 | Bond IQR + derive yield |
| 15 | Market | VG unimproved land value | **Have** | Live | FLI extra: 5-year history |
| 16 | Market | Suburb days on market | **Partial** | Tier 3 | Domain suburb performance |
| 17 | Market | Suburb median sale | **Partial** | Tier 3 | Domain suburb performance |
| 18 | Market | Suburb median rent | **Partial** | Tier 2 + Tier 3 | Bond XLSX or Domain |
| 19 | Market | Quarterly sale/rent trends | **Partial** | Tier 3 | Domain suburb historical |
| 20 | Market | Nearby for-sale listings | **Partial** | Tier 3 | Domain Listings API |
| 21 | Market | Nearby for-rent listings | **Partial** | Tier 3 | Domain Listings API |
| 22 | Market | Nearby sold comparables | **Have** | Live | SIX `query_recent_sales` |
| 23 | Planning | Development applications (lot) | **Have** | Live | ePlanning DA Tracking |
| 24 | Planning | Nearby DAs | **Have** | Live | `dasNear` 1km default |
| 25 | Planning | Easements | **Planned** | Tier 1 | Cadastre FeatureServer/9 |
| 26 | Planning | Heritage | **Have** | Live | ePlanning heritage layer |
| 27 | Planning | Neighbourhood character overlay | **Planned** | Tier 1 | Local Provisions |
| 28 | Planning | Design control overlays | **Partial** | Live | FSR, height, min lot (not Vic DDO) |
| 29 | Planning | Development potential | **Have** | Live | FLI extra: GFA, storeys, subdivision |
| 30 | Environment | Flood / overland flow | **Have** | Live | Flood Planning Map |
| 31 | Environment | Bushfire prone / overlay | **Have** | Live | BFPL; no BAL number |
| 32 | Environment | Historic bushfire footprints | **Planned** | Tier 1 | NSW Fire History API |
| 33 | Environment | Erosion / landslip overlay | **Planned** | Tier 1 | Hazard layer 232 |
| 34 | Environment | Protected vegetation | **Planned** | Tier 1 | Significant Native Vegetation Map |
| 35 | Environment | BAL / AS3959 level | **Missing** | Never | Link to RFS BFHAT only |
| 36 | Utilities | Electricity infrastructure | **Planned** | Tier 1 | DNSP ArcGIS routing |
| 37 | Utilities | Water / sewer assets | **Missing** | UX only | Sydney Water Tap-in handoff |
| 38 | Transport | Road hierarchy | **Planned** | Tier 1 | Transport Theme/5 |
| 39 | Transport | Flight paths / aircraft noise | **Partial** | Tier 4 | ANEF contour (not flights/day) |
| 40 | Transport | Public transport | **Planned** | Tier 2 | TfNSW GTFS + POI |
| 41 | Transport | Bicycle network | **Planned** | Tier 2 | TfNSW cycleways SHP |
| 42 | Lifestyle | Dwelling density | **Planned** | Tier 2 | ABS Census SA2 |
| 43 | Lifestyle | Public housing rate | **Planned** | Tier 2 | ABS Census tenure SA2 |
| 44 | Lifestyle | IRSAD socio-economic score | **Planned** | Tier 2 | ABS SEIFA 2021 |
| 45 | Lifestyle | Crime score and rates | **Planned** | Tier 2 | BOCSAR XLSX (derived score) |
| 46 | Lifestyle | Independent / Catholic schools | **Planned** | Tier 2 | ACARA Schools List |
| 47 | Lifestyle | Parks / sports / dog parks | **Planned** | Tier 1 | NSW Features of Interest |

**Summary**

| Status | Count | MVP target |
|---|---|---|
| Have | 13 | 13 (maintain) |
| Planned (Tier 1–2) | 17 | Wire all for MVP |
| Partial | 16 | Label honestly; Domain unlocks 11 |
| Missing | 1 | BAL — permanent link-out |
| **Total** | **47** | **30+ at launch (64% full parity)** |

---

## Monetization hypotheses

| Model | Price hypothesis | Target ICP | Validation metric |
|---|---|---|---|
| **Freemium** | 3 free reports/mo; basic sections only | All | Sign-up → report conversion >15% |
| **Pro subscription** | $39/mo unlimited NSW reports + chat | Investors | 30-day retention >40% |
| **Per-report** | $19 single report (no subscription) | One-time users | <20% of revenue (anchor for subscription value) |
| **B2B agent** | $149/mo · 3 seats · PDF export · logo | Buyer's agents | 10 paying practices in 90 days post-launch |
| **Domain data upsell** | +$10/mo for AVM + listings block | Power users | Attach rate >25% of Pro |
| **Referral / affiliate** | Sydney Water diagram, LRS title broker | All | Revenue share TBD |

**Recommended launch pricing:** Freemium gate on Lifestyle + Market partials; Pro unlocks full report + unlimited chat. B2B tier at 90-day mark.

---

## Success metrics

| Metric | Target (90 days post-MVP) | Measurement |
|---|---|---|
| **Field coverage (NSW)** | ≥30/47 full parity (64%) | Automated coverage audit vs Homesnoop matrix |
| **Time-to-report** | p95 <60s NSW address | Server-side timing on report endpoint |
| **Data freshness** | ArcGIS live; caches <30 days old | Cache metadata timestamps |
| **Report → chat engagement** | >50% of reports trigger ≥1 chat message | Analytics event |
| **Free → Pro conversion** | >5% within 14 days | Stripe / billing events |
| **B2B pipeline** | 10 agent trials started | CRM / waitlist |
| **Data honesty score** | 0 fabricated fields in eval set | 20-question golden set (PRODUCT-V2) |
| **Cost per report** | <$0.10 (excl. Domain) | Vertex token + ArcGIS latency tracing |

---

## Risks & mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| **Data gaps (AVM, sewer, BAL)** | Users expect Homesnoop parity | High | Honest labelling; derive bands; utility/title handoffs; never fabricate |
| **Domain ToS / API cost** | Market block locked or expensive | Medium | Ship without Domain; VG + sales + bond as free path; negotiate after PMF |
| **State expansion cost** | VIC/QLD each ~4–6 weeks adapter work | High | National tier first (ABS, Microsoft, ACARA); state adapters reuse `arcgisQuery` pattern |
| **ArcGIS rate limits / outages** | Report failures | Medium | Committed response cache (existing pattern); hedge/retry |
| **Legal: planning advice** | Liability if user relies on report | Medium | "Indicative only" disclaimer; cite source; no BAL/legal opinions |
| **Homesnoop competitive response** | Price cut or free tier | Low | Differentiate on map + chat + dev potential; speed of iteration |
| **Investor market size** | Smaller TAM than FHB | Medium | B2B agents expand reach; suburb comparison drives word-of-mouth |
| **QLD cadastre migration (Apr 2026)** | QSCF breaking changes | Medium | Monitor QLD spatial hub; abstract parcel adapter interface |

---

## Roadmap

Aligned with data tiers from [homesnoop-fli-dataset-sourcing.md](./homesnoop-fli-dataset-sourcing.md) and [nationwide-vic-qld-nsw-expansion.md](./nationwide-vic-qld-nsw-expansion.md).

### Q3 2026 — MVP (NSW complete + report UI)

| Week | Deliverable |
|---|---|
| 1–2 | Report shell UI (shadcn sections); wire Tier 1 ArcGIS (7 sources) |
| 3 | Tier 2 caches (BOCSAR, bond, ABS, ACARA, cycleways) |
| 4 | Tier 4 derive (roof footprint, ANEF, frontage, VG band); eval golden set |
| 5–6 | Freemium gate; Pro subscription; polish + launch |

**Exit criteria:** 30+ fields live; p95 <60s; Rosebud-equivalent NSW property demo-ready.

### Q4 2026 — National foundation + VIC

| Milestone | Deliverable |
|---|---|
| Phase 0 | State detection; national caches; Addressr unfiltered |
| Phase 2 | VicPlan + VicMap + SPEAR adapters |
| B2B beta | PDF export; 10 agent pilot users |

**Exit criteria:** Rosebud VIC report reproducible; positioning rename to "FLI" national.

### Q1 2027 — QLD + Domain

| Milestone | Deliverable |
|---|---|
| Phase 3 | QSCF + StatePlanning + QLD crime/bond |
| Phase 4 | Domain OAuth; unlock 11 Partial → Have |
| Scale | SA/WA scoping |

**Exit criteria:** Big 3 states at 90%+ coverage; Domain market block live.

### 2027+ — Platform

- Agent Engine / ADK supervisor (PRODUCT-V2 v2.1)
- Saved properties + DA alerts
- MCP server (NSW tools as standalone product)
- Remaining states (SA, WA, TAS, ACT, NT)

---

## Appendix

### FLI extras (not in Homesnoop)

- FSR, height, minimum lot size (live NSW EPI)
- Development potential (GFA range, storeys, subdivision hint)
- 5-year Valuer General unimproved land value history

### Key references

- Coverage audit: [homesnoop-fli-coverage.md](./homesnoop-fli-coverage.md)
- Source wiring plan: [homesnoop-fli-dataset-sourcing.md](./homesnoop-fli-dataset-sourcing.md)
- Nationwide expansion: [nationwide-vic-qld-nsw-expansion.md](./nationwide-vic-qld-nsw-expansion.md)
- Architecture v2: [PRODUCT-V2.md](../PRODUCT-V2.md)

### Document history

| Date | Change |
|---|---|
| 2026-08-26 | Initial product spec — target market, MVP scope, feature matrix, roadmap |
