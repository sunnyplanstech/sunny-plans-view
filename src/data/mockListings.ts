// Mock data for listings - will be replaced with database calls when Cloud is enabled

// Demo carousel properties (landing page)
export interface DemoProperty {
  id: number;
  image: string;
  distanceToSubstation: number;
  pricePerSqft: number;
  listingPrice: number;
  substationMaxVoltage: number;
}

export const demoProperties: DemoProperty[] = [
  {
    id: 1,
    image: "/1.png",
    distanceToSubstation: 0.00,
    pricePerSqft: 0.065,
    listingPrice: 179000,
    substationMaxVoltage: 230
  },
  {
    id: 2,
    image: "/2.png",
    distanceToSubstation: 0.02,
    pricePerSqft: 1.917,
    listingPrice: 83500,
    substationMaxVoltage: 60
  },
  {
    id: 3,
    image: "/3.png",
    distanceToSubstation: 0.10,
    pricePerSqft: 2.971,
    listingPrice: 25000,
    substationMaxVoltage: 92
  },
  {
    id: 4,
    image: "/4.png",
    distanceToSubstation: 0.11,
    pricePerSqft: 48.197,
    listingPrice: 201944,
    substationMaxVoltage: 230
  },
  {
    id: 5,
    image: "/5.png",
    distanceToSubstation: 0.13,
    pricePerSqft: 18.322,
    listingPrice: 999000,
    substationMaxVoltage: 34.5
  },
  {
    id: 6,
    image: "/6.png",
    distanceToSubstation: 0.14,
    pricePerSqft: 5.621,
    listingPrice: 83250,
    substationMaxVoltage: 33
  }
];

// Listings data
export interface Listing {
  id: string;
  country: "italy" | "usa";
  region: string;
  province: string;
  municipality?: string;
  size: number; // hectares for Italy, acres for USA
  terrain: "flat" | "moderate" | "hilly";
  slopePercentage: number;
  distanceToSubstation: string; // e.g., "< 500m", "< 1km"
  substationName: string;
  landType: "agricultural" | "industrial" | "brownfield";
  sunnyScore: number;
  scoreBreakdown: {
    grid: number;
    solar: number;
    terrain: number;
    other: number;
  };
  isOffMarket: boolean;
  imageUrl: string;
  // Blurred/hidden data for freemium
  coordinates?: { lat: number; lng: number };
  cadastralId?: string;
  exactAddress?: string;
}

