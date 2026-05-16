import { useMemo, useState } from "react";
import { MapPin, Zap, Sun, Trophy, Ruler, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SEOHead from "@/components/listings/SEOHead";
import ListingsFooter from "@/components/listings/ListingsFooter";
import MiniParcelMap from "@/components/maps/MiniParcelMap";
import { ProximityCard } from "@/components/listings/ProximityCard";
import { FullAccessBadge } from "@/components/listings/FullAccessBadge";
import { DetailShell } from "@/components/listings/DetailShell";
import { LockedField, MapLockedOverlay } from "@/components/listings/LockedField";
import { PaywallDrawer } from "@/components/listings/PaywallDrawer";
import { SunnyScoreExplanation, type FeatureValues } from "@/components/listings/sunnyscore";
import { usePaywallAutoOpen } from "@/hooks/usePaywallAutoOpen";
import { OSM_DISTANCE_KEYS, type OsmDistanceFields } from "@/data/osmDistanceFields";
import type { DetailPageProps } from "../types";

// See US DetailPage's buildFeatureValues for the rationale. IT mirror.
function buildFeatureValues(
  listing: OsmDistanceFields & {
    flat_5_acres_pct?: number | null;
    ghi_kwh_m2_yr?: number | null;
    dni_kwh_m2_yr?: number | null;
    pv_specific_yield_kwh_kwp_yr?: number | null;
  },
): FeatureValues {
  const out: FeatureValues = {};
  for (const k of OSM_DISTANCE_KEYS) out[k] = listing[k];
  out.flat_5_acres_pct = listing.flat_5_acres_pct ?? null;
  out.ghi_kwh_m2_yr = listing.ghi_kwh_m2_yr ?? null;
  out.dni_kwh_m2_yr = listing.dni_kwh_m2_yr ?? null;
  out.pv_specific_yield_kwh_kwp_yr = listing.pv_specific_yield_kwh_kwp_yr ?? null;
  return out;
}

/**
 * Detail-endpoint response shape — see USListingDetail for the same
 * pattern. area_m2/area_ha and the cadastral identifiers are the IT
 * premium fields: "****" when locked, formatted display strings when
 * unlocked.
 */
export interface ITListingDetail extends OsmDistanceFields {
  id: string;
  comune_code: string;
  comune_name: string | null;
  comune_slug: string;
  region_slug: string;
  prob_solar: number;
  score: number | null;
  contributions: Record<string, number> | null;
  area_m2: string;
  area_ha: string;
  foglio: string;
  particella: string;
  geom_json: Record<string, unknown> | null;
  location_accuracy_m: number | null;
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
  const scoreInt = listing.score ?? solarPercentage;
  const hasExplanation =
    listing.score != null &&
    listing.contributions != null &&
    Object.keys(listing.contributions).length > 0;
  const featureValues = useMemo(() => buildFeatureValues(listing), [listing]);
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
        <section className="mb-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <MapPin className="w-3.5 h-3.5" />
            <span>
              {listing.comune_name}, {regionName}
            </span>
            {listing.rank_global && (
              <Badge variant="outline" className="ml-auto bg-amber-50/90 border-amber-300 text-amber-700">
                <Trophy className="w-3 h-3 mr-1" />
                #{listing.rank_global} in IT
              </Badge>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Solar Parcel - {listing.comune_name}
          </h1>
        </section>

        {/* Hero: map first, score badge overlaid. SHAP card below. */}
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
            {scoreInt !== null && (
              <Badge className="text-lg py-1 px-3 bg-primary">
                <Sun className="w-4 h-4 mr-1" />
                {scoreInt}
              </Badge>
            )}
          </div>
          {!accessGranted && <MapLockedOverlay onUnlock={openPaywall} lang="it" />}
        </section>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {hasExplanation ? (
            <Card className="md:col-span-2 border-primary/20 bg-gradient-to-b from-primary/[0.03] to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="w-5 h-5 text-primary" />
                  Perche questa particella ha punteggio {listing.score}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SunnyScoreExplanation
                  payload={{
                    score: listing.score!,
                    contributions: listing.contributions!,
                    featureValues,
                  }}
                  size="lg"
                  unit="metric"
                  expandable
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="md:col-span-2">
              <CardContent className="pt-6 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Probabilita Solare</span>
                  <span className="text-sm font-bold text-primary">
                    {scoreInt !== null ? `${scoreInt}%` : "N/A"}
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all"
                    style={{ width: `${scoreInt || 0}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Questa particella ha una probabilita del {scoreInt}% di essere idonea allo
                  sviluppo fotovoltaico.
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6 space-y-4">
              {accessGranted ? <FullAccessBadge /> : <UnlockCTA onClick={openPaywall} />}
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Dettagli Particella</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SpecTile icon={MapPin} label="Comune">
                {listing.comune_name}
              </SpecTile>
              <SpecTile icon={MapPin} label="Regione">
                {regionName}
              </SpecTile>
              <SpecTile icon={Ruler} label="Area">
                <LockedField value={listing.area_ha} onUnlock={openPaywall} /> ha
              </SpecTile>
              <SpecTile icon={Zap} label="Cabina primaria">
                {formatSubstationDistance(listing.power_substation)}
              </SpecTile>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Identificativo Catastale</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Codice Comune</TableHead>
                  <TableHead>Foglio</TableHead>
                  <TableHead>Particella</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  className={!accessGranted ? "cursor-pointer" : "hover:bg-transparent"}
                  onClick={!accessGranted ? openPaywall : undefined}
                >
                  <TableCell className="font-mono">
                    {accessGranted ? listing.comune_code : <LockedCell />}
                  </TableCell>
                  <TableCell className="font-mono">
                    {accessGranted ? listing.foglio : <LockedCell />}
                  </TableCell>
                  <TableCell className="font-mono">
                    {accessGranted ? listing.particella : <LockedCell />}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Premium-only deep-dive — see US DetailPage for rationale. */}
        {accessGranted && (
          <ProximityCard listing={listing} accessGranted={accessGranted} lang="it" unit="metric" />
        )}

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

function LockedCell() {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      ****
      <Lock className="w-3 h-3" />
    </span>
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

