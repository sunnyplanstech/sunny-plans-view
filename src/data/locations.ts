// src/data/static-locations.js

export const COUNTRIES = {
  "united-states": {
    name: "United States",
    slug: "united-states",
    // Use USPS two-letter codes as slugs for states (clean, SEO-friendly, standard)
    states: [
      { name: "Alabama", slug: "al" },
      { name: "Alaska", slug: "ak" },
      { name: "Arizona", slug: "az" },
      { name: "Arkansas", slug: "ar" },
      { name: "California", slug: "ca" },
      { name: "Colorado", slug: "co" },
      { name: "Connecticut", slug: "ct" },
      { name: "Delaware", slug: "de" },
      { name: "Florida", slug: "fl" },
      { name: "Georgia", slug: "ga" },
      { name: "Hawaii", slug: "hi" },
      { name: "Idaho", slug: "id" },
      { name: "Illinois", slug: "il" },
      { name: "Indiana", slug: "in" },
      { name: "Iowa", slug: "ia" },
      { name: "Kansas", slug: "ks" },
      { name: "Kentucky", slug: "ky" },
      { name: "Louisiana", slug: "la" },
      { name: "Maine", slug: "me" },
      { name: "Maryland", slug: "md" },
      { name: "Massachusetts", slug: "ma" },
      { name: "Michigan", slug: "mi" },
      { name: "Minnesota", slug: "mn" },
      { name: "Mississippi", slug: "ms" },
      { name: "Missouri", slug: "mo" },
      { name: "Montana", slug: "mt" },
      { name: "Nebraska", slug: "ne" },
      { name: "Nevada", slug: "nv" },
      { name: "New Hampshire", slug: "nh" },
      { name: "New Jersey", slug: "nj" },
      { name: "New Mexico", slug: "nm" },
      { name: "New York", slug: "ny" },
      { name: "North Carolina", slug: "nc" },
      { name: "North Dakota", slug: "nd" },
      { name: "Ohio", slug: "oh" },
      { name: "Oklahoma", slug: "ok" },
      { name: "Oregon", slug: "or" },
      { name: "Pennsylvania", slug: "pa" },
      { name: "Rhode Island", slug: "ri" },
      { name: "South Carolina", slug: "sc" },
      { name: "South Dakota", slug: "sd" },
      { name: "Tennessee", slug: "tn" },
      { name: "Texas", slug: "tx" },
      { name: "Utah", slug: "ut" },
      { name: "Vermont", slug: "vt" },
      { name: "Virginia", slug: "va" },
      { name: "Washington", slug: "wa" },
      { name: "West Virginia", slug: "wv" },
      { name: "Wisconsin", slug: "wi" },
      { name: "Wyoming", slug: "wy" },
    ],
  },

  italy: {
    name: "Italy",
    slug: "italy",
    // Use lowercase + kebab-case for Italian regions (common in Italian URLs)
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

// Helper to get all top-level paths (useful for sitemap / static generation)
export function getStaticCountryPaths() {
  return Object.values(COUNTRIES).flatMap(country => {
    const countrySlug = country.slug;

    if (countrySlug === "united-states") {
      return country.states.map(state => ({
        params: { country: countrySlug, state: state.slug },
      }));
    } else if (countrySlug === "italy") {
      return country.regions.map(region => ({
        params: { country: countrySlug, region: region.slug },
      }));
    }
    return [];
  });
}