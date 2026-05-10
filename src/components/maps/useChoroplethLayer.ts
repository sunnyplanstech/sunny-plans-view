import { useEffect, useRef } from "react";
import type { ChoroplethSurface } from "@/countries/types";
import { choroplethTint } from "./colorScales";

interface UseChoroplethLayerArgs {
  map: google.maps.Map | null;
  isLoaded: boolean;
  surface?: ChoroplethSurface;
}

/**
 * Render the country/state-zoom polygon layer (counties for US,
 * provinces for IT). Tinted by `max_sunnyscore`; null/0 → muted gray.
 *
 * The latest `onFeatureClick` is held in a ref so handler-identity
 * changes from the parent don't tear the layer down on every render.
 */
export function useChoroplethLayer({
  map,
  isLoaded,
  surface,
}: UseChoroplethLayerArgs): void {
  const layerRef = useRef<google.maps.Data | null>(null);
  const onFeatureClickRef = useRef(surface?.onFeatureClick);
  useEffect(() => {
    onFeatureClickRef.current = surface?.onFeatureClick;
  }, [surface?.onFeatureClick]);

  useEffect(() => {
    if (!map || !isLoaded || typeof google === "undefined") return;

    if (layerRef.current) {
      layerRef.current.setMap(null);
      layerRef.current = null;
    }
    if (!surface || !surface.visible || !surface.features) return;

    const layer = new google.maps.Data({ map });
    layerRef.current = layer;
    try {
      layer.addGeoJson(surface.features);
    } catch {
      // bad payload — bail rather than half-render
      layer.setMap(null);
      layerRef.current = null;
      return;
    }

    layer.setStyle((feature) => {
      const score = feature.getProperty("max_sunnyscore") as number | null;
      const count = feature.getProperty("parcel_count") as number | null;
      return {
        fillColor: choroplethTint(score),
        fillOpacity: count && count > 0 ? 0.55 : 0.18,
        strokeColor: "#ffffff",
        strokeWeight: 0.6,
        strokeOpacity: 0.9,
      };
    });

    const overListener = layer.addListener(
      "mouseover",
      (event: google.maps.Data.MouseEvent) => {
        layer.overrideStyle(event.feature, {
          strokeWeight: 1.6,
          strokeColor: "#1a1a1a",
        });
      },
    );
    const outListener = layer.addListener(
      "mouseout",
      (event: google.maps.Data.MouseEvent) => {
        layer.revertStyle(event.feature);
      },
    );
    const clickListener = layer.addListener(
      "click",
      (event: google.maps.Data.MouseEvent) => {
        const props: Record<string, unknown> = {};
        event.feature.forEachProperty((value, key) => {
          props[key] = value;
        });
        onFeatureClickRef.current?.(props);
      },
    );

    return () => {
      google.maps.event.removeListener(overListener);
      google.maps.event.removeListener(outListener);
      google.maps.event.removeListener(clickListener);
      layer.setMap(null);
      layerRef.current = null;
    };
  }, [map, isLoaded, surface]);
}
