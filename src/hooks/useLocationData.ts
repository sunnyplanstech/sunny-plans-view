import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SLUG_TO_STATE_CODE, STATE_CODE_TO_SLUG } from '@/data/locations';

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

export interface ItalianProvince {
  id: string;
  name: string;
  slug: string;
  region_slug: string;
}

export interface ItalianComune {
  id: string;
  name: string;
  slug: string;
  province_slug: string;
  region_slug: string;
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

// Fetch Italian provinces by region
export function useItalianProvinces(regionSlug: string | undefined) {
  return useQuery({
    queryKey: ['italian-provinces', regionSlug],
    queryFn: async () => {
      if (!regionSlug) return [];

      const { data, error } = await supabase
        .from('italian_provinces')
        .select('*')
        .eq('region_slug', regionSlug)
        .order('name');

      if (error) throw error;
      return data as ItalianProvince[];
    },
    enabled: !!regionSlug,
  });
}

// Fetch Italian comuni by province
export function useItalianComuni(provinceSlug: string | undefined) {
  return useQuery({
    queryKey: ['italian-comuni', provinceSlug],
    queryFn: async () => {
      if (!provinceSlug) return [];

      const { data, error } = await supabase
        .from('italian_comuni')
        .select('*')
        .eq('province_slug', provinceSlug)
        .order('name');

      if (error) throw error;
      return data as ItalianComune[];
    },
    enabled: !!provinceSlug,
  });
}

// Fetch a single Italian province by slug
export function useItalianProvince(regionSlug: string | undefined, provinceSlug: string | undefined) {
  return useQuery({
    queryKey: ['italian-province', regionSlug, provinceSlug],
    queryFn: async () => {
      if (!regionSlug || !provinceSlug) return null;

      const { data, error } = await supabase
        .from('italian_provinces')
        .select('*')
        .eq('region_slug', regionSlug)
        .eq('slug', provinceSlug)
        .maybeSingle();

      if (error) throw error;
      return data as ItalianProvince | null;
    },
    enabled: !!regionSlug && !!provinceSlug,
  });
}

// Fetch a single Italian comune by slug
export function useItalianComune(provinceSlug: string | undefined, comuneSlug: string | undefined) {
  return useQuery({
    queryKey: ['italian-comune', provinceSlug, comuneSlug],
    queryFn: async () => {
      if (!provinceSlug || !comuneSlug) return null;

      const { data, error } = await supabase
        .from('italian_comuni')
        .select('*')
        .eq('province_slug', provinceSlug)
        .eq('slug', comuneSlug)
        .maybeSingle();

      if (error) throw error;
      return data as ItalianComune | null;
    },
    enabled: !!provinceSlug && !!comuneSlug,
  });
}
