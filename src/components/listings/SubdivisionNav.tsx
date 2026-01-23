import { Link } from "react-router-dom";
import { ChevronRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  useUSCounties, 
  useItalianProvinces, 
  useItalianComuni,
  type USCounty,
  type ItalianProvince,
  type ItalianComune
} from "@/hooks/useLocationData";
import { COUNTRIES } from "@/data/locations";

interface SubdivisionNavProps {
  country?: string;
  region?: string;
  province?: string;
}

const SubdivisionNav = ({ country, region, province }: SubdivisionNavProps) => {
  const isUSA = country === "united-states";
  const isItaly = country === "italy";

  // Fetch subdivisions based on current level
  const { data: usCounties, isLoading: loadingCounties } = useUSCounties(isUSA ? region : undefined);
  const { data: italianProvinces, isLoading: loadingProvinces } = useItalianProvinces(isItaly && !province ? region : undefined);
  const { data: italianComuni, isLoading: loadingComuni } = useItalianComuni(isItaly && province ? province : undefined);

  // Show states/regions if at country level
  const showStates = isUSA && !region;
  const showRegions = isItaly && !region;
  
  // Show counties/provinces if at state/region level
  const showCounties = isUSA && region && !province;
  const showProvinces = isItaly && region && !province;
  
  // Show comuni if at province level (Italy only)
  const showComuni = isItaly && province;

  // Get data to display
  const states = showStates ? COUNTRIES["united-states"].states : [];
  const regions = showRegions ? COUNTRIES["italy"].regions : [];
  const counties = showCounties ? (usCounties || []) : [];
  const provinces = showProvinces ? (italianProvinces || []) : [];
  const comuni = showComuni ? (italianComuni || []) : [];

  const isLoading = loadingCounties || loadingProvinces || loadingComuni;

  // Build navigation items
  const navItems: { name: string; slug: string; href: string }[] = [];

  if (showStates) {
    states.forEach(state => {
      navItems.push({
        name: state.name,
        slug: state.slug,
        href: `/${country}/${state.slug}`
      });
    });
  } else if (showRegions) {
    regions.forEach(r => {
      navItems.push({
        name: r.name,
        slug: r.slug,
        href: `/${country}/${r.slug}`
      });
    });
  } else if (showCounties) {
    counties.forEach((c: USCounty) => {
      navItems.push({
        name: c.name,
        slug: c.slug,
        href: `/${country}/${region}/${c.slug}`
      });
    });
  } else if (showProvinces) {
    provinces.forEach((p: ItalianProvince) => {
      navItems.push({
        name: p.name,
        slug: p.slug,
        href: `/${country}/${region}/${p.slug}`
      });
    });
  } else if (showComuni) {
    comuni.forEach((c: ItalianComune) => {
      navItems.push({
        name: c.name,
        slug: c.slug,
        href: `/${country}/${region}/${province}/${c.slug}`
      });
    });
  }

  // Determine section title
  const getSectionTitle = () => {
    if (showStates) return "Explore States";
    if (showRegions) return "Explore Regions";
    if (showCounties) return "Explore Counties";
    if (showProvinces) return "Explore Provinces";
    if (showComuni) return "Explore Comuni";
    return "Explore Areas";
  };

  // Don't render if no items
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
                "bg-muted/50 hover:bg-muted transition-colors",
                "text-sm text-foreground hover:text-primary",
                "group"
              )}
            >
              <span className="truncate">{item.name}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {!isLoading && navItems.length === 0 && (showCounties || showProvinces || showComuni) && (
        <p className="text-sm text-muted-foreground italic">
          No subdivisions available yet. Check back soon!
        </p>
      )}
    </section>
  );
};

export default SubdivisionNav;
