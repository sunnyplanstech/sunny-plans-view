// Drop-in replacement for the data-read half of @/lib/apiClient, backed by
// DuckDB-WASM over public parquet instead of the Django API. It accepts the
// SAME path strings the app already builds (e.g.
// "/api/listings/public/?limit=50&state_code=TX") and returns the SAME JSON
// shapes the Django endpoints returned, so call sites only swap the import.
//
// Only anonymous reads are reimplemented. There is no backend, so there is
// no premium unlock: every listing is served from the obfuscated public
// mart with access_granted=false (paid fields masked as "****"). Auth and
// Stripe still live in @/lib/apiClient and simply don't function here.

import {
  ApiError,
  publicApi as djangoPublicApi,
  optionalAuthApi as djangoOptionalAuthApi,
} from "@/lib/apiClient";
import { runQuery, sqlStr } from "./client";
import { datasetUrl, DATA_BACKEND_ENABLED, type DatasetName } from "./datasets";

// ---- shaping helpers --------------------------------------------------

type Row = Record<string, unknown>;

function parseJson<T>(value: unknown): T | null {
  if (value == null) return null;
  if (typeof value === "string") return JSON.parse(value) as T;
  return value as T;
}

const MASK = "****";

// Fields the Django serializers gate behind a subscription. With no backend
// there's no unlock, so they're always masked. (The public mart already
// omits property_url / foglio / particella entirely; we still mask the keys
// the detail UI expects to find.)
const US_PAID = [
  "list_price",
  "lot_acres",
  "lot_sqft",
  "price_per_acre",
  "price_per_sqft",
  "sqft",
  "last_verified_at",
] as const;
const IT_PAID = ["area_m2", "area_ha", "foglio", "particella"] as const;

// ---- listings (browse/list) ------------------------------------------

const US_LIST_COLS = `id, state_code, county, geom_json::VARCHAR AS geom_json,
  location_accuracy_m, prob_solar, score, contributions::VARCHAR AS contributions,
  rank_global, rank_in_state, rank_in_county, list_price, lot_acres, flat_5_acres,
  flat_5_acres_pct, ghi_kwh_m2_yr, dni_kwh_m2_yr, pv_specific_yield_kwh_kwp_yr,
  power_substation`;

const IT_LIST_COLS = `id, comune_name, comune_slug, region_slug,
  geom_json::VARCHAR AS geom_json, location_accuracy_m, prob_solar, score,
  contributions::VARCHAR AS contributions, area_ha, flat_5_acres, flat_5_acres_pct,
  ghi_kwh_m2_yr, dni_kwh_m2_yr, pv_specific_yield_kwh_kwp_yr, power_substation,
  rank_global, rank_in_comune`;

/** Build the WHERE/ORDER/LIMIT tail shared by both countries' list queries. */
function listTail(
  params: URLSearchParams,
  filters: { col: string; eq?: string; ieq?: string }[],
  rankCol: string,
): string {
  const where = [`${rankCol} IS NOT NULL`];
  for (const f of filters) {
    if (f.eq != null) where.push(`${f.col} = ${sqlStr(f.eq)}`);
    if (f.ieq != null) where.push(`lower(${f.col}) = lower(${sqlStr(f.ieq)})`);
  }
  const minFlat = params.get("min_flat_5_acres");
  if (minFlat != null && minFlat !== "") {
    where.push(`flat_5_acres >= ${Number(minFlat)}`);
  }
  const limit = Math.min(Number(params.get("limit") ?? 50), 1000);
  return `WHERE ${where.join(" AND ")} ORDER BY ${rankCol} LIMIT ${limit}`;
}

function shapeListing(row: Row): Row {
  return {
    ...row,
    geom_json: parseJson(row.geom_json),
    contributions: parseJson<Record<string, number>>(row.contributions),
  };
}

async function usListings(params: URLSearchParams): Promise<Row[]> {
  const stateCode = params.get("state_code") ?? undefined;
  const county = params.get("county") ?? undefined;
  const rankCol = county ? "rank_in_county" : stateCode ? "rank_in_state" : "rank_global";
  const tail = listTail(
    params,
    [
      { col: "state_code", eq: stateCode },
      { col: "county", ieq: county },
    ],
    rankCol,
  );
  const rows = await runQuery(
    `SELECT ${US_LIST_COLS} FROM read_parquet(${sqlStr(datasetUrl("usListings"))}) ${tail}`,
  );
  return rows.map(shapeListing);
}

