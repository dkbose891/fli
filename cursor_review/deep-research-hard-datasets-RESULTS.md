# Hard datasets — research results (2026-08-20)

**Last updated:** 2026-08-20 23:16 AEST (`2026-08-20T23:16:00+10:00`)

Companion to [deep-research-hard-datasets.md](./deep-research-hard-datasets.md). Resolves Tier 4 sourcing for NSW FLI.

## Executive summary

Of the six Tier-4 datasets, only two can be shipped as clean live/cached government feeds: aircraft noise (Topic 4 — ship the NSW Planning Portal EPI Airport Noise ArcGIS layer for the Sydney basin) and a building-area proxy (Topic 1 — cache Microsoft Australia Building Footprints under ODbL as a roof-footprint proxy, clearly labelled). The market AVM (Topic 2), address-level rental history (Topic 5), and register interests/title (Topic 6) are all paid-only or genuinely not available in open data: Domain's Price Estimation and Rental AVM packages are gated commercial products with no published pricing and terms that prohibit persistent storage/derivative works and force no-index on listing pages; NSW rental bond data is postcode-only by design; and secondary interests (covenants, mortgages, non-digitised easements) live only in the LRS register, accessible per-search through paid authorised information brokers at $17.60 base (over-the-counter) to about $21.80 retail per title. Statewide sewer/water (Topic 3) is not a single layer — Sydney Water is a paid per-application diagram ($151.74 incl GST for a water supply system diagram), and most councils do not publish reticulation, so the honest move is a DNSP-style routing UX. Be blunt in the UI: FLI should ship the free layers with disclaimers, route users to paid channels for title and sewer, and either negotiate a Domain commercial deal or show only VG land value plus nearby-sales medians rather than a fabricated AVM.

## Topic 1: Geoscape floor area

### Verdict

**Ship (download+cache)** a roof-footprint proxy from Microsoft Australia Building Footprints (ODbL, free). **Paid only** for true Geoscape building area/height. Internal floor area cannot be **derived** from any free source — label honestly as "roof footprint, not internal floor area".

### Sources table

| Source | Custodian | What it gives | Access | Cost | Coverage | Licence |
|---|---|---|---|---|---|---|
| Microsoft Australia Building Footprints | Microsoft (Bing Maps) | 11,334,866 computer-generated polygon footprints, GeoJSON | GitHub download (github.com/microsoft/AustraliaBuildingFootprints) | Free | National | ODbL (share-alike + attribution) |
| Geoscape National Buildings | Geoscape Australia | Roof outline, building area, volume, height, roof material/colour, solar/pool indicators, G-NAF link | Geoscape Hub API (buildings REST) / Clip download (GDB, SHP) | Paid; "free, instant credit quote" per area, subscription via sales | National | Commercial licence |
| DCS Spatial Services Geoscape buildings | NSW DCS Spatial Services | Same Geoscape buildings layers (GDB statewide, SHP per-LGA) | Customer Hub data request | Free but **NSW Government agencies only** | NSW statewide | Restricted terms of use |
| Domain Property Enrichment / Property Package | Domain Group | buildingSize / landArea when populated | Domain API package (gated) | Commercial, unpublished | National where populated | Domain API terms |

### Recommended FLI approach

Cache the Microsoft footprints once (national GeoJSON — "11,334,866 computer generated building footprints derived using Bing Maps algorithms on satellite imagery... licensed by Microsoft under the Open Data Commons Open Database License (ODbL)"), spatially index by cadastre lot, and compute polygon area in m². Expose it in `SourceResult.summary` as `roofFootprintM2` with the label: "Approximate roof footprint from Microsoft AI-derived building outlines (ODbL). This is not internal/living floor area; treat as an area proxy only." This closes the Homesnoop "171 m²" parity gap honestly without a paid feed. Do NOT present it as "floor area". Integration: new `lib/sources/buildings.ts`, agent tool `getBuildingFootprint`, ODbL attribution ("© Microsoft, data under ODbL") in the UI footer. Because ODbL is share-alike, keep the cached footprint file as a discrete, attributed dataset; do not silently merge it into a proprietary combined DB you redistribute.

