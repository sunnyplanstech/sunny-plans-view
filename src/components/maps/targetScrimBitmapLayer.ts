// Custom BitmapLayer for target-role raster overlays — see the
// "spotlight scrim" section of
// sunnyplans-docs/02_branding/01_map_visual_language.md.
//
// The slope (and future irradiance, etc.) raster is baked with a
// straightforward mask convention: pixels where the predicate is true
// (e.g. slope < 5%) are opaque white in the PNG; pixels where it's
// false are fully transparent. A plain BitmapLayer would render the
// white pixels on top of the basemap and leave the transparent ones
// alone — i.e. it *highlights* the predicate area, the opposite of
// what we want.
//
// We want the predicate area to look like *unmodified basemap* and
// every other pixel to be *dimmed* (the "scrim with hole" idiom).
// That's a per-pixel alpha inversion of the same source PNG.
//
// Implementation: override BitmapLayer's fragment shader with a
// custom main() that runs two branches:
//
//   1. *Inside the mask* (alpha > 0.5) — emit a fully transparent
//      pixel; the basemap shows through at original brightness.
//   2. *Outside the mask* — emit the scrim colour, alpha set from
//      `bitmap.tintColor` × `layer.opacity` so the layer config in
//      pmtilesLayers.ts continues to drive the tunables.
//
// `fillColor` on the layer config is reinterpreted by this class:
//   - RGB → scrim colour (the dim painted outside the mask)
//   - A   → scrim opacity (how dark the dim looks)
//
// Why a full shader replacement, not an `inject` hook: deck.gl 9 hoists
// the DECKGL_FILTER_COLOR hook into a function declared *before* the
// main shader source. From inside the hook, `bitmapTexture` and the
// `in vec2 vTexCoord` varying are not yet in scope, so injection
// fails compilation. Replacing the whole fragment shader is cleaner
// than trying to forward-declare those at module scope.
//
// No explicit boundary line. An earlier iteration tried to draw a
// brand-olive outline at the mask transition via 4-neighbour edge
// detection in the shader. Two flavours were tried (alpha spread
// threshold, threshold-first bucketing); both painted huge bands of
// pixels as "edge" on real slope data because the bake's tile pyramid
// reprojection introduces continuous-alpha transition zones around
// boundaries, *and* real flat-land terrain is patchy at the texel
// level, *and* the bake's resampling can leave alpha-128-ish stripes
// at internal terrain transitions. There is no robust shader-only
// threshold that separates "true boundary" from "noisy interior" on
// this data. The cleaner path is to derive boundaries from vector
// geometry rather than this raster — a follow-up that lives outside
// the spotlight-scrim layer. In the meantime the contrast between the
// scrim's dim and the basemap's full brightness reads as the boundary
// on its own.
//
// `texelFetch` is used (not `texture()`) so the alpha lookup bypasses
// BitmapLayer's bilinear filtering — same reason as before: an
// interpolated alpha is meaningless for an "is the predicate true at
// this pixel" decision.
import { BitmapLayer } from "@deck.gl/layers";

// In/out threshold on the source alpha. 0.5 is the natural midpoint
// for a nominally binary mask; pixels in the bake's anti-aliased
// transition band are assigned to whichever side of 0.5 they fall.
const IN_OUT_THRESHOLD = "0.5";

const TARGET_SCRIM_FRAGMENT_SHADER = /* glsl */ `\
#version 300 es
#define SHADER_NAME target-scrim-bitmap-layer-fragment-shader

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D bitmapTexture;

in vec2 vTexCoord;
in vec2 vTexPos;

out vec4 fragColor;

/* Projection helpers — copied from deck.gl's BitmapLayer fragment so
   non-default \`_imageCoordinateSystem\` keeps working. The shader is
   compiled once per layer instance; the constants and helpers are
   cheap and stay out of the hot per-pixel path. */
const float TILE_SIZE = 512.0;
const float PI = 3.1415926536;
const float WORLD_SCALE = TILE_SIZE / PI / 2.0;

vec2 lnglat_to_mercator(vec2 lnglat) {
  float x = lnglat.x;
  float y = clamp(lnglat.y, -89.9, 89.9);
  return vec2(
    radians(x) + PI,
    PI + log(tan(PI * 0.25 + radians(y) * 0.5))
  ) * WORLD_SCALE;
}

vec2 mercator_to_lnglat(vec2 xy) {
  xy /= WORLD_SCALE;
  return degrees(vec2(
    xy.x - PI,
    atan(exp(xy.y - PI)) * 2.0 - PI * 0.5
  ));
}

vec2 getUV(vec2 pos) {
  return vec2(
    (pos.x - bitmap.bounds[0]) / (bitmap.bounds[2] - bitmap.bounds[0]),
    (pos.y - bitmap.bounds[3]) / (bitmap.bounds[1] - bitmap.bounds[3])
  );
}

void main(void) {
  vec2 uv = vTexCoord;
  if (bitmap.coordinateConversion < -0.5) {
    vec2 lnglat = mercator_to_lnglat(vTexPos);
    uv = getUV(lnglat);
  } else if (bitmap.coordinateConversion > 0.5) {
    vec2 commonPos = lnglat_to_mercator(vTexPos);
    uv = getUV(commonPos);
  }

  /* In/out decision via texelFetch — see header for why this can't
     use texture(). Coords are clamped so tile-edge pixels don't
     trigger the GL "out-of-range returns zero" rule. */
  ivec2 texSize = textureSize(bitmapTexture, 0);
  ivec2 maxCoord = texSize - ivec2(1);
  ivec2 texCoord = clamp(ivec2(uv * vec2(texSize)), ivec2(0), maxCoord);
  float aC = texelFetch(bitmapTexture, texCoord, 0).a;

  if (aC > ${IN_OUT_THRESHOLD}) {
    /* Inside the predicate — basemap passes through unmodified. */
    fragColor = vec4(0.0, 0.0, 0.0, 0.0);
  } else {
    /* Outside the predicate — scrim. Colour from tintColor, alpha
       from layer.opacity (the wash of fillColor in pmtilesLayers.ts). */
    fragColor = vec4(bitmap.tintColor, layer.opacity);
  }

  geometry.uv = uv;
  DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;

export class TargetScrimBitmapLayer extends BitmapLayer {
  static layerName = "TargetScrimBitmapLayer";

  getShaders() {
    const base = super.getShaders();
    return {
      ...base,
      fs: TARGET_SCRIM_FRAGMENT_SHADER,
    };
  }
}
