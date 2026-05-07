// Hatch pattern atlas for hard-exclusion map layers.
//
// The map visual language (sunnyplans-docs/02_branding/01_map_visual_language.md)
// reserves *texture* — not hue — for hard-exclusion polygons (PAD,
// Natura 2000, NWI, urban). Different exclusions get different patterns
// (diagonal-right, diagonal-left, horizontal, dot-grid) so they stay
// distinguishable when they overlap, without each one competing for a
// scarce hue slot in the brand palette.
//
// deck.gl's FillStyleExtension consumes a single sprite atlas + a
// {name -> {x,y,w,h}} mapping. We render the four 16x16 tiles into one
// 64x16 image at module load, then reference them by name from
// usePMTilesOverlays.ts. Tiles are designed to be seamlessly repeating
// so deck.gl's tiling produces no visible seams.
//
// fillPatternMask defaults to true: white pixels in the atlas are where
// the layer's getFillColor shows through; transparent pixels stay see-
// through to the base map. So hatching = white strokes on a fully
// transparent background.
//
// SSR safety: Vite/React renders this on the client, but we still guard
// against `document` being absent (test runners, edge SSR). The fallback
// returns null, and usePMTilesOverlays no-ops the pattern wiring when
// the atlas isn't ready.

export type HatchPatternName =
  | "diagonal-right"
  | "diagonal-left"
  | "horizontal"
  | "dots";

export interface PatternFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

const TILE = 16;
const ATLAS_WIDTH = TILE * 4;
const ATLAS_HEIGHT = TILE;

export const HATCH_PATTERN_MAPPING: Record<HatchPatternName, PatternFrame> = {
  "diagonal-right": { x: TILE * 0, y: 0, width: TILE, height: TILE },
  "diagonal-left":  { x: TILE * 1, y: 0, width: TILE, height: TILE },
  "horizontal":     { x: TILE * 2, y: 0, width: TILE, height: TILE },
  "dots":           { x: TILE * 3, y: 0, width: TILE, height: TILE },
};

// Stripe pixel width is the dominant readability lever. 2px on a 16px
// tile = ~12% coverage per stripe; doubled by the cross direction it
// reads as "marked off" without becoming a solid wash.
const STROKE_PX = 2;

function drawDiagonal(
  ctx: CanvasRenderingContext2D,
  ox: number,
  direction: 1 | -1,
) {
  ctx.save();
  ctx.fillStyle = "#fff";
  // Tile a single diagonal stripe across the 16x16 cell, plus one
  // shifted copy to keep the pattern seamless across the tile boundary.
  for (let offset = -TILE; offset <= TILE; offset += TILE) {
    ctx.beginPath();
    if (direction === 1) {
      // \\\\ — top-left to bottom-right
      ctx.moveTo(ox + offset, 0);
      ctx.lineTo(ox + offset + STROKE_PX, 0);
      ctx.lineTo(ox + offset + TILE + STROKE_PX, TILE);
      ctx.lineTo(ox + offset + TILE, TILE);
    } else {
      // //// — top-right to bottom-left
      ctx.moveTo(ox + offset + TILE, 0);
      ctx.lineTo(ox + offset + TILE - STROKE_PX, 0);
      ctx.lineTo(ox + offset - STROKE_PX, TILE);
      ctx.lineTo(ox + offset, TILE);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawHorizontal(ctx: CanvasRenderingContext2D, ox: number) {
  ctx.fillStyle = "#fff";
  // Two horizontal stripes per tile so the rhythm is visible without
  // the field becoming solid. Stripes at 1/4 and 3/4 of the tile height.
  ctx.fillRect(ox, TILE * 0.25 - STROKE_PX / 2, TILE, STROKE_PX);
  ctx.fillRect(ox, TILE * 0.75 - STROKE_PX / 2, TILE, STROKE_PX);
}

function drawDots(ctx: CanvasRenderingContext2D, ox: number) {
  ctx.fillStyle = "#fff";
  // 2x2 grid of small dots — quietest of the four patterns, used for
  // the "urban" exclusion which already reads as built-up from the
  // satellite base layer.
  const r = STROKE_PX / 2 + 0.5;
  for (const cx of [TILE * 0.25, TILE * 0.75]) {
    for (const cy of [TILE * 0.25, TILE * 0.75]) {
      ctx.beginPath();
      ctx.arc(ox + cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function buildAtlasDataUrl(): string | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_WIDTH;
  canvas.height = ATLAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  // Atlas starts fully transparent; we paint only the stripe pixels.
  ctx.clearRect(0, 0, ATLAS_WIDTH, ATLAS_HEIGHT);
  drawDiagonal(ctx, HATCH_PATTERN_MAPPING["diagonal-right"].x, 1);
  drawDiagonal(ctx, HATCH_PATTERN_MAPPING["diagonal-left"].x, -1);
  drawHorizontal(ctx, HATCH_PATTERN_MAPPING["horizontal"].x);
  drawDots(ctx, HATCH_PATTERN_MAPPING["dots"].x);
  return canvas.toDataURL("image/png");
}

// Build once per page load; the data URL is small (a few hundred bytes)
// and immutable, so we cache it module-scope.
let _atlasUrl: string | null = null;
export function getHatchAtlasUrl(): string | null {
  if (_atlasUrl === null) _atlasUrl = buildAtlasDataUrl();
  return _atlasUrl;
}

// Pattern scale (FillStyleExtension's getFillPatternScale default unit)
// is "original tile size in meters at scale 1". Our 16px tile rendered
// at scale 40 ≈ 640m per tile — readable at the constraint-inspection
// zoom range (z 9–14) where the bake exposes these layers, without
// devolving into solid wash at country view.
export const HATCH_PATTERN_SCALE = 40;
