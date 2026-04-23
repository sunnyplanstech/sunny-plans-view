import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Zap, Ruler, Sun, Calendar, CreditCard, Trophy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ListingsBreadcrumb from "@/components/listings/ListingsBreadcrumb";
import ListingsFooter from "@/components/listings/ListingsFooter";
import SEOHead from "@/components/listings/SEOHead";
import MiniParcelMap from "@/components/maps/MiniParcelMap";
import { ProximityCard } from "@/components/listings/ProximityCard";
import { useUSListingById } from "@/hooks/useUSListings";
import { useITListingById } from "@/hooks/useITListings";
import { useUSPremiumListing, useITPremiumListing } from "@/hooks/usePremiumListing";
import { stateCodeToSlug } from "@/data/locations";
import { seoKeywords } from "@/data/mockListings";
import { getParcelCenter } from "@/lib/geo";
import { useAuth } from "@/hooks/useAuth";

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

function formatRegionSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

const CTA_STRINGS = {
  en: {
    heading: "Interested in this property?",
    description: "Subscribe to unlock exact coordinates, source URL, and full property data.",
    subscribe: "Subscribe Now",
    or: "or",
    schedule: "Schedule a Call",
    footer: "Get personalized guidance on solar land opportunities.",
  },
  it: {
    heading: "Interessato a questa particella?",
    description: "Abbonati per vedere coordinate esatte e dati completi.",
    subscribe: "Abbonati Ora",
    or: "oppure",
    schedule: "Prenota una Chiamata",
    footer: "Ricevi consulenza personalizzata sulle opportunita fotovoltaiche.",
  },
} as const;

function SubscribeCTA({ openAuthModal, lang = "en" }: { openAuthModal: (mode: "signup") => void; lang?: "en" | "it" }) {
  const t = CTA_STRINGS[lang];
  return (
    <>
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold mb-2">{t.heading}</h3>
        <p className="text-sm text-muted-foreground">{t.description}</p>
      </div>

      <Button className="w-full" size="lg" onClick={() => openAuthModal("signup")}>
        <CreditCard className="w-4 h-4 mr-2" />
        {t.subscribe}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">{t.or}</span>
        </div>
      </div>

      <Button asChild variant="outline" className="w-full" size="lg">
        <a href={CALENDLY_LINK} target="_blank" rel="noopener noreferrer">
          <Calendar className="w-4 h-4 mr-2" />
          {t.schedule}
          <ExternalLink className="w-3 h-3 ml-2" />
        </a>
      </Button>

      <p className="text-xs text-center text-muted-foreground pt-2">{t.footer}</p>
    </>
  );
}

function FullAccessBadge() {
  return (
    <div className="text-center">
      <h3 className="text-lg font-semibold mb-2">Full access active</h3>
      <p className="text-sm text-muted-foreground">
        You have access to all data for this property.
      </p>
    </div>
  );
}

