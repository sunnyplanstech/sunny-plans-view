# DuckDB-WASM data path (no-backend mode)

This branch makes the frontend read the listing/parcel data **directly from
public parquet files using DuckDB-WASM in the browser**, replacing the Django
API + Cloud SQL serving layer. The goal: run Sunnyplans as a free, read-only
tool with no VM and no database.

## How it works

Every data read still goes through the same `publicApi(path)` /
`optionalAuthApi(path)` calls and the same query keys and TypeScript types.
The only change is the import source: those functions now come from
`@/lib/duckdb/api` instead of `@/lib/apiClient`.

- `src/lib/duckdb/client.ts` — lazy single DuckDB-WASM instance (jsDelivr
  bundle, instantiated on first query → only on the map route).
- `src/lib/duckdb/datasets.ts` — maps each mart to a published parquet URL
  under `VITE_DATA_BASE_URL`.
- `src/lib/duckdb/api.ts` — a router that takes the exact API path strings
  the app already builds, runs the equivalent SQL over `read_parquet(...)`,
  and returns the exact JSON shapes the Django endpoints returned (listing
  arrays, GeoJSON FeatureCollections, the detail object).

**Safe fallback:** if `VITE_DATA_BASE_URL` is empty, `publicApi` /
`optionalAuthApi` delegate to the real Django client — so local/dev with the
backend up keeps working unchanged. The DuckDB path activates only when the
data bucket is configured.

## What this drops

There is no backend, so there is no premium unlock. Only the **obfuscated
public marts** are published (jittered coordinates, perturbed prices/areas,
no source URL / cadastral id). Every listing is served with
`access_granted: false` and paid fields masked as `"****"`. Auth, signup,
Stripe, and the `/listing/:id` unlock flow no longer function (their code
still compiles but the endpoints don't exist). A follow-up should hide the
login/upgrade UI; until then those buttons simply fail.

`/listing/:id` detail is served from the `*_public_top` slices, so detail
works for every listing the map/browse list can surface (both read the same
top slices). Ids outside the top slice 404 — acceptable since nothing links
to them.

## What's required to go live (pipeline + infra — NOT done on this branch)

1. **Publish single-file public marts to a public bucket.** DuckDB-WASM
   cannot glob a remote directory, so the two hive-partitioned marts
   (`mart_us_counties` by state_code, `mart_it_provinces` by region) must be
   written as ONE file each. Add a Dagster asset (e.g.
   `publish_browser_data`) that reads each serving mart and writes a single
   parquet to `gs://sunnyplans-data-eu/` with these exact names (see
   `datasets.ts`):

   | source mart | published file |
   |---|---|
   | `mart_us_listings_public_top` | `us_listings_public_top.parquet` |
   | `mart_it_parcels_public_top` | `it_parcels_public_top.parquet` |
   | `mart_us_states` | `us_states.parquet` |
   | `mart_us_counties` (combine partitions) | `us_counties.parquet` |
   | `mart_it_regions` | `it_regions.parquet` |
   | `mart_it_provinces` (combine partitions) | `it_provinces.parquet` |

   All six are small (top slices <5 MB; polygon marts ≤3k rows), so a single
   file per mart is fine. Only publish the `_public` / `_public_top` marts —
   never the full-precision `mart_us_listings` / `mart_it_parcels`.

2. **Create the public bucket + CORS.** Same pattern as
   `gs://sunnyplans-tiles-eu`:

   ```bash
   gcloud storage buckets create gs://sunnyplans-data-eu \
     --project=sunnyplans --location=europe-west10 --uniform-bucket-level-access
   gcloud storage buckets add-iam-policy-binding gs://sunnyplans-data-eu \
     --project=sunnyplans --member=allUsers --role=roles/storage.objectViewer
   gcloud storage buckets update gs://sunnyplans-data-eu \
     --project=sunnyplans --cors-file=pipelines/scripts/gcs-cors-tiles.json
   ```

   CORS must allow `GET`/`HEAD` + the `Range`/`Content-Range`/`Accept-Ranges`
   headers from the site origin — `gcs-cors-tiles.json` already does this for
   PMTiles; reuse it or add a `-data` variant.

3. **Set the Netlify env var** (public, `is_secret=false`, all scopes):
   `VITE_DATA_BASE_URL=https://storage.googleapis.com/sunnyplans-data-eu`

4. **Then** the VM's `django` container and Cloud SQL can be retired for
   sunnyplans (the pipeline still bakes + publishes marts on demand).

## Status / testing

The frontend compiles (`vite build` clean) and the wasm bundle is a separate
lazy chunk. It has **not** been run end-to-end — that needs the published
data + CORS from step 1–3. First smoke test after publishing: open
`/solar/app/united-states`, confirm the states choropleth and a state's
listings load, and check the Network tab shows ranged `206` reads of the
parquet files.
