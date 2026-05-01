import { useState } from "react";
import { MapPin, Zap, Ruler, Sun, CreditCard, Trophy, ExternalLink, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { seoKeywords } from "@/data/mockListings";
import { STATE_CODE_TO_SLUG } from "@/data/locations";
import SEOHead from "@/components/listings/SEOHead";
import ListingsFooter from "@/components/listings/ListingsFooter";
import MiniParcelMap from "@/components/maps/MiniParcelMap";
import { ProximityCard } from "@/components/listings/ProximityCard";
import { FullAccessBadge } from "@/components/listings/FullAccessBadge";
import { DetailShell } from "@/components/listings/DetailShell";
import { LockedField, MapLockedOverlay, isLocked } from "@/components/listings/LockedField";
import { PaywallDrawer } from "@/components/listings/PaywallDrawer";
import { usePaywallAutoOpen } from "@/hooks/usePaywallAutoOpen";
import type { OsmDistanceFields } from "@/data/osmDistanceFields";
import type { DetailPageProps } from "../types";

/**
 * Detail-endpoint response shape — same keys regardless of access. The
 * backend renders premium numeric/url/date fields as the literal string
 * "****" when locked, formatted display strings (e.g. "$397,500",
 * "47.18", "2026-04-22") when unlocked. geom_json carries a disc-jittered
 * Point (with location_accuracy_m as the disc radius) when locked and the
 * exact polygon when unlocked.
 */
export interface USListingDetail extends OsmDistanceFields {
  id: string;
  state_code: string;
  county: string | null;
  city: string | null;
  zip_code: string | null;
  list_price: string;
  lot_sqft: string;
  lot_acres: string;
  price_per_sqft: string;
  price_per_acre: string;
  sqft: string;
  property_url: string;
  last_verified_at: string;
  prob_solar: number;
  rank_global: number;
  rank_in_state: number;
  rank_in_county: number;
  geom_json: Record<string, unknown> | null;
  location_accuracy_m: number | null;
  access_granted: boolean;
}

function formatSubstationDistance(meters: number | null): string {
  if (!meters) return "N/A";
  const miles = meters * 0.000621371;
  return `${Math.round(meters)} m (${miles.toFixed(1)} mi)`;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "-");
}

export function USDetailPage({ id, listing, onPaymentSuccess }: DetailPageProps<USListingDetail>) {
  const [paywallOpen, setPaywallOpen] = useState(false);
  usePaywallAutoOpen(() => setPaywallOpen(true));

  const accessGranted = listing.access_granted;
  const solarPercentage = listing.prob_solar ? Math.round(listing.prob_solar * 100) : null;
  const openPaywall = () => setPaywallOpen(true);

  const country = "united-states";
  const region = STATE_CODE_TO_SLUG[listing.state_code.toUpperCase()];
  const province = listing.county ? slugify(listing.county) : undefined;

  const titleAcres = accessGranted && !isLocked(listing.lot_acres)
    ? `${listing.lot_acres} Acres `
    : "";
  const seoTitle = `${titleAcres}Solar Land for Sale - ${listing.county}, ${listing.state_code} | Sunnyplans`;
  const seoDescription = `${titleAcres}Land in ${listing.county}, ${listing.state_code}. ${solarPercentage}% solar probability. Pre-vetted for BESS & solar projects.`;

  const combinedKeywords = [
    ...seoKeywords.primary.slice(0, 3),
    listing.state_code,
    listing.county,
    "solar land for sale",
    "USA solar land",
  ].join(", ");

  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: `Solar Land for Sale in ${listing.county}, ${listing.state_code}`,
    description: seoDescription,
    geo: {
      "@type": "GeoCoordinates",
      addressCountry: "US",
      addressRegion: listing.state_code,
    },
    additionalProperty: [
      { "@type": "PropertyValue", name: "Solar Probability", value: `${solarPercentage}%` },
    ],
  };
  if (accessGranted && !isLocked(listing.list_price)) {
    structuredData.offers = {
      "@type": "Offer",
      priceCurrency: "USD",
      price: listing.list_price,
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
          <MiniParcelMap
            geomJson={listing.geom_json}
            locationAccuracyM={listing.location_accuracy_m}
            className="w-full h-full"
            interactive={accessGranted}
            country={country}
            regionSlug={region}
          />
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <Badge className="text-lg py-1 px-3 bg-primary">
              <Sun className="w-4 h-4 mr-1" />
              {solarPercentage}%
            </Badge>
            {listing.rank_global && (
              <Badge variant="outline" className="bg-amber-50/90 border-amber-300 text-amber-700 py-1">
                <Trophy className="w-3 h-3 mr-1" />
                #{listing.rank_global} in US
              </Badge>
            )}
          </div>
          {!accessGranted && <MapLockedOverlay onUnlock={openPaywall} lang="en" />}
        </section>

        <section className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Solar Land in {listing.county}, {listing.state_code}
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>
              {listing.county} County, {listing.state_code}
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
                  <LockedField value={listing.lot_acres} onUnlock={openPaywall} /> Acres
                </SpecTile>
                <SpecTile icon={Zap} label="Substation Distance">
                  {accessGranted ? "" : "~"}
                  {formatSubstationDistance(listing.power_substation)}
                </SpecTile>
                <SpecTile icon={CreditCard} label="List Price">
                  <LockedField value={listing.list_price} onUnlock={openPaywall} />
                </SpecTile>
                <SpecTile icon={CreditCard} label="Price per Acre">
                  <LockedField value={listing.price_per_acre} onUnlock={openPaywall} />
                </SpecTile>
              </div>

              {accessGranted && !isLocked(listing.property_url) && listing.property_url && (
                <div className="pt-2">
                  <Button asChild variant="outline" size="sm">
                    <a href={listing.property_url} target="_blank" rel="noopener noreferrer">
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
              {accessGranted ? <FullAccessBadge /> : <UnlockCTA onClick={openPaywall} />}
            </CardContent>
          </Card>
        </div>

        <ProximityCard listing={listing} accessGranted={accessGranted} lang="en" unit="imperial" />

        <ListingsFooter currentCountry={country} currentRegion={region} currentProvince={province} />
      </DetailShell>

      <PaywallDrawer
        listingId={id}
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        onPaymentSuccess={onPaymentSuccess}
        lang="en"
      />
    </>
  );
}

function UnlockCTA({ onClick }: { onClick: () => void }) {
  return (
    <div className="text-center space-y-3">
      <h3 className="text-lg font-semibold">Unlock this parcel</h3>
      <p className="text-sm text-muted-foreground">
        Subscribe for full catalog access, or pay $49 to unlock just this listing.
      </p>
      <Button className="w-full" size="lg" onClick={onClick}>
        <Lock className="w-4 h-4 mr-2" />
        See pricing options
      </Button>
    </div>
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