async function itListings(params: URLSearchParams): Promise<Row[]> {
  const regionSlug = params.get("region_slug") ?? undefined;
  const comuneSlug = params.get("comune_slug") ?? undefined;
  const rankCol = comuneSlug
    ? "rank_in_comune"
    : regionSlug
      ? "rank_in_region"
      : "rank_global";
  const tail = listTail(
    params,
    [
      { col: "region_slug", eq: regionSlug },
      { col: "comune_slug", eq: comuneSlug },
    ],
    rankCol,
  );
  const rows = await runQuery(
    `SELECT ${IT_LIST_COLS} FROM read_parquet(${sqlStr(datasetUrl("itListings"))}) ${tail}`,
  );
  return rows.map(shapeListing);
}

// ---- polygons (GeoJSON FeatureCollection) ----------------------------

async function featureCollection(
  dataset: DatasetName,
  propCols: string[],
  filter?: { col: string; eq: string },
): Promise<unknown> {
  const where = filter ? `WHERE ${filter.col} = ${sqlStr(filter.eq)}` : "";
  const rows = await runQuery(
    `SELECT ${propCols.join(", ")}, geom_json::VARCHAR AS geom_json
     FROM read_parquet(${sqlStr(datasetUrl(dataset))}) ${where}`,
  );
  return {
    type: "FeatureCollection",
    features: rows.map((row) => {
      const { geom_json, ...properties } = row;
      return { type: "Feature", geometry: parseJson(geom_json), properties };
    }),
  };
}

// ---- detail ----------------------------------------------------------

async function detailFrom(
  dataset: DatasetName,
  id: string,
  country: "us" | "it",
  paid: readonly string[],
): Promise<Row | null> {
  const rows = await runQuery(
    `SELECT * EXCLUDE (geom_json, contributions),
            geom_json::VARCHAR AS geom_json, contributions::VARCHAR AS contributions
     FROM read_parquet(${sqlStr(datasetUrl(dataset))}) WHERE id = ${sqlStr(id)} LIMIT 1`,
  );
  if (rows.length === 0) return null;
  const row = shapeListing(rows[0]);
  for (const field of paid) row[field] = MASK;
  return { ...row, country, access_granted: false };
}

async function listingDetail(id: string): Promise<Row> {
  const us = await detailFrom("usListings", id, "us", US_PAID);
  if (us) return us;
  const it = await detailFrom("itListings", id, "it", IT_PAID);
  if (it) return it;
  throw new ApiError(404, `/api/listings/${id}/detail/`);
}

// ---- router ----------------------------------------------------------

async function resolve(path: string): Promise<unknown> {
  const url = new URL(path, "http://local");
  const p = url.pathname;
  const q = url.searchParams;

  if (p === "/api/listings/public/") return usListings(q);
  if (p === "/api/listings/it/public/") return itListings(q);

  if (p === "/api/listings/us/states/") {
    return featureCollection("usStates", [
      "state_code",
      "state_name",
      "parcel_count",
      "max_sunnyscore",
    ]);
  }
  let m = p.match(/^\/api\/listings\/us\/states\/([^/]+)\/counties\/$/);
  if (m) {
    return featureCollection(
      "usCounties",
      ["geoid", "state_code", "county_name", "parcel_count", "max_sunnyscore"],
      { col: "state_code", eq: decodeURIComponent(m[1]) },
    );
  }

  if (p === "/api/listings/it/regions/") {
    return featureCollection("itRegions", ["region", "parcel_count", "max_sunnyscore"]);
  }
  m = p.match(/^\/api\/listings\/it\/regions\/([^/]+)\/provinces\/$/);
  if (m) {
    return featureCollection(
      "itProvinces",
      ["province_code", "province_name", "region", "parcel_count", "max_sunnyscore"],
      { col: "region", eq: decodeURIComponent(m[1]) },
    );
  }

  m = p.match(/^\/api\/listings\/([^/]+)\/detail\/$/);
  if (m) return listingDetail(decodeURIComponent(m[1]));

  throw new ApiError(404, path);
}

/**
 * Anonymous GET — same signature as apiClient.publicApi. Routes to DuckDB
 * when a data bucket is configured, otherwise falls back to the Django API
 * so local/dev keeps working unchanged.
 */
export async function publicApi<T>(path: string): Promise<T> {
  if (!DATA_BACKEND_ENABLED) return djangoPublicApi<T>(path);
  return (await resolve(path)) as T;
}

/** Optional-auth GET — no backend means no auth; identical to publicApi. */
export async function optionalAuthApi<T>(path: string): Promise<T> {
  if (!DATA_BACKEND_ENABLED) return djangoOptionalAuthApi<T>(path);
  return (await resolve(path)) as T;
}
