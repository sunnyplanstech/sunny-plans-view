import { CreditCard, ExternalLink, Lock, Ruler, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { seoKeywords } from "@/data/mockListings";
import { STATE_CODE_TO_SLUG } from "@/data/locations";
import { LockedField } from "@/components/listings/LockedField";
import type { OsmDistanceFields } from "@/data/osmDistanceFields";
import {
  SharedDetailPage,
  SpecTile,
  type DetailAdapter,
  type DetailListing,
} from "../SharedDetailPage";
import type { DetailPageProps } from "../types";

/**
 * US detail-endpoint response. Paid numeric/date fields render as
 * "****" when locked and as formatted display strings (e.g. "$397,500",
 * "47.18", "2026-04-22") when unlocked. property_url is the one paid
 * field *omitted* from the locked payload (USListingPublicSerializer
 * doesn't declare it) — the FE shows a paywall CTA in its place.
 * geom_json carries a disc-jittered Point (with location_accuracy_m as
 * the disc radius) when locked and the exact polygon when unlocked.
 */
export interface USListingDetail extends DetailListing {
  id: string;
  state_code: string;
  county: string | null;
  city: string | null;
  zip_code: string | null;
  list_price: string;
  lot_sqft: string;
  lot_acres: string;
  price_per_sqft: string;
  price_per_acre: string;
  sqft: string;
  property_url?: string;
  last_verified_at: string;
  rank_in_state: number;
  rank_in_county: number;
}

function formatSubstationDistance(meters: number | null): string {
  // 0 m means "parcel sits on the substation" — a legit best match,
  // not a missing value. Use `== null`, not `!meters`.
  if (meters == null) return "N/A";
  const miles = meters * 0.000621371;
  return `${Math.round(meters)} m (${miles.toFixed(1)} mi)`;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "-");
}

const usAdapter: DetailAdapter<USListingDetail> = {
  lang: "en",
  unit: "imperial",
  rankLabel: "in US",

  location(listing) {
    return {
      country: "united-states",
      region: STATE_CODE_TO_SLUG[listing.state_code.toUpperCase()],
      province: listing.county ? slugify(listing.county) : undefined,
    };
  },

  formatMeta(listing) {
    return `${listing.county} County, ${listing.state_code}`;
  },

  formatHeading(listing) {
    return `Solar Land in ${listing.county}, ${listing.state_code}`;
  },

  buildSeo(listing) {
    const accessGranted = listing.access_granted;
    const solarPercentage =
      listing.prob_solar != null ? Math.round(listing.prob_solar * 100) : null;
    // When accessGranted=false the serializer overwrites paid fields with
    // "****"; when true they're the formatted string ("" if the source was
    // null). So a simple truthy check is enough — no need to re-test isLocked.
    const titleAcres =
      accessGranted && listing.lot_acres ? `${listing.lot_acres} Acres ` : "";

    const title = `${titleAcres}Solar Land for Sale - ${listing.county}, ${listing.state_code} | Sunnyplans`;
    const description = `${titleAcres}Land in ${listing.county}, ${listing.state_code}. ${solarPercentage}% solar probability. Pre-vetted for BESS & solar projects.`;
    const keywords = [
      ...seoKeywords.primary.slice(0, 3),
      listing.state_code,
      listing.county,
      "solar land for sale",
      "USA solar land",
    ].join(", ");

    const structuredData: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: `Solar Land for Sale in ${listing.county}, ${listing.state_code}`,
      description,
      geo: {
        "@type": "GeoCoordinates",
        addressCountry: "US",
        addressRegion: listing.state_code,
      },
      additionalProperty: [
        { "@type": "PropertyValue", name: "Solar Probability", value: `${solarPercentage}%` },
      ],
    };
    if (accessGranted && listing.list_price) {
      structuredData.offers = {
        "@type": "Offer",
        priceCurrency: "USD",
        price: listing.list_price,
        availability: "https://schema.org/InStock",
      };
    }

    return { title, description, keywords, structuredData };
  },

  renderSpecTiles(listing, { openPaywall }) {
    return (
      <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SpecTile icon={Ruler} label="Size">
            <LockedField value={listing.lot_acres} onUnlock={openPaywall} /> Acres
          </SpecTile>
          <SpecTile icon={Zap} label="Substation">
            {formatSubstationDistance(listing.power_substation)}
          </SpecTile>
          <SpecTile icon={CreditCard} label="List Price">
            <LockedField value={listing.list_price} onUnlock={openPaywall} />
          </SpecTile>
          <SpecTile icon={CreditCard} label="Price / Acre">
            <LockedField value={listing.price_per_acre} onUnlock={openPaywall} />
          </SpecTile>
        </div>

        <div className="pt-2">
          {/* property_url is omitted from the public payload entirely (see
              USListingPublicSerializer) — its presence alone means unlocked. */}
          {listing.property_url ? (
            <Button asChild variant="outline" size="sm">
              <a href={listing.property_url} target="_blank" rel="noopener noreferrer">
                Open original listing
                <ExternalLink className="w-3 h-3 ml-2" />
              </a>
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={openPaywall}>
              Open original listing
              <Lock className="w-3 h-3 ml-2" />
            </Button>
          )}
        </div>
      </>
    );
  },

  strings: {
    backLabel: "Back to results",
    propertyDetailsTitle: "Property Details",
    whyScoreLabel: (score) => `Why this parcel scores ${score}`,
    solarProbabilityLabel: "Solar Probability",
    solarProbabilityDescription: (pct) =>
      `This parcel has a ${pct}% probability of being suitable for solar development based on our analysis.`,
    unlock: {
      heading: "Unlock this parcel",
      description: "Subscribe for full catalog access, or pay $49 to unlock just this listing.",
      cta: "See pricing options",
    },
  },
};

// Re-exported for legacy callsites that import the OsmDistanceFields-
// only base from this module.
export type { OsmDistanceFields };

export function USDetailPage(props: DetailPageProps<USListingDetail>) {
  return <SharedDetailPage {...props} adapter={usAdapter} />;
}
