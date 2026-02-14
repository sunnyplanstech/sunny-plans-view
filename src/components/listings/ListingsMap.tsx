import { MapPin } from "lucide-react";
import { USListing } from "@/hooks/useUSListings";
import { ITListing } from "@/hooks/useITListings";
import { HexCell } from "@/hooks/useHexHeatmap";
import ListingsGoogleMap from "@/components/maps/ListingsGoogleMap";

interface ListingsMapProps {
  country?: string;
  region?: string;
  province?: string;
  listingCount: number;
  isUnlocked?: boolean;
  usListings?: USListing[];
  itListings?: ITListing[];
  hexCells?: HexCell[];
  showHeatmap?: boolean;
  hexLoading?: boolean;
  onToggleHeatmap?: () => void;
}

function itListingsToMapFormat(listings: ITListing[]) {
  return listings.map((listing) => ({
    id: listing.id,
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
  }));
}

const ListingsMap = ({
  country = "italy",
  region,
  province,
  listingCount,
  usListings = [],
  itListings = [],
  hexCells,
  showHeatmap,
  hexLoading,
  onToggleHeatmap,
}: ListingsMapProps) => {
  const isUS = country === "united-states";
  const isItaly = country === "italy";

  if (isUS) {
    return (
      <ListingsGoogleMap
        listings={usListings}
        className="w-full h-full min-h-[400px]"
        country="united-states"
        hexCells={hexCells}
        showHeatmap={showHeatmap}
        hexLoading={hexLoading}
        onToggleHeatmap={onToggleHeatmap}
      />
    );
  }

  if (isItaly) {
    const mappedListings = itListingsToMapFormat(itListings);
    return (
      <ListingsGoogleMap
        listings={mappedListings}
        className="w-full h-full min-h-[400px]"
        country="italy"
        hexCells={hexCells}
        showHeatmap={showHeatmap}
        hexLoading={hexLoading}
        onToggleHeatmap={onToggleHeatmap}
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
