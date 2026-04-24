import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/apiClient";

export interface HexCell {
  id: number;
  point_count: number;
  avg_prob_solar: number | null;
  geom_json: object | null;
}

export function useUSHexHeatmap(enabled: boolean) {
  return useQuery({
    queryKey: ["us-hex-heatmap"],
    queryFn: () => publicApi<HexCell[]>("/api/listings/heatmap/"),
    staleTime: 1000 * 60 * 30,
    enabled,
  });
}

export function useITHexHeatmap(enabled: boolean) {
  return useQuery({
    queryKey: ["it-hex-heatmap"],
    queryFn: () => publicApi<HexCell[]>("/api/listings/it/heatmap/"),
    staleTime: 1000 * 60 * 30,
    enabled,
  });
}
