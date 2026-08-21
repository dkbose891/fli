# Homesnoop vs FLI coverage

**Property:** 16 Wedgewood Drive, Rosebud VIC 3939 (lot 4/LP122761)
**Homesnoop report:** `306dd7e7-fe5e-4536-bb8e-83ca9ece2249` (2026-08-20)
**FLI repo:** `/Users/kunalsaxena/Desktop/workbench/fli`
**Last updated:** 2026-08-20 23:25 AEST (`2026-08-20T23:25:00+10:00`)

Newest entry first. Add a line here whenever this review is updated.

| When | What changed |
|---|---|
| 2026-08-20 23:25 AEST | Nationwide expansion plan (VIC · QLD · NSW first): [nationwide-vic-qld-nsw-expansion.md](./nationwide-vic-qld-nsw-expansion.md). |
| 2026-08-20 23:16 AEST | Tier 4 deep research results: Microsoft roof footprint + ANEF airport noise → Planned; flight paths Partial vs Homesnoop; sewer/title/AVM verdicts. See [deep-research-hard-datasets-RESULTS.md](./deep-research-hard-datasets-RESULTS.md). |
| 2026-08-20 22:35 AEST | Domain stats/history → Partial ([domain-partial-notes.md](./domain-partial-notes.md)); bushfire two-level note; [deep-research-hard-datasets.md](./deep-research-hard-datasets.md) prompt. |
| 2026-08-20 22:30 AEST | Added [dataset sourcing doc](./homesnoop-fli-dataset-sourcing.md) for all 25 Missing + 8 Planned fields (API vs download vs paid). |
| 2026-08-20 22:23 AEST | Initial coverage review: Homesnoop PDF vs FLI live sources. 13 have / 1 partial / 8 planned / 25 missing. |

Homesnoop is a national buyer report for a Victorian lot. FLI is a NSW Place Analyser. Matching field types below are capability matches, not VicPlan coverage. FLI would return nothing for this Rosebud coordinate today.

| Status | Count | Meaning |
|---|---|---|
| Have | 13 | Live NSW equivalent exists in FLI |
| Partial | 16 | Source path exists but incomplete vs Homesnoop (Domain, derive, ANEF≠frequency, roof≠floor area) |
| Planned | 17 | Traceable gov/open source identified, not wired |
| Missing | 1 | No practical open path (BAL engine only) |
| **Total** | **47** | |

**Self-reliant (no Domain):** Tier 1 ArcGIS + Tier 2 downloads + Microsoft ODbL roof footprint + ANEF airport noise + bond postcode rent band + VG/nearby-sales derive band. See [homesnoop-fli-dataset-sourcing.md](./homesnoop-fli-dataset-sourcing.md).

**Paid / not in open data:** Domain AVM & listing history, LRS title/register interests, Sydney Water reticulation diagrams ($151.74+). Sewer has no statewide layer — ship DNSP-style UX, not "none identified".

**Nationwide (VIC · QLD · NSW):** [nationwide-vic-qld-nsw-expansion.md](./nationwide-vic-qld-nsw-expansion.md)

**Deep research (resolved):** [deep-research-hard-datasets-RESULTS.md](./deep-research-hard-datasets-RESULTS.md)

**Domain (Partial):** [domain-partial-notes.md](./domain-partial-notes.md)

### Bushfire — two Homesnoop sections

1. **Bushfire** (current) — Bushfire Prone Area / overlay; triggers AS 3959; does not state BAL number. FLI: BFPL layer only (**Have**).
2. **Historic bushfires** — past fire footprints. FLI: NSW Fire History API (**Planned**).

### Tier 4 outcomes (2026-08-20)

| Topic | Verdict | FLI row impact |
|---|---|---|
| Building floor area | Ship Microsoft ODbL roof footprint | **Planned** (Partial parity — not internal m²) |
| AVM | Paid Domain/Cotality or derive VG+sales | **Partial** |
| Sewer/water | Not available as layer; route to Sydney Water | **Missing** (UX only) |
| Flight paths | Ship EPI ANEF contour | **Partial** (ANEF ≠ flights/day) |
| Rental history | Postcode bond band only | **Partial** |
| LRS title | Paid broker; cadastre easements free | Easements **Planned**; register **not in open data** |

