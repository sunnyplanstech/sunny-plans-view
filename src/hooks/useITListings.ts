import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ITListing {
  gml_id: string;
  comune_code: string;
  comune_name: string;
  comune_slug: string;
  foglio: string | null;
  particella: string | null;
  prob_solar: number | null;
  rank_global: number | null;
  rank_in_comune: number | null;
  region_slug: string;
  geom_json: string | null;
}

export function useITListingsNational(limit = 10) {
  return useQuery({
    queryKey: ["it-listings", "national", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mart_it_catasto_solar_prob")
        .select("*")
        .not("rank_global", "is", null)
        .order("rank_global", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as ITListing[];
    },
  });
}

export function useITListingsByRegion(regionSlug: string | undefined, limit = 10) {
  return useQuery({
    queryKey: ["it-listings", "region", regionSlug, limit],
    queryFn: async () => {
      if (!regionSlug) return [];

      const { data, error } = await supabase
        .from("mart_it_catasto_solar_prob")
        .select("*")
        .eq("region_slug", regionSlug)
        .not("rank_global", "is", null)
        .order("rank_global", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as ITListing[];
    },
    enabled: !!regionSlug,
  });
}

export function useITListingsByComune(comuneSlug: string | undefined, limit = 10) {
  return useQuery({
    queryKey: ["it-listings", "comune", comuneSlug, limit],
    queryFn: async () => {
      if (!comuneSlug) return [];

      const { data, error } = await supabase
        .from("mart_it_catasto_solar_prob")
        .select("*")
        .eq("comune_slug", comuneSlug)
        .not("rank_in_comune", "is", null)
        .order("rank_in_comune", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as ITListing[];
    },
    enabled: !!comuneSlug,
  });
}

export function useITListingById(gmlId: string | undefined) {
  return useQuery({
    queryKey: ["it-listing", gmlId],
    queryFn: async () => {
      if (!gmlId) return null;

      const { data, error } = await supabase
        .from("mart_it_catasto_solar_prob")
        .select("*")
        .eq("gml_id", gmlId)
        .single();

      if (error) throw error;
      return data as ITListing;
    },
    enabled: !!gmlId,
  });
}
