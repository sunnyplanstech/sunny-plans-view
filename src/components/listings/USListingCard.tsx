import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Zap, Ruler, Sun, ArrowRight, Trophy } from "lucide-react";
import type { USListing } from "@/countries/unitedStates";
import MiniParcelMap from "@/components/maps/MiniParcelMap";
import { cn } from "@/lib/utils";
import { formatPrice, formatAcres, formatSubstationDistance } from "@/lib/format";
import { SunnyScoreExplanation } from "@/components/listings/sunnyscore";

// Miles-only distance for the dense preview row. The verbose
// "1291 m (0.8 mi)" form stays on the production-mode card and the
// detail page where horizontal space allows it.
function formatSubstationMiles(meters: number | null): string {
  if (!meters) return "N/A";
  const miles = meters * 0.000621371;
  if (miles < 0.1) return `${Math.round(meters)} m`;
  return `${miles.toFixed(1)} mi`;
}

interface USListingCardProps {
  listing: USListing;
  showRank?: "global" | "state" | "county";
  // When provided, the whole card becomes a click target and the
  // footer "View Details" button is hidden — used by the layer-first
  // preview to open the EvaluateDrawer instead of routing to the URL
  // detail page. When absent (production listings page), the card
  // renders the standard "View Details" link to /listing/:id.
  onSelect?: (listing: USListing) => void;
}

function getSolarScoreColor(prob: number | null) {
  if (!prob) return "bg-secondary text-secondary-foreground";
  const percentage = prob * 100;
  if (percentage >= 80) return "bg-primary text-primary-foreground";
  if (percentage >= 60) return "bg-primary/80 text-primary-foreground";
  return "bg-secondary text-secondary-foreground";
}

function getRankBadge(listing: USListing, showRank: "global" | "state" | "county") {
  let rank: number | null = null;
  let label = "";

  switch (showRank) {
    case "global":
      rank = listing.rank_global;
      label = "US";
      break;
    case "state":
      rank = listing.rank_in_state;
      label = listing.state_code;
      break;
    case "county":
      rank = listing.rank_in_county;
      label = listing.county;
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

const USListingCard = ({ listing, showRank = "global", onSelect }: USListingCardProps) => {
  const interactive = !!onSelect;
  if (interactive) {
    return <USListingTerminalRow listing={listing} onSelect={onSelect!} />;
  }

  const listingUrl = `/listing/${listing.id}`;
  // Prefer the int score (round(prob_solar × 100)); fall back to a
  // computed % from prob_solar so cards still render before the
  // pipeline rematerializes the new column.
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
            locationAccuracyM={listing.location_accuracy_m}
            className="w-full h-full"
          />

          {/* Score badge - positioned on map */}
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
                    {listing.county}, {listing.state_code}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    ~{formatPrice(listing.list_price)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 flex-shrink-0">
                {getRankBadge(listing, showRank)}
              </div>
            </div>

            {/* SunnyScore explanation — score header + top diverging
                driver bars. Falls back to a simple bar if the pipeline
                hasn't populated score+contributions yet. */}
            {hasExplanation ? (
              <SunnyScoreExplanation
                payload={{
                  score: listing.score!,
                  contributions: listing.contributions!,
                }}
                size="sm"
                maxDrivers={4}
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
                  ~{formatAcres(listing.lot_acres)}
                </span>
                <span>acres</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>~{formatSubstationDistance(listing.power_substation)} to substation</span>
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

// Preview-rail row. The whole card is the click target → opens
// EvaluateDrawer; production listings page never sets `onSelect` and
// keeps the original card. First-principles surface area: location,
// SunnyScore (sort key), size + price, grid distance. No icons, no
// secondary affordances, no per-card duplicates of the on-map score.
function USListingTerminalRow({
  listing,
  onSelect,
}: {
  listing: USListing;
  onSelect: (listing: USListing) => void;
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
            locationAccuracyM={listing.location_accuracy_m}
            className="w-full h-full"
          />
        </div>

        <div className="min-w-0 flex-1 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-semibold leading-tight text-foreground truncate">
              {listing.county}, {listing.state_code}
            </h3>
            <ScoreReadout value={score} />
          </div>

          <p className="text-xs tabular-nums text-foreground/85">
            <span className="font-medium">~{formatAcres(listing.lot_acres)} ac</span>
            {listing.list_price !== null && listing.list_price !== undefined ? (
              <>
                <span className="text-muted-foreground/60"> · </span>
                <span className="text-muted-foreground">~{formatPrice(listing.list_price)}</span>
              </>
            ) : null}
          </p>

          <p className="text-[11px] tabular-nums text-muted-foreground">
            ~{formatSubstationMiles(listing.power_substation)} to substation
          </p>
        </div>
      </div>
    </Card>
  );
}

// Score is the strongest cross-card signal (default sort key). Big,
// tabular, color-graded against the brand primary so the eye can run
// down the rail and rank parcels without parsing labels.
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

export default USListingCard;
