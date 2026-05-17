// Listings map — Google Maps canvas plus markers / heatmap / choropleth /
// PMTiles overlays. The page owns selection state and the layer catalog
// (passed in via `pmtilesLayers` + `pmtilesState`); the map drives the
// deck.gl wiring against its own `google.maps.Map` instance and emits
// the resulting `headers` / `progress` back up via callbacks. `overlays`
// is the slot for any absolute UI the page wants on top (HUD, LayerPanel).

import { GoogleMap } from "@react-google-maps/api";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { USListing } from "@/countries/unitedStates";
import type { HexCell } from "@/hooks/useHexHeatmap";
import type { ChoroplethSurface } from "@/countries/types";
import { getParcelCenter } from "@/lib/geo";
import { useGoogleMaps } from "./GoogleMapsProvider";
import { MapLoadingFallback } from "./MapLoadingFallback";
import type { PMTilesLayerConfig } from "./pmtilesLayers";
import { PremiumLabelsGate } from "./PremiumLabelsGate";
import { useAutoFitBounds } from "./useAutoFitBounds";
import { useChoroplethLayer } from "./useChoroplethLayer";
import { useHexHeatmapLayer } from "./useHexHeatmapLayer";
import { useListingMarkers, type ListingMarkerItem } from "./useListingMarkers";
import { useMapZoom } from "./useMapZoom";
import {
  usePMTilesOverlays,
  type LayerHeader,
  type LayerProgress,
  type PMTilesLayerState,
} from "./usePMTilesOverlays";

interface ListingsGoogleMapProps {
  listings: USListing[];
  className?: string;
  country?: string;
  // URL scope hint — drives the auto-fit-bounds latch reset and the
  // default center/zoom.
  regionSlug?: string;
  hexCells?: HexCell[];
  showHeatmap?: boolean;
  hexLoading?: boolean;
  // Reserved for the in-map LayerPanel composed by the production
  // listings page. The map itself doesn't render the panel; the
  // page passes it via `overlays`.
  onToggleHeatmap?: () => void;
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
  // PMTiles overlays — page passes the (region-narrowed) catalog and the
  // visibility map; the deck.gl wiring lives inside the map. Headers and
  // progress flow back up so the page can render LayerPanel / progress
  // chips against the same source of truth.
  pmtilesLayers?: PMTilesLayerConfig[];
  pmtilesState?: Record<string, PMTilesLayerState>;
  onLayerHeadersChange?: (headers: Record<string, LayerHeader>) => void;
  onLayerProgressChange?: (progress: Record<string, LayerProgress>) => void;
  // Absolutely-positioned children rendered inside the map's
  // relative wrapper. Use this for HUD, LayerPanel, and any other
  // page-owned chrome that needs to sit on top of the map canvas.
  overlays?: ReactNode;
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

const EMPTY_PMTILES_LAYERS: PMTilesLayerConfig[] = [];
const EMPTY_PMTILES_STATE: Record<string, PMTilesLayerState> = {};

export function ListingsGoogleMap({
  listings,
  className,
  country,
  regionSlug,
  hexCells,
  showHeatmap = false,
  onZoomChange,
  onListingClick,
  choropleth,
  pmtilesLayers = EMPTY_PMTILES_LAYERS,
  pmtilesState = EMPTY_PMTILES_STATE,
  onLayerHeadersChange,
  onLayerProgressChange,
  overlays,
}: ListingsGoogleMapProps) {
  const { isLoaded, hasApiKey, requestLoad } = useGoogleMaps();
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    requestLoad();
  }, [requestLoad]);

  // TEMP: choropleth disabled
  const choroplethVisible = false;

  // PMTiles overlays. The hook is a no-op when `pmtilesLayers` is empty
  // (legacy callers / countries with no tiles configured); when it has
  // entries it drives a deck.gl `GoogleMapsOverlay` attached to `map`
  // and surfaces per-layer header + tile-fetch progress.
  const { headers: layerHeaders, progress: layerProgress } = usePMTilesOverlays(
    map,
    pmtilesLayers,
    pmtilesState,
  );
  useEffect(() => {
    onLayerHeadersChange?.(layerHeaders);
  }, [layerHeaders, onLayerHeadersChange]);
  useEffect(() => {
    onLayerProgressChange?.(layerProgress);
  }, [layerProgress, onLayerProgressChange]);

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
        .filter((item): item is ListingMarkerItem => item.coords !== null),
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

  // TEMP: choropleth disabled
  useChoroplethLayer({ map, isLoaded, surface: undefined });

  // Stable initial center/zoom/options. <GoogleMap> treats `center` and
  // `options` as controlled props and re-applies them on identity change —
  // so an object literal recreated each render would re-center the map
  // (fighting user pan) and re-initialize the map controls (visible flicker
  // in the top-right where MapTypeControl + fullscreen sit). useMemo
  // anchors identity so we only pay the cost when something genuinely
  // changes.
  const countryKey = country ?? "united-states";
  const initialCenter = useMemo(
    () => DEFAULT_CENTERS[countryKey] ?? DEFAULT_CENTERS["united-states"],
    [countryKey],
  );
  const initialZoom = DEFAULT_ZOOMS[countryKey] ?? DEFAULT_ZOOMS["united-states"];
  const mapOptions = useMemo<google.maps.MapOptions | undefined>(() => {
    // `google` is undefined until the API loads. The GoogleMap is also
    // gated on `isLoaded` (we render MapLoadingFallback below otherwise),
    // so the options object only matters once the API is available.
    if (!isLoaded || typeof google === "undefined") return undefined;
    // mapId is required for AdvancedMarkerElement (useListingMarkers) —
    // without it the Maps JS API throws the "can't load Google Maps
    // correctly" popup. The ID itself is non-secret (ends up in the
    // browser bundle) so we read it from a public Vite env var.
    const mapId = import.meta.env.VITE_GOOGLE_MAP_ID;
    return {
      mapTypeId: "satellite",
      mapTypeControl: true,
      mapTypeControlOptions: {
        position: google.maps.ControlPosition.TOP_RIGHT,
      },
      zoomControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      ...(mapId ? { mapId } : {}),
    };
  }, [isLoaded]);

  if (!isLoaded) {
    return (
      <MapLoadingFallback
        className={className}
        hasApiKey={hasApiKey}
        listingCount={listings.length}
      />
    );
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={initialCenter}
        zoom={initialZoom}
        options={mapOptions}
        onLoad={setMap}
      />
      <PremiumLabelsGate map={map} />
      {overlays}
    </div>
  );
}

export default ListingsGoogleMap;
