// Polygon feeders for the zoom-driven hierarchical navigation
// (roadmap p1-e3-scope-driven-rail).
//
// Hits the four recursive REST endpoints on the Django side:
//   GET /api/listings/us/states/                                  → all states
//   GET /api/listings/us/states/<state_code>/counties/            → that state's counties
//   GET /api/listings/it/regions/                                 → all regions
//   GET /api/listings/it/regions/<region>/provinces/              → that region's provinces
//
// The county / province endpoints read from hive-partitioned marts, so
// each call only fetches the relevant parquet partition — DuckDB
// partition pruning keeps the per-state / per-region payload small.
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/duckdb/api";

export interface StateProps {
  state_code: string;
  state_name: string;
  parcel_count: number;
  max_sunnyscore: number | null;
}

export interface CountyProps {
  geoid: string;
  state_code: string;
  county_name: string;
  parcel_count: number;
  max_sunnyscore: number | null;
}

export interface RegionProps {
  region: string;
  parcel_count: number;
  max_sunnyscore: number | null;
}

export interface ProvinceProps {
  province_code: string;
  province_name: string;
  region: string;
  parcel_count: number;
  max_sunnyscore: number | null;
}

// Loose geometry shape — the Google Maps Data layer parses on render
// and the in-process point-in-polygon helper consumes `coordinates`
// directly. Pulling in `@types/geojson` just to type two fields isn't
// worth the dep noise.
export interface PolygonFeature<P> {
  type: "Feature";
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: unknown };
  properties: P;
}

export interface PolygonCollection<P> {
  type: "FeatureCollection";
  features: PolygonFeature<P>[];
}

// Polygons rarely change between deploys — a 30-minute stale time is
// plenty and matches the previous choropleth feeder's posture.
const STALE_MS = 1000 * 60 * 30;

export function useUSStates(enabled = true) {
  return useQuery({
    queryKey: ["us-states"],
    queryFn: () =>
      publicApi<PolygonCollection<StateProps>>("/api/listings/us/states/"),
    staleTime: STALE_MS,
    enabled,
  });
}

export function useUSCounties(stateCode: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["us-counties", stateCode],
    queryFn: () =>
      publicApi<PolygonCollection<CountyProps>>(
        `/api/listings/us/states/${encodeURIComponent(stateCode!)}/counties/`,
      ),
    staleTime: STALE_MS,
    enabled: enabled && !!stateCode,
  });
}

export function useITRegions(enabled = true) {
  return useQuery({
    queryKey: ["it-regions"],
    queryFn: () =>
      publicApi<PolygonCollection<RegionProps>>("/api/listings/it/regions/"),
    staleTime: STALE_MS,
    enabled,
  });
}

export function useITProvinces(region: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["it-provinces", region],
    queryFn: () =>
      publicApi<PolygonCollection<ProvinceProps>>(
        `/api/listings/it/regions/${encodeURIComponent(region!)}/provinces/`,
      ),
    staleTime: STALE_MS,
    enabled: enabled && !!region,
  });
}
