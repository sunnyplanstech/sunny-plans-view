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
// Colors are RGBA 0-255 and rendered as-is — pick the alpha you want to
// see on the map.
//
// All overlays are no-go zones. Green is reserved for the brand
// (sunscore = "go"), so layers draw from the warm exclusion ramp
// below — anchored to --destructive (hue 0), all outside the brand
// green band (hue 66–100). Wetlands stay blue: that's a universal
// cartographic convention for water and doesn't read as endorsement.

import { STATE_CODE_TO_SLUG, slugToStateCode } from "@/data/locations";

export type PartitionKind = "us-state" | "it-region";

export interface PartitionSpec {
  kind: PartitionKind;
  // Lowercase partition code → public PMTiles URL. For "us-state" the
  // code is the 2-letter state code ("ca"); for "it-region" it's the
  // pipeline's REGION_PARTITIONS key lowercased ("emilia-romagna").
  urlByCode: Record<string, string>;
}

export interface PMTilesLayerConfig {
  id: string;
  url?: string;
  partition?: PartitionSpec;
  label: string;
  description?: string;
  fillColor: [number, number, number, number];
  lineColor?: [number, number, number, number];
  minZoom?: number;
  maxZoom?: number;
  defaultVisible?: boolean;
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

// Exclusion ramp (RGB only; per-layer alpha set on use).
const NOGO = {
  crimson:    [197,  43,  56] as const, // strict     — protected lands
  vermillion: [219,  82,  36] as const, // high       — terrain
  ochre:      [197, 131,  38] as const, // moderate   — reserved
  sienna:     [129,  80,  45] as const, // secondary  — reserved
  magenta:    [180,  60, 122] as const, // distinct   — reserved (heritage)
  plum:       [121,  64, 135] as const, // cool       — reserved (infra)
};

const STEEP_25_BASE = {
  label: "Steep terrain (>25%)",
  description: "Slope > 25% — generally non-developable for utility solar",
  fillColor: [...NOGO.vermillion, 77]  as [number, number, number, number],
  lineColor: [...NOGO.vermillion, 180] as [number, number, number, number],
  minZoom: 0,
  maxZoom: 12,
  defaultVisible: false,
};

const PROTECTED_AREA_BASE = {
  fillColor: [...NOGO.crimson, 63]  as [number, number, number, number],
  lineColor: [...NOGO.crimson, 180] as [number, number, number, number],
  minZoom: 0,
  maxZoom: 12,
  defaultVisible: false,
};

export const PMTILES_LAYERS_BY_COUNTRY: Record<string, PMTilesLayerConfig[]> = {
  italy: [
    {
      id: "steep_25_it",
      partition: itRegionPartition("steep_25_it"),
      ...STEEP_25_BASE,
    },
    {
      id: "natura2000_it",
      url: `${TILES_BUCKET_BASE}/natura2000_it.pmtiles`,
      label: "Natura 2000",
      description:
        "EU Natura 2000 protected sites (Habitats + Birds Directives) — autorizzazione paesaggistica required, ~6–12 month delay",
      ...PROTECTED_AREA_BASE,
    },
  ],
  "united-states": [
    {
      id: "pad_us",
      url: `${TILES_BUCKET_BASE}/pad_us.pmtiles`,
      label: "Protected areas (PAD-US)",
      description:
        "Federal/state protected lands restricted for development (PAD-US Fee + Other, GAP 1–2 / Wilderness / NWR / etc.)",
      ...PROTECTED_AREA_BASE,
    },
    {
      id: "steep_25_us",
      partition: usStatePartition("steep_25_us"),
      ...STEEP_25_BASE,
    },
    {
      id: "nwi_us",
      partition: usStatePartition("nwi_us"),
      label: "Wetlands (NWI)",
      description:
        "USFWS National Wetlands Inventory — Clean Water Act permitting risk and ecological-sensitivity flag",
      fillColor: [60, 110, 200, 63],
      lineColor: [30, 70, 150, 140],
      minZoom: 0,
      maxZoom: 12,
      defaultVisible: false,
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
