import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Lock, MapPin, Zap, Mountain, Ruler, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import SunnyScoreBar from "@/components/listings/SunnyScoreBar";
import ListingsBreadcrumb from "@/components/listings/ListingsBreadcrumb";
import ListingCard from "@/components/listings/ListingCard";
import ListingsFooter from "@/components/listings/ListingsFooter";
import SampleReportModal from "@/components/listings/SampleReportModal";
import SEOHead from "@/components/listings/SEOHead";
import { getListingById, getNearbyListings, seoKeywords } from "@/data/mockListings";

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const isUnlocked = false; // This would come from subscription state

  const listing = useMemo(() => getListingById(id || ""), [id]);
  const nearbyListings = useMemo(() => getNearbyListings(id || ""), [id]);

  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Listing Not Found</h1>
          <p className="text-muted-foreground mb-4">The listing you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/listings">Browse All Listings</Link>
          </Button>
        </div>
      </div>
    );
  }

  const sizeUnit = listing.country === "italy" ? "Hectares" : "Acres";

  // SEO data with homepage keywords
  const seoTitle = `${listing.size} ${sizeUnit} Substation-Ready Land for BESS & Solar - ${listing.municipality || listing.province}, ${listing.region} | Sunnyplans`;
  const seoDescription = `${listing.size} ${sizeUnit.toLowerCase()} ${listing.landType} land in ${listing.province}, ${listing.region}. ${listing.distanceToSubstation} from substation. Pre-vetted for BESS & solar projects with SunnyScore™ ${listing.sunnyScore}/100.`;
  
  // Combine homepage keywords with location-specific keywords
  const combinedKeywords = [
    ...seoKeywords.primary.slice(0, 3),
    listing.region,
    listing.province,
    listing.landType,
    "pre-vetted parcels",
    "grid connection",
    listing.country === "italy" ? "Italy solar land" : "USA solar land",
  ].join(", ");
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": `Substation-Ready ${listing.landType} Land for BESS & Solar in ${listing.province}, ${listing.region}`,
    "description": seoDescription,
    "image": listing.imageUrl,
    "offers": {
      "@type": "Offer",
      "priceCurrency": listing.country === "italy" ? "EUR" : "USD",
      "availability": "https://schema.org/InStock"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "addressCountry": listing.country === "italy" ? "IT" : "US",
      "addressRegion": listing.region,
    },
    "additionalProperty": [
      { "@type": "PropertyValue", "name": "Size", "value": `${listing.size} ${sizeUnit}` },
      { "@type": "PropertyValue", "name": "SunnyScore", "value": listing.sunnyScore },
      { "@type": "PropertyValue", "name": "Land Type", "value": listing.landType },
      { "@type": "PropertyValue", "name": "Grid Distance", "value": listing.distanceToSubstation },
    ]
  };

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={combinedKeywords}
        structuredData={structuredData}
        ogImage={listing.imageUrl}
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/listings/${listing.country}/${listing.region.toLowerCase()}`}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back to results
                </Link>
              </Button>
            </div>
            <ListingsBreadcrumb 
              country={listing.country}
              region={listing.region}
              province={listing.province}
              municipality={listing.municipality}
            />
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          <article className="max-w-4xl mx-auto">
            {/* Hero image */}
            <section className="relative rounded-xl overflow-hidden mb-6">
              <img
                src={listing.imageUrl}
                alt={`Land parcel in ${listing.province}, ${listing.region}`}
                className={cn(
                  "w-full h-64 md:h-96 object-cover",
                  !isUnlocked && "blur-lg"
                )}
              />
              
              {!isUnlocked && (
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent flex items-center justify-center">
                  <div className="text-center p-6">
                    <Lock className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">High-Resolution Image Locked</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                      Subscribe to {listing.region} to unlock precise satellite imagery and parcel boundaries.
                    </p>
                  </div>
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                <Badge 
                  className={cn(
                    "text-lg py-1 px-3",
                    listing.sunnyScore >= 90 ? "bg-primary" : 
                    listing.sunnyScore >= 80 ? "bg-primary/80" : "bg-secondary"
                  )}
                >
                  {listing.sunnyScore}/100
                </Badge>
                <Badge variant="secondary" className="py-1">{listing.landType}</Badge>
                {listing.isOffMarket && (
                  <Badge variant="outline" className="bg-background/80 border-primary text-primary py-1">
                    Off-Market
                  </Badge>
                )}
              </div>

              {/* Share button */}
              <Button 
                variant="secondary" 
                size="icon"
                className="absolute top-4 right-4"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </section>

            {/* Title and location */}
            <section className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {listing.size} {sizeUnit} {listing.landType.charAt(0).toUpperCase() + listing.landType.slice(1)} Land
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>
                  {listing.municipality && `${listing.municipality}, `}
                  {listing.province}, {listing.region}
                </span>
              </div>
            </section>

            {/* Main content grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Left column - Score */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>SunnyScore™ Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <SunnyScoreBar 
                    score={listing.sunnyScore} 
                    breakdown={listing.scoreBreakdown} 
                  />
                  <p className="mt-4 text-sm text-muted-foreground">
                    This parcel scores in the top {100 - listing.sunnyScore + 10}% of all analyzed lands in {listing.region}. 
                    All displayed parcels are pre-vetted and cleared of known environmental constraints.
                  </p>
                </CardContent>
              </Card>

              {/* Right column - CTA */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6 text-center">
                  <Lock className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-2">Unlock Full Details</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get exact coordinates, cadastral ID, and high-res maps.
                  </p>
                  <Button className="w-full mb-2">
                    Subscribe to {listing.region}
                  </Button>
                  <SampleReportModal>
                    <Button variant="link" className="text-sm">
                      See a Sample Report
                    </Button>
                  </SampleReportModal>
                </CardContent>
              </Card>
            </div>

            {/* Specifications */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Technical Specifications</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Ruler className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Size</p>
                        <p className="font-semibold">{listing.size} {sizeUnit}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mountain className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Terrain</p>
                        <p className="font-semibold">
                          {listing.terrain === "flat" ? "Flat" : listing.terrain === "moderate" ? "Moderate" : "Hilly"}
                        </p>
                        <p className="text-xs text-muted-foreground">{listing.slopePercentage}% slope</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Grid Distance</p>
                        <p className="font-semibold">{listing.distanceToSubstation}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Substation</p>
                        <p className={cn("font-semibold", !isUnlocked && "blur-sm select-none")}>
                          {isUnlocked ? listing.substationName : "████████"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Locked data preview */}
            {!isUnlocked && (
              <section className="mb-8">
                <Card className="border-dashed">
                  <CardContent className="py-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Coordinates</p>
                        <p className="font-mono blur-sm select-none">42.4186, 11.8678</p>
                        <Lock className="w-3 h-3 mx-auto mt-1 text-muted-foreground" />
                      </div>
                      {listing.country === "italy" && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Cadastral ID</p>
                          <p className="blur-sm select-none">Foglio 4, Particella 22</p>
                          <Lock className="w-3 h-3 mx-auto mt-1 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Substation Name</p>
                        <p className="blur-sm select-none">{listing.substationName}</p>
                        <Lock className="w-3 h-3 mx-auto mt-1 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Similar listings */}
            {nearbyListings.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Similar Opportunities</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {nearbyListings.slice(0, 2).map((nearby) => (
                    <ListingCard key={nearby.id} listing={nearby} />
                  ))}
                </div>
              </section>
            )}

            {/* Footer with regional links */}
            <ListingsFooter
              currentCountry={listing.country}
              currentRegion={listing.region}
              currentProvince={listing.province}
            />
          </article>
        </main>
      </div>
    </>
  );
};

export default ListingDetail;
