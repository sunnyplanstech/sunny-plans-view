// useMapViewportUrl — one-way bridge between the listings map and the
// browser URL's `?v=lat,lng,zoom` param.
//
// Read happens once via the useState initializer (no router roundtrip,
// no effect, no re-render on URL change). Write happens through the
// browser History API directly — `history.replaceState` mutates the URL
// without triggering a React render, which is the standard pattern used
// by Google Maps, Airbnb, Mapbox examples, etc. The map and React stay
// decoupled, so panning never re-renders the component tree and the
// controlled-prop loop that fights `<GoogleMap center>` can't happen.
//
// Encoding: `v=<lat>,<lng>,<zoom>` — lat/lng 5dp (~1m at the equator),
// zoom 2dp. Malformed values are silently dropped on read; absence
// means "use defaults / auto-fit".
import { useCallback, useState } from "react";

const PARAM_VIEWPORT = "v";
const LATLNG_DECIMALS = 5;
const ZOOM_DECIMALS = 2;

export interface MapViewport {
  lat: number;
  lng: number;
  zoom: number;
}

function parseViewport(raw: string | null): MapViewport | null {
  if (!raw) return null;
  const parts = raw.split(",");
  if (parts.length !== 3) return null;
  const [lat, lng, zoom] = parts.map((s) => Number(s.trim()));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(zoom)) {
    return null;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  if (zoom < 0 || zoom > 24) return null;
  return { lat, lng, zoom };
}

function encodeViewport(v: MapViewport): string {
  return `${v.lat.toFixed(LATLNG_DECIMALS)},${v.lng.toFixed(LATLNG_DECIMALS)},${v.zoom.toFixed(ZOOM_DECIMALS)}`;
}

export interface UseMapViewportUrl {
  /** Viewport read from the URL on first render. Null if absent / malformed. */
  readonly initialViewport: MapViewport | null;
  /** Persist a viewport to the URL via history.replaceState (no re-render). */
  readonly persist: (v: MapViewport) => void;
}

export function useMapViewportUrl(): UseMapViewportUrl {
  // Read once. The dependency on `window.location` is intentionally
  // one-shot — subsequent URL writes don't need to flow back into the
  // map (the map is already where the user moved it to).
  const [initialViewport] = useState<MapViewport | null>(() => {
    if (typeof window === "undefined") return null;
    return parseViewport(new URLSearchParams(window.location.search).get(PARAM_VIEWPORT));
  });

  const persist = useCallback((v: MapViewport) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.set(PARAM_VIEWPORT, encodeViewport(v));
    const next = `${window.location.pathname}?${params}${window.location.hash}`;
    window.history.replaceState(window.history.state, "", next);
  }, []);

  return { initialViewport, persist };
}
