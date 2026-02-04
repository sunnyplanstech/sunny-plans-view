import { GoogleMap, Marker } from "@react-google-maps/api";
import { useMemo, useRef, useState, useEffect } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const hasCoords = latitude != null && longitude != null;
  const center = useMemo(() => {
    if (hasCoords) {
      return { lat: latitude, lng: longitude };
    }
    return defaultCenter;
  }, [latitude, longitude, hasCoords]);

  const { isLoaded, requestLoad } = useGoogleMaps();

  // Lazy load: only render map when visible in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Request Google Maps to load when map becomes visible
          requestLoad();
          observer.disconnect();
        }
      },
      { rootMargin: "100px" } // Start loading 100px before visible
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [requestLoad]);

  // Show placeholder if not visible yet, not loaded, or no coordinates
  if (!isVisible || !isLoaded || !hasCoords) {
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
    gestureHandling: "none",
    zoomControl: false,
    scrollwheel: false,
    draggable: false,
  };

  return (
    <div ref={containerRef} className={className}>
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
