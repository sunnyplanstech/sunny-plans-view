import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

interface ListingsBreadcrumbProps {
  country?: string;
  region?: string;
  province?: string;
  municipality?: string;
}

const ListingsBreadcrumb = ({ country, region, province, municipality }: ListingsBreadcrumbProps) => {
  const formatName = (name: string) => {
    // Handle special cases like "united-states" -> "United States"
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const items = [
    { label: "Home", href: "/", icon: Home },
    country && { label: formatName(country), href: `/${country}` },
    region && { label: formatName(region), href: `/${country}/${region.toLowerCase()}` },
    province && { label: formatName(province), href: `/${country}/${region?.toLowerCase()}/${province.toLowerCase()}` },
    municipality && { label: formatName(municipality), href: null }, // Current page, no link
  ].filter(Boolean) as Array<{ label: string; href: string | null; icon?: typeof Home }>;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => (
          <BreadcrumbItem key={item.label}>
            {index > 0 && <BreadcrumbSeparator />}
            {item.href ? (
              <BreadcrumbLink asChild>
                <Link to={item.href} className="flex items-center gap-1">
                  {item.icon && <item.icon className="h-3 w-3" />}
                  {item.label}
                </Link>
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage>{item.label}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default ListingsBreadcrumb;
