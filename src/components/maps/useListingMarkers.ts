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
  const markersRef = useRef<google.maps.Marker[]>([]);
  const onClickRef = useRef(onClick);
  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  useEffect(() => {
    if (!map || !isLoaded || typeof google === "undefined") return;
    for (const m of markersRef.current) m.setMap(null);
    markersRef.current = [];
    if (!enabled) return;
    for (const { listing, coords } of items) {
      const color = probSolarToColor(listing.prob_solar ?? 0);
      const titlePct =
        listing.prob_solar !== null ? Math.round(listing.prob_solar * 100) : "?";
      const marker = new google.maps.Marker({
        position: coords,
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: color,
          fillOpacity: 0.9,
          strokeColor: "#1a1a1a",
          strokeWeight: 1,
        },
        title: `Solar ${titlePct}%`,
      });
      marker.addListener("click", () => {
        onClickRef.current?.(listing.id);
      });
      markersRef.current.push(marker);
    }
    return () => {
      for (const m of markersRef.current) m.setMap(null);
      markersRef.current = [];
    };
  }, [map, isLoaded, enabled, items]);
}
