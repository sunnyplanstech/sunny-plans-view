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
//   - Hard exclusions (PAD, Natura 2000, NWI, urban) use *texture*
//     (hatch patterns) on a neutral fill, not hue. Different sources
//     get different hatch patterns so they remain distinguishable when
//     they overlap, without each one consuming a scarce hue slot.
//   - NWI keeps a slate-blue tint inside its hatch — water convention
//     is strong enough that breaking it confuses more than it helps.
//   - Soft suitability layers (slope_lt_5) use a low-saturation warm-
//     grey wash with no pattern: a positive-but-quiet affordance that
//     never competes with parcels for visual weight.
//   - Parcels (rendered separately, see ListingsGoogleMap.tsx) remain
//     the only saturated thing on the map. Nothing here may be louder.

import { STATE_CODE_TO_SLUG, slugToStateCode } from "@/data/locations";
import type { HatchPatternName } from "./hatchPatternAtlas";

export type PartitionKind = "us-state" | "it-region";

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
export interface PMTilesLayerConfig {
  id: string;
  url?: string;
  partition?: PartitionSpec;
  label: string;
  description?: string;
  fillColor: [number, number, number, number];
  lineColor?: [number, number, number, number];
  // Hatch pattern from hatchPatternAtlas. Present only on hard-
  // exclusion layers; absent (undefined) means a plain solid fill.
  pattern?: HatchPatternName;
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

// Hard-exclusion palette — neutral slate, no warm hue. Fill alpha is
// low because the hatch (white opaque pixels in the atlas, masked to
// fillColor by FillStyleExtension) carries the visual weight. Outline
// stays at higher alpha so the exclusion's *boundary* still reads at
// low zoom where the hatch is sub-pixel.
const NEUTRAL_SLATE = [80, 92, 110] as const;       // PAD, Natura 2000
const SLATE_BLUE    = [60, 110, 160] as const;      // NWI (water convention)

const HARD_EXCLUSION_BASE = {
  fillColor: [...NEUTRAL_SLATE, 200] as [number, number, number, number],
  lineColor: [...NEUTRAL_SLATE, 200] as [number, number, number, number],
  defaultVisible: false,
};

// Soft suitability — a low-saturation warm-grey wash. Deliberately
// *not* in the brand olive band: parcels own that slot, and a green
// "flat-land" overlay would visually compete with the actual targets.
// Warm grey reads as "neutral positive" — the user notices it but the
// eye still lands on parcels first.
const WARM_GREY = [196, 178, 140] as const;
const SUITABLE_BASE = {
  fillColor: [...WARM_GREY, 70]  as [number, number, number, number],
  lineColor: [...WARM_GREY, 140] as [number, number, number, number],
  defaultVisible: false,
};

export const PMTILES_LAYERS_BY_COUNTRY: Record<string, PMTilesLayerConfig[]> = {
  italy: [
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
    {
      id: "slope_lt_5_it",
      partition: itRegionPartition("slope_lt_5_it"),
      label: "Flat land (<5% slope)",
      description:
        "Pendenza <5% — the unanimous \"definitely usable\" cutoff for utility solar/BESS siting",
      ...SUITABLE_BASE,
      requiresRegionScope: true,
    },
  ],
  "united-states": [
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
      fillColor: [...SLATE_BLUE, 200] as [number, number, number, number],
      lineColor: [...SLATE_BLUE, 200] as [number, number, number, number],
      pattern: "horizontal",
      defaultVisible: false,
      requiresRegionScope: true,
    },
    {
      id: "slope_lt_5_us",
      partition: usStatePartition("slope_lt_5_us"),
      label: "Flat land (<5% slope)",
      description:
        "Slope <5% — the unanimous \"definitely usable\" cutoff for utility solar/BESS siting",
      ...SUITABLE_BASE,
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
