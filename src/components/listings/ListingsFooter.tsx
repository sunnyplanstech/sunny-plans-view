import { Link } from "react-router-dom";
import { Sun, Home } from "lucide-react";
import { COUNTRIES } from "@/data/locations";

interface ListingsFooterProps {
  currentCountry?: string;
  currentRegion?: string;
  currentProvince?: string;
}

const ListingsFooter = ({ currentCountry, currentRegion, currentProvince }: ListingsFooterProps) => {
  const usStates = COUNTRIES["united-states"].states;
  const itRegions = COUNTRIES["italy"].regions;

  return (
    <footer className="mt-12 border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-10">
        {/* US States Section */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
            Explore Solar Land by State
          </h3>

          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-2">
            {usStates.map((state) => (
              <li key={state.slug}>
                <Link
                  to={`/united-states/${state.slug}`}
                  className={`text-sm transition-colors ${
                    currentCountry === "united-states" && state.slug === currentRegion?.toLowerCase()
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {state.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Italian Regions Section */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
            Explore Particelle by Region
          </h3>

          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-2">
            {itRegions.map((region) => (
              <li key={region.slug}>
                <Link
                  to={`/italy/${region.slug}`}
                  className={`text-sm transition-colors ${
                    currentCountry === "italy" && region.slug === currentRegion?.toLowerCase()
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {region.name}
                </Link>
              </li>
            ))}
          </ul>
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
            &copy; {new Date().getFullYear()} Sunnyplans. Geo-analytics for renewable energy.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default ListingsFooter;
