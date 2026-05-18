// Per-country PMTiles overlay config — see roadmap p2-e2.
//
// Each entry maps to one or more .pmtiles files on the public tiles
// bucket (gs://sunnyplans-tiles/<id>.pmtiles, baked by the matching
// `tiles_*` Dagster asset). Adding a layer = one entry here + one
// asset in pipelines/core/<group>/.
//
// Partitioned layers (e.g. NWI, one .pmtiles per US state) declare a
// typed `partition` block instead of `url`. usePMTilesOverlays creates
// one TileLayer per file but they share the same visibility key so the
// user sees one toggle. pmtilesLayersFor(country, regionSlug) narrows a
// partition layer down to a single file when the user is on a
// state/region page.
//
// Visual encoding follows the framework in
// sunnyplans-docs/02_branding/01_map_visual_language.md:
//
//   - Each layer has a `role`: "avoid" (hard exclusion) or "target"
//     (soft suitability). The role drives both the map encoding here
//     and the UI grouping in ConstraintBar.
//   - Hard exclusions (PAD, Natura 2000, NWI, urban) use *texture*
//     (hatch patterns) on a neutral *base tint* (~37% slate fill). The
//     pattern carries source identity; the base tint carries coverage
//     weight. Combined visual coverage lands in the 55–65% range the
//     doc specs as "visibly blocking, basemap still readable".
//   - NWI keeps a slate-blue base + hatch (water convention is strong
//     enough that breaking it confuses more than it helps).
//   - Soft-suitability *target* layers (slope_lt_5) are baked so the
//     scrim pixels — inside the partition polygon AND failing the
//     suitability predicate — carry alpha=255, and everything else
//     (outside the polygon, or suitable terrain) carries alpha=0. A
//     plain BitmapLayer with tintColor=SCRIM_INK then paints the dim
//     directly: target-suitable patches and out-of-region area both
//     show the unmodified basemap; only the unsuitable in-region
//     pixels darken. Clipping in the bake is what lets neighbouring
//     region tiles sit side-by-side without painting scrim into each
//     other's territory.
//   - Same ink (`SCRIM_INK`, near-black) does the dimming job in both
//     directions: painted *inside* an avoid polygon as the base fill
//     under the hatch (so the avoid area looks de-emphasised), or on
//     the unsuitable pixels of a target raster (so non-flat terrain
//     inside the region looks de-emphasised). One hue, two
//     complementary uses, encoding intent symmetrically across the
//     two roles.
//   - Parcels (rendered separately, see ListingsGoogleMap.tsx) remain
//     the only saturated thing on the map. Nothing here may be louder.

import { STATE_CODE_TO_SLUG, slugToStateCode } from "@/data/locations";
import type { HatchPatternName } from "./hatchPatternAtlas";

export type PartitionKind = "us-state" | "it-region";

// Layer role — drives both the map encoding (here) and the UI grouping
// in ConstraintBar / registry.ts. Avoid layers are hard exclusions (you
// can't build here); target layers are soft-suitability affordances
// (you'd prefer to build here).
export type LayerRole = "avoid" | "target";

export interface PartitionSpec {
  kind: PartitionKind;
  // Lowercase partition code → public PMTiles URL. For "us-state" the
  // code is the 2-letter state code ("ca"); for "it-region" it's the
  // pipeline's REGION_PARTITIONS key lowercased ("emilia-romagna").
  urlByCode: Record<string, string>;
}

