type GeomLike = { type?: string; coordinates?: unknown };

// Ray-casting point-in-polygon. `ring` is a GeoJSON LinearRing: an
// ordered array of `[lng, lat]` pairs whose first and last entries
// match. Standard even-odd rule. Boundary points flip with float
// precision; at the scale we use this (named-region containment for
// nav) sub-pixel boundary noise is irrelevant.
function pointInRing(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersects =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

// True iff the point lies inside the polygon's outer ring and not
// inside any of its holes. Holes are subsequent rings in the same
// Polygon `coordinates` array per the GeoJSON spec.
function pointInPolygonRings(
  lng: number,
  lat: number,
  rings: number[][][],
): boolean {
  if (rings.length === 0) return false;
  if (!pointInRing(lng, lat, rings[0])) return false;
  for (let i = 1; i < rings.length; i++) {
    if (pointInRing(lng, lat, rings[i])) return false;
  }
  return true;
}

// True iff the point lies inside the GeoJSON geometry. Accepts Polygon
// and MultiPolygon; anything else (Point/LineString/etc.) returns
// false — named-region polygons in this app are always one of those.
export function pointInGeometry(
  point: { lat: number; lng: number },
  geom: unknown,
): boolean {
  const g = geom as GeomLike;
  if (!g || !g.coordinates) return false;
  if (g.type === "Polygon") {
    return pointInPolygonRings(point.lng, point.lat, g.coordinates as number[][][]);
  }
  if (g.type === "MultiPolygon") {
    const polys = g.coordinates as number[][][][];
    for (const rings of polys) {
      if (pointInPolygonRings(point.lng, point.lat, rings)) return true;
    }
    return false;
  }
  return false;
}

// Linear scan over polygon features. The sets we scan are small
// (≤50 US states, ≤20 IT regions, ≤63 counties per state, ≤12 provinces
// per region) so a bounding-box pre-filter isn't worth the indirection.
//
// `T` is preserved end-to-end so callers passing fully-typed
// FeatureCollections get their concrete feature shape back, not a
// generic interface.
export function findContainingFeature<
  T extends { geometry: unknown },
>(point: { lat: number; lng: number }, features: ReadonlyArray<T>): T | undefined {
  for (const feature of features) {
    if (pointInGeometry(point, feature.geometry)) return feature;
  }
  return undefined;
}

// The Django API ships geom_json as a parsed JSONField, so this always
// receives an object (or null/undefined when the listing has no geometry).
export function getParcelCenter(geomJson: unknown): { lat: number; lng: number } | null {
  if (!geomJson) return null;
  const geom = geomJson as GeomLike;

  if (geom.type === "Point" && Array.isArray(geom.coordinates)) {
    const c = geom.coordinates as number[];
    return { lat: c[1], lng: c[0] };
  }

  const raw = geom.coordinates as unknown;
  const coords: number[][] | null =
    geom.type === "MultiPolygon" && Array.isArray(raw)
      ? ((raw as number[][][][])[0][0] ?? null)
      : geom.type === "Polygon" && Array.isArray(raw)
      ? ((raw as number[][][])[0] ?? null)
      : null;

  if (!coords || coords.length === 0) return null;
  const sumLat = coords.reduce((s, c) => s + c[1], 0);
  const sumLng = coords.reduce((s, c) => s + c[0], 0);
  return { lat: sumLat / coords.length, lng: sumLng / coords.length };
}
