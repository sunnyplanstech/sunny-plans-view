import { Link } from "react-router-dom";
import { ChevronRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUSCounties } from "@/hooks/useLocationData";
import { COUNTRIES } from "@/data/locations";

interface SubdivisionNavProps {
  country?: string;
  region?: string;
  province?: string;
}

const SubdivisionNav = ({ country, region, province }: SubdivisionNavProps) => {
  const isUSA = country === "united-states";

  // Fetch counties for the current state (used for both state-level and county-level views)
  const { data: usCounties, isLoading: loadingCounties } = useUSCounties(isUSA ? region : undefined);

  // Show states if at country level (no region selected)
  const showStates = isUSA && !region;

  // Show counties if at state level or county level (show siblings at county level)
  const showCounties = isUSA && region;

  // Get data to display
  const states = showStates ? COUNTRIES["united-states"].states : [];
  const counties = showCounties ? (usCounties || []) : [];

  const isLoading = loadingCounties;

  // Build navigation items
  const navItems: { name: string; slug: string; href: string; isCurrent?: boolean }[] = [];

  if (showStates) {
    states.forEach(state => {
      navItems.push({
        name: state.name,
        slug: state.slug,
        href: `/${country}/${state.slug}`
      });
    });
  } else if (showCounties) {
    counties.forEach((c: { name: string; slug: string }) => {
      navItems.push({
        name: c.name,
        slug: c.slug,
        href: `/${country}/${region}/${c.slug}`,
        isCurrent: province === c.slug
      });
    });
  }

  // Determine section title
  const getSectionTitle = () => {
    if (showStates) return "Explore States";
    if (showCounties && province) return "Other Counties in This State";
    if (showCounties) return "Explore Counties";
    return "Explore Areas";
  };

  // Don't render if no items or not USA
  if (!isUSA) return null;
  if (!isLoading && navItems.length === 0) return null;

  return (
    <section className="mt-8 pt-6 border-t border-border">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">{getSectionTitle()}</h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-10 bg-muted animate-pulse rounded-md" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {navItems.map((item) => (
            <Link
              key={item.slug}
              to={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-md",
                "transition-colors",
                "text-sm",
                "group",
                item.isCurrent
                  ? "bg-primary/10 text-primary font-medium"
                  : "bg-muted/50 hover:bg-muted text-foreground hover:text-primary"
              )}
            >
              <span className="truncate">{item.name}</span>
              <ChevronRight className={cn(
                "w-4 h-4 shrink-0",
                item.isCurrent ? "text-primary" : "text-muted-foreground group-hover:text-primary"
              )} />
            </Link>
          ))}
        </div>
      )}

      {!isLoading && navItems.length === 0 && showCounties && (
        <p className="text-sm text-muted-foreground italic">
          No counties available yet. Check back soon!
        </p>
      )}
    </section>
  );
};

export default SubdivisionNav;
