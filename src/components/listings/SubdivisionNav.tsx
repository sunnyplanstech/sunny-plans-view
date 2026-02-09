import { Link } from "react-router-dom";
import { ChevronRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUSCounties, useITComuni } from "@/hooks/useLocationData";
import { COUNTRIES } from "@/data/locations";

interface SubdivisionNavProps {
  country?: string;
  region?: string;
  province?: string;
}

const SubdivisionNav = ({ country, region, province }: SubdivisionNavProps) => {
  const isUSA = country === "united-states";
  const isItaly = country === "italy";

  // Fetch counties for the current US state
  const { data: usCounties, isLoading: loadingCounties } = useUSCounties(isUSA ? region : undefined);

  // Fetch comuni for the current Italian region
  const { data: itComuni, isLoading: loadingComuni } = useITComuni(isItaly ? region : undefined);

  // US navigation logic
  const showUSStates = isUSA && !region;
  const showUSCounties = isUSA && !!region;

  // Italy navigation logic
  const showITRegions = isItaly && !region;
  const showITComuni = isItaly && !!region;

  const isLoading = loadingCounties || loadingComuni;

  // Build navigation items
  const navItems: { name: string; slug: string; href: string; isCurrent?: boolean }[] = [];

  if (showUSStates) {
    COUNTRIES["united-states"].states.forEach(state => {
      navItems.push({
        name: state.name,
        slug: state.slug,
        href: `/${country}/${state.slug}`
      });
    });
  } else if (showUSCounties) {
    (usCounties || []).forEach((c: { name: string; slug: string }) => {
      navItems.push({
        name: c.name,
        slug: c.slug,
        href: `/${country}/${region}/${c.slug}`,
        isCurrent: province === c.slug
      });
    });
  } else if (showITRegions) {
    COUNTRIES["italy"].regions.forEach(r => {
      navItems.push({
        name: r.name,
        slug: r.slug,
        href: `/${country}/${r.slug}`
      });
    });
  } else if (showITComuni) {
    (itComuni || []).forEach((c: { name: string; slug: string }) => {
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
    if (showUSStates) return "Explore States";
    if (showUSCounties && province) return "Other Counties in This State";
    if (showUSCounties) return "Explore Counties";
    if (showITRegions) return "Explore Regions";
    if (showITComuni && province) return "Other Comuni in This Region";
    if (showITComuni) return "Explore Comuni";
    return "Explore Areas";
  };

  if (!isUSA && !isItaly) return null;
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

      {!isLoading && navItems.length === 0 && (showUSCounties || showITComuni) && (
        <p className="text-sm text-muted-foreground italic">
          No {isItaly ? "comuni" : "counties"} available yet. Check back soon!
        </p>
      )}
    </section>
  );
};

export default SubdivisionNav;
