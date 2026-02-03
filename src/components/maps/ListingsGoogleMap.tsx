import { GoogleMap, InfoWindow, Marker } from "@react-google-maps/api";
import { useMemo, useState, useCallback } from "react";
import { MapPin } from "lucide-react";
import { USListing } from "@/hooks/useUSListings";
import { stateCodeToSlug, countyToSlug } from "@/data/locations";
import { useGoogleMaps } from "./GoogleMapsProvider";

interface ListingsGoogleMapProps {
  listings: USListing[];
  className?: string;
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = { lat: 39.8283, lng: -98.5795 }; // Center of US

// Get coordinates from listing (uses latitude/longitude fields)
function getListingCoords(listing: USListing): { lat: number; lng: number } | null {
  if (listing.latitude != null && listing.longitude != null) {
    return { lat: listing.latitude, lng: listing.longitude };
  }
  return null;
}

function formatPrice(price: number | null): string {
  if (!price) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function ListingsGoogleMap({ listings, className }: ListingsGoogleMapProps) {
  const { isLoaded, hasApiKey } = useGoogleMaps();
  const [selectedListing, setSelectedListing] = useState<USListing | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Filter listings to only those with valid coordinates
  const listingsWithCoords = useMemo(() => {
    return listings
      .map((listing) => ({
        listing,
        coords: getListingCoords(listing),
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

  const handleMarkerClick = useCallback((listing: USListing) => {
    setSelectedListing(listing);
  }, []);

  const buildListingUrl = useCallback((listing: USListing) => {
    const stateSlug = stateCodeToSlug(listing.state_code) || listing.state_code.toLowerCase();
    const countySlugStr = countyToSlug(listing.county);
    return `/united-states/${stateSlug}/${countySlugStr}/listing/${listing.land_id}`;
  }, []);

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
        zoom={4}
        options={mapOptions}
        onLoad={onLoad}
      >
        {listingsWithCoords.map(({ listing, coords }) => (
          <Marker
            key={listing.land_id}
            position={coords}
            onClick={() => handleMarkerClick(listing)}
          />
        ))}

        {selectedListing && getListingCoords(selectedListing) && (
          <InfoWindow
            position={getListingCoords(selectedListing)!}
            onCloseClick={() => setSelectedListing(null)}
          >
            <div className="p-2 min-w-[200px]">
              <h3 className="font-semibold text-sm mb-2">
                {selectedListing.county}, {selectedListing.state_code}
              </h3>
              <div className="space-y-1 text-xs">
                <p>
                  <span className="text-gray-600">Solar Score:</span>{" "}
                  <span className="font-medium text-green-600">
                    {selectedListing.prob_solar ? `${Math.round(selectedListing.prob_solar * 100)}%` : "N/A"}
                  </span>
                </p>
                <p>
                  <span className="text-gray-600">Size:</span>{" "}
                  {selectedListing.lot_acres?.toFixed(1)} acres
                </p>
                <p>
                  <span className="text-gray-600">Price:</span>{" "}
                  {formatPrice(selectedListing.list_price)}
                </p>
                <p>
                  <span className="text-gray-600">Substation:</span>{" "}
                  {selectedListing.power_substation?.toFixed(1)} mi
                </p>
              </div>
              <a
                href={buildListingUrl(selectedListing)}
                className="mt-3 block text-center text-xs bg-green-600 text-white py-1.5 px-3 rounded hover:bg-green-700 transition-colors"
              >
                View Details
              </a>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}

export default ListingsGoogleMap;