// Zoom range is intentionally absent — it lives in the .pmtiles header
// (set via each `tiles_*` Dagster asset's `min_zoom`/`max_zoom`) and is
// fetched at runtime in usePMTilesOverlays. Centralizing on the bake
// config means the frontend can never drift from what's actually baked.
//
// `kind` discriminates the rendering path:
//   - "vector" (default): PMTiles delivers MVT; renderer is
//     TileLayer + GeoJsonLayer (+ optional FillStyleExtension hatch).
//   - "raster": PMTiles delivers PNG tiles; renderer is
//     TileLayer + BitmapLayer with `fillColor` re-interpreted as
//     tintColor (RGB) × opacity (alpha/255). Hatch + lineColor are
//     ignored; the bake produces a flat translucent wash.
// Picking raster for slope (only) is the p1-e1-slope-raster-tiles.md
// trade-off: vector slope was carrying 1.8 MB / z8 of stairstep
// polygon fragments, where the layer doesn't use any of vector tiles'
// advanced features (no click, no hover, no per-feature styling).
export interface PMTilesLayerConfig {
  id: string;
  url?: string;
  partition?: PartitionSpec;
  label: string;
  description?: string;
  kind?: "vector" | "raster";
  // Cartographic role — see LayerRole above. Drives both the in-map
  // encoding pipeline (target layers also activate the global spotlight
  // scrim) and the UI grouping of the layer's row in ConstraintBar.
  role: LayerRole;
  fillColor: [number, number, number, number];
  lineColor?: [number, number, number, number];
  // Outline stroke width in pixels. Defaults to 1 when omitted. Hard
  // exclusions ship at 1.5 so the boundary still reads at low zoom
  // where the hatch becomes sub-pixel.
  lineWidth?: number;
  // Hatch pattern from hatchPatternAtlas. Present only on hard-
  // exclusion layers; absent (undefined) means a plain solid fill.
  pattern?: HatchPatternName;
  // Translucent solid fill painted *underneath* the hatch pattern.
  // Vector layers only — raster layers ignore this. The hatch carries
  // the source-identifying texture; this base fill carries the visual
  // coverage weight (the "you cannot build here" signal) by *darkening*
  // the polygon area. Set in the ~140 alpha range using SCRIM_INK (or
  // SCRIM_INK_BLUE for water-convention layers) — ≈ 55% solid coverage
  // under the hatch, calibrated so the polygon visibly drops out of
  // the search space without making the basemap unreadable.
  baseFillColor?: [number, number, number, number];
  defaultVisible?: boolean;
  // Layers like NWI fan out to ~50 partitioned PMTiles files; toggling
  // one on at the country view triggers tile fetches against every
  // partition. Set this on dense partitioned layers to keep the toggle
  // disabled until the user is on a state/region page.
  requiresRegionScope?: boolean;
}

const TILES_BUCKET_BASE =
  "https://storage.googleapis.com/sunnyplans-tiles";

// Sole frontend source of US state codes — derived from the slug map
// in locations.ts so the list never drifts from URL routing.
const US_STATE_CODES_LOWER = Object.keys(STATE_CODE_TO_SLUG).map(
  (c) => c.toLowerCase(),
);

function usStatePartition(objectIdPrefix: string): PartitionSpec {
  return {
    kind: "us-state",
    urlByCode: Object.fromEntries(
      US_STATE_CODES_LOWER.map((code) => [
        code,
        `${TILES_BUCKET_BASE}/${objectIdPrefix}_${code}.pmtiles`,
      ]),
    ),
  };
}

// IT region URL slug (locations.ts) → pipeline partition key,
// lowercased. Trentino-Alto Adige is intentionally absent: no slope
// partition exists for it (sistema tavolare ≠ ADE cadastre — see
// pipelines/core/it/partitions.py).
const IT_REGION_SLUG_TO_KEY: Record<string, string> = {
  abruzzo: "abruzzo",
  basilicata: "basilicata",
  calabria: "calabria",
  campania: "campania",
  emiliaromagna: "emilia-romagna",
  "friulivenezia-giulia": "friuli-venezia-giulia",
  lazio: "lazio",
  liguria: "liguria",
  lombardia: "lombardia",
  marche: "marche",
  molise: "molise",
  piemonte: "piemonte",
  puglia: "puglia",
  sardegna: "sardegna",
  sicilia: "sicilia",
  toscana: "toscana",
  umbria: "umbria",
  "valle-daosta": "valle-aosta",
  veneto: "veneto",
};

function itRegionPartition(objectIdPrefix: string): PartitionSpec {
  return {
    kind: "it-region",
    urlByCode: Object.fromEntries(
      Object.values(IT_REGION_SLUG_TO_KEY).map((key) => [
        key,
        `${TILES_BUCKET_BASE}/${objectIdPrefix}_${key}.pmtiles`,
      ]),
    ),
  };
}

