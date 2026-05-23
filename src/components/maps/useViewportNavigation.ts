// Viewport → scope/dominant-region derivation for the zoom-driven
// hierarchical navigation (roadmap p1-e3-scope-driven-rail).
//
// The hook is the bridge between map gestures and the URL+list state.
// It observes the map's debounced viewport (zoom + centre) and emits:
//   - the implied scope level (country / state-or-region / county-or-
//     province), derived from zoom alone via fixed breakpoints.
//   - the named region containing the viewport centre at each
//     available scope, via point-in-polygon against the supplied
//     FeatureCollections.
//
// The caller (page) owns navigation and list rendering — this hook
// stays narrow so it can be reasoned about and tuned without a
// full-page refactor. Breakpoints are guesses per the design card;
// tune by eye once wired.
import { useMemo } from "react";
import { findContainingFeature } from "@/lib/geo";
import type { PolygonCollection, PolygonFeature } from "@/hooks/useRegionPolygons";
import { useDebouncedViewport, type Viewport } from "./useDebouncedViewport";

export type ScopeLevel = "national" | "region" | "subregion";

// Fixed zoom breakpoints. Keep as exported constants so callers can
// also use them (e.g. lookup tables for initial-load auto-fit zoom).
export const SCOPE_REGION_MIN_ZOOM = 6;
export const SCOPE_SUBREGION_MIN_ZOOM = 10;

export function viewportToScopeLevel(zoom: number | undefined): ScopeLevel {
  if (zoom === undefined) return "national";
  if (zoom >= SCOPE_SUBREGION_MIN_ZOOM) return "subregion";
  if (zoom >= SCOPE_REGION_MIN_ZOOM) return "region";
  return "national";
}

export interface ViewportNavigation<R, S> {
  // Latest debounced viewport. `undefined` until the map's first idle.
  viewport: Viewport | undefined;
  // Scope level implied by `viewport.zoom`. `national` until the map
  // emits its first viewport.
  scopeLevel: ScopeLevel;
  // Region containing the viewport centre — the dominant state (US)
  // or region (IT). `undefined` while polygons are loading or the
  // centre falls outside every region polygon (e.g., over open ocean).
  regionFeature: PolygonFeature<R> | undefined;
  // Subregion containing the viewport centre — the dominant county
  // (US) or province (IT). Only populated when `scopeLevel ===
  // 'subregion'` and the subregion FeatureCollection is loaded.
  subregionFeature: PolygonFeature<S> | undefined;
}

interface UseViewportNavigationArgs<R, S> {
  map: google.maps.Map | null;
  // Country-zoom polygons (states for US, regions for IT). Provide
  // these once the country adapter has fetched them; the hook is
  // resilient to `undefined` while loading.
  regionFeatures: PolygonCollection<R> | undefined;
  // State/region-zoom polygons (counties for US, provinces for IT).
  // Optional — the page only needs these once the user has zoomed
  // beyond `SCOPE_REGION_MIN_ZOOM`.
  subregionFeatures: PolygonCollection<S> | undefined;
}

export function useViewportNavigation<R, S>({
  map,
  regionFeatures,
  subregionFeatures,
}: UseViewportNavigationArgs<R, S>): ViewportNavigation<R, S> {
  const viewport = useDebouncedViewport(map);
  const scopeLevel = viewportToScopeLevel(viewport?.zoom);

  // Memoise on viewport identity — the debounce hook returns a new
  // object only when the post-idle reading actually changes, so this
  // memo skips re-scanning polygons during purely-rendering re-renders
  // upstream.
  const regionFeature = useMemo(() => {
    if (!viewport || !regionFeatures) return undefined;
    return findContainingFeature(viewport.center, regionFeatures.features);
  }, [viewport, regionFeatures]);

  const subregionFeature = useMemo(() => {
    if (!viewport || !subregionFeatures) return undefined;
    // Subregion lookup is wasted work below subregion zoom — the page
    // never reads it there. Skipping the scan also avoids spurious
    // dominant-county flicker while panning at state zoom.
    if (scopeLevel !== "subregion") return undefined;
    return findContainingFeature(viewport.center, subregionFeatures.features);
  }, [viewport, subregionFeatures, scopeLevel]);

  return { viewport, scopeLevel, regionFeature, subregionFeature };
}
