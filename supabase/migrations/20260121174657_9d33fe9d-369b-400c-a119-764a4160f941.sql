-- Create demo_properties table for landing page carousel
CREATE TABLE public.demo_properties (
  id SERIAL PRIMARY KEY,
  image TEXT NOT NULL,
  distance_to_substation DECIMAL(10, 2) NOT NULL,
  price_per_sqft DECIMAL(10, 3) NOT NULL,
  listing_price INTEGER NOT NULL,
  substation_max_voltage DECIMAL(10, 1) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (public read access for landing page)
ALTER TABLE public.demo_properties ENABLE ROW LEVEL SECURITY;

-- Allow public read access (these are demo properties shown on landing page)
CREATE POLICY "Demo properties are publicly readable"
ON public.demo_properties
FOR SELECT
USING (true);

-- Insert the existing demo properties data
INSERT INTO public.demo_properties (id, image, distance_to_substation, price_per_sqft, listing_price, substation_max_voltage) VALUES
(1, '/1.png', 0.00, 0.065, 179000, 230),
(2, '/2.png', 0.02, 1.917, 83500, 60),
(3, '/3.png', 0.10, 2.971, 25000, 92),
(4, '/4.png', 0.11, 48.197, 201944, 230),
(5, '/5.png', 0.13, 18.322, 999000, 34.5),
(6, '/6.png', 0.14, 5.621, 83250, 33);