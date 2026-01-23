-- US Counties table
CREATE TABLE public.us_counties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  state_slug TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Italian Provinces table (province level under regions)
CREATE TABLE public.italian_provinces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  region_slug TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Italian Comuni table (municipality level under provinces)
CREATE TABLE public.italian_comuni (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  province_slug TEXT NOT NULL,
  region_slug TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient lookups
CREATE INDEX idx_us_counties_state ON public.us_counties(state_slug);
CREATE INDEX idx_italian_provinces_region ON public.italian_provinces(region_slug);
CREATE INDEX idx_italian_comuni_province ON public.italian_comuni(province_slug);
CREATE INDEX idx_italian_comuni_region ON public.italian_comuni(region_slug);

-- Unique constraints for slug combinations
CREATE UNIQUE INDEX idx_us_counties_unique ON public.us_counties(state_slug, slug);
CREATE UNIQUE INDEX idx_italian_provinces_unique ON public.italian_provinces(region_slug, slug);
CREATE UNIQUE INDEX idx_italian_comuni_unique ON public.italian_comuni(province_slug, slug);

-- Enable RLS
ALTER TABLE public.us_counties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.italian_provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.italian_comuni ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "US counties are publicly readable" 
ON public.us_counties 
FOR SELECT 
USING (true);

CREATE POLICY "Italian provinces are publicly readable" 
ON public.italian_provinces 
FOR SELECT 
USING (true);

CREATE POLICY "Italian comuni are publicly readable" 
ON public.italian_comuni 
FOR SELECT 
USING (true);