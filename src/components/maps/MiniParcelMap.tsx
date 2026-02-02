import { GoogleMap, Polygon } from "@react-google-maps/api";
import { useMemo } from "react";
import { MapPin } from "lucide-react";
import { useGoogleMaps } from "./GoogleMapsProvider";

interface MiniParcelMapProps {
  geom: string | null;
  className?: string;
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = { lat: 39.8283, lng: -98.5795 }; // Center of US

// Parse WKT or GeoJSON geometry string to lat/lng coordinates
function parseGeometry(geom: string | null): { lat: number; lng: number }[] {
  if (!geom) return [];

  try {
    // Try parsing as GeoJSON first
    if (geom.startsWith("{")) {
      const geoJson = JSON.parse(geom);
      if (geoJson.type === "Polygon" && geoJson.coordinates) {
        return geoJson.coordinates[0].map((coord: number[]) => ({
          lng: coord[0],
          lat: coord[1],
        }));
      }
      if (geoJson.type === "MultiPolygon" && geoJson.coordinates) {
        // Take the first polygon for mini map
        return geoJson.coordinates[0][0].map((coord: number[]) => ({
          lng: coord[0],
          lat: coord[1],
        }));
      }
    }

    // Try parsing as WKT
    const wktMatch = geom.match(/POLYGON\s*\(\((.*)\)\)/i);
    if (wktMatch) {
      const coordsStr = wktMatch[1];
      return coordsStr.split(",").map((pair) => {
        const [lng, lat] = pair.trim().split(/\s+/).map(Number);
        return { lat, lng };
      });
    }

    const multiWktMatch = geom.match(/MULTIPOLYGON\s*\(\(\((.*?)\)\)\)/i);
    if (multiWktMatch) {
      const coordsStr = multiWktMatch[1];
      return coordsStr.split(",").map((pair) => {
        const [lng, lat] = pair.trim().split(/\s+/).map(Number);
        return { lat, lng };
      });
    }
  } catch (e) {
    console.error("Failed to parse geometry:", e);
  }

  return [];
}

// Calculate center of polygon
function getPolygonCenter(coords: { lat: number; lng: number }[]): { lat: number; lng: number } {
  if (coords.length === 0) return defaultCenter;

  const sum = coords.reduce(
    (acc, coord) => ({ lat: acc.lat + coord.lat, lng: acc.lng + coord.lng }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / coords.length,
    lng: sum.lng / coords.length,
  };
}

export function MiniParcelMap({ geom, className }: MiniParcelMapProps) {
  const { isLoaded } = useGoogleMaps();
  const coordinates = useMemo(() => parseGeometry(geom), [geom]);
  const center = useMemo(() => getPolygonCenter(coordinates), [coordinates]);

  // Show fallback if Google Maps is not loaded or no coordinates
  if (!isLoaded || coordinates.length === 0) {
    return (
      <div className={`bg-muted/50 flex items-center justify-center ${className}`}>
        <MapPin className="w-6 h-6 text-muted-foreground" />
      </div>
    );
  }

  const mapOptions: google.maps.MapOptions = {
    mapTypeId: "satellite",
    disableDefaultUI: true,
    gestureHandling: "none",
    zoomControl: false,
    scrollwheel: false,
    draggable: false,
  };

  const polygonOptions: google.maps.PolygonOptions = {
    fillColor: "#22c55e",
    fillOpacity: 0.3,
    strokeColor: "#22c55e",
    strokeWeight: 2,
    strokeOpacity: 0.8,
  };

  return (
    <div className={className}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={15}
        options={mapOptions}
      >
        <Polygon paths={coordinates} options={polygonOptions} />
      </GoogleMap>
    </div>
  );
}

export default MiniParcelMap;
