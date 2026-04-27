import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { HexCell } from "@/hooks/useHexHeatmap";

export type { HexCell };

export type Scope =
  | { level: "national" }
  | { level: "region"; regionSlug: string }
  | { level: "subregion"; regionSlug: string; subregionSlug: string };

export interface BaseListing {
  id: string;
  prob_solar: number | null;
  geom_json: unknown | null;
  // Disc-jitter radius in meters around geom_json. Public mart only — null
  // on full-mart (unlocked) rows, where geom_json is the exact polygon.
  location_accuracy_m: number | null;
  rank_global: number | null;
}

export interface SeoCopy {
  title: string;
  description: string;
  keywords: string;
  structuredData: Record<string, unknown>;
}

export interface MapRenderProps {
  listings: BaseListing[];
  scope: Scope;
  hexCells?: HexCell[];
  showHeatmap: boolean;
  hexLoading: boolean;
  onToggleHeatmap: () => void;
}

export interface HeadingStrings {
  /** Prefix shown when at least one listing is found, before the bold location name. */
  topRated: string;
  /** Prefix shown when no listings match, before the bold location name. */
  nearLocation: string;
}

export interface DetailPageProps<TListing = unknown> {
  id: string;
  listing: TListing;
  onPaymentSuccess: () => void;
}

export interface CountryAdapter {
  slug: string;
  name: string;
  listingTerm: string;
  heading: HeadingStrings;

  parseScope(params: { region?: string; province?: string }): Scope;

  useListings(scope: Scope, limit: number): UseQueryResult<BaseListing[]>;
  useHeatmap(enabled: boolean): UseQueryResult<HexCell[]>;

  formatScopeName(scope: Scope): string;
  formatParentName(scope: Scope): string;
  rankSortLabel(scope: Scope): string;

  renderListingCard(listing: BaseListing, scope: Scope, listIndex: number): ReactNode;
  renderMap(props: MapRenderProps): ReactNode;
  seoCopy(scope: Scope, listings: BaseListing[]): SeoCopy;
}

export function parseScopeFromParams(params: { region?: string; province?: string }): Scope {
  if (params.region && params.province) {
    return { level: "subregion", regionSlug: params.region, subregionSlug: params.province };
  }
  if (params.region) {
    return { level: "region", regionSlug: params.region };
  }
  return { level: "national" };
}
