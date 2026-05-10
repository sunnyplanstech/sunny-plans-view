// Listings map for the country listing pages and the layer-first
// preview. This component is deliberately thin: each Google Maps
// subsystem (zoom tracking, marker layer, hex heatmap, choropleth,
// PMTiles overlays, auto-fit) lives in its own hook in this folder.
// The body here is composition + layout.

import { GoogleMap } from "@react-google-maps/api";
import { useEffect, useMemo, useState } from "react";
import type { USListing } from "@/countries/unitedStates";
import type { HexCell } from "@/hooks/useHexHeatmap";
import type { ChoroplethSurface } from "@/countries/types";
import { getParcelCenter } from "@/lib/geo";
import { useGoogleMaps } from "./GoogleMapsProvider";
import { LayerPanel } from "./LayerPanel";
import { MapHud } from "./MapHud";
import { MapLoadingFallback } from "./MapLoadingFallback";
import { useAutoFitBounds } from "./useAutoFitBounds";
import { useChoroplethLayer } from "./useChoroplethLayer";
import { useHexHeatmapLayer } from "./useHexHeatmapLayer";
import { useListingMarkers, type ListingMarkerItem } from "./useListingMarkers";
import { useMapZoom } from "./useMapZoom";
import { usePMTilesLayerState } from "./usePMTilesLayerState";
import { usePMTilesOverlays } from "./usePMTilesOverlays";

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

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };

const DEFAULT_CENTERS: Record<string, { lat: number; lng: number }> = {
  "united-states": { lat: 39.8283, lng: -98.5795 },
  italy: { lat: 42.5, lng: 12.5 },
};

const DEFAULT_ZOOMS: Record<string, number> = {
  "united-states": 4,
  italy: 6,
};

const FALLBACK_CENTER = DEFAULT_CENTERS["united-states"];
const FALLBACK_ZOOM = DEFAULT_ZOOMS["united-states"];

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

  const choroplethVisible = choropleth?.visible ?? false;

  // PMTiles overlays — catalog + visibility live in their own hook so
  // this body doesn't have to know whether the parent is driving
  // selection or the in-map LayerPanel is.
  const {
    layers: pmtilesLayers,
    effectiveState: pmtilesEffectiveState,
    panelState: pmtilesPanelState,
    toggle: togglePMTilesLayer,
  } = usePMTilesLayerState({
    country,
    regionSlug,
    pageControlledIds: pageControlledOverlayIds,
  });
  const { headers: layerHeaders } = usePMTilesOverlays(
    map,
    pmtilesLayers,
    pmtilesEffectiveState,
  );

  const currentZoom = useMapZoom(map);
  useEffect(() => {
    onZoomChange?.(currentZoom);
  }, [currentZoom, onZoomChange]);

  // Resolve a usable center per listing once. Filter out anything
  // without a parcel center so downstream effects can assume coords
  // are well-formed.
  const markerItems = useMemo<ListingMarkerItem[]>(
    () =>
      listings
        .map((listing) => ({
          listing,
          coords: getParcelCenter(listing.geom_json),
        }))
        .filter(
          (item): item is ListingMarkerItem => item.coords !== null,
        ),
    [listings],
  );
  const fitCoords = useMemo(
    () => markerItems.map((item) => item.coords),
    [markerItems],
  );

  useAutoFitBounds({
    map,
    isLoaded,
    enabled: !choroplethVisible,
    scopeKey: `${country ?? ""}/${regionSlug ?? ""}`,
    coords: fitCoords,
  });

  useListingMarkers({
    map,
    isLoaded,
    enabled: !choroplethVisible,
    items: markerItems,
    onClick: onListingClick,
  });

  useHexHeatmapLayer({
    map,
    isLoaded,
    enabled: showHeatmap,
    cells: hexCells,
  });

  useChoroplethLayer({ map, isLoaded, surface: choropleth });

  if (!isLoaded) {
    return (
      <MapLoadingFallback
        className={className}
        hasApiKey={hasApiKey}
        listingCount={listings.length}
      />
    );
  }

  // `google` is defined past this point — it's safe to read enums for
  // map options that need ControlPosition etc.
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

  const countryKey = country ?? "united-states";
  const defaultCenter = DEFAULT_CENTERS[countryKey] ?? FALLBACK_CENTER;
  const defaultZoom = DEFAULT_ZOOMS[countryKey] ?? FALLBACK_ZOOM;

  const choroplethCount = choroplethVisible
    ? choropleth?.features.features.length ?? 0
    : 0;
  const overlayCount = pageControlled ? pageControlledOverlayIds!.size : 0;

  return (
    <div className={`relative ${className ?? ""}`}>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={defaultCenter}
        zoom={defaultZoom}
        options={mapOptions}
        onLoad={setMap}
      />
      {pageControlled && (
        <MapHud
          country={country}
          regionSlug={regionSlug}
          zoom={currentZoom}
          choroplethVisible={choroplethVisible}
          choroplethCount={choroplethCount}
          listingCount={listings.length}
          overlayCount={overlayCount}
        />
      )}
      <LayerPanel
        layers={pageControlled ? [] : pmtilesLayers}
        state={pmtilesPanelState}
        onToggle={togglePMTilesLayer}
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
