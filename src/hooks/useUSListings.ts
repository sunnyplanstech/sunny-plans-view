import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/apiClient";
import { slugToStateCode, slugToCounty } from "@/data/locations";
import type { OsmDistanceFields } from "@/data/osmDistanceFields";

export interface USListing extends OsmDistanceFields {
  id: string;
  state_code: string;
  county: string;
  city: string | null;
  zip_code: string | null;
  prob_solar: number | null;
  rank_global: number | null;
  rank_in_state: number | null;
  rank_in_county: number | null;
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

export function useUSListingsNational(limit = 10) {
  return useQuery({
    queryKey: ["us-listings", "national", limit],
    queryFn: () => publicApi<USListing[]>(`/api/listings/public/?limit=${limit}`),
  });
}

export function useUSListingsByState(stateSlug: string | undefined, limit = 10) {
  const stateCode = stateSlug ? slugToStateCode(stateSlug) : undefined;

  return useQuery({
    queryKey: ["us-listings", "state", stateCode, limit],
    queryFn: () => {
      const params = new URLSearchParams({ state_code: stateCode!, limit: String(limit) });
      return publicApi<USListing[]>(`/api/listings/public/?${params}`);
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
    queryFn: () => {
      const params = new URLSearchParams({
        state_code: stateCode!,
        county: countyName!,
        limit: String(limit),
      });
      return publicApi<USListing[]>(`/api/listings/public/?${params}`);
    },
    enabled: !!stateCode && !!countyName,
  });
}

export function useUSListingById(listingId: string | undefined) {
  return useQuery({
    queryKey: ["us-listing", listingId],
    queryFn: () => publicApi<USListing>(`/api/listings/public/${listingId}/`),
    enabled: !!listingId,
  });
}
