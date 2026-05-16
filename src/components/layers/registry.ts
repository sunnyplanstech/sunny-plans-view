// Layer-first UI registry — see roadmap p1-e3-layer-first-ui.
//
// Each Layer entry is the single source of truth for a user-selectable
// constraint or suitability layer: how it's labelled, which vertical
// bundle it belongs to, what listings filter it applies, what chip it
// surfaces on a card, and which pmtiles overlay it lights up.
//
// The map overlay catalog (`pmtilesLayers.ts`) stays the authoritative
// list of *baked* tiles. This registry is the user-facing layer model
// and references map overlay ids by string — so a layer can exist in
// the panel without a map overlay (e.g. a numeric-only filter), or
// reference an overlay that's also rendered by the in-map LayerPanel.
//
// Per the roadmap's "no dead toggles" rule, layers without backing
// data for the user's region must be filtered out before render — see
// `availableLayers()` below.
import {
  PMTILES_LAYERS_BY_COUNTRY,
  type LayerRole,
} from "@/components/maps/pmtilesLayers";

export type Vertical = "energy" | "van-life";
export type SpatialUnit = "parcel" | "street-segment";
export type CountrySlug = "united-states" | "italy";
export type { LayerRole };

export interface LayerListingsFilter {
  // Query param name appended to the listings URL when this layer is
  // selected (e.g. "min_flat_5_acres").
  param: string;
  // Default value for the filter. The user-story names "5" as the
  // unanimous "definitely usable" cutoff for slope_lt_5.
  defaultValue: string;
}

export interface LayerChip {
  // Numeric field on the listing payload that drives the chip (e.g.
  // "flat_5_acres"). The chip renders only when this value is present
  // and `condition` returns true.
  fieldKey: string;
  condition: (value: number) => boolean;
  format: (value: number) => string;
}

export interface Layer {
  id: string;
  label: string;
  // One-line technical description shown beneath the label in the
  // page-level LayerPanel.
  description: string;
  vertical: Vertical;
  spatialUnit: SpatialUnit;
  // Cartographic role — see LayerRole in pmtilesLayers.ts. Drives the
  // ConstraintBar's "Avoid / Target" grouping in the UI and pairs with
  // the map-side encoding of the same role on PMTilesLayerConfig.
  role: LayerRole;
  // Country scope — undefined means cross-country.
  country: CountrySlug;
  // Map overlay this layer toggles, by pmtilesLayers.ts id. Optional:
  // a layer can be filter-only with no overlay, or overlay-only with
  // no listings filter.
  pmtilesLayerId?: string;
  // True when the layer's overlay needs the user to be on a state /
  // region (or deeper) page — the catalog already encodes this on the
  // pmtiles entry; we mirror it here so the panel can show the hint
  // even when the layer is filter-only.
  requiresRegionScope?: boolean;
  // Lowest map zoom at which this layer's data is meaningful. Below
  // this zoom the constraint bar surfaces a "zoom in to apply" hint and
  // the row's effect counter is held back. The toggle stays selectable —
  // a constraint is the user's project intent, not a map-local toggle.
  minZoom: number;
  listingsFilter?: LayerListingsFilter;
  chip?: LayerChip;
  // Seeded into `selectedIds` on the very first page load (no `c=` in
  // the URL). Used for overlay-only layers whose visual presence is the
  // point — the user shouldn't have to opt in to see what's already
  // been filtered out for them. After any user interaction the URL
  // takes authority; clearing is sticky across reloads.
  defaultSelected?: boolean;
}

const SLOPE_LT_5_CHIP: LayerChip = {
  fieldKey: "flat_5_acres",
  condition: (v) => v > 0,
  format: (v) =>
    v >= 10 ? `${Math.round(v)} ac flat` : `${v.toFixed(1)} ac flat`,
};

const SLOPE_LT_5_FILTER: LayerListingsFilter = {
  param: "min_flat_5_acres",
  defaultValue: "5",
};

