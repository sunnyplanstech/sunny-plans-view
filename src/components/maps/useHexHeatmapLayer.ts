import { useEffect, useMemo, useRef } from "react";
import type { HexCell } from "@/hooks/useHexHeatmap";
import { probSolarToColor, probSolarToOpacity } from "./colorScales";

interface UseHexHeatmapLayerArgs {
  map: google.maps.Map | null;
  isLoaded: boolean;
  enabled: boolean;
  cells?: HexCell[];
}

/**
 * Render the hex aggregate layer with click-to-info-window. Tears down
 * the layer + info window when disabled or when cells change. The max
 * point count is computed once per cells change to drive opacity.
 */
export function useHexHeatmapLayer({
  map,
  isLoaded,
  enabled,
  cells,
}: UseHexHeatmapLayerArgs): void {
  const layerRef = useRef<google.maps.Data | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const maxPointCount = useMemo(() => {
    if (!cells || cells.length === 0) return 0;
    return Math.max(...cells.map((c) => c.point_count));
  }, [cells]);

  useEffect(() => {
    if (!map || !isLoaded || typeof google === "undefined") return;

    if (layerRef.current) {
      layerRef.current.setMap(null);
      layerRef.current = null;
    }
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
      infoWindowRef.current = null;
    }

    if (!enabled || !cells || cells.length === 0) return;

    const layer = new google.maps.Data({ map });
    layerRef.current = layer;
    const infoWindow = new google.maps.InfoWindow();
    infoWindowRef.current = infoWindow;

    for (const cell of cells) {
      if (!cell.geom_json) continue;
      try {
        const geom =
          typeof cell.geom_json === "string"
            ? JSON.parse(cell.geom_json)
            : cell.geom_json;
        layer.addGeoJson({
          type: "Feature",
          geometry: geom,
          properties: {
            id: cell.id,
            point_count: cell.point_count,
            avg_prob_solar: cell.avg_prob_solar,
          },
        });
      } catch {
        // skip invalid geometry
      }
    }

    layer.setStyle((feature) => {
      const prob = feature.getProperty("avg_prob_solar") as number | null;
      const count = feature.getProperty("point_count") as number;
      const color = probSolarToColor(prob ?? 0);
      return {
        fillColor: color,
        fillOpacity: probSolarToOpacity(count, maxPointCount),
        strokeColor: color,
        strokeWeight: 1,
        strokeOpacity: 0.6,
      };
    });

    layer.addListener("click", (event: google.maps.Data.MouseEvent) => {
      const prob = event.feature.getProperty("avg_prob_solar") as number | null;
      const count = event.feature.getProperty("point_count") as number;
      const probStr = prob !== null ? `${Math.round(prob * 100)}%` : "N/A";
      infoWindow.setContent(
        `<div style="font-family:system-ui;font-size:13px;line-height:1.5;">` +
          `<strong>Solar Probability:</strong> ${probStr}<br/>` +
          `<strong>Parcels:</strong> ${count}` +
          `</div>`,
      );
      infoWindow.setPosition(event.latLng!);
      infoWindow.open(map);
    });

    return () => {
      layer.setMap(null);
      infoWindow.close();
    };
  }, [map, isLoaded, enabled, cells, maxPointCount]);
}
