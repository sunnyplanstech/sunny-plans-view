// Country / state-zoom choropleth feeders (roadmap p1-e3-layer-first-ui).
//
// Hits the polygon-driven aggregate endpoints shipped on the Django side
// (`/api/listings/us/aggregate/counties/`, `/api/listings/it/aggregate/provinces/`)
// and returns a typed GeoJSON FeatureCollection. Geometry comes pre-simplified
// (1:500k for US TIGER, 1:10m Natural Earth for IT) so the payload is small
// enough to cache per scope.
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/apiClient";

export interface CountyProps {
  state_code: string;
  county_name: string;
  county_name_full: string;
  geoid: string;
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

export type ChoroplethFeature<P> = {
  type: "Feature";
  // Shape: GeoJSON Polygon or MultiPolygon. Kept loose to avoid
  // pulling in @types/geojson — the GMaps Data layer parses on render.
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: unknown };
  properties: P;
};

export type ChoroplethCollection<P> = {
  type: "FeatureCollection";
  features: ChoroplethFeature<P>[];
};

export function useUSCountyAggregate(enabled: boolean, stateCode?: string) {
  const qs = stateCode ? `?state_code=${encodeURIComponent(stateCode)}` : "";
  return useQuery({
    queryKey: ["us-county-aggregate", stateCode ?? "all"],
    queryFn: () =>
      publicApi<ChoroplethCollection<CountyProps>>(
        `/api/listings/us/aggregate/counties/${qs}`,
      ),
    staleTime: 1000 * 60 * 30,
    enabled,
  });
}

export function useITProvinceAggregate(enabled: boolean, region?: string) {
  const qs = region ? `?region=${encodeURIComponent(region)}` : "";
  return useQuery({
    queryKey: ["it-province-aggregate", region ?? "all"],
    queryFn: () =>
      publicApi<ChoroplethCollection<ProvinceProps>>(
        `/api/listings/it/aggregate/provinces/${qs}`,
      ),
    staleTime: 1000 * 60 * 30,
    enabled,
  });
}
