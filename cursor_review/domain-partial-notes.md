# Domain access — Partial (until resolved)

**Status:** **Partial** — we believe Domain **suburb stats** and **property history** access exists (credentials / packages on hand or in progress), but FLI has **not** wired or validated endpoints yet. Do not mark market fields **Have** until probe + integration complete.

**Last updated:** 2026-08-20 22:35 AEST

---

## What we think we have

| Capability | Domain package (portal) | Scope | Notes |
|---|---|---|---|
| Suburb performance / medians / DOM | Properties & Locations | `api_suburbperformance_read` | Granted on default signup (verify on our project) |
| Suburb historical series | Properties & Locations | same | `GET /v1/suburbHistorical/{state}/{suburb}/{postcode}` |
| Suburb summary | Properties & Locations | same | `GET /v1/suburbSummary/...` |
| Listings search (sale + rent) | Agents & Listings | `api_listings_read` | See `research-live-listings.md` |
| Property suggest / id | Address + Property | `api_properties_read`, `api_addresslocators_read` | `GET /v1/properties/_suggest` |
| Sale + listing history | Property Enrichment (?) | TBD | **Confirm package enabled** — `property_sales_history_get`, `property_listing_history_get` |
| Price AVM | Price Estimation (?) | `api_avm_read` | **Separate negotiation** — not default signup |
| Rental AVM | Rental AVM (?) | `api_avm_read` | Same |

**Action:** fill “?” after logging into [developer.domain.com.au](https://developer.domain.com.au/) → project → enabled packages + scopes.

---

## Variables to map (Homesnoop → Domain)

### Suburb performance — `GET /v2/suburbPerformanceStatistics/{state}/{suburb}` (+ optional postcode)

Homesnoop fields → resolve exact JSON paths on first live response:

| Homesnoop field | Expected Domain source | JSON path (TBD on probe) |
|---|---|---|
| Median sale price | suburb performance | e.g. `series.medianSoldPrice` |
| Median rent | suburb performance | rental series |
| Days on market | suburb performance | `daysOnMarket` or equivalent |
| Quarterly sale trend chart | suburb performance or historical | time series array |
| Quarterly rent trend chart | same | time series array |

Probe:

```bash
# OAuth client-credentials first → Bearer token
curl -s "https://api.domain.com.au/v2/suburbPerformanceStatistics/NSW/Killara/2071" \
  -H "Authorization: Bearer $TOKEN" | jq 'keys'
```

Cache: weekly refresh in `data/domain-cache.json` (dev only) — suburb series change slowly.

### Suburb historical — `GET /v1/suburbHistorical/{state}/{suburb}/{postcode}`

| Homesnoop field | Notes |
|---|---|
| Longer-run medians | 10yr annual used in community scripts (PropertyPy) |
| Property type / bedroom splits | check if request params filter house/unit |

### Property / listing history — Property Enrichment package

Homesnoop fields → resolve on probe with Killara demo or known Domain property id:

| Homesnoop field | Expected endpoint | Fields to capture |
|---|---|---|
| Subject sale history (date, price, agency, DOM) | sales history | `saleDate`, `price`, `agency`, `daysOnMarket` |
| Subject rental history | listing history | lease events if present |
| Growth since last sale | derive | last sale price + current AVM mid |
| Beds / baths / cars (off-market) | `GET /v1/properties/{id}` or enrichment | `bedrooms`, `bathrooms`, `carSpaces` |
| Building floor area | listing or property record | `buildingSize`, `buildingSizeUnit` |
| Features | listing search or enrichment | `features[]` |

Probe flow:

1. `GET /v1/properties/_suggest?q=26+Calvert+Avenue+Killara+NSW`
2. Note `propertyId`
3. Hit history + enrichment endpoints; log 403 vs 200 (package gate)

### AVM block — Price Estimation + Rental AVM (if licensed)

| Homesnoop field | Endpoint | Fields to capture |
|---|---|---|
| Low / mid / high estimate | `GET /v1/properties/{id}/priceEstimate` | `lowerPrice`, `midPrice`, `upperPrice`, `confidence` |
| Rental estimate band | `GET /v1/properties/{id}/rentalEstimate` | weekly band |
| Estimated yield | derive | `(midRent*52)/midPrice` |
| High confidence label | priceEstimate | `confidence` enum |

**Label in FLI:** “Domain automated estimate — not a formal valuation” (same honesty as VG vs market).

### Listings nearby — already researched

| Homesnoop field | Request | Fields |
|---|---|---|
| Nearby for sale | `POST /v1/listings/residential/_search` | geo radius, `bedrooms`, `bathrooms`, `carspaces`, `price`, `listingSlug`, `dateListed` |
| Nearby for rent | same, rent listing type | `bond`, `rentPerWeek` |

---

## Resolution checklist (move Partial → Have)

- [ ] Confirm OAuth client id/secret in `.env.local` (never commit)
- [ ] List enabled packages on Domain developer project
- [ ] Save redacted sample JSON for suburb performance (Killara 2071)
- [ ] Save redacted sample for property suggest + history on demo address
- [ ] Document rate limits (`X-Quota-PerDay-Remaining`) and cache policy
- [ ] Implement `lib/sources/domain.ts` + agent tools
- [ ] Update [homesnoop-fli-coverage.md](./homesnoop-fli-coverage.md) row statuses

---

## Changelog

| When | What |
|---|---|
| 2026-08-20 22:35 AEST | Created — Partial status, variable map, probe commands, resolution checklist |
