import { useQuery } from "@tanstack/react-query";
import { MapPin, Zap, Ruler, Sun, CreditCard, Trophy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient, publicApi } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { seoKeywords } from "@/data/mockListings";
import { getParcelCenter } from "@/lib/geo";
import SEOHead from "@/components/listings/SEOHead";
import ListingsFooter from "@/components/listings/ListingsFooter";
import MiniParcelMap from "@/components/maps/MiniParcelMap";
import { ProximityCard } from "@/components/listings/ProximityCard";
import { SubscribeCTA, FullAccessBadge } from "@/components/listings/SubscribeCTA";
import { DetailShell, DetailLoading, DetailNotFound } from "@/components/listings/DetailShell";
import type { OsmDistanceFields } from "@/data/osmDistanceFields";
import type { DetailPageProps } from "../types";
import type { USListing } from "./index";

export interface USPremiumListing extends OsmDistanceFields {
  id: string;
  state_code: string;
  county: string | null;
  city: string | null;
  zip_code: string;
  lat: number;
  lon: number;
  list_price: number | null;
  lot_sqft: number | null;
  lot_acres: number | null;
  price_per_sqft: number | null;
  price_per_acre: number | null;
  prob_solar: number;
  sqft: number | null;
  year_built: number | null;
  geom_json: Record<string, unknown> | null;
  rank_global: number;
  rank_in_state: number;
  rank_in_county: number;
  property_url?: string;
}

function useUSPublicListing(id: string) {
  return useQuery({
    queryKey: ["us-listing", id],
    queryFn: () => publicApi<USListing>(`/api/listings/public/${id}/`),
  });
}

function useUSPremiumListing(id: string, isAuthenticated: boolean) {
  return useQuery({
    queryKey: ["us-premium-listing", id],
    queryFn: async () => {
      const res = await apiClient(`/api/listings/${id}/detail/`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return (await res.json()) as USPremiumListing;
    },
    enabled: isAuthenticated,
  });
}

function formatPrice(price: number | null): string {
  if (!price) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatPricePerAcre(price: number | null): string {
  return formatPrice(price) + (price ? "/acre" : "");
}

function formatSubstationDistance(meters: number | null): string {
  if (!meters) return "N/A";
  const miles = meters * 0.000621371;
  return `${Math.round(meters)} m (${miles.toFixed(1)} mi)`;
}

export function USDetailPage({ id, country, region, province }: DetailPageProps) {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { data: publicListing, isLoading, error } = useUSPublicListing(id);
  const { data: premium } = useUSPremiumListing(id, isAuthenticated);

  if (isLoading) return <DetailLoading />;
  if (error || !publicListing) return <DetailNotFound country={country} />;

  const solarPercentage = publicListing.prob_solar ? Math.round(publicListing.prob_solar * 100) : null;
  const center = premium
    ? { lat: premium.lat, lng: premium.lon }
    : getParcelCenter(publicListing.geom_json);

  const displayAcres = premium?.lot_acres ?? publicListing.lot_acres;
  const acresLabel = premium
    ? `${displayAcres?.toFixed(1) ?? "?"} Acres`
    : `~${displayAcres?.toFixed(1) ?? "?"} Acres`;

  const seoTitle = `${acresLabel} Solar Land for Sale - ${publicListing.county}, ${publicListing.state_code} | Sunnyplans`;
  const seoDescription = `${acresLabel} of land in ${publicListing.county}, ${publicListing.state_code}. ${solarPercentage}% solar probability. Pre-vetted for BESS & solar projects.`;

  const combinedKeywords = [
    ...seoKeywords.primary.slice(0, 3),
    publicListing.state_code,
    publicListing.county,
    "solar land for sale",
    "USA solar land",
  ].join(", ");

  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: `Solar Land for Sale in ${publicListing.county}, ${publicListing.state_code}`,
    description: seoDescription,
    geo: {
      "@type": "GeoCoordinates",
      addressCountry: "US",
      addressRegion: publicListing.state_code,
    },
    additionalProperty: [
      { "@type": "PropertyValue", name: "Solar Probability", value: `${solarPercentage}%` },
    ],
  };
  if (premium?.list_price) {
    structuredData.offers = {
      "@type": "Offer",
      priceCurrency: "USD",
      price: premium.list_price,
      availability: "https://schema.org/InStock",
    };
  }

  const backUrl = province && region ? `/${country}/${region}/${province}` : `/${country}/${region ?? ""}`;

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={combinedKeywords}
        structuredData={structuredData}
      />

      <DetailShell
        country={country}
        region={region}
        province={province}
        backUrl={backUrl}
        backLabel="Back to results"
      >
        <section className="relative rounded-xl overflow-hidden mb-6 h-64 md:h-96">
          <MiniParcelMap lat={center?.lat ?? null} lon={center?.lng ?? null} className="w-full h-full" />
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <Badge className="text-lg py-1 px-3 bg-primary">
              <Sun className="w-4 h-4 mr-1" />
              {solarPercentage}%
            </Badge>
            {publicListing.rank_global && (
              <Badge variant="outline" className="bg-amber-50/90 border-amber-300 text-amber-700 py-1">
                <Trophy className="w-3 h-3 mr-1" />
                #{publicListing.rank_global} in US
              </Badge>
            )}
          </div>
        </section>

        <section className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {acresLabel} in {publicListing.county}, {publicListing.state_code}
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>
              {publicListing.county} County, {publicListing.state_code}
            </span>
          </div>
        </section>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
                  This parcel has a {solarPercentage}% probability of being suitable for solar
                  development based on our analysis.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <SpecTile icon={Ruler} label="Size">
                  {premium
                    ? `${premium.lot_acres?.toFixed(1) ?? "N/A"} Acres`
                    : `~${publicListing.lot_acres?.toFixed(1) ?? "N/A"} Acres`}
                </SpecTile>
                <SpecTile icon={Zap} label="Substation Distance">
                  {premium
                    ? formatSubstationDistance(premium.power_substation)
                    : `~${formatSubstationDistance(publicListing.power_substation)}`}
                </SpecTile>
                <SpecTile icon={CreditCard} label="List Price">
                  {premium ? formatPrice(premium.list_price) : `~${formatPrice(publicListing.list_price)}`}
                </SpecTile>
                {premium && (
                  <SpecTile icon={CreditCard} label="Price per Acre">
                    {formatPricePerAcre(premium.price_per_acre)}
                  </SpecTile>
                )}
              </div>

              {premium?.property_url && (
                <div className="pt-2">
                  <Button asChild variant="outline" size="sm">
                    <a href={premium.property_url} target="_blank" rel="noopener noreferrer">
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
              {isAuthenticated ? <FullAccessBadge /> : <SubscribeCTA openAuthModal={openAuthModal} />}
            </CardContent>
          </Card>
        </div>

        <ProximityCard premium={premium} publicData={publicListing} lang="en" unit="imperial" />

        <ListingsFooter currentCountry={country} currentRegion={region} currentProvince={province} />
      </DetailShell>
    </>
  );
}

interface SpecTileProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}
function SpecTile({ icon: Icon, label, children }: SpecTileProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-semibold">{children}</p>
      </div>
    </div>
  );
}
