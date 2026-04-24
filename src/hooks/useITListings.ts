import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/apiClient";
import type { OsmDistanceFields } from "@/data/osmDistanceFields";

export interface ITListing extends OsmDistanceFields {
  id: string;
  comune_code: string;
  comune_name: string;
  comune_slug: string;
  region_slug: string;
  prob_solar: number | null;
  rank_global: number | null;
  rank_in_comune: number | null;
  area_ha: number | null;
  area_m2: number | null;
  lat: number | null;
  lon: number | null;
  geom_json: unknown | null;
}

export function useITListingsNational(limit = 10) {
  return useQuery({
    queryKey: ["it-listings", "national", limit],
    queryFn: () => publicApi<ITListing[]>(`/api/listings/it/public/?limit=${limit}`),
  });
}

export function useITListingsByRegion(regionSlug: string | undefined, limit = 10) {
  return useQuery({
    queryKey: ["it-listings", "region", regionSlug, limit],
    queryFn: () => {
      const params = new URLSearchParams({ region_slug: regionSlug!, limit: String(limit) });
      return publicApi<ITListing[]>(`/api/listings/it/public/?${params}`);
    },
    enabled: !!regionSlug,
  });
}

export function useITListingsByComune(comuneSlug: string | undefined, limit = 10) {
  return useQuery({
    queryKey: ["it-listings", "comune", comuneSlug, limit],
    queryFn: () => {
      const params = new URLSearchParams({ comune_slug: comuneSlug!, limit: String(limit) });
      return publicApi<ITListing[]>(`/api/listings/it/public/?${params}`);
    },
    enabled: !!comuneSlug,
  });
}

export function useITListingById(listingId: string | undefined) {
  return useQuery({
    queryKey: ["it-listing", listingId],
    queryFn: () => publicApi<ITListing>(`/api/listings/it/public/${listingId}/`),
    enabled: !!listingId,
  });
}
