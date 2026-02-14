export function getParcelCenter(geomJson: string | object | null): { lat: number; lng: number } | null {
  if (!geomJson) return null;
  try {
    const geom = typeof geomJson === "string" ? JSON.parse(geomJson) : geomJson;
    if (geom.type === "Point" && geom.coordinates) {
      return { lat: geom.coordinates[1], lng: geom.coordinates[0] };
    }
    const coords =
      geom.type === "MultiPolygon"
        ? geom.coordinates[0][0]
        : geom.type === "Polygon"
        ? geom.coordinates[0]
        : null;
    if (!coords || coords.length === 0) return null;
    const sumLat = coords.reduce((s: number, c: number[]) => s + c[1], 0);
    const sumLng = coords.reduce((s: number, c: number[]) => s + c[0], 0);
    return { lat: sumLat / coords.length, lng: sumLng / coords.length };
  } catch {
    return null;
  }
}
