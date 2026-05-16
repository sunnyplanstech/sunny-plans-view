import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Zap, Ruler, Sun, ArrowRight, Trophy } from "lucide-react";
import type { ITListing } from "@/countries/italy";
import MiniParcelMap from "@/components/maps/MiniParcelMap";
import { cn } from "@/lib/utils";
import { formatHectares, formatSubstationDistanceMetric } from "@/lib/format";
import { SunnyScoreExplanation } from "@/components/listings/sunnyscore";

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
  const scoreInt =
    listing.score ??
    (listing.prob_solar !== null ? Math.round(listing.prob_solar * 100) : null);
  const hasExplanation =
    listing.score != null &&
    listing.contributions != null &&
    Object.keys(listing.contributions).length > 0;

  return (
    <Card
      className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/60 bg-card"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Map section */}
        <div className="relative w-full sm:w-40 h-32 sm:h-auto sm:min-h-[180px] flex-shrink-0 overflow-hidden">
          <MiniParcelMap
            geomJson={listing.geom_json}
            locked
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
              {scoreInt !== null ? scoreInt : "N/A"}
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

            {/* SunnyScore explanation — see USListingCard for the same
                pattern. Falls back to a single bar when the pipeline
                hasn't populated score+contributions yet. */}
            {hasExplanation ? (
              <SunnyScoreExplanation
                payload={{
                  score: listing.score!,
                  contributions: listing.contributions!,
                }}
                size="sm"
                maxRowsPerSide={2}
                expandableHint
              />
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Solar Probability</span>
                  <span className="font-medium">
                    {scoreInt !== null ? `${scoreInt}%` : "N/A"}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all"
                    style={{ width: `${scoreInt || 0}%` }}
                  />
                </div>
              </div>
            )}

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

// Preview-rail row. Symmetric with USListingTerminalRow — comune as
// title, region folded into the spec line, score anchored top-right.
function ITListingTerminalRow({
  listing,
  onSelect,
}: {
  listing: ITListing;
  onSelect: (listing: ITListing) => void;
}) {
  const score = listing.prob_solar !== null ? Math.round(listing.prob_solar * 100) : null;
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
      className="group cursor-pointer overflow-hidden border-border/60 bg-card transition-colors hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex gap-3 p-3">
        <div className="h-[88px] w-[88px] flex-shrink-0 overflow-hidden rounded-md border border-border/60 bg-muted/30">
          <MiniParcelMap
            geomJson={listing.geom_json}
            locked
            locationAccuracyM={listing.location_accuracy_m}
            className="w-full h-full"
          />
        </div>

        <div className="min-w-0 flex-1 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-semibold leading-tight text-foreground truncate">
              {listing.comune_name}
            </h3>
            <ScoreReadout value={score} />
          </div>

          <p className="text-xs tabular-nums text-foreground/85">
            <span className="font-medium">~{formatHectares(listing.area_ha)} ha</span>
            <span className="text-muted-foreground/60"> · </span>
            <span className="text-muted-foreground truncate">{formatRegionSlug(listing.region_slug)}</span>
          </p>

          <p className="text-[11px] tabular-nums text-muted-foreground">
            ~{formatSubstationDistanceMetric(listing.power_substation)} to substation
          </p>
        </div>
      </div>
    </Card>
  );
}

// Score is the strongest cross-card signal (default sort key). Big,
// tabular, color-graded so the eye can rank parcels without parsing.
function ScoreReadout({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span className="text-lg font-semibold leading-none tabular-nums text-muted-foreground/50">
        —
      </span>
    );
  }
  const tone =
    value >= 70 ? "text-primary" : value >= 50 ? "text-foreground" : "text-muted-foreground";
  return (
    <span className={cn("text-lg font-semibold leading-none tabular-nums", tone)}>
      {value}
    </span>
  );
}

export default ITListingCard;
