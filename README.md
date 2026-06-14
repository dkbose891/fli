# NSW Property Agent

Ask about NSW land parcels in plain English and see them drawn on a live map. A Gemini agent on Vertex AI translates your question into a cadastral query, hits the **live NSW Cadastre** service, and grounds its answer in real parcel IDs — no data stored, every query live.

![screenshot placeholder](docs/screenshot.png)

## Architecture

```
Browser (React + MapLibre GL)
        │  POST /api/chat
        ▼
Next.js on Cloud Run  ──►  Gemini 2.5 Flash (Vertex AI) ── function calling
        │                            │  query_cadastre(where, max_features)
        │                            ▼
        └──────────────►  NSW Cadastre ArcGIS REST (live, anonymous)
                                     │  Esri JSON (WGS84)
                                     ▼
                          Esri → GeoJSON  →  drawn on the map
```

- **Frontend:** Next.js 15 (App Router) / React 19, MapLibre GL via `react-map-gl/maplibre`, OpenFreeMap basemap (no key).
- **Agent:** `@google/genai` in Vertex mode with native function calling. One tool, `query_cadastre`, takes an ArcGIS SQL `where` clause the model builds from plain English.
- **Data:** NSW Cadastre `FeatureServer/8` (Lot layer). The live service only returns Esri JSON, so the proxy requests WGS84 and converts to GeoJSON with `@terraformer/arcgis`.
- **Auth:** Application Default Credentials — **no key files anywhere**.

## Run locally

```bash
npm install
cp .env.example .env          # set GOOGLE_CLOUD_PROJECT to your project id
gcloud auth application-default login
npm run dev                   # http://localhost:3000
```

One-time GCP setup:

```bash
gcloud config set project YOUR_PROJECT_ID
gcloud services enable aiplatform.googleapis.com run.googleapis.com cloudbuild.googleapis.com
```

## Deploy to Cloud Run

```bash
gcloud run deploy nsw-property-agent \
  --source . \
  --region australia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_GENAI_USE_VERTEXAI=true,GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID,GOOGLE_CLOUD_LOCATION=australia-southeast1,GEMINI_MODEL=gemini-2.5-flash,CADASTRE_URL=https://portal.spatial.nsw.gov.au/server/rest/services/NSW_Land_Parcel_Property_Theme/FeatureServer/8/query
```

If the Cloud Run service account can't reach Vertex:

```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

## Try it

- `show me lot 1 in DP270928` → draws the parcel, cites `1//DP270928`
- `show me 8 lots bigger than 1000 square metres` → a capped set of polygons
- `who owns 10 Smith St?` → honestly declines (out of scope for v1)

## Limitations (v1)

This layer exposes **lot / plan / area only**. It does **not** know about addresses, suburbs, ownership, zoning, flood, or bushfire. The agent is instructed to say so plainly rather than guess.

## Roadmap (v2)

- **MCP server** wrapping the cadastre data as reusable tools
- **Multi-agent orchestration** (Google ADK) with ReAct / self-reflection / hierarchical delegation
- **Supabase-backed** clean, enriched dataset (addresses, suburbs) behind a RAG layer
- **Evaluation + observability** harness: accuracy/safety/latency, tokens/sec and cost-per-request tracing

## Attribution

Cadastre data © State of New South Wales (Spatial Services). CC BY.