// Brand ink — the visual-language palette's dim hue. Used in two
// complementary places:
//   - As the *scrim* painted outside a target polygon (slope), where it
//     dims the basemap so the target patch reads as bright by contrast.
//   - As the *base fill* painted inside a hard-exclusion polygon (PAD,
//     Natura 2000), where it dims the area itself so the exclusion
//     reads as "darkened, do not build here". Same hue on both sides of
//     the polygon keeps the avoid/target encoding visually coherent.
const SCRIM_INK = [22, 26, 34] as const;

// Blue-cast analog of SCRIM_INK — used as the dark base under NWI
// wetlands. Same role as SCRIM_INK (darken the polygon area) but
// preserves the water convention so wetlands stay readable as "wet"
// against PAD's neutral darkening.
const SCRIM_INK_BLUE = [16, 32, 64] as const;

// Hard-exclusion palette. The pattern's fillColor is the *hatch* tint
// (the stripes themselves) — kept at the higher-luminance slate /
// slate-blue so the stripes stay legible against the darker base. The
// baseFillColor is a translucent solid painted underneath the hatch
// and carries the polygon's coverage weight; it uses SCRIM_INK (or
// SCRIM_INK_BLUE for NWI) so the polygon visibly darkens its area on
// the basemap, mirroring the slope scrim's dim effect but applied
// inside the avoid polygon instead of outside it.
const NEUTRAL_SLATE = [80, 92, 110] as const;       // PAD, Natura 2000 (stripes + outline)
const SLATE_BLUE    = [60, 110, 160] as const;      // NWI (stripes + outline, water convention)

const HARD_EXCLUSION_BASE = {
  role: "avoid" as const,
  fillColor:     [...NEUTRAL_SLATE, 230] as [number, number, number, number],
  baseFillColor: [...SCRIM_INK, 140] as [number, number, number, number],
  lineColor:     [...NEUTRAL_SLATE, 230] as [number, number, number, number],
  lineWidth: 1.5,
  defaultVisible: true,
};

// Soft suitability (target affordance). Visual goal: target-suitable
// patches read as *un-dimmed basemap*, surrounded by darkened
// unsuitable terrain — but only inside the partition's polygon. Out
// of region stays clean so neighbouring region tiles compose
// seamlessly into a national picture.
//
// The raster bake (`raster_pmtiles.py`) encodes this directly: alpha
// is 255 where (inside polygon) AND (predicate false), 0 everywhere
// else. A plain BitmapLayer with `tintColor` then paints the scrim
// where alpha is high and leaves the rest of the tile transparent.
//
// `fillColor`:
//   - RGB → scrim colour (the dim ink the layer paints with)
//   - A   → max scrim alpha (how dark the dim looks at full strength)
//
// SCRIM_INK_DEEP is the near-black ink picked from the in-page A/B
// preset comparison: at ~82% opacity the unsuitable wash reads as
// intentional darkening — not basemap shadow — and the contrast at
// the slope_lt_5 boundary is obvious without needing a separate
// vector outline pass. Distinct from the neutral SCRIM_INK used by
// HARD_EXCLUSION_BASE (which sits under a hatch and needs to stay
// lighter so the stripes remain legible).
const SCRIM_INK_DEEP = [12, 14, 18] as const;

const SUITABLE_BASE = {
  role: "target" as const,
  kind: "raster" as const,
  fillColor: [...SCRIM_INK_DEEP, 210] as [number, number, number, number],
  defaultVisible: true,
};

