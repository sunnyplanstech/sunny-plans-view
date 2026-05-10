// Listings map — pure Google Maps canvas plus markers / heatmap /
// choropleth. PMTiles overlays are composed at the page level (each
// page owns its toggle UI and progress state); the map exposes its
// google.maps.Map instance via `onMapReady` so the page can attach
// deck.gl directly. `overlays` is the slot for any absolute UI the
// page wants on top (HUD, LayerPanel, custom chrome).

import { GoogleMap } from "@react-google-maps/api";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { USListing } from "@/countries/unitedStates";
import type { HexCell } from "@/hooks/useHexHeatmap";
import type { ChoroplethSurface } from "@/countries/types";
import { getParcelCenter } from "@/lib/geo";
import { useGoogleMaps } from "./GoogleMapsProvider";
import { MapLoadingFallback } from "./MapLoadingFallback";
import { useAutoFitBounds } from "./useAutoFitBounds";
import { useChoroplethLayer } from "./useChoroplethLayer";
import { useHexHeatmapLayer } from "./useHexHeatmapLayer";
import { useListingMarkers, type ListingMarkerItem } from "./useListingMarkers";
import { useMapZoom } from "./useMapZoom";

interface ListingsGoogleMapProps {
  listings: USListing[];
  className?: string;
  country?: string;
  // URL scope hint — drives the auto-fit-bounds latch reset and the
  // default center/zoom. PMTiles overlays don't live here anymore;
  // pages compose them at their own level.
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
  // Surfaces the google.maps.Map instance to the page so it can
  // compose imperative subsystems (deck.gl overlays, etc.) against
  // the same map. Fired with `null` on unmount.
  onMapReady?: (map: google.maps.Map | null) => void;
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

const FALLBACK_CENTER = DEFAULT_CENTERS["united-states"];
const FALLBACK_ZOOM = DEFAULT_ZOOMS["united-states"];

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
  onMapReady,
  overlays,
}: ListingsGoogleMapProps) {
  const { isLoaded, hasApiKey, requestLoad } = useGoogleMaps();
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    requestLoad();
  }, [requestLoad]);

  // Stable ref so callers passing a fresh closure each render don't
  // cause the map-ready notification to refire.
  const onMapReadyRef = useRef(onMapReady);
  useEffect(() => {
    onMapReadyRef.current = onMapReady;
  }, [onMapReady]);

  useEffect(() => {
    onMapReadyRef.current?.(map);
    return () => {
      onMapReadyRef.current?.(null);
    };
  }, [map]);

  const choroplethVisible = choropleth?.visible ?? false;

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

  return (
    <div className={`relative ${className ?? ""}`}>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={defaultCenter}
        zoom={defaultZoom}
        options={mapOptions}
        onLoad={setMap}
      />
      {overlays}
    </div>
  );
}

export default ListingsGoogleMap;
