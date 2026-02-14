import { GoogleMap } from "@react-google-maps/api";
import { useMemo, useState, useCallback } from "react";
import { MapPin } from "lucide-react";
import { USListing } from "@/hooks/useUSListings";
import { useGoogleMaps } from "./GoogleMapsProvider";
import { getParcelCenter } from "@/lib/geo";

interface ListingsGoogleMapProps {
  listings: USListing[];
  className?: string;
  country?: string;
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

export function ListingsGoogleMap({ listings, className, country }: ListingsGoogleMapProps) {
  const { isLoaded, hasApiKey } = useGoogleMaps();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const defaultCenter = defaultCenters[country || "united-states"] || defaultCenterUS;
  const defaultZoom = country === "italy" ? 6 : 4;

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
    <div className={className}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={defaultZoom}
        options={mapOptions}
        onLoad={onLoad}
      />
    </div>
  );
}

export default ListingsGoogleMap;
