type GeomLike = { type?: string; coordinates?: unknown };

export function getParcelCenter(geomJson: unknown): { lat: number; lng: number } | null {
  if (!geomJson) return null;
  try {
    const geom = (typeof geomJson === "string" ? JSON.parse(geomJson) : geomJson) as GeomLike;

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
  } catch {
    return null;
  }
}
