import { useEffect, useRef } from "react";
import type { USListing } from "@/countries/unitedStates";
import { probSolarToColor } from "./colorScales";

export interface ListingMarkerItem {
  listing: USListing;
  coords: { lat: number; lng: number };
}

interface UseListingMarkersArgs {
  map: google.maps.Map | null;
  isLoaded: boolean;
  /** When false, all markers are torn down (e.g. while the choropleth covers the map). */
  enabled: boolean;
  items: ReadonlyArray<ListingMarkerItem>;
  onClick?: (id: string) => void;
}

// Match the legacy SymbolPath.CIRCLE marker: scale 7 → ~14px circle,
// black 1px stroke, 90% opacity.
function buildMarkerContent(color: string): HTMLElement {
  const dot = document.createElement("div");
  dot.style.width = "14px";
  dot.style.height = "14px";
  dot.style.borderRadius = "50%";
  dot.style.backgroundColor = color;
  dot.style.opacity = "0.9";
  dot.style.border = "1px solid #1a1a1a";
  dot.style.cursor = "pointer";
  return dot;
}

/**
 * Render one circle marker per listing, colored by SunnyScore probability.
 *
 * The latest `onClick` is held in a ref so handler-identity changes
 * from the parent don't tear the marker layer down on every render.
 */
export function useListingMarkers({
  map,
  isLoaded,
  enabled,
  items,
  onClick,
}: UseListingMarkersArgs): void {
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const onClickRef = useRef(onClick);
  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  useEffect(() => {
    if (!map || !isLoaded || typeof google === "undefined") return;
    if (!google.maps.marker?.AdvancedMarkerElement) return;
    for (const m of markersRef.current) m.map = null;
    markersRef.current = [];
    if (!enabled) return;
    for (const { listing, coords } of items) {
      const color = probSolarToColor(listing.prob_solar ?? 0);
      const titlePct =
        listing.prob_solar !== null ? Math.round(listing.prob_solar * 100) : "?";
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: coords,
        map,
        content: buildMarkerContent(color),
        title: `Solar ${titlePct}%`,
      });
      marker.addListener("click", () => {
        onClickRef.current?.(listing.id);
      });
      markersRef.current.push(marker);
    }
    return () => {
      for (const m of markersRef.current) m.map = null;
      markersRef.current = [];
    };
  }, [map, isLoaded, enabled, items]);
}
