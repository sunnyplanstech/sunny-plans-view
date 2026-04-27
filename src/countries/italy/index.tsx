import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/apiClient";
import { COUNTRIES } from "@/data/locations";
import ITListingCard from "@/components/listings/ITListingCard";
import ListingsGoogleMap from "@/components/maps/ListingsGoogleMap";
import { useITHexHeatmap } from "@/hooks/useHexHeatmap";
import type {
  BaseListing,
  CountryAdapter,
  MapRenderProps,
  Scope,
  SeoCopy,
} from "../types";
import { parseScopeFromParams } from "../types";

export interface ITListing extends BaseListing {
  comune_name: string;
  comune_slug: string;
  region_slug: string;
  rank_in_comune: number | null;
}

function buildListingsUrl(scope: Scope, limit: number): string {
  const params = new URLSearchParams({ limit: String(limit) });
  if (scope.level !== "national") params.set("region_slug", scope.regionSlug);
  if (scope.level === "subregion") params.set("comune_slug", scope.subregionSlug);
  return `/api/listings/it/public/?${params}`;
}

function useITListings(scope: Scope, limit: number) {
  return useQuery({
    queryKey: ["it-listings", scope, limit],
    queryFn: () => publicApi<ITListing[]>(buildListingsUrl(scope, limit)),
  });
}

function rankShowFor(scope: Scope): "global" | "region" | "comune" {
  if (scope.level === "subregion") return "comune";
  if (scope.level === "region") return "region";
  return "global";
}

function toTitle(slug: string): string {
  return slug
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function scopeName(scope: Scope): string {
  if (scope.level === "national") return "Italy";
  if (scope.level === "region") {
    const region = COUNTRIES.italy.regions.find(r => r.slug === scope.regionSlug);
    return region?.name ?? toTitle(scope.regionSlug);
  }
  return toTitle(scope.subregionSlug);
}

function parentName(scope: Scope): string {
  if (scope.level === "subregion") {
    const region = COUNTRIES.italy.regions.find(r => r.slug === scope.regionSlug);
    return region?.name ?? toTitle(scope.regionSlug);
  }
  return "Italy";
}

// IT listings have different field names than US — the existing Google map
// component is typed for USListing, so flatten to that shape with nulls
// where IT has no equivalent. This is the same conversion the legacy
// ListingsMap.tsx did inline.
function toMapShape(listings: ITListing[]) {
  return listings.map(listing => ({
    id: listing.id,
    state_code: listing.region_slug,
    county: listing.comune_name,
    lot_acres: null as number | null,
    list_price: null as number | null,
    price_per_acre: null as number | null,
    prob_solar: listing.prob_solar,
    power_substation: null as number | null,
    geom_json: listing.geom_json,
    location_accuracy_m: listing.location_accuracy_m,
    rank_global: listing.rank_global,
    rank_in_state: null as number | null,
    rank_in_county: listing.rank_in_comune,
  }));
}

function seoCopy(scope: Scope, listings: ITListing[]): SeoCopy {
  const locationName = scopeName(scope);
  const parent = parentName(scope);
  const description = `Particelle catastali per fotovoltaico e BESS in ${locationName}, ${parent}. Analisi solare e vicinanza alle sottostazioni elettriche.`;

  return {
    title: `Terreni per Fotovoltaico e BESS in ${locationName} | Sunnyplans`,
    description,
    keywords: `terreni fotovoltaico ${locationName}, BESS Italia, solare ${locationName}, particelle catastali fotovoltaico`,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Particelle Catastali per Fotovoltaico in ${locationName}`,
      description,
      numberOfItems: listings.length,
      itemListElement: listings.slice(0, 10).map((listing, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: `Solar Parcel - ${listing.comune_name}`,
          description: `Particella catastale con ${Math.round((listing.prob_solar ?? 0) * 100)}% probabilità solare. Pre-analizzata per connessione alla rete.`,
        },
      })),
    },
  };
}

export const italy: CountryAdapter = {
  slug: "italy",
  name: "Italy",
  listingTerm: "particelle",
  heading: {
    topRated: "Top Rated Particelle in",
    nearLocation: "Particelle Catastali near",
  },

  parseScope: parseScopeFromParams,
  useListings: useITListings as CountryAdapter["useListings"],
  useHeatmap: useITHexHeatmap,

  formatScopeName: scopeName,
  formatParentName: parentName,
  rankSortLabel(scope) {
    if (scope.level === "subregion") return "comune";
    if (scope.level === "region") return "region";
    return "national";
  },

  renderListingCard(listing, scope, listIndex) {
    return (
      <ITListingCard
        key={(listing as ITListing).id}
        listing={listing as ITListing}
        showRank={rankShowFor(scope)}
        listPosition={listIndex + 1}
      />
    );
  },

  renderMap(props: MapRenderProps) {
    return (
      <ListingsGoogleMap
        listings={toMapShape(props.listings as ITListing[])}
        className="w-full h-full min-h-[400px]"
        country="italy"
        hexCells={props.hexCells}
        showHeatmap={props.showHeatmap}
        hexLoading={props.hexLoading}
        onToggleHeatmap={props.onToggleHeatmap}
      />
    );
  },

  seoCopy(scope, listings) {
    return seoCopy(scope, listings as ITListing[]);
  },
};
