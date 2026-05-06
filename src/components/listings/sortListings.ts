// Pure listings sort. The layer-first preview rail offers a small set
// of sort keys — SunnyScore by default, with price-per-acre and
// flat-acres as alternates. Distance-to-grid is named in the roadmap
// but skipped here: there's no per-parcel grid-distance field exposed
// on listings yet (it lives only inside SunnyScore).
//
// Country adapters extend BaseListing with `list_price` (US) or
// `area_ha` (IT). The sort reads those fields defensively so a single
// list can mix shapes; missing fields land at the bottom of the order.
import type { BaseListing } from "@/countries/types";

export type SortKey = "sunnyscore" | "price_per_acre" | "flat_acres";

export interface SortOption {
  key: SortKey;
  label: string;
}

export const SORT_OPTIONS: ReadonlyArray<SortOption> = [
  { key: "sunnyscore", label: "SunnyScore" },
  { key: "price_per_acre", label: "Price per acre" },
  { key: "flat_acres", label: "Flat acres" },
];

export const DEFAULT_SORT_KEY: SortKey = "sunnyscore";

function num(listing: BaseListing, field: string): number | null {
  const value = (listing as unknown as Record<string, unknown>)[field];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function pricePerAcre(listing: BaseListing): number | null {
  const price = num(listing, "list_price");
  const acres = num(listing, "lot_acres");
  if (price === null || acres === null || acres <= 0) return null;
  return price / acres;
}

interface KeyedListing {
  listing: BaseListing;
  sortValue: number | null;
}

function keyFor(listing: BaseListing, key: SortKey): number | null {
  switch (key) {
    case "sunnyscore":
      return num(listing, "prob_solar");
    case "price_per_acre":
      return pricePerAcre(listing);
    case "flat_acres":
      return num(listing, "flat_5_acres");
  }
}

// Direction depends on the key: SunnyScore + flat acres sort
// descending (more is better); price-per-acre sorts ascending (cheaper
// is better).
function descending(key: SortKey): boolean {
  return key !== "price_per_acre";
}

export function sortListings<T extends BaseListing>(
  listings: ReadonlyArray<T>,
  key: SortKey,
): T[] {
  const desc = descending(key);
  const decorated: KeyedListing[] = listings.map((listing) => ({
    listing,
    sortValue: keyFor(listing, key),
  }));
  decorated.sort((a, b) => {
    if (a.sortValue === null && b.sortValue === null) return 0;
    if (a.sortValue === null) return 1;
    if (b.sortValue === null) return -1;
    return desc ? b.sortValue - a.sortValue : a.sortValue - b.sortValue;
  });
  return decorated.map((d) => d.listing as T);
}
