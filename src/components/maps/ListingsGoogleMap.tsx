import { GoogleMap } from "@react-google-maps/api";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import type { USListing } from "@/countries/unitedStates";
import type { HexCell } from "@/hooks/useHexHeatmap";
import { useGoogleMaps } from "./GoogleMapsProvider";
import { getParcelCenter } from "@/lib/geo";
import { LayerPanel } from "./LayerPanel";
import { pmtilesLayersFor } from "./pmtilesLayers";
import {
  usePMTilesOverlays,
  type PMTilesLayerState,
} from "./usePMTilesOverlays";

interface ListingsGoogleMapProps {
  listings: USListing[];
  className?: string;
  country?: string;
  // URL scope hint — when on a region/subregion page, lets the PMTiles
  // catalog narrow per-state-partitioned layers (e.g. NWI) down to that
  // one state's .pmtiles instead of registering all 50.
  regionSlug?: string;
  hexCells?: HexCell[];
  showHeatmap?: boolean;
  hexLoading?: boolean;
  onToggleHeatmap?: () => void;
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenters: Record<string, { lat: number; lng: number }> = {
  "united-states": { lat: 39.8283, lng: -98.5795 },
  "italy": { lat: 42.5, lng: 12.5 },
};
const defaultCenterUS = defaultCenters["united-states"];

function probSolarToColor(prob: number): string {
  // yellow (low) → orange (mid) → red (high)
  const clamped = Math.max(0, Math.min(1, prob));
  if (clamped <= 0.5) {
    const hue = 60 - clamped * 60;
    return `hsl(${hue}, 100%, 50%)`;
  }
  const hue = 30 - (clamped - 0.5) * 60;
  return `hsl(${hue}, 100%, 50%)`;
}

function probSolarToOpacity(pointCount: number, maxCount: number): number {
  if (maxCount === 0) return 0.3;
  return 0.25 + 0.5 * (pointCount / maxCount);
}

export function ListingsGoogleMap({
  listings,
  className,
  country,
  regionSlug,
  hexCells,
  showHeatmap = false,
  hexLoading = false,
  onToggleHeatmap,
}: ListingsGoogleMapProps) {
  const { isLoaded, hasApiKey, requestLoad } = useGoogleMaps();
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    requestLoad();
  }, [requestLoad]);
  const dataLayerRef = useRef<google.maps.Data | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const defaultCenter = defaultCenters[country || "united-states"] || defaultCenterUS;
  const defaultZoom = country === "italy" ? 6 : 4;

  // PMTiles constraint overlays: catalog from country config, live state
  // managed locally so the LayerPanel toggles persist across renders
  // without bleeding into URL or global store.
  const pmtilesLayers = useMemo(
    () => pmtilesLayersFor(country, regionSlug),
    [country, regionSlug],
  );
  const [layerState, setLayerState] = useState<Record<string, PMTilesLayerState>>(
    () =>
      Object.fromEntries(
        pmtilesLayers.map((l) => [
          l.id,
          { visible: l.defaultVisible ?? false },
        ]),
      ),
  );
  // Re-seed when the country (and therefore the layer catalog) changes.
  useEffect(() => {
    setLayerState(
      Object.fromEntries(
        pmtilesLayers.map((l) => [
          l.id,
          { visible: l.defaultVisible ?? false },
        ]),
      ),
    );
  }, [pmtilesLayers]);

  usePMTilesOverlays(map, pmtilesLayers, layerState);

  const toggleLayer = useCallback((id: string) => {
    setLayerState((prev) => ({
      ...prev,
      [id]: { visible: !prev[id]?.visible },
    }));
  }, []);

  // Filter listings to only those with valid coordinates from geom_json
  const listingsWithCoords = useMemo(() => {
    return listings
      .map((listing) => ({
        listing,
        coords: getParcelCenter(listing.geom_json),
      }))
      .filter((item): item is { listing: USListing; coords: { lat: number; lng: number } } =>
        item.coords !== null
      );
  }, [listings]);

  const maxPointCount = useMemo(() => {
    if (!hexCells || hexCells.length === 0) return 0;
    return Math.max(...hexCells.map((c) => c.point_count));
  }, [hexCells]);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  // Update bounds when map or listings change
  useMemo(() => {
    if (map && isLoaded && listingsWithCoords.length > 0 && typeof google !== "undefined") {
      const bounds = new google.maps.LatLngBounds();

      listingsWithCoords.forEach(({ coords }) => {
        bounds.extend(coords);
      });

      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }
  }, [map, listingsWithCoords, isLoaded]);

  // Manage heatmap data layer
  useEffect(() => {
    if (!map || !isLoaded || typeof google === "undefined") return;

    // Clean up previous layer
    if (dataLayerRef.current) {
      dataLayerRef.current.setMap(null);
      dataLayerRef.current = null;
    }
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
      infoWindowRef.current = null;
    }

    if (!showHeatmap || !hexCells || hexCells.length === 0) return;

    const dataLayer = new google.maps.Data({ map });
    dataLayerRef.current = dataLayer;

    const infoWindow = new google.maps.InfoWindow();
    infoWindowRef.current = infoWindow;

    // Add hex features
    hexCells.forEach((cell) => {
      if (!cell.geom_json) return;
      const geom = typeof cell.geom_json === "string" ? JSON.parse(cell.geom_json) : cell.geom_json;
      try {
        const feature = {
          type: "Feature" as const,
          geometry: geom,
          properties: {
            id: cell.id,
            point_count: cell.point_count,
            avg_prob_solar: cell.avg_prob_solar,
          },
        };
        dataLayer.addGeoJson(feature);
      } catch {
        // skip invalid geometry
      }
    });

    // Style each feature
    dataLayer.setStyle((feature) => {
      const prob = feature.getProperty("avg_prob_solar") as number | null;
      const count = feature.getProperty("point_count") as number;
      return {
        fillColor: probSolarToColor(prob ?? 0),
        fillOpacity: probSolarToOpacity(count, maxPointCount),
        strokeColor: probSolarToColor(prob ?? 0),
        strokeWeight: 1,
        strokeOpacity: 0.6,
      };
    });

    // Click → info window
    dataLayer.addListener("click", (event: google.maps.Data.MouseEvent) => {
      const feat = event.feature;
      const prob = feat.getProperty("avg_prob_solar") as number | null;
      const count = feat.getProperty("point_count") as number;

      let html = `<div style="font-family:system-ui;font-size:13px;line-height:1.5;">`;
      html += `<strong>Solar Probability:</strong> ${prob !== null ? `${Math.round(prob * 100)}%` : "N/A"}<br/>`;
      html += `<strong>Parcels:</strong> ${count}`;
      html += `</div>`;

      infoWindow.setContent(html);
      infoWindow.setPosition(event.latLng!);
      infoWindow.open(map);
    });

    return () => {
      dataLayer.setMap(null);
      infoWindow.close();
    };
  }, [map, isLoaded, showHeatmap, hexCells, maxPointCount]);

  // Show fallback if Google Maps is not available
  if (!isLoaded) {
    return (
      <div className={`bg-muted/30 flex flex-col items-center justify-center ${className}`}>
        <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
        {!hasApiKey ? (
          <>
            <p className="text-muted-foreground text-center">
              Google Maps API key not configured
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Set VITE_GOOGLE_MAPS_API_KEY in .env
            </p>
          </>
        ) : (
          <p className="text-muted-foreground">Loading map...</p>
        )}
        {listings.length > 0 && (
          <p className="text-sm text-muted-foreground mt-4">
            {listings.length} listings available
          </p>
        )}
      </div>
    );
  }

  const mapOptions: google.maps.MapOptions = {
    mapTypeId: "satellite",
    mapTypeControl: true,
    mapTypeControlOptions: {
      position: google.maps.ControlPosition.TOP_RIGHT,
    },
    zoomControl: true,
    streetViewControl: false,
    fullscreenControl: true,
  };

  return (
    <div className={`relative ${className}`}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={defaultZoom}
        options={mapOptions}
        onLoad={onLoad}
      />
      <LayerPanel
        layers={pmtilesLayers}
        state={layerState}
        onToggle={toggleLayer}
        showHeatmap={showHeatmap}
        hexLoading={hexLoading}
        onToggleHeatmap={onToggleHeatmap}
      />
    </div>
  );
}

export default ListingsGoogleMap;
