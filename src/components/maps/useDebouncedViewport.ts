import { useEffect, useState } from "react";

export interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface Viewport {
  zoom: number;
  center: { lat: number; lng: number };
  // The current visible bounds in lat/lng. Used to filter polygon
  // collections to features that intersect the viewport (the "list
  // shows states intersecting the viewport" acceptance criterion).
  bounds: ViewportBounds;
}

/**
 * Tracks a Google Map's zoom + centre, settling on its post-gesture
 * value after `delayMs` of quiescence. Google's native `idle` event
 * already fires once the user stops moving the map, so we listen there
 * and add a short trailing debounce on top — that coalesces any
 * adjacent programmatic updates (auto-fit, deep-link bbox fit) into a
 * single observable transition. Returns `undefined` until the map
 * mounts and emits its first idle event.
 */
export function useDebouncedViewport(
  map: google.maps.Map | null,
  delayMs = 150,
): Viewport | undefined {
  const [viewport, setViewport] = useState<Viewport | undefined>(undefined);
  useEffect(() => {
    if (!map) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => {
        const zoom = map.getZoom();
        const center = map.getCenter();
        const bounds = map.getBounds();
        if (zoom === undefined || !center || !bounds) return;
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        setViewport({
          zoom,
          center: { lat: center.lat(), lng: center.lng() },
          bounds: {
            north: ne.lat(),
            south: sw.lat(),
            east: ne.lng(),
            west: sw.lng(),
          },
        });
      }, delayMs);
    };
    const listener = map.addListener("idle", schedule);
    schedule();
    return () => {
      if (timer !== null) clearTimeout(timer);
      google.maps.event.removeListener(listener);
    };
  }, [map, delayMs]);
  return viewport;
}
