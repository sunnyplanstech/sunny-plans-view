// src/data/locations.ts - Static location data for nations and first-level divisions

export const COUNTRIES = {
  "united-states": {
    name: "United States",
    slug: "united-states",
    states: [
      { name: "Alabama", slug: "alabama" },
      { name: "Alaska", slug: "alaska" },
      { name: "Arizona", slug: "arizona" },
      { name: "Arkansas", slug: "arkansas" },
      { name: "California", slug: "california" },
      { name: "Colorado", slug: "colorado" },
      { name: "Connecticut", slug: "connecticut" },
      { name: "Delaware", slug: "delaware" },
      { name: "Florida", slug: "florida" },
      { name: "Georgia", slug: "georgia" },
      { name: "Hawaii", slug: "hawaii" },
      { name: "Idaho", slug: "idaho" },
      { name: "Illinois", slug: "illinois" },
      { name: "Indiana", slug: "indiana" },
      { name: "Iowa", slug: "iowa" },
      { name: "Kansas", slug: "kansas" },
      { name: "Kentucky", slug: "kentucky" },
      { name: "Louisiana", slug: "louisiana" },
      { name: "Maine", slug: "maine" },
      { name: "Maryland", slug: "maryland" },
      { name: "Massachusetts", slug: "massachusetts" },
      { name: "Michigan", slug: "michigan" },
      { name: "Minnesota", slug: "minnesota" },
      { name: "Mississippi", slug: "mississippi" },
      { name: "Missouri", slug: "missouri" },
      { name: "Montana", slug: "montana" },
      { name: "Nebraska", slug: "nebraska" },
      { name: "Nevada", slug: "nevada" },
      { name: "New Hampshire", slug: "new-hampshire" },
      { name: "New Jersey", slug: "new-jersey" },
      { name: "New Mexico", slug: "new-mexico" },
      { name: "New York", slug: "new-york" },
      { name: "North Carolina", slug: "north-carolina" },
      { name: "North Dakota", slug: "north-dakota" },
      { name: "Ohio", slug: "ohio" },
      { name: "Oklahoma", slug: "oklahoma" },
      { name: "Oregon", slug: "oregon" },
      { name: "Pennsylvania", slug: "pennsylvania" },
      { name: "Rhode Island", slug: "rhode-island" },
      { name: "South Carolina", slug: "south-carolina" },
      { name: "South Dakota", slug: "south-dakota" },
      { name: "Tennessee", slug: "tennessee" },
      { name: "Texas", slug: "texas" },
      { name: "Utah", slug: "utah" },
      { name: "Vermont", slug: "vermont" },
      { name: "Virginia", slug: "virginia" },
      { name: "Washington", slug: "washington" },
      { name: "West Virginia", slug: "west-virginia" },
      { name: "Wisconsin", slug: "wisconsin" },
      { name: "Wyoming", slug: "wyoming" },
    ],
  },

  italy: {
    name: "Italy",
    slug: "italy",
    regions: [
      { name: "Abruzzo", slug: "abruzzo" },
      { name: "Basilicata", slug: "basilicata" },
      { name: "Calabria", slug: "calabria" },
      { name: "Campania", slug: "campania" },
      { name: "Emilia-Romagna", slug: "emiliaromagna" },
      { name: "Friuli-Venezia Giulia", slug: "friulivenezia-giulia" },
      { name: "Lazio", slug: "lazio" },
      { name: "Liguria", slug: "liguria" },
      { name: "Lombardia", slug: "lombardia" },
      { name: "Marche", slug: "marche" },
      { name: "Molise", slug: "molise" },
      { name: "Piemonte", slug: "piemonte" },
      { name: "Puglia", slug: "puglia" },
      { name: "Sardegna", slug: "sardegna" },
      { name: "Sicilia", slug: "sicilia" },
      { name: "Toscana", slug: "toscana" },
      { name: "Trentino-Alto Adige", slug: "trentinoalto-adige" },
      { name: "Umbria", slug: "umbria" },
      { name: "Valle d'Aosta", slug: "valle-daosta" },
      { name: "Veneto", slug: "veneto" },
    ],
  },
};

// US State code mappings (2-letter code to slug)
export const STATE_CODE_TO_SLUG: Record<string, string> = {
  AL: "alabama",
  AK: "alaska",
  AZ: "arizona",
  AR: "arkansas",
  CA: "california",
  CO: "colorado",
  CT: "connecticut",
  DE: "delaware",
  FL: "florida",
  GA: "georgia",
  HI: "hawaii",
  ID: "idaho",
  IL: "illinois",
  IN: "indiana",
  IA: "iowa",
  KS: "kansas",
  KY: "kentucky",
  LA: "louisiana",
  ME: "maine",
  MD: "maryland",
  MA: "massachusetts",
  MI: "michigan",
  MN: "minnesota",
  MS: "mississippi",
  MO: "missouri",
  MT: "montana",
  NE: "nebraska",
  NV: "nevada",
  NH: "new-hampshire",
  NJ: "new-jersey",
  NM: "new-mexico",
  NY: "new-york",
  NC: "north-carolina",
  ND: "north-dakota",
  OH: "ohio",
  OK: "oklahoma",
  OR: "oregon",
  PA: "pennsylvania",
  RI: "rhode-island",
  SC: "south-carolina",
  SD: "south-dakota",
  TN: "tennessee",
  TX: "texas",
  UT: "utah",
  VT: "vermont",
  VA: "virginia",
  WA: "washington",
  WV: "west-virginia",
  WI: "wisconsin",
  WY: "wyoming",
};

// Reverse mapping: slug to state code
export const SLUG_TO_STATE_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_CODE_TO_SLUG).map(([code, slug]) => [slug, code])
);

// Helper functions for state code conversion
export function stateCodeToSlug(code: string): string | undefined {
  return STATE_CODE_TO_SLUG[code.toUpperCase()];
}

export function slugToStateCode(slug: string): string | undefined {
  return SLUG_TO_STATE_CODE[slug.toLowerCase()];
}

// Convert county name to URL slug
export function countyToSlug(county: string): string {
  return county.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Convert URL slug back to county name for query (title case)
export function slugToCounty(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper functions for location lookups
export function getCountryBySlug(slug: string) {
  return Object.values(COUNTRIES).find(c => c.slug === slug);
}

export function getStateBySlug(stateSlug: string) {
  return COUNTRIES["united-states"].states.find(s => s.slug === stateSlug);
}

export function getRegionBySlug(regionSlug: string) {
  return COUNTRIES["italy"].regions.find(r => r.slug === regionSlug);
}

// Helper to get all static paths (used for sitemap generation)
export function getStaticLocationPaths() {
  const paths: { params: { country: string; state?: string; region?: string } }[] = [];
  
  const us = COUNTRIES["united-states"];
  for (const state of us.states) {
    paths.push({ params: { country: us.slug, state: state.slug } });
  }
  
  const italy = COUNTRIES["italy"];
  for (const region of italy.regions) {
    paths.push({ params: { country: italy.slug, region: region.slug } });
  }
  
  return paths;
}