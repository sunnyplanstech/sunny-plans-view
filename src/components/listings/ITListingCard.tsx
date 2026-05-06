import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Zap, Ruler, Sun, ArrowRight, Trophy } from "lucide-react";
import type { ITListing } from "@/countries/italy";
import MiniParcelMap from "@/components/maps/MiniParcelMap";
import { cn } from "@/lib/utils";
import { formatHectares, formatSubstationDistanceMetric } from "@/lib/format";

interface ITListingCardProps {
  listing: ITListing;
  showRank?: "global" | "region" | "comune";
  /** 1-based position in the list, used as rank for region level (no rank_in_region in DB) */
  listPosition?: number;
  // When provided, the whole card becomes a click target and the
  // footer "View Details" button is hidden — used by the layer-first
  // preview to open the EvaluateDrawer instead of routing to the URL
  // detail page.
  onSelect?: (listing: ITListing) => void;
}

function getSolarScoreColor(prob: number | null) {
  if (!prob) return "bg-secondary text-secondary-foreground";
  const percentage = prob * 100;
  if (percentage >= 80) return "bg-primary text-primary-foreground";
  if (percentage >= 60) return "bg-primary/80 text-primary-foreground";
  return "bg-secondary text-secondary-foreground";
}

function formatRegionSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getRankBadge(listing: ITListing, showRank: "global" | "region" | "comune", listPosition?: number) {
  let rank: number | null = null;
  let label = "";

  switch (showRank) {
    case "global":
      rank = listing.rank_global;
      label = "IT";
      break;
    case "region":
      rank = listPosition ?? null;
      label = formatRegionSlug(listing.region_slug);
      break;
    case "comune":
      rank = listing.rank_in_comune;
      label = listing.comune_name;
      break;
  }

  if (!rank) return null;

  return (
    <Badge variant="outline" className="bg-amber-50 border-amber-300 text-amber-700 text-xs">
      <Trophy className="w-3 h-3 mr-1" />
      #{rank} in {label}
    </Badge>
  );
}

const ITListingCard = ({
  listing,
  showRank = "global",
  listPosition,
  onSelect,
}: ITListingCardProps) => {
  const interactive = !!onSelect;
  if (interactive) {
    return <ITListingTerminalRow listing={listing} onSelect={onSelect!} />;
  }

  const listingUrl = `/listing/${listing.id}`;
  const solarPercentage = listing.prob_solar ? Math.round(listing.prob_solar * 100) : null;

  return (
    <Card
      className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/60 bg-card"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Map section */}
        <div className="relative w-full sm:w-40 h-32 sm:h-auto sm:min-h-[180px] flex-shrink-0 overflow-hidden">
          <MiniParcelMap
            geomJson={listing.geom_json}
            locationAccuracyM={listing.location_accuracy_m}
            className="w-full h-full"
          />

          {/* Score badge */}
          <div className="absolute top-2 left-2">
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-sm shadow-md",
              getSolarScoreColor(listing.prob_solar)
            )}>
              <Sun className="w-3.5 h-3.5" />
              {solarPercentage !== null ? `${solarPercentage}%` : "N/A"}
            </div>
          </div>
        </div>

        {/* Content section */}
        <div className="flex-1 flex flex-col min-w-0">
          <CardContent className="p-4 flex-1 space-y-3">
            {/* Header with location and badges */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {listing.comune_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {formatRegionSlug(listing.region_slug)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 flex-shrink-0">
                {getRankBadge(listing, showRank, listPosition)}
              </div>
            </div>

            {/* Solar score bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Solar Probability</span>
                <span className="font-medium">{solarPercentage !== null ? `${solarPercentage}%` : "N/A"}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all"
                  style={{ width: `${solarPercentage || 0}%` }}
                />
              </div>
            </div>

            {/* Specs - horizontal layout */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5" />
                <span className="font-medium text-foreground">
                  ~{formatHectares(listing.area_ha)}
                </span>
                <span>ha</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>~{formatSubstationDistanceMetric(listing.power_substation)} to substation</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-4 pt-0 flex items-center gap-3">
            <Button asChild className="flex-1 group/btn">
              <Link to={listingUrl} className="flex items-center justify-center gap-2">
                View Details
                <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
              </Link>
            </Button>
          </CardFooter>
        </div>
      </div>
    </Card>
  );
};

// Terminal-style row used inside the layer-first preview.
function ITListingTerminalRow({
  listing,
  onSelect,
}: {
  listing: ITListing;
  onSelect: (listing: ITListing) => void;
}) {
  const solarPercentage = listing.prob_solar ? Math.round(listing.prob_solar * 100) : null;
  const handleSelect = () => onSelect(listing);
  const handleKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSelect();
    }
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={handleKey}
      className="group cursor-pointer overflow-hidden border-border/60 bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="grid grid-cols-[120px_1fr] gap-3 p-3">
        <div className="relative h-[120px] overflow-hidden rounded-md border border-border/60">
          <MiniParcelMap
            geomJson={listing.geom_json}
            locationAccuracyM={listing.location_accuracy_m}
            className="w-full h-full"
          />
          <div
            className={cn(
              "absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold shadow-md",
              getSolarScoreColor(listing.prob_solar),
            )}
          >
            <Sun className="h-3 w-3" />
            {solarPercentage !== null ? `${solarPercentage}%` : "N/A"}
          </div>
        </div>

        <div className="min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[14px] font-semibold text-foreground leading-tight truncate">
              {listing.comune_name}
            </h3>
            <span className="tp-mono text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap truncate max-w-[120px]">
              {formatRegionSlug(listing.region_slug)}
            </span>
          </div>

          <div className="mt-2">
            <div className="flex items-baseline justify-between text-xs">
              <span className="tp-eyebrow">SunnyScore</span>
              <span className="tp-mono tabular-nums font-medium text-foreground">
                {solarPercentage !== null ? `${solarPercentage}/100` : "—"}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all"
                style={{ width: `${solarPercentage || 0}%` }}
              />
            </div>
          </div>

          <dl className="mt-2 grid grid-cols-2 gap-x-3 text-[12px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Ruler className="w-3 h-3" />
              <dt className="sr-only">Hectares</dt>
              <dd className="tp-mono tabular-nums text-foreground font-medium">
                ~{formatHectares(listing.area_ha)}
              </dd>
              <span className="text-[10px]">ha</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3" />
              <dt className="sr-only">Distance to substation</dt>
              <dd className="tp-mono tabular-nums text-foreground font-medium">
                ~{formatSubstationDistanceMetric(listing.power_substation)}
              </dd>
              <span className="text-[10px]">to sub</span>
            </div>
          </dl>

          <div className="mt-auto pt-2 flex items-center justify-between">
            <span className="tp-mono text-[10px] text-muted-foreground/70 truncate">
              {listing.id.slice(0, 8)}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground transition-colors group-hover:text-primary">
              Valuta <ArrowRight className="inline h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default ITListingCard;
