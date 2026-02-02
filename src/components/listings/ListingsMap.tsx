import { Clock, MapPin } from "lucide-react";
import { USListing } from "@/hooks/useUSListings";
import ListingsGoogleMap from "@/components/maps/ListingsGoogleMap";

interface ListingsMapProps {
  country?: string;
  region?: string;
  province?: string;
  listingCount: number;
  isUnlocked?: boolean;
  usListings?: USListing[];
}

const ListingsMap = ({
  country = "italy",
  region,
  province,
  listingCount,
  usListings = [],
}: ListingsMapProps) => {
  const isUS = country === "united-states";
  const isItaly = country === "italy";

  // For Italy, show "Coming Soon" message
  if (isItaly) {
    return (
      <div className="relative w-full h-full min-h-[400px] bg-muted/30 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Coming Soon</h3>
          <p className="text-muted-foreground mb-4">
            Italian land listings are coming soon. We're currently focused on the US market
            with our comprehensive solar & BESS land database.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>
              {province || region || "Italy"} - Stay tuned for updates
            </span>
          </div>
        </div>
      </div>
    );
  }

  // For US, always use Google Maps (shows US even with no listings)
  if (isUS) {
    return (
      <ListingsGoogleMap
        listings={usListings}
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
