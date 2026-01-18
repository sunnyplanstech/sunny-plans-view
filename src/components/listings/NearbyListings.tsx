import { Link } from "react-router-dom";
import { locationHierarchy } from "@/data/mockListings";
import { MapPin, ArrowRight } from "lucide-react";

interface NearbyListingsProps {
  currentCountry?: string;
  currentRegion?: string;
  currentProvince?: string;
}

const NearbyListings = ({ currentCountry, currentRegion, currentProvince }: NearbyListingsProps) => {
  // Filter to show nearby locations (same country, different province or region)
  const nearbyLocations = locationHierarchy
    .filter(loc => {
      if (!currentCountry) return true;
      if (loc.country !== currentCountry) return false;
      if (currentProvince && loc.province === currentProvince) return false;
      return true;
    })
    .slice(0, 6);

  if (nearbyLocations.length === 0) return null;

  return (
    <section className="py-8 border-t border-border">
      <h3 className="text-lg font-semibold mb-4">
        Explore Nearby Regions
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {nearbyLocations.map((location) => (
          <Link
            key={`${location.region}-${location.province}`}
            to={`/listings/${location.country}/${location.region.toLowerCase()}/${location.province?.toLowerCase().replace(/\s+/g, '-')}`}
            className="group flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all"
          >
            <MapPin className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate group-hover:text-primary">
                {location.province || location.region}
              </p>
              <p className="text-xs text-muted-foreground">
                {location.listingCount} parcels
              </p>
            </div>
            <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>
    </section>
  );
};

export default NearbyListings;
