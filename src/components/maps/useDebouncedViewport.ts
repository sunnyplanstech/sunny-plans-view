import { useEffect, useState } from "react";

export interface Viewport {
  zoom: number;
  center: { lat: number; lng: number };
}

/**
 * Tracks a Google Map's zoom + centre.
 *
 * Subscribes synchronously to `zoom_changed` and `dragend` — the same
 * pattern the working `useMapZoom` uses. Earlier versions debounced
 * around `idle`/`bounds_changed`, but on large viewports the tile
 * pipeline keeps emitting those events long after the user has
 * stopped, so the trailing-edge debounce timer never fired and the
 * viewport state stayed pinned at its first reading (the default
 * zoom). `zoom_changed` and `dragend` are discrete, settled events —
 * they fire once per gesture and we just read fresh values inline.
 */
export function useDebouncedViewport(
  map: google.maps.Map | null,
): Viewport | undefined {
  const [viewport, setViewport] = useState<Viewport | undefined>(undefined);
  useEffect(() => {
    if (!map) return;
    const update = () => {
      const zoom = map.getZoom();
      const center = map.getCenter();
      if (zoom === undefined || !center) return;
      setViewport({
        zoom,
        center: { lat: center.lat(), lng: center.lng() },
      });
    };
    update();
    const listeners = [
      map.addListener("zoom_changed", update),
      map.addListener("dragend", update),
    ];
    return () => {
      for (const l of listeners) google.maps.event.removeListener(l);
    };
  }, [map]);
  return viewport;
}
