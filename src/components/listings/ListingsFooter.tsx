import { Link } from "react-router-dom";
import { Sun, Home } from "lucide-react";
import { locationHierarchy } from "@/data/mockListings";

interface ListingsFooterProps {
  currentCountry?: string;
  currentRegion?: string;
  currentProvince?: string;
}

const ListingsFooter = ({ currentCountry, currentRegion, currentProvince }: ListingsFooterProps) => {
  // Group locations by country
  const italyLocations = locationHierarchy.filter(loc => loc.country === "italy");
  const usaLocations = locationHierarchy.filter(loc => loc.country === "usa");

  // Filter out current location
  const filterCurrent = (loc: typeof locationHierarchy[0]) => {
    if (currentProvince && loc.province?.toLowerCase() === currentProvince.toLowerCase()) return false;
    return true;
  };

  return (
    <footer className="mt-12 border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-10">
        {/* Explore Regions Section */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
            Explore Solar Land by Region
          </h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Italy */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs">🇮🇹</span>
                Italy
              </h4>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                {italyLocations.filter(filterCurrent).map((location) => (
                  <li key={`${location.region}-${location.province}`}>
                    <Link
                      to={`/listings/${location.country}/${location.region.toLowerCase()}/${location.province?.toLowerCase().replace(/\s+/g, '-')}`}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {location.province || location.region}
                      <span className="text-xs ml-1 text-muted-foreground/60">
                        ({location.listingCount})
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* USA */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs">🇺🇸</span>
                United States
              </h4>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                {usaLocations.filter(filterCurrent).map((location) => (
                  <li key={`${location.region}-${location.province}`}>
                    <Link
                      to={`/listings/${location.country}/${location.region.toLowerCase()}/${location.province?.toLowerCase().replace(/\s+/g, '-')}`}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {location.province || location.region}
                      <span className="text-xs ml-1 text-muted-foreground/60">
                        ({location.listingCount})
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Back to Sunnyplans Home</span>
          </Link>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sun className="w-4 h-4 text-primary" />
            <span>Substation-ready land for BESS & Solar</span>
          </div>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Sunnyplans. Geo-analytics for renewable energy.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default ListingsFooter;
