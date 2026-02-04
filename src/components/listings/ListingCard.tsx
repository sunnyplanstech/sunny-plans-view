import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, MapPin, Zap, Mountain, Ruler, Sun, ArrowRight } from "lucide-react";
import SunnyScoreBar from "./SunnyScoreBar";
import SampleReportModal from "./SampleReportModal";
import { Listing } from "@/data/mockListings";
import { cn } from "@/lib/utils";

interface ListingCardProps {
  listing: Listing;
  isUnlocked?: boolean;
}

const ListingCard = ({ listing, isUnlocked = false }: ListingCardProps) => {
  const sizeUnit = listing.country === "italy" ? "ha" : "ac";

  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-primary text-primary-foreground";
    if (score >= 80) return "bg-primary/80 text-primary-foreground";
    return "bg-secondary text-secondary-foreground";
  };

  // Build the listing detail URL based on the new structure
  const countrySlug = listing.country === "italy" ? "italy" : "united-states";
  const regionSlug = listing.region.toLowerCase().replace(/\s+/g, '-');
  const provinceSlug = listing.province.toLowerCase().replace(/\s+/g, '-');
  const municipalitySlug = listing.municipality?.toLowerCase().replace(/\s+/g, '-');
  
  const listingUrl = municipalitySlug
    ? `/${countrySlug}/${regionSlug}/${provinceSlug}/${municipalitySlug}/listing/${listing.id}`
    : `/${countrySlug}/${regionSlug}/${provinceSlug}/listing/${listing.id}`;

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/60 bg-card">
      <div className="flex flex-col sm:flex-row">
        {/* Image section */}
        <div className="relative w-full sm:w-40 h-32 sm:h-auto sm:min-h-[180px] flex-shrink-0 overflow-hidden">
          <img
            src={listing.imageUrl}
            alt={`Land parcel in ${listing.province}`}
            loading="lazy"
            decoding="async"
            className={cn(
              "w-full h-full object-cover transition-transform duration-500 group-hover:scale-110",
              !isUnlocked && "blur-md scale-105"
            )}
          />
          
          {/* Privacy overlay */}
          {!isUnlocked && (
            <div className="absolute inset-0 bg-gradient-to-br from-background/60 via-background/40 to-transparent flex items-center justify-center">
              <div className="text-center">
                <Lock className="w-6 h-6 mx-auto mb-1 text-muted-foreground/80" />
                <p className="text-xs text-muted-foreground font-medium">Subscribe to view</p>
              </div>
            </div>
          )}

          {/* Score badge - positioned on image */}
          <div className="absolute top-2 left-2">
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-sm shadow-md",
              getScoreColor(listing.sunnyScore)
            )}>
              <Sun className="w-3.5 h-3.5" />
              {listing.sunnyScore}
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
                    {listing.province}, {listing.region}
                  </h3>
                  {listing.municipality && (
                    <p className="text-sm text-muted-foreground truncate">{listing.municipality}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 flex-shrink-0">
                <Badge variant="secondary" className="text-xs font-medium">
                  {listing.landType}
                </Badge>
                {listing.isOffMarket && (
                  <Badge variant="outline" className="text-xs border-primary/50 text-primary bg-primary/5">
                    Off-Market
                  </Badge>
                )}
              </div>
            </div>

            {/* SunnyScore mini bar */}
            <SunnyScoreBar score={listing.sunnyScore} breakdown={listing.scoreBreakdown} compact />

            {/* Specs - horizontal layout */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5" />
                <span className="font-medium text-foreground">{listing.size}</span>
                <span>{sizeUnit}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mountain className="w-3.5 h-3.5" />
                <span className="capitalize">{listing.terrain}</span>
                <span className="text-xs">({listing.slopePercentage}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>{listing.distanceToSubstation}</span>
                <span className={cn(
                  "text-xs",
                  !isUnlocked && "blur-sm select-none"
                )}>
                  {isUnlocked ? `to ${listing.substationName}` : "to ████████"}
                </span>
              </div>
            </div>

            {/* Blurred coordinates hint */}
            {!isUnlocked && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 pt-1">
                <Lock className="w-3 h-3" />
                <span className="blur-sm select-none font-mono">42.4186, 11.8678</span>
                <span>· Coordinates hidden</span>
              </div>
            )}
          </CardContent>

          <CardFooter className="p-4 pt-0 flex items-center gap-3">
            <Button asChild className="flex-1 group/btn">
              <Link to={listingUrl} className="flex items-center justify-center gap-2">
                {isUnlocked ? "View Details" : "Unlock Details"}
                <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
              </Link>
            </Button>
            {!isUnlocked && (
              <SampleReportModal>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/5">
                  Sample Report
                </Button>
              </SampleReportModal>
            )}
          </CardFooter>
        </div>
      </div>
    </Card>
  );
};

export default ListingCard;