export const mockListings: Listing[] = [
  {
    id: "it-lazio-vt-001",
    country: "italy",
    region: "Lazio",
    province: "Viterbo",
    municipality: "Tuscania",
    size: 5.2,
    terrain: "flat",
    slopePercentage: 3,
    distanceToSubstation: "< 500m",
    substationName: "Terna - Viterbo North",
    landType: "agricultural",
    sunnyScore: 94,
    scoreBreakdown: { grid: 40, solar: 28, terrain: 20, other: 6 },
    isOffMarket: true,
    imageUrl: "/1.png",
    coordinates: { lat: 42.4186, lng: 11.8678 },
    cadastralId: "Foglio 4, Particella 22",
  },
  {
    id: "it-lazio-vt-002",
    country: "italy",
    region: "Lazio",
    province: "Viterbo",
    municipality: "Montalto di Castro",
    size: 8.7,
    terrain: "flat",
    slopePercentage: 2,
    distanceToSubstation: "< 1km",
    substationName: "Terna - Montalto",
    landType: "agricultural",
    sunnyScore: 91,
    scoreBreakdown: { grid: 35, solar: 30, terrain: 22, other: 4 },
    isOffMarket: true,
    imageUrl: "/2.png",
    coordinates: { lat: 42.3531, lng: 11.6061 },
    cadastralId: "Foglio 12, Particella 8",
  },
  {
    id: "it-lazio-rm-001",
    country: "italy",
    region: "Lazio",
    province: "Roma",
    municipality: "Civitavecchia",
    size: 3.4,
    terrain: "moderate",
    slopePercentage: 8,
    distanceToSubstation: "< 2km",
    substationName: "Enel - Civitavecchia Sud",
    landType: "industrial",
    sunnyScore: 87,
    scoreBreakdown: { grid: 32, solar: 26, terrain: 18, other: 11 },
    isOffMarket: false,
    imageUrl: "/3.png",
    coordinates: { lat: 42.0931, lng: 11.7961 },
    cadastralId: "Foglio 7, Particella 15",
  },
  {
    id: "it-puglia-ba-001",
    country: "italy",
    region: "Puglia",
    province: "Bari",
    municipality: "Altamura",
    size: 12.1,
    terrain: "flat",
    slopePercentage: 1,
    distanceToSubstation: "< 500m",
    substationName: "Terna - Altamura",
    landType: "agricultural",
    sunnyScore: 96,
    scoreBreakdown: { grid: 42, solar: 32, terrain: 18, other: 4 },
    isOffMarket: true,
    imageUrl: "/4.png",
    coordinates: { lat: 40.8269, lng: 16.5531 },
    cadastralId: "Foglio 22, Particella 45",
  },
  {
    id: "it-sicilia-ct-001",
    country: "italy",
    region: "Sicilia",
    province: "Catania",
    municipality: "Paternò",
    size: 6.8,
    terrain: "moderate",
    slopePercentage: 6,
    distanceToSubstation: "< 1km",
    substationName: "Enel - Etna Sud",
    landType: "agricultural",
    sunnyScore: 89,
    scoreBreakdown: { grid: 34, solar: 30, terrain: 16, other: 9 },
    isOffMarket: true,
    imageUrl: "/5.png",
    coordinates: { lat: 37.5667, lng: 14.9000 },
    cadastralId: "Foglio 9, Particella 33",
  },
  {
    id: "us-ca-001",
    country: "usa",
    region: "California",
    province: "Kern County",
    size: 45.2,
    terrain: "flat",
    slopePercentage: 2,
    distanceToSubstation: "< 1 mile",
    substationName: "SCE - Mojave",
    landType: "agricultural",
    sunnyScore: 92,
    scoreBreakdown: { grid: 38, solar: 32, terrain: 18, other: 4 },
    isOffMarket: false,
    imageUrl: "/6.png",
    coordinates: { lat: 35.0527, lng: -118.1739 },
  },
  {
    id: "us-tx-001",
    country: "usa",
    region: "Texas",
    province: "Pecos County",
    size: 120.5,
    terrain: "flat",
    slopePercentage: 1,
    distanceToSubstation: "< 2 miles",
    substationName: "ERCOT - Fort Stockton",
    landType: "agricultural",
    sunnyScore: 88,
    scoreBreakdown: { grid: 30, solar: 34, terrain: 20, other: 4 },
    isOffMarket: false,
    imageUrl: "/1.png",
    coordinates: { lat: 30.8904, lng: -102.8793 },
  },
  {
    id: "us-az-001",
    country: "usa",
    region: "Arizona",
    province: "Maricopa County",
    size: 78.3,
    terrain: "flat",
    slopePercentage: 3,
    distanceToSubstation: "< 500m",
    substationName: "APS - Buckeye",
    landType: "brownfield",
    sunnyScore: 95,
    scoreBreakdown: { grid: 40, solar: 34, terrain: 17, other: 4 },
    isOffMarket: false,
    imageUrl: "/2.png",
    coordinates: { lat: 33.3703, lng: -112.5838 },
  },
];

export interface LocationData {
  country: "italy" | "usa";
  region: string;
  province?: string;
  municipality?: string;
  listingCount: number;
  avgDistanceToSubstation: string;
  rating: "excellent" | "good" | "moderate";
}

export const locationHierarchy: LocationData[] = [
  { country: "italy", region: "Lazio", province: "Viterbo", listingCount: 2, avgDistanceToSubstation: "750m", rating: "excellent" },
  { country: "italy", region: "Lazio", province: "Roma", listingCount: 1, avgDistanceToSubstation: "2km", rating: "good" },
  { country: "italy", region: "Puglia", province: "Bari", listingCount: 1, avgDistanceToSubstation: "500m", rating: "excellent" },
  { country: "italy", region: "Sicilia", province: "Catania", listingCount: 1, avgDistanceToSubstation: "1km", rating: "good" },
  { country: "usa", region: "California", province: "Kern County", listingCount: 1, avgDistanceToSubstation: "1 mile", rating: "excellent" },
  { country: "usa", region: "Texas", province: "Pecos County", listingCount: 1, avgDistanceToSubstation: "2 miles", rating: "good" },
  { country: "usa", region: "Arizona", province: "Maricopa County", listingCount: 1, avgDistanceToSubstation: "500m", rating: "excellent" },
];

export function getListingsByLocation(country?: string, region?: string, province?: string, municipality?: string): Listing[] {
  return mockListings.filter(listing => {
    if (country && listing.country !== country) return false;
    if (region && listing.region.toLowerCase() !== region.toLowerCase()) return false;
    if (province && listing.province.toLowerCase() !== province.toLowerCase()) return false;
    if (municipality && listing.municipality?.toLowerCase() !== municipality.toLowerCase()) return false;
    return true;
  }).sort((a, b) => b.sunnyScore - a.sunnyScore);
}

export function getListingById(id: string): Listing | undefined {
  return mockListings.find(listing => listing.id === id);
}

export function getNearbyListings(currentId: string, limit = 5): Listing[] {
  const current = getListingById(currentId);
  if (!current) return [];
  
  return mockListings
    .filter(l => l.id !== currentId && l.country === current.country)
    .sort((a, b) => b.sunnyScore - a.sunnyScore)
    .slice(0, limit);
}