const ListingDetail = () => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { id, country, region, province } = useParams<{
    id: string;
    country: string;
    region: string;
    province: string;
  }>();

  const isUS = country === "united-states";
  const isItaly = country === "italy";

  // Public (obfuscated) data from Supabase — always loaded
  const { data: usPublic, isLoading: usLoading, error: usError } = useUSListingById(isUS ? id : undefined);
  const { data: itPublic, isLoading: itLoading, error: itError } = useITListingById(isItaly ? id : undefined);

  // Premium (exact) data from Django API — only when authenticated
  const { data: usPremium } = useUSPremiumListing(isUS ? id : undefined);
  const { data: itPremium } = useITPremiumListing(isItaly ? id : undefined);

  const isLoading = isUS ? usLoading : itLoading;
  const error = isUS ? usError : itError;
  const listing = isUS ? usPublic : itPublic;

  const backUrl = province && region ? `/${country}/${region}/${province}` : `/${country}/${region}`;

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

  // --- Italian listing ---
  if (isItaly && itPublic) {
    const solarPercentage = itPublic.prob_solar ? Math.round(itPublic.prob_solar * 100) : null;
    const center = itPremium
      ? { lat: itPremium.lat, lng: itPremium.lon }
      : getParcelCenter(itPublic.geom_json);
    const regionName = formatRegionSlug(itPublic.region_slug);

    const seoTitle = `Solar Parcel - ${itPublic.comune_name}, ${regionName} | Sunnyplans`;
    const seoDescription = `Particella catastale in ${itPublic.comune_name}, ${regionName}. Probabilita solare: ${solarPercentage}%. Pre-analizzata per fotovoltaico e BESS.`;
    const combinedKeywords = `terreni fotovoltaico ${itPublic.comune_name}, BESS Italia, solare ${regionName}, particelle catastali`;

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": `Solar Parcel - ${itPublic.comune_name}`,
      "description": seoDescription,
      "additionalProperty": [
        { "@type": "PropertyValue", "name": "Solar Probability", "value": `${solarPercentage}%` },
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
          <header className="border-b border-border bg-card">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center gap-4 mb-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link to={backUrl}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Torna ai risultati
                  </Link>
                </Button>
              </div>
              <ListingsBreadcrumb country={country} region={region} province={province} />
            </div>
          </header>

          <main className="container mx-auto px-4 py-6">
            <article className="max-w-4xl mx-auto">
              <section className="relative rounded-xl overflow-hidden mb-6 h-64 md:h-96">
                <MiniParcelMap
                  lat={center?.lat ?? null}
                  lon={center?.lng ?? null}
                  className="w-full h-full"
                />
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  {solarPercentage !== null && (
                    <Badge className="text-lg py-1 px-3 bg-primary">
                      <Sun className="w-4 h-4 mr-1" />
                      {solarPercentage}%
                    </Badge>
                  )}
                  {itPublic.rank_global && (
                    <Badge variant="outline" className="bg-amber-50/90 border-amber-300 text-amber-700 py-1">
                      <Trophy className="w-3 h-3 mr-1" />
                      #{itPublic.rank_global} in IT
                    </Badge>
                  )}
                </div>
              </section>

              <section className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Solar Parcel - {itPublic.comune_name}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{itPublic.comune_name}, {regionName}</span>
                </div>
              </section>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Dettagli Particella</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
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

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Comune</p>
                          <p className="font-semibold">{itPublic.comune_name}</p>
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

                      {/* Premium fields — only visible to authenticated users */}
                      {itPremium && (
                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Substation Distance</p>
                            <p className="font-semibold">{formatSubstationDistance(itPremium.power_substation)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6 space-y-4">
                    {isAuthenticated ? <FullAccessBadge /> : (
                      <SubscribeCTA openAuthModal={openAuthModal} lang="it" />
                    )}
                  </CardContent>
                </Card>
              </div>

              <ProximityCard
                premium={itPremium}
                publicData={itPublic}
                lang="it"
                unit="metric"
              />

              <ListingsFooter currentCountry={country} currentRegion={region} currentProvince={province} />
            </article>
          </main>
        </div>
      </>
    );
  }

  // --- US listing ---
  if (isUS && usPublic) {
    const solarPercentage = usPublic.prob_solar ? Math.round(usPublic.prob_solar * 100) : null;
    const stateSlug = stateCodeToSlug(usPublic.state_code) || usPublic.state_code.toLowerCase();

    // Use exact coords from premium data when available, otherwise grid-snapped from public
    const center = usPremium
      ? { lat: usPremium.lat, lng: usPremium.lon }
      : getParcelCenter(usPublic.geom_json);

    // SEO — premium gives exact, public gives bucket midpoint
    const displayAcres = usPremium?.lot_acres ?? usPublic.lot_acres;
    const acresLabel = usPremium
      ? `${displayAcres?.toFixed(1) ?? "?"} Acres`
      : `~${displayAcres?.toFixed(1) ?? "?"} Acres`;

    const seoTitle = `${acresLabel} Solar Land for Sale - ${usPublic.county}, ${usPublic.state_code} | Sunnyplans`;
    const seoDescription = `${acresLabel} of land in ${usPublic.county}, ${usPublic.state_code}. ${solarPercentage}% solar probability. Pre-vetted for BESS & solar projects.`;

    const combinedKeywords = [
      ...seoKeywords.primary.slice(0, 3),
      usPublic.state_code,
      usPublic.county,
      "solar land for sale",
      "USA solar land",
    ].join(", ");

    const structuredData: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      "name": `Solar Land for Sale in ${usPublic.county}, ${usPublic.state_code}`,
      "description": seoDescription,
      "geo": {
        "@type": "GeoCoordinates",
        "addressCountry": "US",
        "addressRegion": usPublic.state_code,
      },
      "additionalProperty": [
        { "@type": "PropertyValue", "name": "Solar Probability", "value": `${solarPercentage}%` },
      ],
    };

    // Add exact price to structured data only for premium users
    if (usPremium?.list_price) {
      structuredData["offers"] = {
        "@type": "Offer",
        "priceCurrency": "USD",
        "price": usPremium.list_price,
        "availability": "https://schema.org/InStock",
      };
    }

    return (
      <>
        <SEOHead
          title={seoTitle}
          description={seoDescription}
          keywords={combinedKeywords}
          structuredData={structuredData}
        />

        <div className="min-h-screen bg-background">
          <header className="border-b border-border bg-card">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center gap-4 mb-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link to={backUrl}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to results
                  </Link>
                </Button>
              </div>
              <ListingsBreadcrumb country={country} region={region} province={province} />
            </div>
          </header>

          <main className="container mx-auto px-4 py-6">
            <article className="max-w-4xl mx-auto">
              <section className="relative rounded-xl overflow-hidden mb-6 h-64 md:h-96">
                <MiniParcelMap lat={center?.lat ?? null} lon={center?.lng ?? null} className="w-full h-full" />

                {/* Badges overlay */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <Badge className="text-lg py-1 px-3 bg-primary">
                    <Sun className="w-4 h-4 mr-1" />
                    {solarPercentage}%
                  </Badge>
                  {usPublic.rank_global && (
                    <Badge variant="outline" className="bg-amber-50/90 border-amber-300 text-amber-700 py-1">
                      <Trophy className="w-3 h-3 mr-1" />
                      #{usPublic.rank_global} in US
                    </Badge>
                  )}
                </div>
              </section>

              <section className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {acresLabel} in {usPublic.county}, {usPublic.state_code}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{usPublic.county} County, {usPublic.state_code}</span>
                </div>
              </section>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
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

                    {/* Specs grid — show exact or obfuscated depending on auth */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Ruler className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Size</p>
                          <p className="font-semibold">
                            {usPremium
                              ? `${usPremium.lot_acres?.toFixed(1) ?? "N/A"} Acres`
                              : `~${usPublic.lot_acres?.toFixed(1) ?? "N/A"} Acres`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Substation Distance</p>
                          <p className="font-semibold">
                            {usPremium
                              ? formatSubstationDistance(usPremium.power_substation)
                              : `~${formatSubstationDistance(usPublic.power_substation)}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">List Price</p>
                          <p className="font-semibold">
                            {usPremium
                              ? formatPrice(usPremium.list_price)
                              : `~${formatPrice(usPublic.list_price)}`}
                          </p>
                        </div>
                      </div>

                      {usPremium && (
                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Price per Acre</p>
                            <p className="font-semibold">{formatPricePerAcre(usPremium.price_per_acre)}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Source URL — premium only */}
                    {usPremium && (
                      <div className="pt-2">
                        <Button asChild variant="outline" size="sm">
                          <a href={usPremium.property_url} target="_blank" rel="noopener noreferrer">
                            View on Realtor.com
                            <ExternalLink className="w-3 h-3 ml-2" />
                          </a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6 space-y-4">
                    {isAuthenticated ? <FullAccessBadge /> : (
                      <SubscribeCTA openAuthModal={openAuthModal} />
                    )}
                  </CardContent>
                </Card>
              </div>

              <ProximityCard
                premium={usPremium}
                publicData={usPublic}
                lang="en"
                unit="imperial"
              />

              <ListingsFooter currentCountry={country} currentRegion={region} currentProvince={province} />
            </article>
          </main>
        </div>
      </>
    );
  }

  return null;
};

export default ListingDetail;
