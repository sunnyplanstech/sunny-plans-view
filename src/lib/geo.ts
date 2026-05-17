type GeomLike = { type?: string; coordinates?: unknown };

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
