# Nationwide expansion — VIC · QLD · NSW first

**Created:** 2026-08-20 23:25 AEST  
**Context:** [homesnoop-fli-coverage.md](./homesnoop-fli-coverage.md) (47 Homesnoop fields, NSW research complete)  
**Goal:** Homesnoop-class buyer reports nationwide; ship **NSW → VIC → QLD** before other states.

Homesnoop is already national (demo property: Rosebud **VIC**). FLI today is NSW-only. This doc maps the 47 fields to **national vs state** sources and estimates coverage per priority state.

---

## Architecture recommendation

Keep FLI’s current pattern: deterministic `lib/sources/*` + `SourceResult`, no raw geometry to the LLM.

```
lib/
  geo.ts                    # point-in-state (already NSW-boundary check → extend)
  sources/
    national/               # wire once
      addressr.ts           # G-NAF (already)
      buildings.ts          # Microsoft ODbL footprints (planned)
      census.ts             # ABS SA2 (planned)
      schools-acara.ts      # non-gov schools (planned)
      domain.ts             # optional commercial layer
    nsw/                    # move existing lib/sources/* here over time
    vic/
    qld/
  layers.ts                 # LAYER_REGISTRY gains state dimension
```

**Routing:** geocode → detect state from G-NAF / boundary polygon → dispatch `sources/{state}/*` with national fallbacks.

**Cache:** extend `data/nsw-cache.json` pattern to `data/{state}-cache.json` + national caches (`buildings`, `bond`, `bocsar`, etc.).

---

## Source tier model (nationwide)

| Tier | Scope | Fields (approx) | Integration count |
|---|---|---|---|
| **N0 National** | One feed, all states | 8–10 | ~5 modules |
| **N1 State ArcGIS** | Same query pattern, different base URL per state | 18–22 | 3× state adapters |
| **N2 State download** | Bond, crime, valuer sales — different file per state | 6–8 | 3× ETL caches |
| **N3 Commercial** | Domain (national API), title registries (per state) | 10–14 | 1 + 8 registries |
| **N4 Hard everywhere** | BAL, sewer layer, bank AVM, address rental history | 4–6 | honesty UX |

---

## N0 — National (wire once)