## Field-by-field

| Section | Homesnoop field | Value at 16 Wedgewood | FLI | FLI source / gap |
|---|---|---|---|---|
| Property | Street address | 16 Wedgewood Drive, Rosebud VIC 3939 | Have | Addressr / G-NAF — NSW addresses only |
| Property | Lot / plan | 4/LP122761 | Have | NSW cadastre (portal + SIX fallback) |
| Property | Lot area | 2,700 m² (market page 2,722 m²) | Have | planlotarea, or geodesic area from boundary |
| Property | Frontage | 37.0 m | Planned | Derived from cadastre lot polygon — not computed yet |
| Property | Zoning | SUZ — Special Use Zone | Have | NSW EPI zoning (LAY_CLASS, SYM_CODE) — not VicPlan |
| Property | State school catchments | Eastbourne Primary; Rosebud Secondary College | Have | NSW DoE School Finder CARTO — public primary + secondary |
| Property | Beds / baths / cars | 4 / 2 / 4 | Partial | Domain Listings/Property when listed — not wired |
| Property | Building floor area | 171 m² | Planned | Microsoft ODbL roof footprint cache — label proxy, not internal m² ([RESULTS §1](./deep-research-hard-datasets-RESULTS.md#topic-1-geoscape-floor-area)) |
| Property | Property features | None listed | Partial | Domain listings `features[]` — not wired |
| Market | Subject sale history | Sold 1 Dec 2016 for $827k; Belle Property Dromana; 9 days on market | Partial | SIX transfers live (no agency/DOM); Domain Property Enrichment = paid |
| Market | Subject rental history | None shown | Partial | Address-level **not available** in open data; bond postcode IQR band only ([RESULTS §5](./deep-research-hard-datasets-RESULTS.md#topic-5-address-level-rental-history)) |
| Market | AVM (low / mid / high) | $1.15M / $1.34M / $1.53M, high confidence | Partial | Domain/Cotality paid; or derive VG + nearby-sales band — no fake AVM ([RESULTS §2](./deep-research-hard-datasets-RESULTS.md#topic-2-corelogic-grade-avm-alternative)) |
| Market | Growth since last sale | +$513k (62%), 5.1% CAGR | Partial | Derive from SIX last sale + honest price band — blocked on AVM policy |
| Market | Rental estimate + yield | $730–$1,040/wk, 3.44% yield | Partial | Bond postcode IQR (free) or Domain Rental AVM (paid) |
| Market | VG unimproved land value | Not in this report | Have | FLI extra: 5-year Valuer General history via SIX |
| Market | Suburb days on market | 55 days (Rosebud houses) | Partial | Domain suburbPerformanceStatistics — probe pending |
| Market | Suburb median sale | $800k | Partial | Domain suburb performance — probe pending |
| Market | Suburb median rent | $595/wk | Partial | Domain suburb performance or bond lodgements XLSX |
| Market | Quarterly sale / rent trends | Charts included | Partial | Domain suburb performance + suburbHistorical |
| Market | Nearby for-sale listings | 4 listings (e.g. 255A Jetty Rd $1.4M) | Partial | Domain Listings API — researched, not wired |
| Market | Nearby for-rent listings | 4 listings ($600–$850/wk) | Partial | Same Domain listings path |
| Market | Nearby sold comparables | 4 recent sales ($1.095M–$1.3M) | Have | query_recent_sales — SIX registered transfers, default 500 m |
| Planning | Development applications (this lot) | None in SPEAR dataset | Have | NSW ePlanning DA Tracking — not VIC SPEAR |
| Planning | Nearby DAs | 2 SPEAR apps (Sherwood Ave consolidation; Jetty Rd 2-lot + veg removal) | Have | dasNear, default 1 km |
| Planning | Easements | None in digital datasets; title search still required | Planned | Cadastre easement layer (FeatureServer/9) — digitised only; LRS title = paid broker ([RESULTS §6](./deep-research-hard-datasets-RESULTS.md#topic-6-lrs-title-easements-covenants-mortgages)) |
| Planning | Heritage | None identified | Have | NSW EPI heritage layer (H_NAME, SIG) |
| Planning | Neighbourhood character overlay | None identified | Planned | ePlanning Local Provisions — Built Character + Special Character |
| Planning | Design control overlays | No DDO / DPO / IPO / BFO | Partial | NSW FSR, height, min lot size live — different instruments than Vic DDO |
| Planning | Development potential | Not computed | Have | FLI extra: GFA range, storeys, subdivision hint |
| Environment | Flood / overland flow | Not in an adopted flood planning area | Have | NSW Flood Planning Map |
| Environment | Bushfire prone / overlay | Bushfire Prone Area — new builds under AS3959 | Have | NSW BFPL category; no BAL number |
| Environment | Historic bushfire footprints | None identified | Planned | NSW Fire History ArcGIS — API ready, not wired |
| Environment | Erosion / landslip overlay | None identified | Planned | Planning_Portal_Hazard/232 Landslide Risk |
| Environment | Protected vegetation | Environmental Significance Overlay (ESO) | Planned | Significant Native Vegetation Map (Local Provisions) |
| Environment | BAL / AS3959 construction level | Flagged as required, not scored | Missing | No gov BAL API; link to RFS BFHAT only — do not fabricate |
| Utilities | Electricity infrastructure | None identified on lot | Planned | DNSP ArcGIS (Essential Energy + Ausgrid/Endeavour routing) |
| Utilities | Water / sewer assets | None identified on lot | Missing | No statewide layer — DNSP UX to Sydney Water Tap in ($151.74 diagram); do not claim "none" ([RESULTS §3](./deep-research-hard-datasets-RESULTS.md#topic-3-statewide-sewer--water-infrastructure)) |
| Transport | Road hierarchy / traffic proxy | Map of local / collector / arterial | Planned | NSW_Transport_Theme/5 functionhierarchy |
| Transport | Flight paths / aircraft noise | None within 1 km | Partial | EPI Airport Noise ANEF layer (Planned to wire) — ANEF contour, not Homesnoop flights/day ([RESULTS §4](./deep-research-hard-datasets-RESULTS.md#topic-4-flight-path-frequency-raster-aircraft-noise)) |
| Transport | Public transport | OSM bus / rail / tram map | Planned | TfNSW GTFS + NSW POI stations |
| Transport | Bicycle network | On-road lanes + off-road paths map | Planned | TfNSW cycleways SHP download |
| Lifestyle | Dwelling density | 57 dwellings/km² (ABS 2021) | Planned | ABS Census 2021 SA2 |
| Lifestyle | Public housing rate | 0% (2021) | Planned | ABS Census tenure at SA2 |
| Lifestyle | IRSAD socio-economic score | Percentile 60 / 100; score 1029 | Planned | ABS SEIFA 2021 IRSAD at SA2 |
| Lifestyle | Crime score and rates | Score 33/100; violent 21.6, property 66.7 per 1,000 | Planned | BOCSAR suburb/postcode XLSX — score is derived, not official field |
| Lifestyle | Independent / Catholic schools | Shown on catchment map | Planned | ACARA Schools List XLSX (Non-Gov sector) |
| Lifestyle | Parks / sports / dog parks | Council parks map (OSM) | Planned | NSW Features of Interest PlacePoint |

## FLI extras Homesnoop does not include

- FSR, height, minimum lot size (NSW EPI)
- Development potential (GFA range, storeys, subdivision hint)
- 5-year Valuer General unimproved land value

## Sources

- Homesnoop PDF: `Homesnoop Report - 16 WEDGEWOOD DRIVE ROSEBUD VIC 3939.pdf` (39 pages)
- FLI: `PRODUCT.md`, `lib/sources/*`, `lib/agent.ts`, `research-live-listings.md`
- Deep research: [deep-research-hard-datasets-RESULTS.md](./deep-research-hard-datasets-RESULTS.md)
