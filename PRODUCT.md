# Product — NSW Place Analyser

One sentence: **ask anything about a NSW property and get a grounded answer from live government data, drawn on a map.**

This document is the product view: who it's for, what questions it answers, and what's next. Architecture and setup live in the README.

## Personas and their questions

**The home buyer (due diligence).** Found a listing on Saturday, wants the truth by Sunday.
> What is this place? How big is the block? What's the zoning? Is it bushfire or flood prone? Any heritage catch? Which school catchments? What's the land actually worth? What sold nearby?

**The investor (screening).** Compares suburbs and properties, cares about numbers.
> Land value and trend over five years? What did comparable properties sell for? What kind of area is this (income, renters, age)? What's the rent like?

**The developer (feasibility).** Sees a site, wants a fast first read before paying consultants.
> What could I build here — FSR × area, height in storeys? Is the lot subdividable under the minimum lot size? Any overlays that kill the deal (heritage, acid sulfate, landslide)? What DAs are being approved around here?

## The question map

| Question | Persona | Status | Data source (all free, live, anonymous) |
|---|---|---|---|
| What is this parcel (lot, plan, size)? | all | ✅ live | NSW Cadastre; area computed from boundary when the cadastre lacks it |
| Zoning / FSR / height / min lot size / heritage | all | ✅ live | NSW ePlanning EPI layers |
| Bushfire / flood | B/D | ✅ live | NSW Planning Portal hazard layers |
| Find a property by address | all | ✅ live | Addressr (G-NAF) — quota-limited, cached |
| **What's the land worth (5-yr history)?** | B/I | **P0 — building** | Valuer General via SIX Valuation service |
| **What sold nearby, for how much?** | B/I | **P0 — building** | SIX property sales layer |
| **What could I build here?** | D/B | **P0 — building** | computed from existing planning controls |
| **Which school catchments?** | B | **P0 — building** | NSW DoE School Finder (CARTO) |
| **What's being built around here (DAs)?** | all | **P0 — building** | NSW ePlanning DA Tracking |
| **Full picture as a report card** | all | **P0 — building** | UX over all tools |
| Suburb demographics (income, rent, age, renters) | I | P1 | ABS Census 2021 API (SA2) |
| More risk overlays: acid sulfate, salinity, landslide | B/D | P1 | NSW ePlanning Protection/Hazard layers |
| What's nearby (parks, hospitals, stations)? | B | P1 | NSW POI service |
| Elevation / slope | D | P1 | NSW 5m DEM |
| Catchments as a map layer | B | P1 | as above |
| Photorealistic 3D buildings | all | P2 (parked) | Google Map Tiles API — needs key |
| Compare two properties side by side | all | P2 | existing tools |
| Current median rents | I | P2 | no live source (see honesty section) |

## Data honesty

The product only claims what its sources can support:

- **Live and free (used):** everything above marked live/P0/P1 — NSW Spatial Services, ePlanning, Valuer General (via SIX), DoE, ABS. No keys except Addressr.
- **Not live:** NSW rental bond data (median rents) is monthly Excel downloads only — no API. We say so rather than guessing; ABS 2021 census rent and recent sales serve as proxies.
- **Paid, out of scope:** market valuations (beyond VG land value), listings, sales comparables at CoreLogic quality, ownership (NSW Land Registry), commute times (keyed APIs).
- **Always labelled:** land values are *unimproved land values* (not market price); planning/hazard answers are indicative, not legal advice; development potential is arithmetic on published controls, not planning advice.

## Principles

1. **Token discipline** — map interaction and data fetching are deterministic API calls; the LLM is only used to reason and narrate. Clicking is free; asking is cheap.
2. **No storage** — every answer is fetched live at question time; nothing to go stale.
3. **Honest by construction** — tools return what the source returned; gaps are stated, never filled in.

## Backlog

- **P0 (in progress):** land value + sales tools, development potential, school catchments, nearby DAs, report card.
- **P1:** census suburb profile, extra risk overlays, POI, elevation, catchment map layer.
- **P2:** photorealistic 3D (Google Map Tiles), property comparison, workflow agents (shortlist builder, suburb deep-research), evaluation harness + observability (see tutorial.md).
