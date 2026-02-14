import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HexCell {
  id: number;
  point_count: number;
  avg_prob_solar: number | null;
  avg_price_per_acre?: number | null;
  geom_json: object | null;
}

export function useUSHexHeatmap() {
  return useQuery({
    queryKey: ["us-hex-heatmap"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mart_us_hex_heatmap")
        .select("*");

      if (error) throw error;
      return data as HexCell[];
    },
  });
}

export function useITHexHeatmap() {
  return useQuery({
    queryKey: ["it-hex-heatmap"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mart_it_hex_heatmap")
        .select("*");

      if (error) throw error;
      return data as HexCell[];
    },
  });
}
