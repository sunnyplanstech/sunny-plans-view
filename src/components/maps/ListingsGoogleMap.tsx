import { GoogleMap } from "@react-google-maps/api";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import type { USListing } from "@/countries/unitedStates";
import type { HexCell } from "@/hooks/useHexHeatmap";
import type { ChoroplethSurface } from "@/countries/types";
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
  // Layer-first preview hook (roadmap p1-e3-layer-first-ui): when
  // provided, pmtiles overlay visibility is driven by the parent's
  // selection (a page-level LayerPanel) instead of the in-map toggles.
  // The in-map layer rows are hidden in that mode; the heatmap toggle
  // stays since it's a different control surface.
  pageControlledOverlayIds?: ReadonlySet<string>;
  // Surfaces every zoom_changed event to the parent. The layer-first
  // page uses this to gate the constraint bar's "zoom in to apply"
  // hint. `undefined` until the map mounts.
  onZoomChange?: (zoom: number | undefined) => void;
  // Click handler for the per-parcel markers. Fires with the listing's
  // id; the parent looks up its full BaseListing and opens the
  // EvaluateDrawer. When undefined, markers still render but click is
  // a no-op (production listings page hasn't wired a handler yet).
  onListingClick?: (id: string) => void;
  // Country/state-zoom polygon overlay (counties for US, provinces
  // for IT). Page owns the zoom gate via `visible`; when on, parcel
  // markers are suppressed and the polygons become the click surface.
  choropleth?: ChoroplethSurface;
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

