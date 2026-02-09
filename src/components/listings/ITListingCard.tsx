import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Sun, ArrowRight, Trophy, FileText } from "lucide-react";
import { ITListing } from "@/hooks/useITListings";
import MiniParcelMap from "@/components/maps/MiniParcelMap";
import { cn } from "@/lib/utils";

interface ITListingCardProps {
  listing: ITListing;
  showRank?: "global" | "region" | "comune";
}

function getSolarScoreColor(prob: number | null) {
  if (!prob) return "bg-secondary text-secondary-foreground";
  const percentage = prob * 100;
  if (percentage >= 80) return "bg-primary text-primary-foreground";
  if (percentage >= 60) return "bg-primary/80 text-primary-foreground";
  return "bg-secondary text-secondary-foreground";
}

function getRankBadge(listing: ITListing, showRank: "global" | "region" | "comune") {
  let rank: number | null = null;
  let label = "";

  switch (showRank) {
    case "global":
      rank = listing.rank_global;
      label = "IT";
      break;
    case "region":
      rank = listing.rank_global;
      label = listing.region_slug;
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

function getParcelCenter(geomJson: string | object | null): { lat: number; lng: number } | null {
  if (!geomJson) return null;
  try {
    const geom = typeof geomJson === "string" ? JSON.parse(geomJson) : geomJson;
    const coords = geom.type === "MultiPolygon"
      ? geom.coordinates[0][0]
      : geom.type === "Polygon"
      ? geom.coordinates[0]
      : null;
    if (!coords || coords.length === 0) return null;
    const sumLat = coords.reduce((s: number, c: number[]) => s + c[1], 0);
    const sumLng = coords.reduce((s: number, c: number[]) => s + c[0], 0);
    return { lat: sumLat / coords.length, lng: sumLng / coords.length };
  } catch {
    return null;
  }
}

const ITListingCard = ({ listing, showRank = "global" }: ITListingCardProps) => {
  const listingUrl = `/italy/${listing.region_slug}/${listing.comune_slug}/listing/${listing.gml_id}`;
  const solarPercentage = listing.prob_solar ? Math.round(listing.prob_solar * 100) : null;
  const center = getParcelCenter(listing.geom_json);

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/60 bg-card">
      <div className="flex flex-col sm:flex-row">
        {/* Map section */}
        <div className="relative w-full sm:w-40 h-32 sm:h-auto sm:min-h-[180px] flex-shrink-0 overflow-hidden">
          <MiniParcelMap
            latitude={center?.lat ?? null}
            longitude={center?.lng ?? null}
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
                    Foglio {listing.foglio || "N/A"}, Particella {listing.particella || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 flex-shrink-0">
                {getRankBadge(listing, showRank)}
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

            {/* Specs */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Foglio {listing.foglio || "N/A"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs">Particella {listing.particella || "N/A"}</span>
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

export default ITListingCard;
