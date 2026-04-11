import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { slugToStateCode, slugToCounty } from "@/data/locations";

export interface USListing {
  id: string;
  state_code: string;
  county: string;
  city: string | null;
  zip_code: string | null;
  prob_solar: number | null;
  rank_global: number | null;
  rank_in_state: number | null;
  rank_in_county: number | null;
  power_substation: number | null;
  power_transformer: number | null;
  highway_motorway: number | null;
  landuse_industrial: number | null;
  natural_water: number | null;
  list_price: number | null;
  lot_acres: number | null;
  lot_sqft: number | null;
  price_per_acre: number | null;
  price_per_sqft: number | null;
  sqft: number | null;
  year_built: number | null;
  lat: number | null;
  lon: number | null;
  geom_json: unknown | null;
}

const TABLE = "mart_us_listings_public";

export function useUSListingsNational(limit = 10) {
  return useQuery({
    queryKey: ["us-listings", "national", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .not("rank_global", "is", null)
        .order("rank_global", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as USListing[];
    },
  });
}

export function useUSListingsByState(stateSlug: string | undefined, limit = 10) {
  const stateCode = stateSlug ? slugToStateCode(stateSlug) : undefined;

  return useQuery({
    queryKey: ["us-listings", "state", stateCode, limit],
    queryFn: async () => {
      if (!stateCode) return [];

      const { data, error } = await supabase
        .from(TABLE)
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
        .from(TABLE)
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

export function useUSListingById(listingId: string | undefined) {
  return useQuery({
    queryKey: ["us-listing", listingId],
    queryFn: async () => {
      if (!listingId) return null;

      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("id", listingId)
        .single();

      if (error) throw error;
      return data as USListing;
    },
    enabled: !!listingId,
  });
}
