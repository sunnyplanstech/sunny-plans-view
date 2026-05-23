import { useEffect, useState } from "react";

export interface Viewport {
  zoom: number;
  center: { lat: number; lng: number };
}

/**
 * Tracks a Google Map's zoom + centre, settling on its post-gesture
 * value after `delayMs` of quiescence.
 *
 * Listens to `bounds_changed` rather than `idle`. `idle` is more
 * elegant in theory (fires once the map has fully settled, including
 * tile loads) but in practice on large map viewports the tile pipeline
 * can keep the map non-idle for a long time after the user has
 * stopped gesturing — `idle` then fires late or not at all, and the
 * zoom-driven URL update never lands. `bounds_changed` fires on every
 * pan/zoom step instead; the trailing `setTimeout` debounce gives us
 * the "user has paused for ≥ delayMs" semantics we actually want.
 *
 * Returns `undefined` until the map's first `bounds_changed`.
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
        if (zoom === undefined || !center) return;
        setViewport({
          zoom,
          center: { lat: center.lat(), lng: center.lng() },
        });
      }, delayMs);
    };
    // Belt-and-braces: subscribe to every event that could plausibly
    // indicate "the user moved the map." On large viewports `idle`
    // alone is unreliable (tile pipeline keeps the map non-idle);
    // `bounds_changed` alone failed in field testing too. The four
    // together cover every documented gesture path.
    const events = ["zoom_changed", "dragend", "bounds_changed", "idle"];
    const listeners = events.map((ev) => map.addListener(ev, schedule));
    schedule();
    return () => {
      if (timer !== null) clearTimeout(timer);
      for (const l of listeners) google.maps.event.removeListener(l);
    };
  }, [map, delayMs]);
  return viewport;
}