// Catalog ordering is the deck.gl render order (earlier = lower z).
// Per the visual-language doc §5, target / soft-suitability layers
// render *below* hard-exclusion hatching, so the exclusion polygon
// always wins where the two overlap. Spotlight scrim is injected
// separately by usePMTilesOverlays at z-order #3 (below everything).
export const PMTILES_LAYERS_BY_COUNTRY: Record<string, PMTilesLayerConfig[]> = {
  italy: [
    {
      id: "slope_lt_5_it",
      partition: itRegionPartition("slope_lt_5_it"),
      label: "Flat land (<5% slope)",
      description:
        "Pendenza <5% — the unanimous \"definitely usable\" cutoff for utility solar/BESS siting",
      ...SUITABLE_BASE,
      requiresRegionScope: true,
    },
    {
      id: "natura2000_it",
      partition: itRegionPartition("natura2000_it"),
      label: "Natura 2000",
      description:
        "EU Natura 2000 protected sites (Habitats + Birds Directives) — autorizzazione paesaggistica required, ~6–12 month delay",
      ...HARD_EXCLUSION_BASE,
      pattern: "diagonal-left",
      requiresRegionScope: true,
    },
  ],
  "united-states": [
    {
      id: "slope_lt_5_us",
      partition: usStatePartition("slope_lt_5_us"),
      label: "Flat land (<5% slope)",
      description:
        "Slope <5% — the unanimous \"definitely usable\" cutoff for utility solar/BESS siting",
      ...SUITABLE_BASE,
      requiresRegionScope: true,
    },
    {
      id: "pad_us",
      partition: usStatePartition("pad_us"),
      label: "Protected areas (PAD-US)",
      description:
        "Federal/state protected lands restricted for development (PAD-US Fee + Other, GAP 1–2 / Wilderness / NWR / etc.)",
      ...HARD_EXCLUSION_BASE,
      pattern: "diagonal-right",
      requiresRegionScope: true,
    },
    {
      id: "nwi_us",
      partition: usStatePartition("nwi_us"),
      label: "Wetlands (NWI)",
      description:
        "USFWS National Wetlands Inventory — Clean Water Act permitting risk and ecological-sensitivity flag",
      role: "avoid",
      fillColor:     [...SLATE_BLUE, 230] as [number, number, number, number],
      baseFillColor: [...SCRIM_INK_BLUE, 140] as [number, number, number, number],
      lineColor:     [...SLATE_BLUE, 230] as [number, number, number, number],
      lineWidth: 1.5,
      pattern: "horizontal",
      defaultVisible: true,
      requiresRegionScope: true,
    },
  ],
};

function regionSlugToCode(
  country: string,
  regionSlug: string,
): { kind: PartitionKind; code: string } | undefined {
  if (country === "united-states") {
    const code = slugToStateCode(regionSlug);
    return code ? { kind: "us-state", code: code.toLowerCase() } : undefined;
  }
  if (country === "italy") {
    const code = IT_REGION_SLUG_TO_KEY[regionSlug];
    return code ? { kind: "it-region", code } : undefined;
  }
  return undefined;
}

function narrowToPartition(
  layer: PMTilesLayerConfig,
  kind: PartitionKind,
  code: string,
): PMTilesLayerConfig {
  if (!layer.partition || layer.partition.kind !== kind) return layer;
  const url = layer.partition.urlByCode[code];
  if (!url) {
    if (import.meta.env.DEV) {
      console.warn(
        `[pmtiles] ${layer.id}: no ${kind} URL for code=${code}; ` +
          `falling back to all ${Object.keys(layer.partition.urlByCode).length} files`,
      );
    }
    return layer;
  }
  return {
    ...layer,
    partition: { kind, urlByCode: { [code]: url } },
  };
}

// URL-scope filter: when the user is on a state/region (or
// county/province) page, narrow per-partition layers down to that one
// file. On the national page (regionSlug undefined) we keep the full
// per-partition list — deck.gl's TileLayer fires range-requests in
// parallel only for tiles whose bbox intersects the viewport, so the
// cost is bounded.
export function pmtilesLayersFor(
  country: string | undefined,
  regionSlug?: string,
): PMTilesLayerConfig[] {
  if (!country) return [];
  const layers = PMTILES_LAYERS_BY_COUNTRY[country] ?? [];
  if (!regionSlug) return layers;
  const resolved = regionSlugToCode(country, regionSlug);
  if (!resolved) return layers;
  return layers.map((l) => narrowToPartition(l, resolved.kind, resolved.code));
}
