// useUrlMapState — bidirectional binding between the listings page's
// map view state (viewport + selected parcel) and the browser URL.
//
// Sibling to useUrlSpecState. Kept separate because the two have
// different concerns and different history strategies:
//
//   * useUrlSpecState owns `c=` (constraints) and `s=` (sort) — these
//     are the user's *spec*, semantic state.
//   * useUrlMapState owns `v=` (viewport) and `p=` (selected parcel)
//     — these are the user's *view*, ephemeral chrome that should
//     still be addressable so shared links and detail-back work.
//
// Encoding:
//   v=<lat>,<lng>,<zoom>   3-tuple, fixed precision (lat/lng 5dp ≈ 1m,
//                          zoom 2dp). Malformed values are silently
//                          dropped on read; absence means "use the
//                          map's natural defaults / auto-fit".
//   p=<parcelId>           Opaque listing id. Unknown id (parcel not
//                          in current scope) is silently dropped on
//                          read — same posture as bad `c=` ids.
//   i=<intent-key>         Reserved; not implemented in this card.
//
// History strategy:
//   * Viewport writes use replaceState. Pan/zoom is high-frequency
//     and shouldn't bloat the back-button stack — the Google Maps
//     `idle` event is the natural debounce (fires once after motion
//     settles).
//   * Parcel selection uses pushState on null↔id transitions so the
//     back-button toggles the drawer, and replaceState on id→id swaps
//     so rapid pin-clicks don't pile up history entries.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

const PARAM_VIEWPORT = "v";
const PARAM_PARCEL = "p";

// lat/lng to 5 decimals (~1m), zoom to 2 decimals — enough to round-trip
// the user's actual pan/zoom without spraying noise into the URL.
const LATLNG_DECIMALS = 5;
const ZOOM_DECIMALS = 2;

export interface MapViewport {
  lat: number;
  lng: number;
  zoom: number;
}

interface UrlMapState {
  /** Viewport from the URL at mount time. Null if absent or malformed. */
  initialViewport: MapViewport | null;
  /** Parcel id from the URL. Tracks URL changes after mount. */
  selectedParcelId: string | null;
  /** Commit a viewport change to the URL (replaceState, no history entry). */
  setViewport: (v: MapViewport) => void;
  /** Set or clear the selected parcel. Decides push vs replace internally. */
  setSelectedParcelId: (id: string | null) => void;
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

/**
 * Build the next URLSearchParams from the current ones, mutating one key.
 * Pulled out so both setters share a single "read prev, set/delete, return
 * unchanged if no-op" path — keeps the callback form race-safe and the
 * decision logic in each setter readable.
 */
function withParam(
  prev: URLSearchParams,
  key: string,
  value: string | null,
): URLSearchParams {
  if (prev.get(key) === value) return prev;
  const next = new URLSearchParams(prev);
  if (value === null) next.delete(key);
  else next.set(key, value);
  return next;
}

export function useUrlMapState(): UrlMapState {
  const [searchParams, setSearchParams] = useSearchParams();

  // Captured once on mount — subsequent URL writes are page-driven, so
  // the "initial" viewport is a deliberate snapshot, not a tracked
  // value. Pin selection is different (see below) because external
  // navigation (back-button, detail-back link) must move the drawer.
  const initialViewportRef = useRef<MapViewport | null>(null);
  if (initialViewportRef.current === null) {
    initialViewportRef.current = parseViewport(searchParams.get(PARAM_VIEWPORT));
  }

  // Mirror p= into local state so changes from outside the page
  // (browser back-button, detail-back link with ?p=<id>) propagate
  // into the drawer. The page reads selectedParcelId; the URL is the
  // source of truth.
  const [selectedParcelId, setSelectedParcelIdState] = useState<string | null>(
    () => searchParams.get(PARAM_PARCEL),
  );
  useEffect(() => {
    const urlParcel = searchParams.get(PARAM_PARCEL);
    setSelectedParcelIdState((prev) => (prev === urlParcel ? prev : urlParcel));
  }, [searchParams]);

  // setSearchParams' callback form reads `prev` from the live URL at
  // commit time, so two near-simultaneous writes (e.g. user pans the
  // map while clicking a pin) compose correctly instead of clobbering
  // each other. Same race-safety pattern as functional setState.
  const setViewport = useCallback(
    (v: MapViewport) => {
      const encoded = encodeViewport(v);
      setSearchParams((prev) => withParam(prev, PARAM_VIEWPORT, encoded), {
        replace: true,
      });
    },
    [setSearchParams],
  );

  // History strategy:
  //   null → id  : pushState  (back-button closes the drawer)
  //   id   → id' : replaceState (rapid pin-clicks don't pile up history)
  //   id   → null: pushState  (back-button reopens the drawer)
  // The push/replace decision needs `prev` *now* (it's an arg to
  // setSearchParams, not a value inside the callback) — read it from
  // the latest closure. Two near-simultaneous selection writes are
  // already unlikely (selection is user-click-driven), and the worst
  // case is a misclassified push/replace, not a lost id.
  const setSelectedParcelId = useCallback(
    (id: string | null) => {
      const prev = searchParams.get(PARAM_PARCEL);
      if (prev === id) return;
      const isToggle = prev === null || id === null;
      setSearchParams((current) => withParam(current, PARAM_PARCEL, id), {
        replace: !isToggle,
      });
    },
    [searchParams, setSearchParams],
  );

  return useMemo(
    () => ({
      initialViewport: initialViewportRef.current,
      selectedParcelId,
      setViewport,
      setSelectedParcelId,
    }),
    [selectedParcelId, setViewport, setSelectedParcelId],
  );
}
