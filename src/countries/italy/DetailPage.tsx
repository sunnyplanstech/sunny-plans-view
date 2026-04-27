import { useState } from "react";
import { MapPin, Zap, Sun, Trophy, Ruler, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SEOHead from "@/components/listings/SEOHead";
import ListingsFooter from "@/components/listings/ListingsFooter";
import MiniParcelMap from "@/components/maps/MiniParcelMap";
import { ProximityCard } from "@/components/listings/ProximityCard";
import { FullAccessBadge } from "@/components/listings/FullAccessBadge";
import { DetailShell } from "@/components/listings/DetailShell";
import { LockedField, MapLockedOverlay } from "@/components/listings/LockedField";
import { PaywallDrawer } from "@/components/listings/PaywallDrawer";
import { usePaywallAutoOpen } from "@/hooks/usePaywallAutoOpen";
import type { OsmDistanceFields } from "@/data/osmDistanceFields";
import type { DetailPageProps } from "../types";

/**
 * Detail-endpoint response shape — see USListingDetail for the same
 * pattern. lat/lon and area_m2/area_ha are the IT premium fields:
 * "****" when locked, formatted display strings when unlocked.
 */
export interface ITListingDetail extends OsmDistanceFields {
  id: string;
  comune_code: string;
  comune_name: string | null;
  comune_slug: string;
  region_slug: string;
  prob_solar: number;
  lat: string;
  lon: string;
  area_m2: string;
  area_ha: string;
  foglio: string;
  particella: string;
  geom_json: Record<string, unknown> | null;
  rank_global: number;
  rank_in_comune: number;
  access_granted: boolean;
}

function formatSubstationDistance(meters: number | null): string {
  if (!meters) return "N/A";
  return `${Math.round(meters)} m`;
}

function formatRegionSlug(slug: string): string {
  return slug
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function ITDetailPage({ id, listing, onPaymentSuccess }: DetailPageProps<ITListingDetail>) {
  const [paywallOpen, setPaywallOpen] = useState(false);
  usePaywallAutoOpen(() => setPaywallOpen(true));

  const accessGranted = listing.access_granted;
  const solarPercentage = listing.prob_solar ? Math.round(listing.prob_solar * 100) : null;
  const regionName = formatRegionSlug(listing.region_slug);
  const openPaywall = () => setPaywallOpen(true);

  const country = "italy";
  const region = listing.region_slug;
  const province = listing.comune_slug;

  const seoTitle = `Solar Parcel - ${listing.comune_name}, ${regionName} | Sunnyplans`;
  const seoDescription = `Particella catastale in ${listing.comune_name}, ${regionName}. Probabilita solare: ${solarPercentage}%. Pre-analizzata per fotovoltaico e BESS.`;
  const combinedKeywords = `terreni fotovoltaico ${listing.comune_name}, BESS Italia, solare ${regionName}, particelle catastali`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `Solar Parcel - ${listing.comune_name}`,
    description: seoDescription,
    additionalProperty: [
      { "@type": "PropertyValue", name: "Solar Probability", value: `${solarPercentage}%` },
    ],
  };

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
        backLabel="Torna ai risultati"
      >
        <section className="relative rounded-xl overflow-hidden mb-6 h-64 md:h-96">
          <MiniParcelMap geomJson={listing.geom_json} className="w-full h-full" />
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            {solarPercentage !== null && (
              <Badge className="text-lg py-1 px-3 bg-primary">
                <Sun className="w-4 h-4 mr-1" />
                {solarPercentage}%
              </Badge>
            )}
            {listing.rank_global && (
              <Badge variant="outline" className="bg-amber-50/90 border-amber-300 text-amber-700 py-1">
                <Trophy className="w-3 h-3 mr-1" />
                #{listing.rank_global} in IT
              </Badge>
            )}
          </div>
          {!accessGranted && <MapLockedOverlay onUnlock={openPaywall} lang="it" />}
        </section>

        <section className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Solar Parcel - {listing.comune_name}
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>
              {listing.comune_name}, {regionName}
            </span>
          </div>
        </section>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Dettagli Particella</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Identificativo Catastale
                </p>
                <p className="font-mono text-sm">
                  {listing.comune_code} · Foglio{" "}
                  <LockedField value={listing.foglio} onUnlock={openPaywall} /> · Particella{" "}
                  <LockedField value={listing.particella} onUnlock={openPaywall} />
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Probabilita Solare</span>
                  <span className="text-sm font-bold text-primary">
                    {solarPercentage !== null ? `${solarPercentage}%` : "N/A"}
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all"
                    style={{ width: `${solarPercentage || 0}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Questa particella ha una probabilita del {solarPercentage}% di essere idonea allo
                  sviluppo fotovoltaico.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <SpecTile icon={MapPin} label="Comune">
                  {listing.comune_name}
                </SpecTile>
                <SpecTile icon={MapPin} label="Regione">
                  {regionName}
                </SpecTile>
                <SpecTile icon={Ruler} label="Area">
                  <LockedField value={listing.area_ha} onUnlock={openPaywall} /> ha
                </SpecTile>
                <SpecTile icon={Zap} label="Substation Distance">
                  {accessGranted ? "" : "~"}
                  {formatSubstationDistance(listing.power_substation)}
                </SpecTile>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6 space-y-4">
              {accessGranted ? <FullAccessBadge /> : <UnlockCTA onClick={openPaywall} />}
            </CardContent>
          </Card>
        </div>

        <ProximityCard listing={listing} accessGranted={accessGranted} lang="it" unit="metric" />

        <ListingsFooter currentCountry={country} currentRegion={region} currentProvince={province} />
      </DetailShell>

      <PaywallDrawer
        listingId={id}
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        onPaymentSuccess={onPaymentSuccess}
        lang="it"
      />
    </>
  );
}

function UnlockCTA({ onClick }: { onClick: () => void }) {
  return (
    <div className="text-center space-y-3">
      <h3 className="text-lg font-semibold">Sblocca questa particella</h3>
      <p className="text-sm text-muted-foreground">
        Abbonati per accesso completo, o paga $49 per sbloccare solo questa particella.
      </p>
      <Button className="w-full" size="lg" onClick={onClick}>
        <Lock className="w-4 h-4 mr-2" />
        Vedi opzioni
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

