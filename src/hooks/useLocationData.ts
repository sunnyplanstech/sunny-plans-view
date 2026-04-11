import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SLUG_TO_STATE_CODE } from '@/data/locations';

// Generic SEO page row (works for both US and IT tables)
export interface SEOPage {
  path: string;
  area_name: string;
  page_title: string;
  meta_description: string;
  listing_count: number;
  avg_prob_solar: number | null;
}

// Backwards-compatible interfaces consumed by SubdivisionNav and other components
export interface USCountySEO {
  state_code: string;
  county_name: string;
  county_slug: string;
  listing_count: number;
  avg_prob_solar: number | null;
}

export interface ITComuneSEO {
  comune_slug: string;
  comune_name: string;
  region_slug: string;
  listing_count: number;
  avg_prob_solar: number | null;
}

// Fetch a single SEO page by path, dispatching to the correct table
export function useSEOPage(path: string | undefined) {
  const table = path?.startsWith('/italia') ? 'mart_it_seo_pages' : 'mart_us_seo_pages';

  return useQuery({
    queryKey: ['seo-page', path],
    queryFn: async () => {
      if (!path) return null;

      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('path', path)
        .maybeSingle();

      if (error) throw error;
      return data as SEOPage | null;
    },
    enabled: !!path,
  });
}

// Fetch US counties by state slug (county-level SEO pages)
export function useUSCounties(stateSlug: string | undefined) {
  const stateCode = stateSlug ? SLUG_TO_STATE_CODE[stateSlug] : undefined;

  return useQuery({
    queryKey: ['us-counties-seo', stateCode],
    queryFn: async () => {
      if (!stateCode) return [];

      const { data, error } = await supabase
        .from('mart_us_seo_pages')
        .select('*')
        .eq('state_code', stateCode)
        .not('county_slug', 'is', null)
        .order('county_name');

      if (error) throw error;

      return (data ?? []).map(row => ({
        state_code: row.state_code!,
        county_name: row.county_name!,
        county_slug: row.county_slug!,
        listing_count: row.listing_count,
        avg_prob_solar: row.avg_prob_solar,
        // SubdivisionNav compatibility
        name: row.county_name!,
        slug: row.county_slug!,
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
        .from('mart_us_seo_pages')
        .select('*')
        .eq('state_code', stateCode)
        .eq('county_slug', countySlug)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        state_code: data.state_code!,
        county_name: data.county_name!,
        county_slug: data.county_slug!,
        listing_count: data.listing_count,
        avg_prob_solar: data.avg_prob_solar,
      } as USCountySEO;
    },
    enabled: !!stateCode && !!countySlug,
  });
}

// Fetch Italian comuni by region slug
export function useITComuni(regionSlug: string | undefined) {
  return useQuery({
    queryKey: ['it-comuni-seo', regionSlug],
    queryFn: async () => {
      if (!regionSlug) return [];

      const { data, error } = await supabase
        .from('mart_it_seo_pages')
        .select('*')
        .eq('region_slug', regionSlug)
        .not('comune_slug', 'is', null)
        .order('comune_name');

      if (error) throw error;

      return (data ?? []).map(row => ({
        comune_slug: row.comune_slug!,
        comune_name: row.comune_name!,
        region_slug: row.region_slug!,
        listing_count: row.listing_count,
        avg_prob_solar: row.avg_prob_solar,
        // SubdivisionNav compatibility
        name: row.comune_name!,
        slug: row.comune_slug!,
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
        .from('mart_it_seo_pages')
        .select('*')
        .eq('comune_slug', comuneSlug)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        comune_slug: data.comune_slug!,
        comune_name: data.comune_name!,
        region_slug: data.region_slug!,
        listing_count: data.listing_count,
        avg_prob_solar: data.avg_prob_solar,
      } as ITComuneSEO;
    },
    enabled: !!comuneSlug,
  });
}
