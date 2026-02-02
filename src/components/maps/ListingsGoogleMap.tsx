import { GoogleMap, Polygon, InfoWindow, Marker } from "@react-google-maps/api";
import { useMemo, useState, useCallback } from "react";
import { USListing } from "@/hooks/useUSListings";
import { stateCodeToSlug, countyToSlug } from "@/data/locations";

interface ListingsGoogleMapProps {
  listings: USListing[];
  className?: string;
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = { lat: 39.8283, lng: -98.5795 }; // Center of US

// Parse WKT or GeoJSON geometry string to lat/lng coordinates
function parseGeometry(geom: string | null): google.maps.LatLngLiteral[] {
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
function getPolygonCenter(coords: google.maps.LatLngLiteral[]): google.maps.LatLngLiteral {
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

// Calculate bounds to fit all listings
function getBounds(listings: USListing[]): google.maps.LatLngBounds | null {
  if (typeof google === "undefined" || listings.length === 0) return null;

  const bounds = new google.maps.LatLngBounds();
  let hasValidCoords = false;

  listings.forEach((listing) => {
    const coords = parseGeometry(listing.geom);
    if (coords.length > 0) {
      coords.forEach((coord) => bounds.extend(coord));
      hasValidCoords = true;
    }
  });

  return hasValidCoords ? bounds : null;
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
  const [selectedListing, setSelectedListing] = useState<USListing | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    const bounds = getBounds(listings);
    if (bounds) {
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }
  }, [listings]);

  const listingsWithCoords = useMemo(() => {
    return listings.map((listing) => ({
      listing,
      coords: parseGeometry(listing.geom),
      center: getPolygonCenter(parseGeometry(listing.geom)),
    }));
  }, [listings]);

  // Update bounds when listings change
  useMemo(() => {
    if (map && listings.length > 0) {
      const bounds = getBounds(listings);
      if (bounds) {
        map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
      }
    }
  }, [map, listings]);

  const mapOptions: google.maps.MapOptions = {
    mapTypeId: "satellite",
    mapTypeControl: true,
    mapTypeControlOptions: {
      position: typeof google !== "undefined" ? google.maps.ControlPosition.TOP_RIGHT : undefined,
    },
    zoomControl: true,
    streetViewControl: false,
    fullscreenControl: true,
  };

  const getPolygonOptions = (listing: USListing): google.maps.PolygonOptions => {
    const isSelected = selectedListing?.land_id === listing.land_id;
    return {
      fillColor: isSelected ? "#facc15" : "#22c55e",
      fillOpacity: isSelected ? 0.5 : 0.3,
      strokeColor: isSelected ? "#facc15" : "#22c55e",
      strokeWeight: isSelected ? 3 : 2,
      strokeOpacity: 0.9,
    };
  };

  const handlePolygonClick = (listing: USListing) => {
    setSelectedListing(listing);
  };

  const buildListingUrl = (listing: USListing) => {
    const stateSlug = stateCodeToSlug(listing.state_code) || listing.state_code.toLowerCase();
    const countySlugStr = countyToSlug(listing.county);
    return `/united-states/${stateSlug}/${countySlugStr}/listing/${listing.land_id}`;
  };

  if (listings.length === 0) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className}`}>
        <span className="text-muted-foreground">No listings to display</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={4}
        options={mapOptions}
        onLoad={onLoad}
      >
        {listingsWithCoords.map(({ listing, coords, center }) => (
          <div key={listing.land_id}>
            {coords.length > 0 ? (
              <Polygon
                paths={coords}
                options={getPolygonOptions(listing)}
                onClick={() => handlePolygonClick(listing)}
              />
            ) : (
              <Marker
                position={center}
                onClick={() => handlePolygonClick(listing)}
              />
            )}
          </div>
        ))}

        {selectedListing && (
          <InfoWindow
            position={getPolygonCenter(parseGeometry(selectedListing.geom))}
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
