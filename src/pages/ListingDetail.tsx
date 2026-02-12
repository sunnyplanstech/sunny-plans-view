import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Zap, Ruler, Sun, Calendar, CreditCard, Trophy, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ListingsBreadcrumb from "@/components/listings/ListingsBreadcrumb";
import ListingsFooter from "@/components/listings/ListingsFooter";
import SEOHead from "@/components/listings/SEOHead";
import MiniParcelMap from "@/components/maps/MiniParcelMap";
import { useUSListingById } from "@/hooks/useUSListings";
import { useITListingById } from "@/hooks/useITListings";
import { stateCodeToSlug, slugToCounty } from "@/data/locations";
import { seoKeywords } from "@/data/mockListings";

const STRIPE_LINK = "https://buy.stripe.com/4gM14pb5r7Wx4g1aOGaR200";
const CALENDLY_LINK = "https://calendly.com/eracle/new-meeting";

function formatPrice(price: number | null): string {
  if (!price) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatPricePerAcre(price: number | null): string {
  if (!price) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price) + "/acre";
}

function formatSubstationDistance(meters: number | null): string {
  if (!meters) return "N/A";
  const miles = meters * 0.000621371;
  return `${Math.round(meters)} m (${miles.toFixed(1)} mi)`;
}

function getParcelCenter(geomJson: string | object | null): { lat: number; lng: number } | null {
  if (!geomJson) return null;
  try {
    const geom = typeof geomJson === "string" ? JSON.parse(geomJson) : geomJson;
    if (geom.type === "Point" && geom.coordinates) {
      return { lat: geom.coordinates[1], lng: geom.coordinates[0] };
    }
    const coords =
      geom.type === "MultiPolygon"
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

function formatRegionSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

const ListingDetail = () => {
  const { id, country, region, province } = useParams<{
    id: string;
    country: string;
    region: string;
    province: string;
  }>();

  const isUS = country === "united-states";
  const isItaly = country === "italy";

  const { data: usListing, isLoading: usLoading, error: usError } = useUSListingById(isUS ? id : undefined);
  const { data: itListing, isLoading: itLoading, error: itError } = useITListingById(isItaly ? id : undefined);

  const isLoading = isUS ? usLoading : itLoading;
  const error = isUS ? usError : itError;
  const listing = isUS ? usListing : itListing;

  // Build back URL based on current location
  const backUrl = province && region ? `/${country}/${region}/${province}` : `/${country}/${region}`;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading listing details...</p>
        </div>
      </div>
    );
  }

  // Error or not found state
  if (error || !listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Listing Not Found</h1>
          <p className="text-muted-foreground mb-4">The listing you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to={country ? `/${country}` : "/"}>Browse All Listings</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Render Italian listing detail
  if (isItaly && itListing) {
    const solarPercentage = itListing.prob_solar ? Math.round(itListing.prob_solar * 100) : null;
    const center = getParcelCenter(itListing.geom_json);
    const regionName = formatRegionSlug(itListing.region_slug);

    const seoTitle = `Particella ${itListing.foglio || ""}/${itListing.particella || ""} - ${itListing.comune_name}, ${regionName} | Sunnyplans`;
    const seoDescription = `Particella catastale in ${itListing.comune_name}, ${regionName}. Probabilita solare: ${solarPercentage}%. Pre-analizzata per fotovoltaico e BESS.`;
    const combinedKeywords = `terreni fotovoltaico ${itListing.comune_name}, BESS Italia, solare ${regionName}, particelle catastali`;

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": `Particella ${itListing.foglio}/${itListing.particella} - ${itListing.comune_name}`,
      "description": seoDescription,
      "additionalProperty": [
        { "@type": "PropertyValue", "name": "Solar Probability", "value": `${solarPercentage}%` },
        { "@type": "PropertyValue", "name": "Foglio", "value": itListing.foglio },
        { "@type": "PropertyValue", "name": "Particella", "value": itListing.particella },
      ],
    };

    return (
      <>
        <SEOHead
          title={seoTitle}
          description={seoDescription}
          keywords={combinedKeywords}
          structuredData={structuredData}
        />

        <div className="min-h-screen bg-background">
          {/* Header */}
          <header className="border-b border-border bg-card">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center gap-4 mb-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link to={backUrl}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Torna ai risultati
                  </Link>
                </Button>
              </div>
              <ListingsBreadcrumb
                country={country}
                region={region}
                province={province}
              />
            </div>
          </header>

          <main className="container mx-auto px-4 py-6">
            <article className="max-w-4xl mx-auto">
              {/* Parcel Map - Main Hero */}
              <section className="relative rounded-xl overflow-hidden mb-6 h-64 md:h-96">
                <MiniParcelMap
                  latitude={center?.lat ?? null}
                  longitude={center?.lng ?? null}
                  className="w-full h-full"
                />

                {/* Badges overlay */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  {solarPercentage !== null && (
                    <Badge className="text-lg py-1 px-3 bg-primary">
                      <Sun className="w-4 h-4 mr-1" />
                      {solarPercentage}%
                    </Badge>
                  )}
                  {itListing.rank_global && (
                    <Badge variant="outline" className="bg-amber-50/90 border-amber-300 text-amber-700 py-1">
                      <Trophy className="w-3 h-3 mr-1" />
                      #{itListing.rank_global} in IT
                    </Badge>
                  )}
                </div>
              </section>

              {/* Title and location */}
              <section className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Particella {itListing.foglio || "N/A"}/{itListing.particella || "N/A"} - {itListing.comune_name}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{itListing.comune_name}, {regionName}</span>
                </div>
              </section>

              {/* Main content grid */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {/* Left column - Specs */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Dettagli Particella</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Solar Score Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Probabilita Solare</span>
                        <span className="text-sm font-bold text-primary">{solarPercentage !== null ? `${solarPercentage}%` : "N/A"}</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all"
                          style={{ width: `${solarPercentage || 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Questa particella ha una probabilita del {solarPercentage}% di essere idonea allo sviluppo fotovoltaico.
                      </p>
                    </div>

                    {/* Specs grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Foglio</p>
                          <p className="font-semibold">{itListing.foglio || "N/A"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Particella</p>
                          <p className="font-semibold">{itListing.particella || "N/A"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Comune</p>
                          <p className="font-semibold">{itListing.comune_name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Regione</p>
                          <p className="font-semibold">{regionName}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Right column - CTA */}
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6 space-y-4">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold mb-2">Interessato a questa particella?</h3>
                      <p className="text-sm text-muted-foreground">
                        Accedi al database completo e contatta il nostro team.
                      </p>
                    </div>

                    <Button asChild className="w-full" size="lg">
                      <a href={STRIPE_LINK} target="_blank" rel="noopener noreferrer">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Abbonati Ora
                        <ExternalLink className="w-3 h-3 ml-2" />
                      </a>
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">oppure</span>
                      </div>
                    </div>

                    <Button asChild variant="outline" className="w-full" size="lg">
                      <a href={CALENDLY_LINK} target="_blank" rel="noopener noreferrer">
                        <Calendar className="w-4 h-4 mr-2" />
                        Prenota una Chiamata
                        <ExternalLink className="w-3 h-3 ml-2" />
                      </a>
                    </Button>

                    <p className="text-xs text-center text-muted-foreground pt-2">
                      Ricevi consulenza personalizzata sulle opportunita fotovoltaiche.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Footer with regional links */}
              <ListingsFooter
                currentCountry={country}
                currentRegion={region}
                currentProvince={province}
              />
            </article>
          </main>
        </div>
      </>
    );
  }

  // Render US listing detail (existing behavior)
  if (isUS && usListing) {
    const solarPercentage = usListing.prob_solar ? Math.round(usListing.prob_solar * 100) : null;
    const stateSlug = stateCodeToSlug(usListing.state_code) || usListing.state_code.toLowerCase();

    const seoTitle = `${usListing.lot_acres?.toFixed(1) || ""} Acres Solar Land for Sale - ${usListing.county}, ${usListing.state_code} | Sunnyplans`;
    const seoDescription = `${usListing.lot_acres?.toFixed(1)} acres of land in ${usListing.county}, ${usListing.state_code}. ${solarPercentage}% solar probability. ${formatSubstationDistance(usListing.power_substation)} from substation. Pre-vetted for BESS & solar projects.`;

    const combinedKeywords = [
      ...seoKeywords.primary.slice(0, 3),
      usListing.state_code,
      usListing.county,
      "solar land for sale",
      "USA solar land",
    ].join(", ");

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      "name": `Solar Land for Sale in ${usListing.county}, ${usListing.state_code}`,
      "description": seoDescription,
      "offers": {
        "@type": "Offer",
        "priceCurrency": "USD",
        "price": usListing.list_price,
        "availability": "https://schema.org/InStock",
      },
      "geo": {
        "@type": "GeoCoordinates",
        "addressCountry": "US",
        "addressRegion": usListing.state_code,
      },
      "additionalProperty": [
        { "@type": "PropertyValue", "name": "Size", "value": `${usListing.lot_acres} Acres` },
        { "@type": "PropertyValue", "name": "Solar Probability", "value": `${solarPercentage}%` },
        { "@type": "PropertyValue", "name": "Substation Distance", "value": formatSubstationDistance(usListing.power_substation) },
      ],
    };

    return (
      <>
        <SEOHead
          title={seoTitle}
          description={seoDescription}
          keywords={combinedKeywords}
          structuredData={structuredData}
        />

        <div className="min-h-screen bg-background">
          {/* Header */}
          <header className="border-b border-border bg-card">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center gap-4 mb-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link to={backUrl}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to results
                  </Link>
                </Button>
              </div>
              <ListingsBreadcrumb
                country={country}
                region={region}
                province={province}
              />
            </div>
          </header>

          <main className="container mx-auto px-4 py-6">
            <article className="max-w-4xl mx-auto">
              {/* Parcel Map - Main Hero */}
              <section className="relative rounded-xl overflow-hidden mb-6 h-64 md:h-96">
                <MiniParcelMap latitude={usListing.latitude} longitude={usListing.longitude} className="w-full h-full" />

                {/* Badges overlay */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <Badge className="text-lg py-1 px-3 bg-primary">
                    <Sun className="w-4 h-4 mr-1" />
                    {solarPercentage}%
                  </Badge>
                  {usListing.rank_global && (
                    <Badge variant="outline" className="bg-amber-50/90 border-amber-300 text-amber-700 py-1">
                      <Trophy className="w-3 h-3 mr-1" />
                      #{usListing.rank_global} in US
                    </Badge>
                  )}
                </div>
              </section>

              {/* Title and location */}
              <section className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {usListing.lot_acres?.toFixed(1)} Acres in {usListing.county}, {usListing.state_code}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{usListing.county} County, {usListing.state_code}</span>
                </div>
              </section>

              {/* Main content grid */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {/* Left column - Specs */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Property Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Solar Score Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Solar Probability</span>
                        <span className="text-sm font-bold text-primary">{solarPercentage}%</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all"
                          style={{ width: `${solarPercentage || 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This parcel has a {solarPercentage}% probability of being suitable for solar development based on our analysis.
                      </p>
                    </div>

                    {/* Specs grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Ruler className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Size</p>
                          <p className="font-semibold">{usListing.lot_acres?.toFixed(1)} Acres</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Substation Distance</p>
                          <p className="font-semibold">{formatSubstationDistance(usListing.power_substation)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">List Price</p>
                          <p className="font-semibold">{formatPrice(usListing.list_price)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Price per Acre</p>
                          <p className="font-semibold">{formatPricePerAcre(usListing.price_per_acre)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Right column - CTA */}
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6 space-y-4">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold mb-2">Interested in this property?</h3>
                      <p className="text-sm text-muted-foreground">
                        Get full access to our database and connect with our team.
                      </p>
                    </div>

                    <Button asChild className="w-full" size="lg">
                      <a href={STRIPE_LINK} target="_blank" rel="noopener noreferrer">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Subscribe Now
                        <ExternalLink className="w-3 h-3 ml-2" />
                      </a>
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">or</span>
                      </div>
                    </div>

                    <Button asChild variant="outline" className="w-full" size="lg">
                      <a href={CALENDLY_LINK} target="_blank" rel="noopener noreferrer">
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule a Call
                        <ExternalLink className="w-3 h-3 ml-2" />
                      </a>
                    </Button>

                    <p className="text-xs text-center text-muted-foreground pt-2">
                      Get personalized guidance on solar land opportunities.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Footer with regional links */}
              <ListingsFooter
                currentCountry={country}
                currentRegion={region}
                currentProvince={province}
              />
            </article>
          </main>
        </div>
      </>
    );
  }

  // Fallback (should not reach here)
  return null;
};

export default ListingDetail;
