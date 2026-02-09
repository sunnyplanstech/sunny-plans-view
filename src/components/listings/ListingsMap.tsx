import { MapPin } from "lucide-react";
import { USListing } from "@/hooks/useUSListings";
import { ITListing } from "@/hooks/useITListings";
import ListingsGoogleMap from "@/components/maps/ListingsGoogleMap";

interface ListingsMapProps {
  country?: string;
  region?: string;
  province?: string;
  listingCount: number;
  isUnlocked?: boolean;
  usListings?: USListing[];
  itListings?: ITListing[];
}

function itListingsToMapFormat(listings: ITListing[]) {
  return listings
    .map((listing) => {
      const center = getParcelCenter(listing.geom_json);
      if (!center) return null;
      return {
        land_id: listing.gml_id,
        latitude: center.lat,
        longitude: center.lng,
        state_code: listing.region_slug,
        county: listing.comune_name,
        lot_acres: null as number | null,
        list_price: null as number | null,
        price_per_acre: null as number | null,
        prob_solar: listing.prob_solar,
        power_substation: null as number | null,
        geom_json: listing.geom_json,
        rank_global: listing.rank_global,
        rank_in_state: null as number | null,
        rank_in_county: listing.rank_in_comune,
      };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);
}

function getParcelCenter(geomJson: string | object | null): { lat: number; lng: number } | null {
  if (!geomJson) return null;
  try {
    const geom = typeof geomJson === "string" ? JSON.parse(geomJson) : geomJson;
    const coords =
      geom.type === "MultiPolygon"
        ? geom.coordinates[0][0]
        : geom.type === "Polygon"
        ? geom.coordinates[0]
        : null;
    if (!coords || coords.length === 0) return null;
    const sumLat = coords.reduce((s: number, c: number[]) => s + c[1], 0);
    const sumLng = coords.reduce((s: number, c: number[]) => s + c[0], 0);
    return { lat: sumLat / coords.length, lng: sumLng / coords.length };
  } catch {
    return null;
  }
}

const ListingsMap = ({
  country = "italy",
  region,
  province,
  listingCount,
  usListings = [],
  itListings = [],
}: ListingsMapProps) => {
  const isUS = country === "united-states";
  const isItaly = country === "italy";

  if (isUS) {
    return (
      <ListingsGoogleMap
        listings={usListings}
        className="w-full h-full min-h-[400px]"
      />
    );
  }

  if (isItaly) {
    const mappedListings = itListingsToMapFormat(itListings);
    return (
      <ListingsGoogleMap
        listings={mappedListings}
        className="w-full h-full min-h-[400px]"
      />
    );
  }

  // Default fallback
  return (
    <div className="relative w-full h-full min-h-[400px] bg-muted/30 rounded-lg overflow-hidden flex items-center justify-center">
      <div className="text-center p-8">
        <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">
          {listingCount} parcels found
        </p>
      </div>
    </div>
  );
};

export default ListingsMap;
