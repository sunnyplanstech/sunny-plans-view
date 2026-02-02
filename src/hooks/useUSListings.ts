import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { slugToStateCode, slugToCounty } from "@/data/locations";

export interface USListing {
  land_id: string;
  state_code: string;
  county: string;
  lot_acres: number | null;
  list_price: number | null;
  price_per_acre: number | null;
  prob_solar: number | null;
  power_substation: number | null;
  geom: string | null;
  rank_global: number | null;
  rank_in_state: number | null;
  rank_in_county: number | null;
}

// Fetch top 10 US listings nationally by rank_global
export function useUSListingsNational(limit = 10) {
  return useQuery({
    queryKey: ["us-listings", "national", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mart_us_land_solar_prob")
        .select("*")
        .not("rank_global", "is", null)
        .order("rank_global", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as USListing[];
    },
  });
}

// Fetch top 10 listings by state using rank_in_state
export function useUSListingsByState(stateSlug: string | undefined, limit = 10) {
  const stateCode = stateSlug ? slugToStateCode(stateSlug) : undefined;

  return useQuery({
    queryKey: ["us-listings", "state", stateCode, limit],
    queryFn: async () => {
      if (!stateCode) return [];

      const { data, error } = await supabase
        .from("mart_us_land_solar_prob")
        .select("*")
        .eq("state_code", stateCode)
        .not("rank_in_state", "is", null)
        .order("rank_in_state", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as USListing[];
    },
    enabled: !!stateCode,
  });
}

// Fetch top 10 listings by county using rank_in_county
export function useUSListingsByCounty(
  stateSlug: string | undefined,
  countySlug: string | undefined,
  limit = 10
) {
  const stateCode = stateSlug ? slugToStateCode(stateSlug) : undefined;
  const countyName = countySlug ? slugToCounty(countySlug) : undefined;

  return useQuery({
    queryKey: ["us-listings", "county", stateCode, countyName, limit],
    queryFn: async () => {
      if (!stateCode || !countyName) return [];

      const { data, error } = await supabase
        .from("mart_us_land_solar_prob")
        .select("*")
        .eq("state_code", stateCode)
        .ilike("county", countyName)
        .not("rank_in_county", "is", null)
        .order("rank_in_county", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as USListing[];
    },
    enabled: !!stateCode && !!countyName,
  });
}

// Fetch a single listing by land_id
export function useUSListingById(landId: string | undefined) {
  return useQuery({
    queryKey: ["us-listing", landId],
    queryFn: async () => {
      if (!landId) return null;

      const { data, error } = await supabase
        .from("mart_us_land_solar_prob")
        .select("*")
        .eq("land_id", landId)
        .single();

      if (error) throw error;
      return data as USListing;
    },
    enabled: !!landId,
  });
}
