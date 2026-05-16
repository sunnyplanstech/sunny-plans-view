import { GoogleMap, Marker, Polygon } from "@react-google-maps/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { useGoogleMaps } from "./GoogleMapsProvider";
import { LayerPanel } from "./LayerPanel";
import { pmtilesLayersFor, type PMTilesLayerConfig } from "./pmtilesLayers";
import { usePMTilesOverlays, type PMTilesLayerState } from "./usePMTilesOverlays";

function initialLayerState(
  layers: PMTilesLayerConfig[],
): Record<string, PMTilesLayerState> {
  return Object.fromEntries(
    layers.map((l) => [l.id, { visible: l.defaultVisible ?? false }]),
  );
}

interface MiniParcelMapProps {
  geomJson: unknown;
  className?: string;
  interactive?: boolean;
  /**
   * Whether the viewer is looking at a paywalled (locked) version of
   * the parcel — i.e. `!access_granted` from the API. Drives the
   * rendering use case:
   *   locked=true  → obfuscation disc: hide the marker, fit to a
   *                  `locationAccuracyM`-sized box, cap zoom so the
   *                  implied disc cannot fill the viewport. Overlays
   *                  still mount on the detail surface as a regional
   *                  preview that doesn't reveal the parcel.
   *   locked=false → exact location: render the polygon if `geomJson`
   *                  is one, otherwise drop a pin and zoom in close.
   * Callers know this from `access_granted`; for list endpoints (which
   * always serve obfuscated rows) it is unconditionally true.
   */
  locked: boolean;
  /**
   * Disc radius in meters around `geomJson`. Read only when
   * `locked=true`. Ignored otherwise.
   */
  locationAccuracyM: number | null;
  /**
   * Country + region slug enable PMTiles constraint overlays
   * (PAD-US, slope, NWI for US; slope, Natura 2000 for IT) on the
   * detail-page map — for both locked rows (obfuscation disc, where
   * overlays act as a regional preview without revealing the parcel)
   * and unlocked rows. Listing cards leave these unset so the small
   * per-card maps stay overlay-free.
   */
  country?: string;
  regionSlug?: string;
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

type GeomLike = { type?: string; coordinates?: unknown };

interface ResolvedGeom {
  center: google.maps.LatLngLiteral;
  paths: google.maps.LatLngLiteral[][];
}

function ringToPath(ring: number[][]): google.maps.LatLngLiteral[] {
  return ring.map(([lng, lat]) => ({ lat, lng }));
}

function pathCentroid(path: google.maps.LatLngLiteral[]): google.maps.LatLngLiteral {
  const n = path.length;
  return {
    lat: path.reduce((s, p) => s + p.lat, 0) / n,
    lng: path.reduce((s, p) => s + p.lng, 0) / n,
  };
}

function resolveGeom(geomJson: unknown): ResolvedGeom | null {
  if (!geomJson) return null;
  try {
    const g = (typeof geomJson === "string" ? JSON.parse(geomJson) : geomJson) as GeomLike;
    if (g.type === "Point" && Array.isArray(g.coordinates)) {
      const [lng, lat] = g.coordinates as number[];
      return { center: { lat, lng }, paths: [] };
    }
    if (g.type === "Polygon" && Array.isArray(g.coordinates)) {
      const rings = g.coordinates as number[][][];
      if (rings.length === 0) return null;
      const paths = rings.map(ringToPath);
      return { center: pathCentroid(paths[0]), paths };
    }
    return null;
  } catch {
    return null;
  }
}

// Cap zoom so the disc (diameter 2*accuracyM) cannot fill the viewport.
// Tuned for a ~1024-px viewport; disc lands at ~1/3 width at the cap.
function computeAccuracyMaxZoom(accuracyM: number, lat: number): number {
  const cos = Math.max(Math.cos((lat * Math.PI) / 180), 0.05);
  const z = Math.log2(((1024 / 3) * 156543 * cos) / (2 * accuracyM));
  return Math.max(8, Math.min(18, Math.floor(z)));
}

function buildAccuracyBounds(
  center: google.maps.LatLngLiteral,
  accuracyM: number,
): google.maps.LatLngBoundsLiteral {
  const halfSideM = accuracyM * 4;
  const cos = Math.max(Math.cos((center.lat * Math.PI) / 180), 0.05);
  const dLat = halfSideM / 111320;
  const dLng = halfSideM / (111320 * cos);
  return {
    north: center.lat + dLat,
    south: center.lat - dLat,
    east: center.lng + dLng,
    west: center.lng - dLng,
  };
}

export function MiniParcelMap({
  geomJson,
  className,
  interactive = false,
  locked,
  locationAccuracyM,
  country,
  regionSlug,
}: MiniParcelMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const geom = useMemo(() => resolveGeom(geomJson), [geomJson]);
  const { isLoaded, requestLoad } = useGoogleMaps();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          requestLoad();
          observer.disconnect();
        }
      },
      { rootMargin: "100px" }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [requestLoad]);

  // Two orthogonal use-case axes drive every render branch below.
  // Naming them explicitly here so the rest of the component reads as
  // a switch on intent, not a chain of shape heuristics:
  //
  //   locked   — paywall state of the location data (= !access_granted)
  //     true   the location is obfuscated; render the disc, hide the
  //            marker, cap zoom by `locationAccuracyM`
  //     false  the exact location is available; if it's a polygon
  //            (IT premium) render it, otherwise drop a pin (US premium)
  //
  //   surface  — where this map is mounted
  //     "detail"     full detail-page map; PMTiles overlays mount and
  //                  Google attribution stays visible
  //     "thumbnail"  listing-card / drawer preview; no overlays, no
  //                  attribution
  //
  // Overlays mount whenever we have a geom to anchor on AND we're on
  // the detail surface — including the locked disc surface, where they
  // act as a regional trust preview without revealing the parcel.
  const hasPolygon = (geom?.paths.length ?? 0) > 0;
  const surface: "detail" | "thumbnail" = country ? "detail" : "thumbnail";
  const overlaysEnabled = surface === "detail" && geom != null;

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const pmtilesLayers = useMemo(
    () => (overlaysEnabled ? pmtilesLayersFor(country, regionSlug) : []),
    [overlaysEnabled, country, regionSlug],
  );
  const [layerState, setLayerState] = useState<Record<string, PMTilesLayerState>>(
    () => initialLayerState(pmtilesLayers),
  );
  useEffect(() => {
    setLayerState(initialLayerState(pmtilesLayers));
  }, [pmtilesLayers]);
  const toggleLayer = useCallback((id: string) => {
    setLayerState((prev) => ({
      ...prev,
      [id]: { visible: !prev[id]?.visible },
    }));
  }, []);
  const { headers: layerHeaders } = usePMTilesOverlays(map, pmtilesLayers, layerState);

  const [currentZoom, setCurrentZoom] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (!map) return;
    const update = () => setCurrentZoom(map.getZoom());
    update();
    const listener = map.addListener("zoom_changed", update);
    return () => google.maps.event.removeListener(listener);
  }, [map]);

  // `mini-parcel-map` scopes the listing-card thumbnail attribution
  // suppression in src/index.css. Only the thumbnail surface hides
  // attribution; detail maps keep the Google logo + Map data / Terms
  // links visible for both premium and free viewers.
  const wrapperClass = `relative ${surface === "thumbnail" ? "mini-parcel-map" : ""} ${className ?? ""}`.trim();

  if (!isVisible || !isLoaded || !geom) {
    return (
      <div
        ref={containerRef}
        className={`bg-muted/50 flex items-center justify-center ${className}`}
      >
        <MapPin className="w-6 h-6 text-muted-foreground" />
      </div>
    );
  }

  const mapOptions: google.maps.MapOptions = {
    mapTypeId: "satellite",
    disableDefaultUI: true,
    zoomControl: interactive,
    gestureHandling: interactive ? "cooperative" : "none",
    scrollwheel: interactive,
    draggable: interactive,
    // Unlocked (polygon or exact pin): tile coverage tops out at z20;
    // satellite goes blank past that. Locked: cap derived from disc
    // radius so no street-level detail emerges through the obfuscation.
    maxZoom: locked && locationAccuracyM != null
      ? computeAccuracyMaxZoom(locationAccuracyM, geom.center.lat)
      : 19,
  };

  // Map is fully uncontrolled: viewport is set imperatively in onLoad. Passing
  // center/zoom as props alongside fitBounds caused the satellite tile loader
  // to enter an inconsistent state and render a blank gray background.
  const handleMapLoad = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    if (locked && locationAccuracyM != null) {
      mapInstance.fitBounds(buildAccuracyBounds(geom.center, locationAccuracyM));
    } else if (hasPolygon) {
      const bounds = new google.maps.LatLngBounds();
      geom.paths.forEach((path) => path.forEach((p) => bounds.extend(p)));
      mapInstance.fitBounds(bounds, 24);
    } else {
      mapInstance.setCenter(geom.center);
      mapInstance.setZoom(15);
    }
  };

  return (
    <div ref={containerRef} className={wrapperClass}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        options={mapOptions}
        onLoad={handleMapLoad}
      >
        {/* Locked: nothing drawn — the disc bounds + capped zoom carry
            the location signal without leaking it. Unlocked: polygon if
            we have one, otherwise an exact pin. */}
        {locked ? null : hasPolygon ? (
          geom.paths.map((path, i) => (
            <Polygon
              key={i}
              paths={path}
              options={{
                fillColor: "#fbbf24",
                fillOpacity: 0.2,
                strokeColor: "#fbbf24",
                strokeWeight: 2,
                strokeOpacity: 0.95,
                clickable: false,
              }}
            />
          ))
        ) : (
          <Marker
            position={geom.center}
            clickable={false}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: "#fbbf24",
              fillOpacity: 0.6,
              strokeColor: "#fbbf24",
              strokeWeight: 2,
              strokeOpacity: 0.95,
              scale: 9,
            }}
          />
        )}
      </GoogleMap>
      {overlaysEnabled && (
        <LayerPanel
          layers={pmtilesLayers}
          state={layerState}
          onToggle={toggleLayer}
          hasRegionScope={!!regionSlug}
          layerHeaders={layerHeaders}
          currentZoom={currentZoom}
        />
      )}
    </div>
  );
}

export default MiniParcelMap;
