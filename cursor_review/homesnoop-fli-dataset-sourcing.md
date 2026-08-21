# Dataset sourcing — Missing + Planned (Homesnoop gap fill)

**Last updated:** 2026-08-20 23:16 AEST (`2026-08-20T23:16:00+10:00`)

Companion to [homesnoop-fli-coverage.md](./homesnoop-fli-coverage.md). Researches all **25 Missing** and **8 Planned** fields for NSW FLI: can we get them by **live API**, **download/cache**, **derive**, or not at all?

Legend:

| Access | Meaning |
|---|---|
| **API** | Live HTTP query at request time (ArcGIS REST, REST, GTFS, etc.) |
| **Download** | Bulk file (XLSX, ZIP, SHP) — cache in `data/` like `nsw-cache.json`, refresh on schedule |
| **Derived** | Computed from data we already have or will add |
| **Paid** | Official but needs commercial package, license, or account negotiation |
| **Hard** | No practical open source; paid title/registry, or manual only |

---

## Executive summary

| Bucket | Count | Action |
|---|---|---|
| Free live API (ArcGIS / gov REST) | 12 | Wire next — same pattern as existing `lib/sources/*` |
| Free download + cache | 5 | Monthly/quarterly ETL into committed cache |
| Domain API (free tier + extra packages) | 11 | One OAuth integration unlocks most market gaps |
| Derived (no new vendor) | 4 | Frontage, growth, yield, BAL (partial) |
| Paid / hard | 4 | AVM (Domain/Cotality), statewide sewer layer, LRS title/register, BAL engine |
| Ship (resolved Tier 4) | 2 | Microsoft roof footprint (Topic 1); EPI Airport Noise ANEF (Topic 4) |

**Big win:** several rows marked Missing in the first review **do have NSW sources** — easements, character overlays, protected vegetation, historic fire, landslide, road hierarchy. They are not wired in FLI yet.

**Tier 4 resolved:** [deep-research-hard-datasets-RESULTS.md](./deep-research-hard-datasets-RESULTS.md) — Microsoft ODbL roof footprint (ship), ANEF airport noise (ship), bond postcode rent band (derive), VG+sales band (derive). Still paid/hard: Domain AVM, sewer reticulation layer, LRS title, BAL.

**Biggest remaining hole:** Domain **Price Estimation + Rental AVM** packages (paid negotiation) for Homesnoop-grade market block — or ship derive-only VG + nearby-sales band with honest labelling.

**Domain (Partial):** we may already have suburb stats + property history access — see [domain-partial-notes.md](./domain-partial-notes.md). Keep all Domain-backed rows **Partial** until endpoints are probed and wired.

---

## Bushfire — Homesnoop’s “two levels” vs FLI

Homesnoop splits bushfire into **two separate report sections** (not one combined score):

| # | Homesnoop section | What it means (Rosebud example) | NSW / FLI equivalent |
|---|---|---|---|
| 1 | **Bushfire** | Current planning trigger: **Bushfire Prone Area** (+ map legend: Bushfire Management Overlay). Text: new builds must meet **AS 3959**; BAL depends on site assessment. | **Have (partial)** — FLI queries **Bush Fire Prone Land** only (`Category`, `d_Category`, `Guideline` from `Planning_Portal_Hazard/229`). Does **not** yet show BMO as separate layer or compute BAL. |
| 2 | **Historic bushfires** | Past fire footprints near the property (“Historic Bushfire Area”). Rosebud: none identified. | **Planned** — `Hosted/NSWFireHistory/FeatureServer/0` (API ready, not wired). |

Homesnoop does **not** print a BAL number (e.g. BAL-19) in this report — only that BPA applies and AS 3959 applies. A third concept, **BAL / construction level**, would be a consultant or RFS BFHAT output — FLI still **Missing** for automated BAL.

**VIC vs NSW naming:** Rosebud report uses VicPlan **BPA**; NSW uses **BFPL** — same product slot, different instrument names.

---

## Missing (25)

