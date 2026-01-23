import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types for location data
export interface USCounty {
  id: string;
  name: string;
  slug: string;
  state_slug: string;
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

// Fetch US counties by state
export function useUSCounties(stateSlug: string | undefined) {
  return useQuery({
    queryKey: ['us-counties', stateSlug],
    queryFn: async () => {
      if (!stateSlug) return [];
      
      const { data, error } = await supabase
        .from('us_counties')
        .select('*')
        .eq('state_slug', stateSlug)
        .order('name');
      
      if (error) throw error;
      return data as USCounty[];
    },
    enabled: !!stateSlug,
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

// Fetch a single US county by slug
export function useUSCounty(stateSlug: string | undefined, countySlug: string | undefined) {
  return useQuery({
    queryKey: ['us-county', stateSlug, countySlug],
    queryFn: async () => {
      if (!stateSlug || !countySlug) return null;
      
      const { data, error } = await supabase
        .from('us_counties')
        .select('*')
        .eq('state_slug', stateSlug)
        .eq('slug', countySlug)
        .maybeSingle();
      
      if (error) throw error;
      return data as USCounty | null;
    },
    enabled: !!stateSlug && !!countySlug,
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
