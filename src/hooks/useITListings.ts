import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ITListing {
  id: string;
  comune_code: string;
  comune_name: string;
  comune_slug: string;
  region_slug: string;
  prob_solar: number | null;
  rank_global: number | null;
  rank_in_comune: number | null;
  geom_json: string | null;
}

export function useITListingsNational(limit = 10) {
  return useQuery({
    queryKey: ["it-listings", "national", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mart_it_catasto_public")
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
        .from("mart_it_catasto_public")
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
        .from("mart_it_catasto_public")
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

export function useITListingById(listingId: string | undefined) {
  return useQuery({
    queryKey: ["it-listing", listingId],
    queryFn: async () => {
      if (!listingId) return null;

      const { data, error } = await supabase
        .from("mart_it_catasto_public")
        .select("*")
        .eq("id", listingId)
        .single();

      if (error) throw error;
      return data as ITListing;
    },
    enabled: !!listingId,
  });
}