| Homesnoop field | Source | Notes |
|---|---|---|
| Street address | G-NAF via Addressr | Already national; FLI currently NSW-filtered |
| Building roof footprint | Microsoft Australia Building Footprints (ODbL) | National GeoJSON — [RESULTS §1](./deep-research-hard-datasets-RESULTS.md#topic-1-geoscape-floor-area) |
| Dwelling density, public housing, IRSAD | ABS Census / SEIFA 2021 API | SA2 nationwide |
| Independent / Catholic schools | ACARA Schools List XLSX | Filter `Sector = Non-Gov` |
| Beds/baths, features, listings, suburb stats, AVM | Domain API | National OAuth; same Partial/paid constraints |
| Nearby sold comparables (partial) | Domain + state valuer sales | Sales layer is **state**; Domain fills gaps |

**National-only coverage:** ~10 of 47 fields at full or partial parity without any state adapter.

---

## N1 — State ArcGIS (same pattern, three adapters)

Each state publishes cadastre + planning + hazard layers on ArcGIS REST. FLI’s existing `arcgisQuery` + `pointParams` pattern ports directly.

### NSW (researched — 13 Have, 17 Planned, 16 Partial)

| Field group | Service | Status in FLI |
|---|---|---|
| Lot/plan, area, frontage (derive) | NSW Cadastre / SIX | ✅ / Planned |
| Zoning, heritage, FSR/height/min lot | ePlanning EPI | ✅ |
| Bushfire, flood, landslide | Planning Portal Hazard | ✅ / Planned |
| Character, vegetation | Local Provisions | Planned |
| Easements | Cadastre FeatureServer/9 | Planned |
| Historic fire | NSWFireHistory | Planned |
| DAs | ePlanning DA Tracking | ✅ |
| Road hierarchy | Transport Theme/5 | Planned |
| Electricity | DNSP ArcGIS (Essential/Ausgrid/Endeavour) | Planned |
| Parks/POI | Features of Interest | Planned |
| Airport noise (ANEF) | Planning/Protection MapServer | Planned |
| State school catchments | NSW DoE CARTO | ✅ |
| VG land value, nearby sales | SIX Valuation | ✅ |

**NSW self-reliant path:** ~38/47 fields ([coverage doc](./homesnoop-fli-coverage.md)).

### VIC (Homesnoop demo state — not wired)

| Field group | Source | Endpoint hint |
|---|---|---|
| Lot/plan, area | VicMap Property / parcel services | data.vic.gov.au Vicmap |
| Zoning, overlays (ESO, BPA, heritage, etc.) | VicPlan | `plan-gis.mapshare.vic.gov.au/arcgis/rest/services/Planning/` — Vicplan_PlanningSchemeZones, Vicplan_PlanningSchemeOverlays |
| DAs | SPEAR / planning permit spatial | SPEAR dataset (Homesnoop cites for Rosebud) |
| Bushfire | CFA / VicPlan bushfire overlays | BPA, BMO in overlay service |
| Flood | VicPlan / melbourne water where applicable | overlay layers |
| Heritage | VicPlan heritage overlay | overlay service |
| School catchments | Vic education spatial | school zone layers |
| Sales history | Victorian property sales (LV/VG) | data.vic.gov.au property sales |
| Land tax / site value | Victorian Valuer-General | VG Victoria |
| Crime | Crime Statistics Agency Victoria | CSV/API — different schema to BOCSAR |
| Bond rent band | RTBA Victoria | separate XLSX to NSW |
| Electricity | CitiPower/Powercor/United/Jemena/AusNet DNSPs | per-DNSP ArcGIS (like NSW) |
| Airport noise | Planning scheme ANEF overlays + Melbourne Airport | council/state layers |
| Public transport | PTV GTFS | gtfs.vic.gov.au |

**VIC expected parity vs NSW research:** **similar ~80–90%** self-reliant once VicPlan + VicMap adapters exist. Rosebud report fields (SUZ, ESO, BPA) map cleanly to VicPlan overlays.

### QLD (third priority)

| Field group | Source | Endpoint hint |
|---|---|---|
| Lot/plan, area | QSCF / LPPF (replacing DCDB from Apr 2026) | `spatial-gis.information.qld.gov.au` — QSCF foundation FeatureServer |
| Zoning, overlays | State Planning | `PlanningCadastre/StatePlanning/MapServer` |
| DAs | DA mapping / council / State Assessment | mixed — PDAs on StatePlanning |
| Bushfire, flood | QLD hazard layers | State Planning + council |
| School catchments | QLD education spatial | state layers |
| Sales | QLD valuation / property sales open data | data.qld.gov.au |
| Crime | QPS / QLD Statistician crime data | download |
| Bond rent | RTA Queensland bond lodgement data | separate to NSW/VIC |
| Electricity | Energex/Ergon DNSPs | per-DNSP |
| Public transport | TransLink GTFS | qld.gov.au translink |

**QLD expected parity:** **~75–85%** — strong cadastre/planning REST; DA and hazard layers need per-topic verification (StatePlanning MapServer is the hub).

---

## N2 — State download + cache (same field, three files)

| Field | NSW | VIC | QLD |
|---|---|---|---|
| Crime score/rates | BOCSAR XLSX | Crime Statistics Agency | QPS / QLD open data |
| Suburb median rent (fallback) | Fair Trading bond XLSX | RTBA | RTA QLD |
| Non-gov schools | ACARA (national) | ACARA | ACARA |
| Cycleways | TfNSW SHP | VicTracks / OSM | QLD transport open data |

**Pattern:** one `lib/sources/rental.ts` with `{ nsw, vic, qld }` bond ingesters; one crime module with state-specific score derivation (document formula; not official Homesnoop score).

---

## N3 — Commercial / paid (national + per-state)

| Field | Scope | Notes |
|---|---|---|
| Listings, suburb stats, AVM, property history | Domain — **national** | Same Partial constraints; AU hosting |
| Title / covenants / mortgages | **Per-state** land registry | NSW LRS ~$20; Vic Land Use Information; QLD Titles Registry — all broker-mediated |
| Sewer/water diagram | **Per utility** | Sydney Water $151.74; South East Water / Yarra Valley / Urban Utilities etc. — DNSP UX each state |
| Geoscape building area | National paid | Optional upgrade over Microsoft proxy |

---

## N4 — Hard in every state (honesty boundary)

| Field | Nationwide verdict |
|---|---|
| BAL / AS3959 number | No state publishes queryable BAL; link to state RFS/CFA tools |
| Sewer/water reticulation layer | No statewide REST in NSW/VIC/QLD — utility-specific paid diagrams |
| Homesnoop flights/day frequency | Airservices N70 per airport — not national API; ANEF overlay per state where available |
| Address-level rental history | All states: bond data postcode-only; Domain paid if at all |
| Bank-grade AVM | Domain/Cotality paid nationally |

---

## Coverage estimate by state (after full wire-up)

Assumes: national tier wired, state ArcGIS adapters built, Domain optional, honest partials accepted.

| State | Have+Planned+Partial | Full parity (no Domain) | With Domain | True gaps |
|---|---|---|---|---|
| **NSW** | 46/47 (98%) | ~30/47 (64%) | 46/47 | BAL |
| **VIC** | ~44/47 (94%)* | ~28/47 (60%)* | ~45/47* | BAL; SPEAR lag; sewer |
| **QLD** | ~42/47 (89%)* | ~26/47 (55%)* | ~43/47* | BAL; DA coverage; regional DNSP |
| **Other states** | TBD | Lower until adapters built | +Domain helps market block | Same hard four |

\*VIC/QLD estimates — VicPlan/QSCF REST confirmed; field-level mapping not yet probed at Killara/Rosebud equivalents.

**Nationwide headline (NSW+VIC+QLD, no Domain):** ~**58–65%** full parity, ~**90%+** something to show.  
**With Domain:** ~**95%+** something to show; market block unlocked in all three states.

---

## Build order (recommended)

### Phase 0 — National foundation (all states at once)

1. Microsoft building footprints cache + ODbL attribution  
2. State boundary detection (`geo.ts` → NSW | VIC | QLD | unsupported)  
3. ABS Census / SEIFA SA2  
4. ACARA non-gov schools  
5. Addressr — remove NSW-only filter for VIC/QLD addresses  

**Unlocks:** address, demographics, schools (partial), roof footprint — anywhere in Australia.

### Phase 1 — NSW complete (current FLI backlog)

Wire Tier 1–2 from [homesnoop-fli-dataset-sourcing.md](./homesnoop-fli-dataset-sourcing.md): easements, character, vegetation, fire history, landslide, roads, electricity, parks, BOCSAR, bond rent, ANEF.

**Unlocks:** NSW at ~64% full parity self-reliant.

### Phase 2 — VIC (Homesnoop parity for demo property)

1. VicMap parcel at point  
2. VicPlan zones + overlays point query (BPA, ESO, heritage, SUZ — matches Rosebud report)  
3. SPEAR / planning permit nearby  
4. Vic sales + VG site value  
5. Vic school zones  
6. CFA bushfire where not in VicPlan  
7. Crime Statistics Agency ingest  
8. RTBA bond rent band  
9. Vic DNSP electricity routing  

**Unlocks:** Rosebud-class report; validates national product against Homesnoop PDF.

### Phase 3 — QLD

1. QSCF LPPF FeatureServer parcel query  
2. StatePlanning MapServer zones/overlays/hazards  
3. QLD sales / valuation  
4. QLD school catchments  
5. QPS crime + RTA bond  
6. Ergon/Energex DNSP  

### Phase 4 — Domain (optional, all states)

One OAuth integration — listings, suburb stats, AVM if licensed.

### Phase 5 — Remaining states (SA, WA, TAS, ACT, NT)

One state adapter each — cadastre + planning portal pattern repeats; lower priority until Big 3 stable.

---

## Field matrix — national vs state (47 fields)

| # | Field | National | NSW | VIC | QLD |
|---|---|---|---|---|---|
| 1 | Address | ✅ G-NAF | ✅ | ✅ | ✅ |
| 2 | Lot/plan | — | ✅ | ✅ VicMap | ✅ QSCF |
| 3 | Lot area | — | ✅ | ✅ derive | ✅ derive |
| 4 | Frontage | — | Planned derive | Planned | Planned |
| 5 | Zoning | — | ✅ | ✅ VicPlan | ✅ StatePlanning |
| 6 | State school catchments | — | ✅ | ✅ | ✅ |
| 7 | Beds/baths/cars | Domain | Partial | Partial | Partial |
| 8 | Building area | ✅ Microsoft proxy | Planned | Planned | Planned |
| 9 | Property features | Domain | Partial | Partial | Partial |
| 10–21 | Market block | Domain + state sales | Partial | Partial | Partial |
| 22 | VG land value | — | ✅ | ✅ Vic VG | ✅ QLD valuer |
| 23–24 | DAs | — | ✅ | ✅ SPEAR | ⚠ verify |
| 25 | Easements | — | Planned cadastre | ⚠ verify | ⚠ verify |
| 26 | Heritage | — | ✅ | ✅ overlay | ✅ overlay |
| 27 | Character overlay | — | Planned | ✅ VicPlan | ⚠ verify |
| 28 | Design controls | — | Partial FSR | Partial | Partial |
| 29 | Development potential | — | ✅ derive | Planned derive | Planned derive |
| 30–35 | Environment | — | ✅/Planned | ✅ VicPlan | ✅/⚠ |
| 36 | BAL | ❌ hard | Missing | Missing | Missing |
| 37–38 | Utilities | — | Elec Planned; sewer Missing | DNSP | DNSP |
| 39–42 | Transport | national+state | Planned | PTV | TransLink |
| 43–47 | Lifestyle | ABS national + state crime | Planned | Planned | Planned |

Legend: ✅ researched/confirmed path · Planned · Partial · ⚠ needs probe · ❌ hard nationwide

---

## Product implications

1. **Rename positioning** — from "NSW Place Analyser" to national buyer report with state badges ("Data: VicPlan + SPEAR" / "Data: NSW ePlanning").  
2. **Unsupported state** — geocode works (G-NAF) but show "VIC/QLD/NSW supported; SA coming soon" until adapter ships.  
3. **Homesnoop diff** — VIC first makes Rosebud demo reproducible; NSW was the wrong first target for that PDF.  
4. **Domain once** — national API means one commercial relationship covers market block in all three states.  
5. **Honesty lines** — national UX for BAL, sewer, title, bond rent band — same copy everywhere, state-specific broker/utility links.

---

## Next research (VIC + QLD)

Short probe pass needed before Phase 2/3 implementation (mirror NSW verification):

| Probe | VIC | QLD |
|---|---|---|
| Parcel at point | VicMap Property REST | QSCF LPPF FeatureServer |
| Rosebud / test overlay | SUZ + ESO + BPA at Wedgewood Dr | Brisbane equivalent |
| SPEAR / DA API | permit spatial layer | State/council DA layer |
| Sales at address | Vic property sales | QLD valuation sales |
| Bond XLSX schema | RTBA columns | RTA columns |
| Crime ingest | CSA CSV | QPS open data |

Save results to `cursor_review/vic-qld-source-probes.md` when run.

---

## Changelog

| When | What |
|---|---|
| 2026-08-20 23:25 AEST | Initial nationwide plan — VIC/QLD/NSW priority, tier model, coverage estimates, build order |
