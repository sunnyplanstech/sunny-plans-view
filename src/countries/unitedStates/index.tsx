import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/apiClient";
import { COUNTRIES, slugToCounty, slugToStateCode } from "@/data/locations";
import {
  generateListingKeywords,
  generateListingSEODescription,
} from "@/data/mockListings";
import USListingCard from "@/components/listings/USListingCard";
import ListingsGoogleMap from "@/components/maps/ListingsGoogleMap";
import { useUSHexHeatmap } from "@/hooks/useHexHeatmap";
import type {
  BaseListing,
  CountryAdapter,
  MapRenderProps,
  Scope,
  SeoCopy,
} from "../types";
import { parseScopeFromParams } from "../types";

export interface USListing extends BaseListing {
  state_code: string;
  county: string;
  rank_in_state: number | null;
  rank_in_county: number | null;
  list_price: number | null;
  lot_acres: number | null;
  power_substation: number | null;
}

function buildListingsUrl(
  scope: Scope,
  limit: number,
  extraParams?: URLSearchParams,
): string | null {
  const params = new URLSearchParams({ limit: String(limit) });
  if (scope.level !== "national") {
    const stateCode = slugToStateCode(scope.regionSlug);
    if (!stateCode) return null;
    params.set("state_code", stateCode);
  }
  if (scope.level === "subregion") {
    params.set("county", slugToCounty(scope.subregionSlug));
  }
  if (extraParams) {
    for (const [k, v] of extraParams) params.set(k, v);
  }
  return `/api/listings/public/?${params}`;
}

function useUSListings(
  scope: Scope,
  limit: number,
  extraParams?: URLSearchParams,
) {
  const url = buildListingsUrl(scope, limit, extraParams);
  const extraKey = extraParams ? extraParams.toString() : "";
  return useQuery({
    queryKey: ["us-listings", scope, limit, extraKey],
    queryFn: () => publicApi<USListing[]>(url!),
    enabled: url !== null,
  });
}

function rankShowFor(scope: Scope): "global" | "state" | "county" {
  if (scope.level === "subregion") return "county";
  if (scope.level === "region") return "state";
  return "global";
}

function scopeName(scope: Scope): string {
  if (scope.level === "national") return "United States";
  if (scope.level === "region") {
    const state = COUNTRIES["united-states"].states.find(s => s.slug === scope.regionSlug);
    return state?.name ?? toTitle(scope.regionSlug);
  }
  return toTitle(scope.subregionSlug);
}

function parentName(scope: Scope): string {
  if (scope.level === "subregion") {
    const state = COUNTRIES["united-states"].states.find(s => s.slug === scope.regionSlug);
    return state?.name ?? toTitle(scope.regionSlug);
  }
  return "United States";
}

function toTitle(slug: string): string {
  return slug
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function seoCopy(scope: Scope, listings: USListing[]): SeoCopy {
  const locationName = scopeName(scope);
  const description = generateListingSEODescription(locationName, listings.length, parentName(scope));
  const region = scope.level === "subregion" ? scopeName({ level: "region", regionSlug: scope.regionSlug }) : undefined;

  return {
    title: `Substation-Ready Land for BESS & Solar in ${locationName} | Sunnyplans`,
    description,
    keywords: generateListingKeywords(locationName, region),
    structuredData: {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Substation-Ready Solar Land in ${locationName}`,
      description,
      numberOfItems: listings.length,
      itemListElement: listings.slice(0, 10).map((listing, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "RealEstateListing",
          name: `Solar Land in ${listing.county}, ${listing.state_code}`,
          description: `${listing.lot_acres} acre land with ${Math.round((listing.prob_solar ?? 0) * 100)}% solar probability. Pre-vetted for grid connection.`,
        },
      })),
    },
  };
}

export const unitedStates: CountryAdapter = {
  slug: "united-states",
  name: "United States",
  listingTerm: "parcels",
  heading: {
    topRated: "Top Rated Solar Land in",
    nearLocation: "Solar Land Opportunities near",
  },

  parseScope: parseScopeFromParams,
  useListings: useUSListings as CountryAdapter["useListings"],
  useHeatmap: useUSHexHeatmap,

  formatScopeName: scopeName,
  formatParentName: parentName,
  rankSortLabel(scope) {
    if (scope.level === "subregion") return "county";
    if (scope.level === "region") return "state";
    return "national";
  },

  renderListingCard(listing, scope, _listIndex, options) {
    const us = listing as USListing;
    return (
      <USListingCard
        key={us.id}
        listing={us}
        showRank={rankShowFor(scope)}
        onSelect={options?.onSelect as ((l: USListing) => void) | undefined}
      />
    );
  },

  renderMap(props: MapRenderProps) {
    const regionSlug =
      props.scope.level !== "national" ? props.scope.regionSlug : undefined;
    return (
      <ListingsGoogleMap
        listings={props.listings as USListing[]}
        className="w-full h-full min-h-[400px]"
        country="united-states"
        regionSlug={regionSlug}
        hexCells={props.hexCells}
        showHeatmap={props.showHeatmap}
        hexLoading={props.hexLoading}
        onToggleHeatmap={props.onToggleHeatmap}
        pageControlledOverlayIds={props.pageControlledOverlayIds}
        onZoomChange={props.onZoomChange}
        onListingClick={props.onListingClick}
      />
    );
  },

  seoCopy(scope, listings) {
    return seoCopy(scope, listings as USListing[]);
  },
};
