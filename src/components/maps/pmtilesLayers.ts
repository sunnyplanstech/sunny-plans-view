// Per-country PMTiles overlay config — see roadmap p2-e2.
//
// Each entry maps to one .pmtiles file on the public tiles bucket
// (gs://sunnyplans-tiles/<id>.pmtiles, baked by the matching
// `*_pmtiles` Dagster asset). Adding a layer = one entry here + one
// asset in pipelines/core/<group>/.
//
// Colors are RGBA 0-255 and rendered as-is — pick the alpha you want to
// see on the map.

export interface PMTilesLayerConfig {
  id: string;
  url: string;
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

const STEEP_25_BASE = {
  label: "Steep terrain (>25%)",
  description: "Slope > 25% — generally non-developable for utility solar",
  fillColor: [220, 80, 30, 77] as [number, number, number, number],
  lineColor: [180, 50, 10, 140] as [number, number, number, number],
  minZoom: 0,
  maxZoom: 12,
  defaultVisible: false,
};

const PROTECTED_AREA_BASE = {
  fillColor: [40, 140, 70, 63] as [number, number, number, number],
  lineColor: [20, 90, 40, 140] as [number, number, number, number],
  minZoom: 0,
  maxZoom: 12,
  defaultVisible: false,
};

export const PMTILES_LAYERS_BY_COUNTRY: Record<string, PMTilesLayerConfig[]> = {
  italy: [
    {
      id: "steep_25_it",
      url: `${TILES_BUCKET_BASE}/steep_25_it.pmtiles`,
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
      url: `${TILES_BUCKET_BASE}/steep_25_us.pmtiles`,
      ...STEEP_25_BASE,
    },
    {
      id: "nwi_us",
      url: `${TILES_BUCKET_BASE}/nwi_us.pmtiles`,
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

export function pmtilesLayersFor(country: string | undefined): PMTilesLayerConfig[] {
  if (!country) return [];
  return PMTILES_LAYERS_BY_COUNTRY[country] ?? [];
}
