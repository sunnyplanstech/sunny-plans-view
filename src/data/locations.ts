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
      { name: "Emilia-Romagna", slug: "emilia-romagna" },
      { name: "Friuli-Venezia Giulia", slug: "friuli-venezia-giulia" },
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
      { name: "Trentino-Alto Adige", slug: "trentino-alto-adige" },
      { name: "Umbria", slug: "umbria" },
      { name: "Valle d'Aosta", slug: "valle-d-aosta" },
      { name: "Veneto", slug: "veneto" },
    ],
  },
};

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