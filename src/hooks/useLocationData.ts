import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SLUG_TO_STATE_CODE } from '@/data/locations';

// Types for location data
export interface USCountySEO {
  state_code: string;
  county_name: string;
  county_slug: string;
  listing_count: number;
  avg_prob_solar: number | null;
  max_prob_solar: number | null;
  min_price_per_acre: number | null;
  avg_price_per_acre: number | null;
}

export interface ITComuneSEO {
  comune_code: string;
  comune_name: string;
  comune_slug: string;
  region_name: string;
  region_slug: string;
  listing_count: number;
  avg_prob_solar: number | null;
  max_prob_solar: number | null;
}

// Fetch US counties by state slug (maps to state_code internally)
export function useUSCounties(stateSlug: string | undefined) {
  const stateCode = stateSlug ? SLUG_TO_STATE_CODE[stateSlug] : undefined;

  return useQuery({
    queryKey: ['us-counties-seo', stateCode],
    queryFn: async () => {
      if (!stateCode) return [];

      const { data, error } = await supabase
        .from('mart_us_counties_seo')
        .select('*')
        .eq('state_code', stateCode)
        .order('county_name');

      if (error) throw error;

      // Transform to match expected interface for SubdivisionNav
      return (data as USCountySEO[]).map(county => ({
        ...county,
        name: county.county_name,
        slug: county.county_slug,
      }));
    },
    enabled: !!stateCode,
  });
}

// Fetch a single US county by state slug and county slug
export function useUSCounty(stateSlug: string | undefined, countySlug: string | undefined) {
  const stateCode = stateSlug ? SLUG_TO_STATE_CODE[stateSlug] : undefined;

  return useQuery({
    queryKey: ['us-county-seo', stateCode, countySlug],
    queryFn: async () => {
      if (!stateCode || !countySlug) return null;

      const { data, error } = await supabase
        .from('mart_us_counties_seo')
        .select('*')
        .eq('state_code', stateCode)
        .eq('county_slug', countySlug)
        .maybeSingle();

      if (error) throw error;
      return data as USCountySEO | null;
    },
    enabled: !!stateCode && !!countySlug,
  });
}

// Fetch Italian comuni by region slug (for SubdivisionNav)
export function useITComuni(regionSlug: string | undefined) {
  return useQuery({
    queryKey: ['it-comuni-seo', regionSlug],
    queryFn: async () => {
      if (!regionSlug) return [];

      const { data, error } = await supabase
        .from('mart_it_comuni_seo')
        .select('*')
        .eq('region_slug', regionSlug)
        .order('comune_name');

      if (error) throw error;

      return (data as ITComuneSEO[]).map(comune => ({
        ...comune,
        name: comune.comune_name,
        slug: comune.comune_slug,
      }));
    },
    enabled: !!regionSlug,
  });
}

// Fetch a single Italian comune by slug
export function useITComune(comuneSlug: string | undefined) {
  return useQuery({
    queryKey: ['it-comune-seo', comuneSlug],
    queryFn: async () => {
      if (!comuneSlug) return null;

      const { data, error } = await supabase
        .from('mart_it_comuni_seo')
        .select('*')
        .eq('comune_slug', comuneSlug)
        .maybeSingle();

      if (error) throw error;
      return data as ITComuneSEO | null;
    },
    enabled: !!comuneSlug,
  });
}
