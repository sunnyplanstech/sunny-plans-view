// SEO utilities for listings pages - keep for programmatic SEO

// SEO keywords extracted from homepage for programmatic SEO
export const seoKeywords = {
  primary: [
    "solar land",
    "land solar",
    "solar and solar",
    "land for solar",
    "bess solar",
    "450w panel",
    "solar and bess",
    "sol energy",
    "solar land acquisition",
    "geo solar",
    "solar acquisition",
    "bess in solar",
    "solar in solar",
    "solary fotowoltaika",
    "solary fotowoltaiczne",
    "substation-ready land",
    "BESS development",
    "solar farm land",
    "grid-connected parcels",
    "utility-scale solar",
    "battery storage sites",
  ],
  secondary: [
    "geo-analytics",
    "pre-vetted parcels",
    "grid connection",
    "interconnection",
    "constraint filtering",
    "photovoltaic",
    "site acquisition",
    "renewable energy",
    "solar projects",
    "battery storage",
  ],
  features: [
    "automated land indexing",
    "substation-proximate",
    "infrastructure costs",
    "permitting viability",
    "regulatory compliance",
  ],
};

// Generate SEO-optimized description for listings pages
export function generateListingSEODescription(
  locationName: string,
  listingCount: number,
  parentName?: string
): string {
  return `Discover ${listingCount} substation-ready land opportunities for BESS & solar projects in ${locationName}${parentName ? `, ${parentName}` : ""}. Pre-vetted parcels with constraint analysis and solar probability ratings.`;
}

// Generate SEO-optimized keywords for listings pages
export function generateListingKeywords(
  locationName: string,
  region?: string,
  landTypes?: string[]
): string {
  const locationKeywords = [locationName, region].filter(Boolean);
  const landTypeKeywords = landTypes?.length
    ? landTypes
    : ["agricultural", "industrial", "brownfield"];

  return [
    ...seoKeywords.primary.slice(0, 3),
    ...locationKeywords,
    "land for sale",
    ...landTypeKeywords.map(t => `${t} land`),
    "grid connection",
  ].join(", ");
}
