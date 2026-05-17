import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Zap, Ruler, ArrowRight, Trophy } from "lucide-react";
import type { ITListing } from "@/countries/italy";
import type { Layer } from "@/components/layers/registry";
import { cn } from "@/lib/utils";
import { formatHectares, formatSubstationDistanceMetric } from "@/lib/format";
import { SunnyScoreExplanation } from "@/components/listings/sunnyscore";
import { ConstraintBadges } from "@/components/listings/ConstraintBadges";

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
  // Active constraint filters from the map page. Drives the per-card
  // pass/fail badge row. Empty/undefined → no badge row.
  selectedLayers?: ReadonlyArray<Layer>;
}

function formatRegionSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getRankBadge(
  listing: ITListing,
  showRank: "global" | "region" | "comune",
  listPosition?: number,
) {
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
  selectedLayers,
}: ITListingCardProps) => {
  const interactive = !!onSelect;
  if (interactive) {
    return (
      <ITListingTerminalRow
        listing={listing}
        onSelect={onSelect!}
        selectedLayers={selectedLayers}
      />
    );
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
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/60 bg-card">
      <CardContent className="p-4 space-y-3">
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

        {selectedLayers && selectedLayers.length > 0 && (
          <ConstraintBadges listing={listing} selectedLayers={selectedLayers} />
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center gap-3">
        <Button asChild className="flex-1 group/btn">
          <Link to={listingUrl} className="flex items-center justify-center gap-2">
            View Details
            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

// Preview-rail row. Mirror of USListingTerminalRow — comune as title,
// region folded into the spec line, score anchors the left edge.
function ITListingTerminalRow({
  listing,
  onSelect,
  selectedLayers,
}: {
  listing: ITListing;
  onSelect: (listing: ITListing) => void;
  selectedLayers?: ReadonlyArray<Layer>;
}) {
  const score = listing.prob_solar !== null ? Math.round(listing.prob_solar * 100) : null;
  const handleSelect = () => onSelect(listing);
  const handleKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSelect();
    }
  };

  const hasBadges = selectedLayers && selectedLayers.some((l) => l.chip);

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={handleKey}
      className="group cursor-pointer overflow-hidden border-border/60 bg-card transition-colors hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex gap-3 p-3">
        <ScoreBlock value={score} />

        <div className="min-w-0 flex-1 flex flex-col gap-1">
          <h3 className="text-sm font-semibold leading-tight text-foreground truncate">
            {listing.comune_name}
          </h3>

          <p className="text-xs tabular-nums text-foreground/85">
            <span className="font-medium">~{formatHectares(listing.area_ha)} ha</span>
            <span className="text-muted-foreground/60"> · </span>
            <span className="text-muted-foreground truncate">
              {formatRegionSlug(listing.region_slug)}
            </span>
          </p>

          <p className="text-[11px] tabular-nums text-muted-foreground">
            ~{formatSubstationDistanceMetric(listing.power_substation)} to substation
          </p>

          {hasBadges && (
            <ConstraintBadges
              listing={listing}
              selectedLayers={selectedLayers!}
              className="mt-0.5"
            />
          )}
        </div>
      </div>
    </Card>
  );
}

function ScoreBlock({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <div className="flex h-[60px] w-[60px] flex-shrink-0 flex-col items-center justify-center rounded-md border border-border/60 bg-muted/30 text-muted-foreground/50">
        <span className="text-2xl font-semibold leading-none tabular-nums">—</span>
        <span className="mt-0.5 text-[9px] uppercase tracking-wide">score</span>
      </div>
    );
  }
  const tone =
    value >= 70
      ? "bg-primary/10 border-primary/40 text-primary"
      : value >= 50
      ? "bg-muted/40 border-border/60 text-foreground"
      : "bg-muted/30 border-border/60 text-muted-foreground";
  return (
    <div
      className={cn(
        "flex h-[60px] w-[60px] flex-shrink-0 flex-col items-center justify-center rounded-md border",
        tone,
      )}
    >
      <span className="text-2xl font-semibold leading-none tabular-nums">{value}</span>
      <span className="mt-0.5 text-[9px] uppercase tracking-wide opacity-70">score</span>
    </div>
  );
}

export default ITListingCard;
