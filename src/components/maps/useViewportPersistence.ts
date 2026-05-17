// useViewportPersistence — bridge between a Google Maps instance and
// the page's URL-backed viewport state.
//
// Subscribes to the map's `idle` event (which fires once after pan or
// zoom motion settles) and surfaces the resulting center+zoom upward.
// The page wires the callback to useUrlMapState.setViewport so the URL
// reflects what the user is actually looking at.
//
// The `idle` event is the natural debounce for "the user has stopped
// moving the map" — no manual throttle needed. Center/zoom are read
// directly off the map (more accurate than tracking duplicate state
// in React).
import { useEffect } from "react";
import type { MapViewport } from "./useUrlMapState";

interface UseViewportPersistenceArgs {
  map: google.maps.Map | null;
  /** Called once per settled pan/zoom. Pass `undefined` to disable the hook. */
  onChange: ((viewport: MapViewport) => void) | undefined;
}

export function useViewportPersistence({
  map,
  onChange,
}: UseViewportPersistenceArgs): void {
  useEffect(() => {
    if (!map || !onChange || typeof google === "undefined") return;
    const listener = map.addListener("idle", () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      if (!center || zoom === undefined) return;
      onChange({ lat: center.lat(), lng: center.lng(), zoom });
    });
    return () => listener.remove();
  }, [map, onChange]);
}