// Registry order = UI display order. Avoid layers first, then target —
// users scan top-down and "is this parcel even legal?" must precede
// "is it suitable?" (see visual-language doc §10).
//
// PAD-US, NWI wetlands, and Natura 2000 are hard mart-level invariants
// (mart_us_listings.sql, mart_it_parcels.sql) — they don't filter the
// listings cohort because the cohort already excludes anything that
// overlaps them. They appear here as *overlay-only* entries (no chip,
// no listingsFilter) so the map can still paint the polygons as a
// trust-signal "this is what we filtered out for you", with the
// toggle living in ConstraintBar's existing Avoid section. They're
// `defaultSelected: true` so the overlay is on the moment the page
// mounts; clicking the toggle hides the polygons without changing
// which listings qualify.
export const LAYER_REGISTRY: Layer[] = [
  {
    id: "pad_us",
    label: "Protected areas",
    description:
      "PAD-US federal/state protected lands — already excluded from listings, shown for context",
    vertical: "energy",
    spatialUnit: "parcel",
    role: "avoid",
    country: "united-states",
    pmtilesLayerId: "pad_us",
    requiresRegionScope: true,
    minZoom: 6,
    defaultSelected: true,
  },
  {
    id: "nwi_us",
    label: "Wetlands",
    description:
      "USFWS National Wetlands Inventory — already excluded from listings, shown for context",
    vertical: "energy",
    spatialUnit: "parcel",
    role: "avoid",
    country: "united-states",
    pmtilesLayerId: "nwi_us",
    requiresRegionScope: true,
    minZoom: 11,
    defaultSelected: true,
  },
  {
    id: "slope_lt_5_us",
    label: "Flat land (<5% slope)",
    description:
      "Slope <5% — usable terrain for utility solar / BESS siting",
    vertical: "energy",
    spatialUnit: "parcel",
    role: "target",
    country: "united-states",
    pmtilesLayerId: "slope_lt_5_us",
    requiresRegionScope: true,
    minZoom: 11,
    listingsFilter: SLOPE_LT_5_FILTER,
    chip: SLOPE_LT_5_CHIP,
  },
  {
    id: "natura2000_it",
    label: "Natura 2000",
    description:
      "EU Natura 2000 protected sites — already excluded from particelle, shown for context",
    vertical: "energy",
    spatialUnit: "parcel",
    role: "avoid",
    country: "italy",
    pmtilesLayerId: "natura2000_it",
    requiresRegionScope: true,
    minZoom: 6,
    defaultSelected: true,
  },
  {
    id: "slope_lt_5_it",
    label: "Flat land (<5% slope)",
    description: "Pendenza <5% — usable terrain for solar / BESS siting",
    vertical: "energy",
    spatialUnit: "parcel",
    role: "target",
    country: "italy",
    pmtilesLayerId: "slope_lt_5_it",
    requiresRegionScope: true,
    minZoom: 11,
    listingsFilter: SLOPE_LT_5_FILTER,
    chip: SLOPE_LT_5_CHIP,
  },
];

// Layers visible to the user given the current country. Per "no dead
// toggles" the pmtiles-backed entries gate against the bake catalog so
// a layer with no baked tile in this build silently disappears. A
// future capabilities probe replaces this with API-driven availability.
export function availableLayers(country: CountrySlug | undefined): Layer[] {
  if (!country) return [];
  const baked = new Set(
    (PMTILES_LAYERS_BY_COUNTRY[country] ?? []).map((l) => l.id),
  );
  return LAYER_REGISTRY.filter(
    (l) => l.country === country && (!l.pmtilesLayerId || baked.has(l.pmtilesLayerId)),
  );
}

// Build the listings query params from selected layer ids.
// Returns an empty URLSearchParams when no layer contributes a filter,
// so callers can compose this with their existing scope params.
export function listingsParamsFor(
  selectedIds: ReadonlySet<string>,
  layers: Layer[],
): URLSearchParams {
  const params = new URLSearchParams();
  for (const layer of layers) {
    if (!selectedIds.has(layer.id)) continue;
    const filter = layer.listingsFilter;
    if (!filter) continue;
    params.set(filter.param, filter.defaultValue);
  }
  return params;
}

// Map overlay ids unlocked by the current selection. Used to drive
// the deck.gl overlay state from the page-level LayerPanel instead of
// the in-map toggle.
export function selectedOverlayIds(
  selectedIds: ReadonlySet<string>,
  layers: Layer[],
): Set<string> {
  const out = new Set<string>();
  for (const layer of layers) {
    if (selectedIds.has(layer.id) && layer.pmtilesLayerId) {
      out.add(layer.pmtilesLayerId);
    }
  }
  return out;
}
