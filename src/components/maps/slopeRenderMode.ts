// Dev-only render-mode toggle for the target-role slope raster.
//
// Why this file exists: the production scrim (SUITABLE_BASE in
// pmtilesLayers.ts) reads as ambient shadow on real terrain, and the
// suitable/unsuitable boundary is hard to pick out at country / state
// zoom levels. We need to compare a few tunable variants visually on
// the live map before committing to one.
//
// Activated by URL search param `?slope-render=<preset>`. Absent → the
// "baseline" preset, which matches what's currently shipped. Once we
// pick a winner the choice gets folded back into SUITABLE_BASE and
// this module gets deleted.
//
// The presets only drive `tintColor` + per-pixel alpha multiplier on
// the BitmapLayer that paints the bake's alpha mask — they cannot
// flip the mask convention (which would need a re-bake) or add a
// vector boundary line (which would need a separate overlay). Both
// are larger changes worth keeping out of this preview path.

export type SlopeRenderPreset = "baseline" | "deep" | "cool" | "sepia";

interface PresetSpec {
  // RGB tint multiplied into the bake's white-on-transparent mask.
  rgb: [number, number, number];
  // 0–255 max scrim opacity. The BitmapLayer further multiplies this
  // by the bake's per-pixel alpha (0 or 255), so this is effectively
  // "alpha at painted pixels".
  alpha: number;
  // Shown in the floating mode chip so the comparison stays grounded
  // in what each preset is trying to achieve.
  label: string;
  description: string;
}

export const SLOPE_RENDER_PRESETS: Record<SlopeRenderPreset, PresetSpec> = {
  baseline: {
    rgb: [22, 26, 34],
    alpha: 115,
    label: "Baseline",
    description: "Current shipped scrim — dark ink, ~45% opacity",
  },
  deep: {
    rgb: [12, 14, 18],
    alpha: 210,
    label: "Deep dim",
    description: "Near-black ink, ~82% opacity — boundary reads by contrast",
  },
  cool: {
    rgb: [22, 38, 64],
    alpha: 180,
    label: "Cool ink",
    description: "Blue-cast ink, ~70% opacity — reads as data overlay, not shadow",
  },
  sepia: {
    rgb: [70, 56, 38],
    alpha: 165,
    label: "Sepia",
    description: "Warm earth tint, ~65% opacity — \"unsuitable terrain\" warmth",
  },
};

export const SLOPE_PRESET_ORDER: SlopeRenderPreset[] = [
  "baseline",
  "deep",
  "cool",
  "sepia",
];

const QUERY_KEY = "slope-render";

export function getSlopeRenderPreset(): SlopeRenderPreset {
  if (typeof window === "undefined") return "baseline";
  const raw = new URLSearchParams(window.location.search).get(QUERY_KEY);
  if (raw && raw in SLOPE_RENDER_PRESETS) {
    return raw as SlopeRenderPreset;
  }
  return "baseline";
}

// Build a URL pointing at `preset` while preserving every other search
// param + the current pathname/hash. Used by the floating mode chip to
// render anchor hrefs the user can right-click / open in new tab.
export function urlForSlopeRenderPreset(preset: SlopeRenderPreset): string {
  if (typeof window === "undefined") return `?${QUERY_KEY}=${preset}`;
  const url = new URL(window.location.href);
  if (preset === "baseline") {
    url.searchParams.delete(QUERY_KEY);
  } else {
    url.searchParams.set(QUERY_KEY, preset);
  }
  return url.pathname + url.search + url.hash;
}
