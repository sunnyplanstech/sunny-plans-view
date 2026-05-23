import { useEffect, useRef } from "react";

interface UseAutoFitBoundsArgs {
  map: google.maps.Map | null;
  isLoaded: boolean;
  /** When false, the hook is dormant. */
  enabled: boolean;
  /** Resets the "have we fit yet?" latch. Pass a stable string per scope. */
  scopeKey: string;
  /** Coordinates to fit. Empty list is a no-op. */
  coords: ReadonlyArray<{ lat: number; lng: number }>;
  padding?: google.maps.Padding;
}

const DEFAULT_PADDING: google.maps.Padding = {
  top: 50,
  right: 50,
  bottom: 50,
  left: 50,
};

/**
 * Fit the map viewport to `coords` once per scope.
 *
 * The latch resets when `scopeKey` changes (e.g. user navigates to a
 * different region) so navigation refits to the new area. Subsequent
 * changes to `coords` within the same scope leave the viewport intact —
 * a constraint toggle that re-filters listings should not pull the
 * camera back from where the user has panned/zoomed to.
 */
export function useAutoFitBounds({
  map,
  isLoaded,
  enabled,
  scopeKey,
  coords,
  padding = DEFAULT_PADDING,
}: UseAutoFitBoundsArgs): void {
  const fittedRef = useRef(false);

  useEffect(() => {
    fittedRef.current = false;
  }, [scopeKey]);

  useEffect(() => {
    if (!enabled || fittedRef.current) return;
    if (!map || !isLoaded || typeof google === "undefined") return;
    if (coords.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    for (const c of coords) bounds.extend(c);
    map.fitBounds(bounds, padding);
    fittedRef.current = true;
  }, [map, isLoaded, enabled, coords, padding]);
}
