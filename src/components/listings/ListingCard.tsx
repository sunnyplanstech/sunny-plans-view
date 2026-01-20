import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, MapPin, Zap, Mountain, Ruler } from "lucide-react";
import SunnyScoreBar from "./SunnyScoreBar";
import SampleReportModal from "./SampleReportModal";
import { Listing } from "@/data/mockListings";
import { cn } from "@/lib/utils";
interface ListingCardProps {
  listing: Listing;
  isUnlocked?: boolean;
}

const ListingCard = ({ listing, isUnlocked = false }: ListingCardProps) => {
  const sizeUnit = listing.country === "italy" ? "Hectares" : "Acres";

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50">
      {/* Image with blur overlay for freemium */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={listing.imageUrl}
          alt={`Land parcel in ${listing.province}`}
          className={cn(
            "w-full h-full object-cover transition-transform duration-300 group-hover:scale-105",
            !isUnlocked && "blur-md"
          )}
        />
        
        {/* Privacy overlay */}
        {!isUnlocked && (
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex items-center justify-center">
            <div className="text-center p-4">
              <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Subscribe to view</p>
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <Badge 
            variant="default" 
            className={cn(
              "font-bold",
              listing.sunnyScore >= 90 ? "bg-primary" : 
              listing.sunnyScore >= 80 ? "bg-primary/80" : "bg-secondary"
            )}
          >
            {listing.sunnyScore}/100
          </Badge>
          <Badge variant="secondary">{listing.landType}</Badge>
          {listing.isOffMarket && (
            <Badge variant="outline" className="bg-background/80 border-primary text-primary">
              Off-Market
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Location */}
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-foreground">
              {listing.province}, {listing.region}
            </p>
            {listing.municipality && (
              <p className="text-sm text-muted-foreground">{listing.municipality}</p>
            )}
          </div>
        </div>

        {/* SunnyScore mini bar */}
        <SunnyScoreBar score={listing.sunnyScore} breakdown={listing.scoreBreakdown} compact />

        {/* Specs grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-muted-foreground" />
            <span>{listing.size} {sizeUnit}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mountain className="w-4 h-4 text-muted-foreground" />
            <span>
              {listing.terrain === "flat" ? "Flat" : listing.terrain === "moderate" ? "Moderate" : "Hilly"} 
              ({listing.slopePercentage}% slope)
            </span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <Zap className="w-4 h-4 text-muted-foreground" />
            <span className="truncate">
              {listing.distanceToSubstation} to{" "}
              <span className={cn(!isUnlocked && "blur-sm select-none")}>
                {isUnlocked ? listing.substationName : "████████████"}
              </span>
            </span>
          </div>
        </div>

        {/* Blurred coordinates hint */}
        {!isUnlocked && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="w-3 h-3" />
            <span className="blur-sm select-none">42.4186, 11.8678</span>
            <span className="text-xs">(Coordinates hidden)</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        <Button asChild className="w-full">
          <Link to={`/listings/${listing.id}`}>
            {isUnlocked ? "View Details" : "Unlock Parcel Details"}
          </Link>
        </Button>
        {!isUnlocked && (
          <SampleReportModal>
            <button className="text-sm text-primary hover:underline w-full text-center py-1">
              See a Sample Report
            </button>
          </SampleReportModal>
        )}
      </CardFooter>
    </Card>
  );
};

export default ListingCard;
