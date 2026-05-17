import { useEffect, useRef } from "react";

interface UseAutoFitBoundsArgs {
  map: google.maps.Map | null;
  isLoaded: boolean;
  /** When false, the hook is dormant — used to defer to the choropleth view. */
  enabled: boolean;
  /** Resets the "have we fit yet?" latch. Pass a stable string per scope. */
  scopeKey: string;
  /** Coordinates to fit. Empty list is a no-op. */
  coords: ReadonlyArray<{ lat: number; lng: number }>;
  padding?: google.maps.Padding;
  /**
   * Pre-latch the fit guard on first render so the initial mount skips
   * auto-fit. Used when the URL already carries a viewport (`v=`): we
   * want the user's preserved view, not a refit. Scope changes still
   * reset the latch — navigating to a new region refits as before.
   */
  skipInitial?: boolean;
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
  skipInitial = false,
}: UseAutoFitBoundsArgs): void {
  const fittedRef = useRef(skipInitial);

  // Reset the fit latch only when scope *changes* — not on mount.
  // Comparing against a held previous-scope ref means the initial
  // mount short-circuits and preserves `skipInitial`. The naive
  // `useEffect(..., [scopeKey])` fires on mount too and would stomp
  // skipInitial back to false the first time it ran.
  const prevScopeKeyRef = useRef(scopeKey);
  useEffect(() => {
    if (prevScopeKeyRef.current === scopeKey) return;
    prevScopeKeyRef.current = scopeKey;
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
