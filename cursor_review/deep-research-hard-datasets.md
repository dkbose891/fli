# Deep research prompt — hard dataset sources (NSW FLI)

**Created:** 2026-08-20 22:35 AEST  
**Results:** [deep-research-hard-datasets-RESULTS.md](./deep-research-hard-datasets-RESULTS.md) (2026-08-20 23:16 AEST)  
**Context:** [homesnoop-fli-dataset-sourcing.md](./homesnoop-fli-dataset-sourcing.md) — Tier 4 / “Paid / hard” rows we could not close with a quick web pass.  
**Product:** NSW Place Analyser (`/Users/kunalsaxena/Desktop/workbench/fli`) — live gov data + optional Domain; no storage except demo caches.

---

## Instructions for researcher

You are researching **whether FLI can legally and practically source** each dataset below for NSW properties. For each topic deliver:

1. **Verdict** — `Ship (API)` | `Ship (download+cache)` | `Paid only` | `Not available` | `Derive`
2. **Best source(s)** — official name, URL, custodian
3. **Access method** — REST/ArcGIS endpoint, bulk file URL, signup process, indicative pricing if paid
4. **Coverage** — NSW statewide vs Sydney-only vs council patchwork
5. **Freshness** — update frequency, lag, cache strategy for FLI
6. **Key fields** — exact attribute/column names we would expose in `SourceResult.summary`
7. **Legal / ToS** — redistribution, attribution, commercial use, key-in-repo rules
8. **FLI integration sketch** — which `lib/sources/*.ts` file, agent tool name, honest labelling in UI
9. **Homesnoop parity** — what their report shows vs what we can match
10. **Alternatives ranked** — free → cheap → enterprise

Be adversarial: if the only path is scraping, ToS breach, or “contact sales”, say so plainly. Prefer primary sources (gov portals, vendor docs, OpenAPI specs) over blog posts.

**Test address for probes:** 26 Calvert Avenue, Killara NSW 2071 (FLI demo — pre-cached cadastre). Secondary: a Sydney metro parcel and a regional NSW parcel.

---

## Topic 1 — Geoscape floor area (building internal / footprint m²)

**Homesnoop shows:** building floor area (e.g. 171 m²) on the market tab — likely from listing/AVM vendor, not cadastre.

**FLI gap:** cadastre is land-only. Need dwelling size for report parity.

**Research questions:**

- What does **Geoscape National Buildings** actually sell? Distinguish roof footprint m², building area, height, G-NAF link, API vs GDB/SHP delivery.
- Is there **whole-of-government NSW access** via DCS Spatial Services (free to agencies only) and can a Cloud Run demo app qualify?
- **Microsoft Australia Building Footprints** (ODbL) — field list, accuracy, suitability as “area proxy” with disclaimer.
- **Domain** listing `buildingSize` / Property Enrichment — when populated off-market?
- Any **NSW open** building footprint layer (e.g. 3D BASIX, council open data)?
- Cost ballpark for startup/demo scale (single LGA vs state).

**Deliverable:** recommended path for FLI with label text (“roof footprint, not internal floor area” if applicable).

---

## Topic 2 — CoreLogic-grade AVM alternative

**Homesnoop shows:** low / mid / high estimate, confidence, growth since last sale — sourced from Domain Insight (APM) per PDF footer.

**FLI gap:** we have **Valuer General unimproved land value** (5-yr) but not market AVM. Domain Price Estimation exists but is a **separate negotiated package**.

**Research questions:**

- **Domain** — exact packages, scopes, pricing tiers, sandbox vs prod, fields on `priceEstimate` and `rentalEstimate`, rate limits, whether fintech demo qualifies.
- **PropTrack / REA** — any public or startup API, or B2B only.
- **CoreLogic / Cotality** — API availability, minimum commit.
- **Open substitutes** — hedonic model from SIX sales + VG land value (derive); accuracy expectations.
- **Honesty line** — what FLI should show if we only have VG land value + nearby sales median.

**Deliverable:** decision matrix: Domain-only vs derive vs pay CoreLogic vs don’t show AVM.

---

## Topic 3 — Statewide sewer / water infrastructure

**Homesnoop shows:** water pipes on property; “no infrastructure identified” with caveat to check before build.

**FLI gap:** no statewide layer; Sydney Water is internal GIS + formal request; some councils have local MapServer under data-share.