The DCS Spatial Services free Geoscape channel is closed to FLI: the October 2022 arrangement provides these datasets "for distribution exclusively to NSW Government agencies" — a Cloud Run demo app is not a government agency and does not qualify. The building-footprint SHP is only supplied as an LGA-area extract and the whole arrangement is bound by "terms of use with restricted application". If FLI later wants true building area/height, Geoscape Hub is the path: self-serve "free, instant credit quote" per area, priced by feature (Geoscape's AEC industry page shows overage rates of $0.012 and $0.015 incl. GST per feature), scaling from single-LGA to statewide. Buildings updates are applied continuously and released quarterly.

### Open questions

- Exact Geoscape subscription minimum for a startup (only overage rates are public; base plan requires a sales conversation).
- Whether Domain's buildingSize field is reliably populated off-market for NSW residential (Property Enrichment reference is gated).
- Microsoft footprint vintage for Killara/North Shore (underlying Bing imagery is 2014-2021; may miss recent rebuilds).

## Topic 2: CoreLogic-grade AVM alternative

### Verdict

**Paid only** for a real AVM (Domain Price Estimation, or Cotality/PropTrack). **Derive** a defensible band from SIX sales + VG land value if you will not pay. Recommendation: do NOT show a fabricated AVM; either sign Domain or show VG land value + nearby-sales median with explicit "not a valuation" labelling.

### Sources table

| Option | Provider | Access | Pricing | Fields | Verdict |
|---|---|---|---|---|---|
| Price Estimation package | Domain | Self-serve signup, but package must be added to a project; production launch of paid products subject to Domain review (cl 5.4) + Product Schedule (cl 2.5) | No published pricing; per-deal Product Schedule (AUD ex GST) | priceConfidence, date, lowerPrice, midPrice, upperPrice, history[] | Paid only |
| Rental AVM API | Domain | Same gating | Unpublished | rentalEstimate (fields gated, not public) | Paid only |
| PropTrack (REA) | REA Group | Docs published, access via account manager only | Per deal, unpublished | AVM fields | B2B only |
| Cotality (CoreLogic) | RP Data Pty Ltd | developer.corelogic.asia sandbox self-serve; production 401 until signed commercial licence | Median enterprise contract about $12,000/year (realestatetoolkit.ai, "based on actual buyer data"); RP Data small-agent entry "Min. cost $2,639.88 (incl. GST) over 12 months" | IntelliVal AVM, HVI | Enterprise only |
| Derive | FLI in-house | SIX sales history + VG land value (already in lib/sources/valuation.ts) | Free | Custom band | Derive |

### Recommended FLI approach

FLI already has Valuer General unimproved land value (5-yr) and SIX sales in `lib/sources/valuation.ts`. The honest no-cost path: compute a nearby-sales median from recent comparable transactions and present a range alongside the VG land value, labelled: "This is not a professional valuation or bank-grade AVM. It combines the NSW Valuer General land value and nearby recent sales. For a market estimate, see a licensed valuer or a Cotality/Domain AVM." Do not badge it "estimated market value low/mid/high" in a way that mimics an AVM confidence band.

For genuine parity with Homesnoop's low/mid/high + confidence (Homesnoop sources this from Domain Insight/APM per its PDF footer), the only realistic route is a Domain commercial agreement. Terms constraints are material: Domain's API Terms (Last Updated 13 March 2024) treat caching as *temporary* only (cl 16.5 requires deletion/destruction of all stored API data on termination), prohibit derivative works (cl 7.6(g)), prohibit storing/using the data outside Australia (cl 7.6(j) — a US-region Cloud Run deployment would breach the licence), and the go-live FAQ requires that "no price estimate data is behind a paywall". A Domain-powered AVM in FLI would therefore need AU hosting, live calls (no persistent cache), "Powered by Domain Insight" attribution, and a signed Product Schedule that Domain "has no obligation to issue" (cl 2.5). OAuth2 client-credentials flow; token generation "may be limited to not more than 3000 Requests Per Hour". Liability cap for paid products is the lesser of AUD $5,000 or fees paid in the prior 12 months (cl 13.1).

### Open questions

- Whether Domain will issue a Product Schedule to a small demo/fintech (self-serve gets you sandbox; production is gated and commercial).
- Exact Rental AVM response fields (gated; not publicly indexed).
- Accuracy of a derived band vs a real AVM in low-turnover suburbs like Killara.

## Topic 3: Statewide sewer / water infrastructure

### Verdict

**Not available** as a statewide queryable layer. **Paid only** per-property for Sydney Water ($151.74 incl GST water supply system diagram, or a cheaper service location print). Council reticulation is a **patchwork** — few NSW LGAs publish sewer mains via public ArcGIS REST. Recommended: DNSP-style routing UX, not a data layer.

### Sources table

| Source | Custodian | Coverage | Access | Cost |
|---|---|---|---|---|
| GIS asset data request (water supply system diagram) | Sydney Water | Greater Sydney, Blue Mountains, Illawarra | sydneywater.com.au / Tap in application | $151.74 incl GST (applies 1 July 2026–30 June 2027) |
| Service location print / sewer service diagram | Sydney Water | Same | Tap in (register) or Property Link broker | Lower conveyancing fee + broker fee |
| Before You Dig Australia (BYDA) | National referral | National | Online enquiry | Free (plans mailed, not queryable) |
| Council sewer MapServers (e.g. Randwick SewerMain) | Individual councils | Single LGA each | Public ArcGIS REST where published | Free where available |
| NSW Cadastre easement layer | DCS Spatial Services | Statewide | maps.six.nsw.gov.au ArcGIS REST | Free (digitised easements only) |

### Recommended FLI approach

There is no statewide sewer/water reticulation REST layer in NSW open data — the NSW cadastre and Land Parcel/Property theme carry cadastral easements and water *features* (rivers, boundaries), not utility reticulation mains. Sydney Water holds the Greater Sydney network internally and sells it per-application: its GIS asset data request page states "A water supply system diagram application costs $151.74 (including GST)", and a service location print / sewer service diagram is the cheaper conveyancing product ordered via Sydney Water Tap in or a Property Link broker. Some councils (e.g. Randwick City Council publishes a public SewerMain MapServer) expose mains, but this is a patchwork — most do not, and where they do it is often stormwater rather than sewer.

Best FLI behaviour: mirror the DNSP pattern already used for electricity. Detect the servicing utility from the address (Greater Sydney → Sydney Water; Hunter → Hunter Water; regional → local council/county council) and render: "This property is in the Sydney Water service area. FLI does not hold reticulation data. Order a Service Location Print or GIS asset diagram from Sydney Water Tap in before any excavation or build." Show the digitised cadastre easement polygons FLI already has, with the caveat that not all sewer easements are digitised. Do not show "no infrastructure identified" as if it were authoritative — that risks a false-negative before-you-dig outcome, which is exactly the failure mode Homesnoop hedges against.

Coverage of NSW population with a free, queryable public sewer REST is low. Sydney Water services the majority of NSW's population but only via paid per-property diagrams, not a REST query; council-published sewer REST covers a small minority of LGAs. Effective free-and-queryable coverage is a single-digit percentage of population.

### Open questions

- A verified count of NSW LGAs publishing sewer (not stormwater) mains via public ArcGIS REST (needs an endpoint inventory sweep of top-20 LGAs).
- Whether Sydney Water offers any bulk/enterprise data-share for proptech (public posture is per-application only).
- Hunter Water / Central Coast open data posture.

## Topic 4: Flight-path frequency raster (aircraft noise)

### Verdict

**Ship (API)** for the Sydney basin and other NSW airports: the NSW Planning Portal EPI "Airport Noise" ArcGIS layer is a free, queryable ANEF contour service. This is a land-use ANEF contour, NOT a flights-per-day raster — label accordingly. A true N70 "planes per day" raster like Homesnoop's is Airservices/airport-specific and mostly not a national point-query API.

### Sources table

| Source | Custodian | What | Access | Licence |
|---|---|---|---|---|
| EPI Protection — Airport Noise | NSW Dept of Planning, Housing & Infrastructure | Airport-noise EPI contour polygons | ArcGIS REST: mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/Protection/MapServer (+ WMS/WFS) | CC-BY |
| ANEF/ANEI charts | Airservices Australia | ANEF contours (20-40 units); N70 "how often" contours | Tailored data order form, airport-specific | Redistribution restricted |
| Defence Airfields ANEF | Dept of Defence | ANEF/ANEC KML for defence bases | data.gov.au download | Open |
| Council ANEF layers (e.g. Randwick ANEF2039) | Individual councils | Sydney Airport 2039 ANEF contours | Council ArcGIS REST | Council terms |

### Recommended FLI approach

Ship a point query against the NSW Planning Portal Protection MapServer's Airport Noise layer (licence: Creative Commons Attribution; update frequency: as needed; equivalent scale 320,000; temporal coverage from 2018-03-23). This resolves whether an address falls in an ANEF contour — the same authoritative dataset councils and certifiers use. Label it: "Aircraft noise — ANEF contour (a land-use planning measure), not a live flights-per-day count. ANEF units reflect cumulative annual noise, not frequency." For the Sydney basin this covers Kingsford Smith.

FLI cannot cleanly replicate Homesnoop's "~2 / ~10 / 20+ planes per day below 10,000 ft" band, which is an N70-style frequency product. N70 contours come from Airservices' Noise and Flight Path Monitoring System and are released per airport via a tailored data order form with redistribution restrictions — not a national point-query API. OpenSky/ADS-B self-computation is not viable for production (coverage gaps below 10,000 ft, licensing/compute burden, and it would be a home-grown model FLI would have to defend). Recommendation: ship the ANEF layer for a defensible "in noise contour / near airport" heuristic and cite the limitation rather than fabricating a frequency number.

Integration: extend `lib/sources/hazard.ts` (already does BFPL + flood ArcGIS point queries) with an `airportNoise` query; agent tool `getAircraftNoise`; attribution "© State Government of NSW and NSW Dept of Planning, Housing & Infrastructure 2018".

### Open questions

- The exact layer index and field names inside the Protection MapServer Airport Noise sublayer (the `?f=pjson` service endpoint could not be fetched directly this pass; confirm the ANEF field and contour value attribute against the live service, then hardcode the sublayer id).
- Whether Airservices' Sydney N70 contours can be licensed for display (would give true frequency parity).

## Topic 5: Address-level rental history

### Verdict

**Not available** at address level from open data — NSW rental bond data is postcode-only by design and privacy-appropriate. **Paid only** (Domain) for property-level rental events/estimate. Best honest FLI behaviour: show a postcode/bedroom IQR band from bond data, not a fake address-level history.

### Sources table

| Source | Custodian | Granularity | Fields | Access | Cost |
|---|---|---|---|---|---|
| Rental bond lodgement data | NSW Fair Trading / Rental Bond Board | **Postcode** (no address) | postcode, dwelling type, number of bedrooms, weekly rent, bond amount | Monthly XLSX at nsw.gov.au; also Data.NSW CKAN Data API | Free |
| Rental AVM API | Domain | Property-level estimate | rentalEstimate (gated fields) | Domain package (gated) | Paid, unpublished |
| Property listing history | Domain | Property-level (when listed) | listing events incl leases | Property Package (gated) | Paid |
| Rent Check (Tenants Union) | Tenants Union NSW | Postcode/bedroom IQR | median + quartile bands | Derived from bond data | Free tool |

### Recommended FLI approach

NSW rental bond lodgement data has no address field — it is aggregated to postcode with dwelling type and bedroom count, and is "provided by the agent or landlord at the beginning of a tenancy". This is a deliberate privacy design (bonds are anonymised at postcode level), and ethically, address-level rental history should not be surfaced in a buyer report even if obtainable, because it exposes a specific tenancy's rent. The correct FLI behaviour for "what did this place rent for before?" is a postcode + bedrooms + dwelling-type band using the Rent Check IQR methodology: "Homes of this type in postcode 2071 rented for a median of $X/week (IQR $Y-$Z) in [month], per NSW Fair Trading bond lodgements. FLI cannot show this specific property's rental history — that is not published at address level, for privacy reasons."

If FLI wants property-level rental events (Homesnoop's rental history section when populated), that requires Domain's Property Package (listing history) and/or Rental AVM API — both gated commercial packages under the same storage/attribution constraints as Topic 2. Domain listing history only captures periods when the property was actually advertised on Domain, so it is patchy off-market.

Integration: `lib/sources/rental.ts`, load the monthly bond XLSX into a cached postcode lookup, agent tool `getRentBand`. Cache strategy: the bond XLSX is published monthly (e.g. "Rental bond lodgement data - December 2025 (XLSX 655.71KB)"), so a monthly cron re-ingest is sufficient; label with the source month.

### Open questions

- Exact column headers/legend in the current monthly XLSX (each file ships a legend sheet describing content; ingest should parse it).
- Whether Domain listing history reliably returns lease events for NSW off-market properties.

## Topic 6: LRS title (easements, covenants, mortgages)

### Verdict

**Paid only** per-search via authorised information brokers ($17.60 base to about $21.80 retail per title). **Not available** as an open feed or consumer read API. FLI should extend its existing "ownership not available" boundary to "secondary interests (covenants, mortgages, non-digitised easements) require a paid title search" and offer a per-click broker handoff.

### Sources table

| Source | Custodian | What | Access | Cost |
|---|---|---|---|---|
| Torrens Title Search | NSW LRS (Australian Registry Investments) | Owner, encumbrances, mortgages, caveats, notifications | Authorised information broker (retail sales via brokers since 2017) | $17.60 incl GST over-the-counter base (includes $5.35 Torrens Assurance Fund levy); retail e.g. Landchecker $20.34, Direct Info $21.80 |
| Section 88B instrument | NSW LRS | Easement/covenant terms referenced on plan | Via broker | Per-document fee |
| Free LRS online portal searches | NSW LRS | Street address inquiry, title reference lookup, CRE, land value, plan inquiry | online.nswlrs.com.au (free, no login) | Free (identifiers only, not full title) |
| Cadastre easement polygons | DCS Spatial Services | Digitised easements (geometry) | maps.six.nsw.gov.au ArcGIS REST | Free |
| PEXA | PEXA | Settlement/lodgement exchange | Practitioner-only (subscriber members) | No consumer read API |

### Recommended FLI approach

The register (covenants, mortgages, caveats, and easements not digitised on the cadastre) is only available through a Torrens Title Search, and since 2017 all retail title purchases in NSW go through authorised information brokers — the NSW Registrar General confirms title searches and plans "are available electronically to information brokers", with InfoTrack, Landchecker and Direct Info listed as authorised NSW LRS brokers. There is no free open feed and no consumer read API. Free LRS portal searches return only identifiers (title reference from street address, cadastral records enquiry), not the full title with encumbrances. PEXA is a practitioner settlement exchange, not a consumer data API.

The cadastre easement layer FLI already surfaces shows *digitised* easement geometry; it diverges from the register because (a) not all easements are digitised (older/complex easements exist only as text in the Section 88B instrument), and (b) covenants and mortgages are never spatial. So the cadastre layer is necessary but not sufficient.

FLI policy recommendation: extend the existing honesty line. Show digitised easements from the cadastre with the caveat "digitised easements only". Then state plainly: "Covenants, mortgages, caveats and non-digitised easements are recorded on the LRS title register, not in open data. FLI cannot show these. Order a title search (about $20-$22) from an authorised broker." Offer an outbound link/handoff to a broker rather than reselling titles in-app.

Cost model — per-click title in app vs hard boundary: a per-click model would require FLI to become or integrate an authorised information broker (compliance overhead, reseller terms). For a demo/startup, the cleaner path is a hard "not in open data" boundary with an outbound broker link. If FLI later monetises, an InfoTrack/Landchecker affiliate or reseller integration at about $20 cost + margin is the model. The LRS base fee is $17.60 incl GST (over-the-counter, including the $5.35 Torrens Assurance Fund levy); broker retail runs $20.34 (Landchecker) to $21.80 (Direct Info).

### Open questions

- Whether any broker offers a clean REST API to embed per-click title ordering (InfoTrack has integrations but access is "arrange a demonstration", not self-serve keys).
- Reseller terms for displaying title contents to end users (redistribution/attribution constraints per broker).

## Appendix: links and probe commands

### Verified endpoints and probe examples

**Test address:** 26 Calvert Avenue, Killara NSW 2071 (approx -33.767, 151.155). Use lat/long, or a point in EPSG:3857 (Web Mercator) for ArcGIS `identify`/`query`.

**Topic 1 — Microsoft Australia Building Footprints (ODbL, free download):**

```
https://github.com/microsoft/AustraliaBuildingFootprints
# Load once, spatially index by cadastre lot, compute polygon area m2
```

**Topic 1/6 — NSW Cadastre (lot + digitised easements), free ArcGIS REST:**

```
https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Cadastre/MapServer
curl "https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Cadastre/MapServer/9/query?geometry=16825000,-4008000&geometryType=esriGeometryPoint&inSR=102100&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=true&f=json"
https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Cadastre/MapServer/layers?f=pjson
```

**Topic 4 — NSW Planning Portal EPI Airport Noise (ANEF), free ArcGIS REST + WMS + WFS:**

```
https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/Protection/MapServer
https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/Protection/MapServer?f=pjson
https://mapprod3.environment.nsw.gov.au/arcgis/services/Planning/Protection/MapServer/WMSServer?request=GetCapabilities&service=WMS
https://mapprod3.environment.nsw.gov.au/arcgis/services/Planning/Protection/MapServer/WFSServer?request=GetCapabilities&service=WFS
```

**Topic 4 — council ANEF (Sydney Airport 2039), Randwick example (field: `anef`, values 20/25/30/35/40):**

```
https://mapservices.randwick.nsw.gov.au/arcgis/rest/services/intPlanning/AircraftNoiseANEF2039/MapServer/0?f=pjson
```

**Topic 3 — council sewer main (Randwick example, patchwork; layer name SewerMain, GDA94 MGA Zone 56):**

```
https://mapservices.randwick.nsw.gov.au/arcgis/rest/services/intStormwater/SewerMain/MapServer
```

**Topic 3 — Sydney Water paid diagrams (no API):**

```
https://www.sydneywater.com.au/plumbing-building-developing/building/sydney-water-tap-in/gis-asset-data-request.html
https://www.sydneywater.com.au/plumbing-building-developing/plumbing/diagrams-prints.html
```

**Topic 5 — NSW rental bond data (monthly XLSX, free; postcode/beds/dwelling type/weekly rent):**

```
https://www.nsw.gov.au/housing-and-construction/rental-forms-surveys-and-data/rental-bond-data
```

**Topic 2 — Domain Price Estimation (gated, paid):**

```
GET https://api.domain.com.au/v1/properties/{propertyId}/priceEstimate
# OAuth2 client_credentials; AU-hosting required; no persistent cache
```

**Topic 6 — NSW LRS free identifier searches / paid broker title:**

```
https://online.nswlrs.com.au/
# Full title via broker: LRS base $17.60 incl GST; Landchecker ~$20.34; Direct Info ~$21.80
```

### Verdict column updates for homesnoop-fli-dataset-sourcing.md

| Topic | Verdict |
|---|---|
| 1 Geoscape / floor area | **Ship (download+cache)** — Microsoft ODbL roof footprint; Geoscape paid; DCS gov-only |
| 2 AVM | **Paid only / Derive** — VG + nearby-sales band; or Domain commercial (AU-host, no cache) |
| 3 Sewer/water | **Not available (route to paid)** — DNSP UX; Sydney Water Tap in $151.74 |
| 4 Flight paths | **Ship (API)** — EPI Airport Noise ANEF; label not flights/day |
| 5 Rental history | **Not available at address / Derive** — bond postcode IQR band |
| 6 LRS title | **Paid only** — broker handoff $17.60–$21.80 |

## Changelog

| When | What changed |
|---|---|
| 2026-08-20 23:16 AEST | Initial results from deep-research pass (Claude). Closes Tier 4 open questions in sourcing doc. |
