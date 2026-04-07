import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";

export interface USPremiumListing {
  id: string;
  state_code: string;
  county: string | null;
  city: string | null;
  zip_code: string;
  google_maps_url: string;
  latitude: number;
  longitude: number;
  property_url: string;
  list_price: number | null;
  lot_sqft: number | null;
  lot_acres: number | null;
  price_per_sqft: number | null;
  price_per_acre: number | null;
  prob_solar: number;
  list_date: string | null;
  days_on_mls: number | null;
  sqft: number | null;
  year_built: number | null;
  power_substation: number | null;
  power_transformer: number | null;
  highway_motorway: number | null;
  landuse_industrial: number | null;
  natural_water: number | null;
  geom_json: Record<string, unknown> | null;
  last_verified_at: string;
  rank_global: number;
  rank_in_state: number;
  rank_in_county: number;
}

export interface ITPremiumListing {
  id: string;
  comune_code: string;
  comune_name: string | null;
  comune_slug: string;
  region_slug: string;
  prob_solar: number;
  latitude: number;
  longitude: number;
  geom_json: Record<string, unknown> | null;
  power_substation: number | null;
  power_transformer: number | null;
  highway_motorway: number | null;
  landuse_industrial: number | null;
  natural_water: number | null;
  rank_global: number;
  rank_in_comune: number;
}

export function useUSPremiumListing(listingId: string | undefined) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["us-premium-listing", listingId],
    queryFn: async () => {
      const res = await apiClient(`/api/listings/${listingId}/detail/`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return (await res.json()) as USPremiumListing;
    },
    enabled: !!listingId && isAuthenticated,
  });
}

export function useITPremiumListing(listingId: string | undefined) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["it-premium-listing", listingId],
    queryFn: async () => {
      const res = await apiClient(`/api/listings/it/${listingId}/detail/`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return (await res.json()) as ITPremiumListing;
    },
    enabled: !!listingId && isAuthenticated,
  });
}
