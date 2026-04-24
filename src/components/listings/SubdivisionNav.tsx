import { Link } from "react-router-dom";
import { ChevronRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { COUNTRIES, slugToStateCode } from "@/data/locations";
import countiesByState from "@/data/counties.json";
import comuniByRegion from "@/data/comuni.json";

interface SubdivisionNavProps {
  country?: string;
  region?: string;
  province?: string;
}

interface SubItem {
  slug: string;
  name: string;
}

const counties = countiesByState as Record<string, SubItem[]>;
const comuni = comuniByRegion as Record<string, SubItem[]>;

const SubdivisionNav = ({ country, region, province }: SubdivisionNavProps) => {
  const isUSA = country === "united-states";
  const isItaly = country === "italy";

  // US navigation logic
  const showUSStates = isUSA && !region;
  const showUSCounties = isUSA && !!region;

  // Italy navigation logic
  const showITRegions = isItaly && !region;
  const showITComuni = isItaly && !!region;

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
  } else if (showUSCounties && region) {
    const stateCode = slugToStateCode(region);
    (counties[stateCode] ?? []).forEach((c) => {
      navItems.push({
        name: c.name,
        slug: c.slug,
        href: `/${country}/${region}/${c.slug}`,
        isCurrent: province === c.slug,
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
  } else if (showITComuni && region) {
    (comuni[region] ?? []).forEach((c) => {
      navItems.push({
        name: c.name,
        slug: c.slug,
        href: `/${country}/${region}/${c.slug}`,
        isCurrent: province === c.slug,
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
  if (navItems.length === 0) return null;

  return (
    <section className="mt-8 pt-6 border-t border-border">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">{getSectionTitle()}</h2>
      </div>

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
    </section>
  );
};

export default SubdivisionNav;
