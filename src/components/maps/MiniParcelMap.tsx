import { GoogleMap, Polygon } from "@react-google-maps/api";
import { useMemo, useRef, useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { useGoogleMaps } from "./GoogleMapsProvider";

interface MiniParcelMapProps {
  geomJson: unknown;
  className?: string;
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
    if (g.type === "MultiPolygon" && Array.isArray(g.coordinates)) {
      const polys = g.coordinates as number[][][][];
      if (polys.length === 0) return null;
      const paths = polys.flatMap((poly) => poly.map(ringToPath));
      if (paths.length === 0) return null;
      return { center: pathCentroid(paths[0]), paths };
    }
    return null;
  } catch {
    return null;
  }
}

export function MiniParcelMap({ geomJson, className }: MiniParcelMapProps) {
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

  const hasPolygon = geom.paths.length > 0;

  const mapOptions: google.maps.MapOptions = {
    mapTypeId: "satellite",
    disableDefaultUI: true,
    gestureHandling: "none",
    zoomControl: false,
    scrollwheel: false,
    draggable: false,
    // Satellite tiles top out around z20 — fitBounds on a small parcel can
    // otherwise zoom past tile coverage and render the parcel on blank gray.
    maxZoom: 19,
  };

  const handleMapLoad = (map: google.maps.Map) => {
    if (!hasPolygon) return;
    const bounds = new google.maps.LatLngBounds();
    geom.paths.forEach((path) => path.forEach((p) => bounds.extend(p)));
    map.fitBounds(bounds, 24);
  };

  return (
    <div ref={containerRef} className={className}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={geom.center}
        zoom={15}
        options={mapOptions}
        onLoad={hasPolygon ? handleMapLoad : undefined}
      >
        {hasPolygon &&
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
          ))}
      </GoogleMap>
    </div>
  );
}

export default MiniParcelMap;
