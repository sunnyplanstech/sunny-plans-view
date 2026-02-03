import { GoogleMap, Marker } from "@react-google-maps/api";
import { useMemo } from "react";
import { MapPin } from "lucide-react";
import { useGoogleMaps } from "./GoogleMapsProvider";

interface MiniParcelMapProps {
  latitude: number | null;
  longitude: number | null;
  className?: string;
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = { lat: 39.8283, lng: -98.5795 }; // Center of US

export function MiniParcelMap({ latitude, longitude, className }: MiniParcelMapProps) {
  const { isLoaded } = useGoogleMaps();

  const hasCoords = latitude != null && longitude != null;
  const center = useMemo(() => {
    if (hasCoords) {
      return { lat: latitude, lng: longitude };
    }
    return defaultCenter;
  }, [latitude, longitude, hasCoords]);

  // Show fallback if Google Maps is not loaded or no coordinates
  if (!isLoaded || !hasCoords) {
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

  return (
    <div className={className}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={15}
        options={mapOptions}
      >
        <Marker position={center} />
      </GoogleMap>
    </div>
  );
}

export default MiniParcelMap;