| # | Field | Access | Source | Endpoint / file | Notes |
|---|---|---|---|---|---|
| 1 | Frontage | **Derived** | NSW cadastre lot polygon | existing `parcelAtPoint` | Longest street-facing edge or min-area bounding rectangle on lot geometry. Not in any gov attribute table. Homesnoop computes similarly. |
| 2 | Beds / baths / cars | **API** (+ **Paid** enrich) | Domain Listings API | `POST /v1/listings/residential/_search` | On-market attributes when listed. Off-market: Domain Property API (`GET /v1/properties/{id}`) or listing history — extra scopes. See `research-live-listings.md`. |
| 3 | Building floor area | **Ship (download+cache)** | Microsoft Australia Building Footprints (ODbL) | [github.com/microsoft/AustraliaBuildingFootprints](https://github.com/microsoft/AustraliaBuildingFootprints) | **Resolved:** cache national GeoJSON, intersect lot, expose `roofFootprintM2`. Label "roof footprint, not internal floor area". Geoscape = paid; DCS free channel = gov agencies only. See [RESULTS §1](./deep-research-hard-datasets-RESULTS.md#topic-1-geoscape-floor-area). |
| 4 | Property features | **API** | Domain Listings API | same search endpoint | `features` array on listings (pool, AC, etc.). |
| 5 | Subject sale history | **Partial** | SIX Valuation sales; Domain Property | SIX live today; Domain history TBD — [domain-partial-notes.md](./domain-partial-notes.md) | SIX: registered transfers, no agency/DOM. Domain may add agency + DOM once Property Enrichment confirmed. |
| 6 | Subject rental history | **Not available** / **Derive** | Bond lodgements (postcode); Domain listing history (paid) | [nsw.gov.au rental bond data](https://www.nsw.gov.au/housing-and-construction/rental-forms-surveys-and-data/rental-bond-data) | **Resolved:** no address field in bond data (privacy by design). Ship postcode+beds IQR band only; property-level = Domain paid. See [RESULTS §5](./deep-research-hard-datasets-RESULTS.md#topic-5-address-level-rental-history). |
| 7 | AVM (low / mid / high) | **Paid only** / **Derive** | Domain Price Estimation; Cotality; SIX+VG derive | `GET /v1/properties/{propertyId}/priceEstimate` | **Resolved:** no free AVM. Derive nearby-sales median + VG land value with "not a valuation" label, or Domain commercial (AU-host, no cache). See [RESULTS §2](./deep-research-hard-datasets-RESULTS.md#topic-2-corelogic-grade-avm-alternative). |
| 8 | Growth since last sale | **Derive** | SIX last sale + derived band or Domain AVM | derive | Blocked on honest band (#7). Do not fabricate CAGR from fake AVM. |
| 9 | Rental estimate + yield | **Derive** / **Paid** | Bond lodgements IQR; Domain Rental AVM | bond XLSX; `rentalEstimate` | Postcode IQR from bond (free); property band = Domain paid. Yield = derive from mid rent / price band. |
| 10 | Suburb days on market | **Partial** | Domain Properties & Locations | `GET /v2/suburbPerformanceStatistics/{state}/{suburb}` | Likely on default package — probe Killara; see domain-partial-notes. |
| 11 | Suburb median sale | **Partial** | Domain suburb performance | same | Same probe. |
| 12 | Suburb median rent | **Partial** / **Download** | Domain suburb performance; bond lodgements | same + bond XLSX | Domain preferred; bond fallback. |
| 13 | Quarterly sale / rent trends | **Partial** | Domain suburb performance + `/v1/suburbHistorical` | same + historical endpoint | Cache weekly; variable paths TBD on probe. |
| 14 | Easements | **API** | NSW cadastre Easement layer | `portal.spatial.nsw.gov.au/.../NSW_Land_Parcel_Property_Theme/FeatureServer/9/query` | **Source exists** — polygon, `easementtype`, `easementwidth`. Digitised easements only; title still definitive for missing ones (Homesnoop caveat applies). |
| 15 | Neighbourhood character overlay | **API** | ePlanning Local Provisions | `mapprod3.environment.nsw.gov.au/.../Planning_Portal_Local_Provisions/MapServer` → **Built Character Map**, **Special Character Areas Map** | Point query same as existing EPI layers. |
| 16 | Historic bushfire footprints | **API** | NSW RFS Fire History | `portal.spatial.nsw.gov.au/.../Hosted/NSWFireHistory/FeatureServer/0/query` | AFAC schema; weekly update. `fire_name`, `ignition_date`, `area_ha`. |
| 17 | Protected vegetation | **API** | ePlanning Local Provisions | **Significant Native Vegetation Map** (+ council VPO/ESO schedules in same service) | Vic ESO ≠ NSW layer names but same product slot. |
| 18 | BAL / AS3959 level | **Derived** / **Hard** | NSW BFPL (have) + vegetation + slope + RFS tools | `bfhat.rfs.nsw.gov.au` (web only); AS3959 tables | No single gov “BAL raster”. Build: vegetation distance + DEM slope + FFDI → BAL band (complex). RFS BFHAT is interactive, not an API. Flag as indicative. |
| 19 | Electricity infrastructure | **API** | DNSP ArcGIS FeatureServers | Essential Energy: `services-ap1.arcgis.com/3o0vFs4fJRsuYuBO/arcgis/rest/services/*` (poles, spans, cables, substations). Ausgrid/Endeavour have similar. | Pick DNSP by point-in-service-area polygon. Anonymous, no key (Essential Energy confirmed). |
| 20 | Water / sewer assets | **Not available** (route to paid) | Sydney Water Tap in; council patchwork | [Sydney Water GIS diagram](https://www.sydneywater.com.au/plumbing-building-developing/building/sydney-water-tap-in/gis-asset-data-request.html) ($151.74 incl GST) | **Resolved:** no statewide REST. DNSP-style UX → service area + link to Tap in / broker. Do not show "none identified" as authoritative. See [RESULTS §3](./deep-research-hard-datasets-RESULTS.md#topic-3-statewide-sewer--water-infrastructure). |
| 21 | Road hierarchy | **API** | NSW Transport Theme | `portal.spatial.nsw.gov.au/.../NSW_Transport_Theme/FeatureServer/5` (`functionhierarchy`: Motorway, PrimaryRoad, ArterialRoad, …) | Point + distance query for nearest road class. |
| 22 | Flight paths / aircraft noise | **Ship (API)** | NSW Planning Portal EPI Airport Noise (ANEF) | `mapprod3.environment.nsw.gov.au/.../Planning/Protection/MapServer` | **Resolved:** free CC-BY ANEF contour query. Partial vs Homesnoop: ANEF ≠ flights/day (N70 = Airservices paid). See [RESULTS §4](./deep-research-hard-datasets-RESULTS.md#topic-4-flight-path-frequency-raster-aircraft-noise). |
| 23 | Bicycle network | **Download** | TfNSW Infrastructure Cycleway | [opendata.transport.nsw.gov.au/dataset/infrastructure-cycleway-data](https://opendata.transport.nsw.gov.au/dataset/infrastructure-cycleway-data) SHP, monthly | Cache SHP or load into PostGIS; not a point-query ArcGIS layer statewide. |
| 24 | Crime score + rates | **Download** | BOCSAR | [bocsar.nsw.gov.au open datasets](https://bocsar.nsw.gov.au/statistics-dashboards/open-datasets.html) — suburb/postcode XLSX quarterly | No REST API. Cache + compute weighted score (Homesnoop-style) from violent/property offence counts per 1000. |
| 25 | Independent / Catholic schools | **Download** / **API** | ACARA Australian Schools List | [acara.edu.au/data-access](https://www.acara.edu.au/contact-us/acara-data-access) School Location XLSX; ASL search UI | Filter `Sector = Non-Gov`, lat/lon. DoE CARTO already covers state catchments. |

---

## Planned (8) — from PRODUCT.md / first review

| # | Field | Access | Source | Endpoint / file | Notes |
|---|---|---|---|---|---|
| P1 | Nearby for-sale listings | **Partial** | Domain Listings API | `POST /v1/listings/residential/_search` | Researched; credentials/packages TBD — [domain-partial-notes.md](./domain-partial-notes.md) |
| P2 | Nearby for-rent listings | **Partial** | Domain Listings API | same | Same as P1. |
| P3 | Erosion / landslip overlay | **API** | ePlanning Hazard | `Planning_Portal_Hazard/MapServer/232` **Landslide Risk Land** | Also coastal erosion layers in Local Provisions. PRODUCT.md P1 — source confirmed, not wired. |
| P4 | Public transport | **API** / **Download** | TfNSW GTFS + optional GTFS-R | [opendata.transport.nsw.gov.au](https://opendata.transport.nsw.gov.au/) — GTFS zip + API key for realtime | Static: download/cache `stops.txt` + shapes. Live: needs API token. NSW POI PlacePoint for station names. |
| P5 | Dwelling density | **API** | ABS Census 2021 | [data.api.abs.gov.au](https://data.api.abs.gov.au/rest/data/...) SA2 dwelling counts ÷ area | Join SA2 polygon (ABS ASGS) to point. Or SEIFA/Census table download. |
| P6 | Public housing rate | **API** | ABS Census 2021 | Census tenure variables (rented social housing) at SA2 | Same ABS API / Census DataPack. |
| P7 | IRSAD socio-economic | **API** | ABS SEIFA 2021 | SEIFA IRSAD at SA2 via Data API or [Data Explorer](https://www.abs.gov.au/statistics/people/people-and-communities/socio-economic-indexes-areas-seifa-australia/latest-release) | Point → SA2 lookup → IRSAD score + percentile. |
| P8 | Parks / sports / dog parks | **API** | NSW Features of Interest | `portal.spatial.nsw.gov.au/.../NSW_Features_of_Interest_Category/FeatureServer/1` (PlacePoint) | Filter `placetype` / name. OSM Overpass as fallback for dog parks. |

---

## Recommended build order (NSW FLI)

### Tier 1 — free ArcGIS, same pattern as today (~1–2 weeks)

Wire point queries into `lib/sources/` + agent tools:

1. Easements (`FeatureServer/9`)
2. Built Character + Special Character + Significant Native Vegetation (`Planning_Portal_Local_Provisions`)
3. Landslide Risk (`Planning_Portal_Hazard/232`)
4. Historic fire (`NSWFireHistory`)
5. Road hierarchy (`NSW_Transport_Theme/5`)
6. Electricity (Essential Energy + Ausgrid/Endeavour service-area routing)
7. Parks/POI (`NSW_Features_of_Interest_Category`)

### Tier 2 — download + cache (~1 week)

1. BOCSAR crime → suburb/postcode score
2. TfNSW cycleways SHP → simplify for map
3. ACARA schools XLSX → non-gov schools layer
4. Rental bond lodgements → postcode median rent band (label as bond-based, not live)

### Tier 3 — Domain API (~2 weeks + approval wait)

1. Listings search (for-sale + for-rent nearby) — **already researched**
2. Suburb performance (medians, DOM, trends)
3. Property suggest → beds/baths/features when listed
4. Negotiate Price Estimation + Rental AVM packages for AVM block

### Tier 4 — derived / hard / ship from research

1. **Microsoft roof footprint** — cache ODbL GeoJSON, `lib/sources/buildings.ts` (Topic 1)
2. **EPI Airport Noise ANEF** — extend `lib/sources/hazard.ts` (Topic 4)
3. **Bond postcode rent band** — `lib/sources/rental.ts`, monthly XLSX cache (Topic 5)
4. **VG + nearby-sales band** — extend `lib/sources/valuation.ts`; no fake AVM (Topic 2)
5. Frontage from lot geometry
6. BAL — link out to RFS BFHAT only; no fabricated BAL (still **Missing**)
7. Water/sewer — DNSP-style routing UX to Sydney Water Tap in; no layer (Topic 3)
8. LRS title — broker handoff; cadastre easements only (Topic 6)

---

## Domain API package map (market block)

| Homesnoop field | Domain package | Scope |
|---|---|---|
| Nearby listings | Agents & Listings (default) | `api_listings_read` |
| Suburb medians / DOM / trends | Properties & Locations (default) | `api_suburbperformance_read` |
| Beds, baths, features, building size | Listings + Property | `api_listings_read`, `api_properties_read` |
| Sale + rental history | Property Enrichment | negotiate |
| AVM + rental estimate | Price Estimation + Rental AVM | `api_avm_read` — **negotiate with account manager** |

Portal: [developer.domain.com.au](https://developer.domain.com.au/)

---

## Corrections to first coverage review

These were marked **Missing** but NSW sources exist (status should move to **Planned** or **Have** once wired):

| Field | Was | Now |
|---|---|---|
| Easements | Missing | **API ready** — cadastre layer 9 |
| Character overlay | Missing | **API ready** — Local Provisions |
| Protected vegetation | Missing | **API ready** — Significant Native Vegetation Map |
| Historic bushfire | Missing | **API ready** — NSW Fire History |
| Erosion / landslip | Planned | **API ready** — Hazard layer 232 |
| Road hierarchy | Missing | **API ready** — Transport Theme |
| Parks | Planned | **API ready** — Features of Interest |

---

## Changelog

| When | What changed |
|---|---|
| 2026-08-20 23:16 AEST | Tier 4 resolved in [deep-research-hard-datasets-RESULTS.md](./deep-research-hard-datasets-RESULTS.md): Microsoft roof footprint, ANEF airport noise, bond rent band, VG+sales derive; sewer/title/AVM verdicts updated. |
| 2026-08-20 22:35 AEST | Bushfire two-level mapping; Domain rows → Partial + [domain-partial-notes.md](./domain-partial-notes.md); deep-research prompt for 6 hard datasets. |
| 2026-08-20 22:30 AEST | Initial sourcing research for 25 Missing + 8 Planned fields. Verified live endpoints for easements, Local Provisions, fire history, landslide, road hierarchy. |
