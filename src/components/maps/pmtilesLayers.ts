// Per-country PMTiles overlay config — see roadmap p2-e2.
//
// Each entry maps to one .pmtiles file on the public pipeline bucket
// (gs://sunnyplans-pipeline/tiles/<id>.pmtiles, baked by the matching
// `*_pmtiles` Dagster asset). Adding a layer = one entry here + one
// asset in pipelines/core/<group>/.
//
// Colors are RGBA 0-255. The hook multiplies the alpha channel by the
// per-layer opacity slider, so the alphas below are the *base* visual
// weight at slider = 1.0.

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
  defaultOpacity?: number;
}

const PIPELINE_BUCKET_BASE =
  "https://storage.googleapis.com/sunnyplans-pipeline/tiles";

const STEEP_25_BASE = {
  label: "Steep terrain (>25%)",
  description: "Slope > 25% — generally non-developable for utility solar",
  fillColor: [220, 80, 30, 110] as [number, number, number, number],
  lineColor: [180, 50, 10, 200] as [number, number, number, number],
  minZoom: 0,
  maxZoom: 12,
  defaultVisible: false,
  defaultOpacity: 0.7,
};

export const PMTILES_LAYERS_BY_COUNTRY: Record<string, PMTilesLayerConfig[]> = {
  italy: [
    {
      id: "steep_25_it",
      url: `${PIPELINE_BUCKET_BASE}/steep_25_it.pmtiles`,
      ...STEEP_25_BASE,
    },
  ],
  "united-states": [
    {
      id: "pad_us",
      url: `${PIPELINE_BUCKET_BASE}/pad_us.pmtiles`,
      label: "Protected areas (PAD-US)",
      description:
        "Federal/state protected lands restricted for development (PAD-US Fee + Other, GAP 1–2 / Wilderness / NWR / etc.)",
      fillColor: [40, 140, 70, 90],
      lineColor: [20, 90, 40, 200],
      minZoom: 0,
      maxZoom: 12,
      defaultVisible: false,
      defaultOpacity: 0.7,
    },
    // steep_25_us bake asset not yet shipped — placeholder slot once
    // the per-state pmtiles asset lands. The frontend tolerates a
    // missing tile file (range request 404 → empty layer).
  ],
};

export function pmtilesLayersFor(country: string | undefined): PMTilesLayerConfig[] {
  if (!country) return [];
  return PMTILES_LAYERS_BY_COUNTRY[country] ?? [];
}