// max_sunnyscore is a 0–1 number (NULL on counties with no qualifying
// parcels). Map to a brand-olive ramp; missing data → muted gray.
function choroplethTint(score: number | null): string {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return "#9ca3af"; // muted slate — "no data"
  }
  const clamped = Math.max(0, Math.min(1, score));
  // hsl(75 …) is the brand olive family; lighten at low scores so the
  // ramp reads from sand → olive → deep olive at high SunnyScore.
  const lightness = 80 - clamped * 40; // 80% → 40%
  return `hsl(75, 35%, ${lightness}%)`;
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
  pageControlledOverlayIds,
  onZoomChange,
  onListingClick,
  choropleth,
}: ListingsGoogleMapProps) {
  const pageControlled = pageControlledOverlayIds !== undefined;
  const { isLoaded, hasApiKey, requestLoad } = useGoogleMaps();
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    requestLoad();
  }, [requestLoad]);
  const dataLayerRef = useRef<google.maps.Data | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const choroplethLayerRef = useRef<google.maps.Data | null>(null);
  // Stable ref so the choropleth click handler doesn't tear the layer
  // down on every parent render that produces a fresh closure.
  const onChoroplethClickRef = useRef(choropleth?.onFeatureClick);
  useEffect(() => {
    onChoroplethClickRef.current = choropleth?.onFeatureClick;
  }, [choropleth?.onFeatureClick]);
  const choroplethVisible = choropleth?.visible ?? false;
  // Stable ref so the marker effect doesn't tear down on every parent
  // render that produces a fresh handler closure.
  const onListingClickRef = useRef(onListingClick);
  useEffect(() => {
    onListingClickRef.current = onListingClick;
  }, [onListingClick]);
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

  // In page-controlled mode the parent owns the selection — derive a
  // synthetic layerState so usePMTilesOverlays sees the right
  // visibility set, and ignore in-map toggles (the rows are hidden).
  const effectiveLayerState = useMemo(() => {
    if (!pageControlled) return layerState;
    return Object.fromEntries(
      pmtilesLayers.map((l) => [
        l.id,
        { visible: pageControlledOverlayIds!.has(l.id) },
      ]),
    );
  }, [pageControlled, layerState, pmtilesLayers, pageControlledOverlayIds]);

  const { headers: layerHeaders } = usePMTilesOverlays(
    map,
    pmtilesLayers,
    effectiveLayerState,
  );

  const toggleLayer = useCallback((id: string) => {
    setLayerState((prev) => ({
      ...prev,
      [id]: { visible: !prev[id]?.visible },
    }));
  }, []);

  // Track the current zoom so LayerPanel can disable zoom-gated layers
  // (e.g. NWI at z<header.minZoom) with a "Zoom in" hint. zoom_changed
  // fires on every zoom step; google.maps.event.removeListener cleans up.
  const [currentZoom, setCurrentZoom] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (!map) return;
    const update = () => setCurrentZoom(map.getZoom());
    update();
    const listener = map.addListener("zoom_changed", update);
    return () => google.maps.event.removeListener(listener);
  }, [map]);
  // Forward zoom to the parent (layer-first preview's constraint bar).
  // Kept as a dedicated effect so the in-map LayerPanel's existing
  // zoom-aware logic stays untouched.
  useEffect(() => {
    onZoomChange?.(currentZoom);
  }, [currentZoom, onZoomChange]);

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

  // Auto-fit the parcel set once per scope. Refitting on every
  // `listings` change pulled the viewport back whenever the user
  // toggled a constraint in the layer-first preview, undoing their
  // pan/zoom. Resetting on `country`/`regionSlug` keeps state-level
  // navigation snappy; constraint toggles within the same scope
  // leave the viewport intact. Skipped while the choropleth is on
  // (the country/state polygon view owns the camera).
  const hasFitBoundsRef = useRef(false);
  useEffect(() => {
    hasFitBoundsRef.current = false;
  }, [country, regionSlug]);
  useEffect(() => {
    if (choroplethVisible) return;
    if (!map || !isLoaded || typeof google === "undefined") return;
    if (listingsWithCoords.length === 0) return;
    if (hasFitBoundsRef.current) return;
    const bounds = new google.maps.LatLngBounds();
    listingsWithCoords.forEach(({ coords }) => bounds.extend(coords));
    map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    hasFitBoundsRef.current = true;
  }, [map, listingsWithCoords, isLoaded, choroplethVisible]);

  // Render one marker per listing. Color follows the heatmap's
  // probSolarToColor so a parcel's solar score reads consistently
  // across surfaces. Click delegates to onListingClickRef so the
  // parent can open the EvaluateDrawer (or any future per-parcel
  // surface) without forcing this effect to tear down on every
  // handler-identity change.
  useEffect(() => {
    if (!map || !isLoaded || typeof google === "undefined") return;
    for (const m of markersRef.current) m.setMap(null);
    markersRef.current = [];
    if (choroplethVisible) return;
    for (const { listing, coords } of listingsWithCoords) {
      const color = probSolarToColor(listing.prob_solar ?? 0);
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
        title: `Solar ${listing.prob_solar !== null ? Math.round(listing.prob_solar * 100) : "?"}%`,
      });
      marker.addListener("click", () => {
        onListingClickRef.current?.(listing.id);
      });
      markersRef.current.push(marker);
    }
    return () => {
      for (const m of markersRef.current) m.setMap(null);
      markersRef.current = [];
    };
  }, [map, isLoaded, listingsWithCoords, choroplethVisible]);

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

  // County / province choropleth (page-driven, country/state zoom).
  // Tints by `max_sunnyscore` on a brand olive ramp; null/0 → muted
  // gray ("no data"). Click delegates to the page through the stable
  // ref so the layer stays mounted across navigation closures.
  useEffect(() => {
    if (!map || !isLoaded || typeof google === "undefined") return;
    if (choroplethLayerRef.current) {
      choroplethLayerRef.current.setMap(null);
      choroplethLayerRef.current = null;
    }
    if (!choropleth || !choropleth.visible || !choropleth.features) return;

    const layer = new google.maps.Data({ map });
    choroplethLayerRef.current = layer;
    try {
      layer.addGeoJson(choropleth.features);
    } catch {
      // bad payload — bail rather than half-render
      layer.setMap(null);
      choroplethLayerRef.current = null;
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
        layer.overrideStyle(event.feature, { strokeWeight: 1.6, strokeColor: "#1a1a1a" });
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
        onChoroplethClickRef.current?.(props);
      },
    );

    return () => {
      google.maps.event.removeListener(overListener);
      google.maps.event.removeListener(outListener);
      google.maps.event.removeListener(clickListener);
      layer.setMap(null);
      choroplethLayerRef.current = null;
    };
  }, [map, isLoaded, choropleth]);

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

  // Active overlay count surfaced in the HUD only when the parent (the
  // layer-first preview) actually drives overlay selection. Production
  // map keeps the standard LayerPanel and no HUD chrome.
  const activeOverlayCount = pageControlled
    ? pageControlledOverlayIds!.size
    : 0;
  const choroplethCount = choroplethVisible
    ? choropleth?.features.features.length ?? 0
    : 0;

  return (
    <div className={`relative ${className}`}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={defaultZoom}
        options={mapOptions}
        onLoad={onLoad}
      />
      {pageControlled && (
        <div className="pointer-events-none absolute top-3 left-3 z-10 flex flex-col items-start gap-1.5">
          <div className="tp-hud">
            <span>Scope</span>
            <b>{country === "italy" ? "IT" : "US"}{regionSlug ? ` · ${regionSlug.toUpperCase()}` : ""}</b>
          </div>
          <div className="tp-hud">
            <span>Z</span>
            <b className="tabular-nums">{currentZoom !== undefined ? currentZoom : "—"}</b>
            <span className="opacity-50">·</span>
            <span>{choroplethVisible ? "Areas" : "N"}</span>
            <b className="tabular-nums">{choroplethVisible ? choroplethCount : listings.length}</b>
            <span className="opacity-50">·</span>
            <span>Ovl</span>
            <b className="tabular-nums">{activeOverlayCount}</b>
          </div>
        </div>
      )}
      <LayerPanel
        layers={pageControlled ? [] : pmtilesLayers}
        state={layerState}
        onToggle={toggleLayer}
        hasRegionScope={!!regionSlug}
        layerHeaders={layerHeaders}
        currentZoom={currentZoom}
        showHeatmap={showHeatmap}
        hexLoading={hexLoading}
        onToggleHeatmap={onToggleHeatmap}
      />
    </div>
  );
}

export default ListingsGoogleMap;
