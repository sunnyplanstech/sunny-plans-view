import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HexCell {
  id: number;
  point_count: number;
  avg_prob_solar: number | null;
  avg_price_per_acre?: number | null;
  geom_json: object | null;
}

const PAGE_SIZE = 1000;

async function fetchAllRows(table: string): Promise<HexCell[]> {
  const rows: HexCell[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...(data as HexCell[]));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}

export function useUSHexHeatmap(enabled: boolean) {
  return useQuery({
    queryKey: ["us-hex-heatmap"],
    queryFn: () => fetchAllRows("mart_us_hex_heatmap"),
    staleTime: 1000 * 60 * 30,
    enabled,
  });
}

export function useITHexHeatmap(enabled: boolean) {
  return useQuery({
    queryKey: ["it-hex-heatmap"],
    queryFn: () => fetchAllRows("mart_it_hex_heatmap"),
    staleTime: 1000 * 60 * 30,
    enabled,
  });
}
