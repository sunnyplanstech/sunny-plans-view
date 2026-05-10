import { useEffect, useState } from "react";

/**
 * Tracks the current zoom of a Google Map.
 * Returns `undefined` until the map has mounted and emitted its first
 * value. Re-subscribes if the map instance changes.
 */
export function useMapZoom(map: google.maps.Map | null): number | undefined {
  const [zoom, setZoom] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (!map) return;
    const update = () => setZoom(map.getZoom());
    update();
    const listener = map.addListener("zoom_changed", update);
    return () => google.maps.event.removeListener(listener);
  }, [map]);
  return zoom;
}