**Research questions:**

- **Sydney Water** — GIS asset data request process, cost, latency, coverage (Greater Sydney), formats.
- **WaterNSW**, **local water utilities** (Hunter, Illawarra, etc.) — open data posture.
- **Council MapServers** — how many LGAs publish sewer mains (ArcGIS REST)? Build a inventory table for top 20 LGAs by population.
- **NSW Spatial** — does `NSW_Water_Theme` include reticulation (likely not — confirm)?
- **Digitised easements** on cadastre — overlap with sewer easements?
- Practical FLI approach: DNSP-style routing (“you are in Sydney Water area → link to Tap-in/GIS request”) vs silent skip.

**Deliverable:** map of coverage % NSW population with queryable sewer REST, and minimum viable UX.

---

## Topic 4 — Flight-path frequency raster (aircraft noise)

**Homesnoop shows:** low / moderate / high frequency areas (~2 / ~10 / 20+ planes per day below 10,000 ft), map layer. Footer cites **Geoscience Australia**.

**FLI gap:** Airservices has ANEF packs and WebTrak (airport-specific), not a national point-query API.

**Research questions:**

- Locate the **exact Geoscience Australia (or other) dataset** Homesnoop likely uses — product name, WMS/WFS/REST, license.
- **Airservices** — ANEF/ANEI data pack subscription process, airports covered, format, redistribution.
- **Planning layers** — SYD/NTL/CBR ANEF contours in NSW/VIC planning portals; usable for “near airport” heuristic?
- **OpenSky / ADS-B** — feasibility of computing frequency raster (probably not for prod — note why).
- Accuracy limits — disclaimer text.

**Deliverable:** can we get a queryable layer for Sydney basin or must we omit?

---

## Topic 5 — Address-level rental history

**Homesnoop shows:** rental history section (often empty); rental **estimate** band when populated.

**FLI gap:** NSW **rental bond** data is postcode + beds + dwelling type in monthly XLSX — not address-level. Domain listing history may have leases when property was listed.

**Research questions:**

- **NSW Fair Trading bond lodgements** — confirm no address field; document columns available for aggregate stats.
- **Domain** — `property_listing_history_get`, rental events, off-market coverage, package required.
- **Tenants Union / other** derived products from bond data.
- **Privacy** — can address-level rental history be shown ethically in a buyer report?
- **Proxy strategy** — postcode IQR band (Rent Check methodology) vs property-level Domain rental AVM.

**Deliverable:** best honest FLI behaviour for “what did this place rent for before?”

---

## Topic 6 — LRS title (easements, covenants, mortgages)

**Homesnoop shows:** easements “none in digital datasets; check title”; recommends conveyancer title search.

**FLI gap:** we found **cadastre easement polygons** (digitised) but user wants to know about **register interests** (covenants, easements not digitised, mortgages).

**Research questions:**

- **NSW Land Registry Services (LRS)** — Title Search API, PEP, pricing per search, developer access, terms for displaying to end users.
- **Integrated Titling** / **NLIS** — what’s public vs broker-only.
- Relationship between **cadastre easement layer** and **register** — when do they diverge?
- **PEXA** / property exchange — any read API for consumers?
- FLI policy: already say “ownership not available” — extend to “secondary interests not available without paid title search”?

**Deliverable:** cost model for per-click title in app vs hard “not in open data” boundary.

---

## Output format

Write findings to a new file:

`cursor_review/deep-research-hard-datasets-RESULTS.md`

Structure:

```markdown
# Hard datasets — research results (YYYY-MM-DD)

## Executive summary (one paragraph)

## Topic 1: Geoscape floor area
### Verdict
### Sources table
### Recommended FLI approach
### Open questions

(repeat for topics 2–6)

## Appendix: links and probe commands
```

Include curl/ArcGIS probe examples that worked. Update [homesnoop-fli-dataset-sourcing.md](./homesnoop-fli-dataset-sourcing.md) verdict column when a topic is resolved.

---

## References already in repo

- `research-live-listings.md` — Domain listings OAuth
- `lib/sources/valuation.ts` — SIX sales + VG land value
- `lib/sources/hazard.ts` — BFPL + flood
- `PRODUCT.md` — data honesty principles
- Homesnoop PDF — 16 Wedgewood Drive Rosebud (Vic example report)
