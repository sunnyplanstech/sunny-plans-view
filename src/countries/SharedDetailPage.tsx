// Country-agnostic listing-detail page.
//
// Both /listing/:id surfaces (US + IT) share ~90% of their layout —
// hero map with score badge, SHAP explanation card, paywall CTA,
// property-details card, proximity table, footer, paywall drawer. The
// country-specific bits (SEO strings, header labels, spec tiles,
// optional extras like the IT cadastral identifier or the US source-URL
// button) are factored into a small DetailAdapter that each country
// implements. Adding a new country = writing one adapter, not forking a
// 300-line page file.
//
// The pattern mirrors the existing CountryAdapter for listings/cards/
// rails — same idea, applied to the detail surface.
import { useMemo, useState, type ReactNode } from "react";
import { MapPin, Sun, Trophy, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SEOHead from "@/components/listings/SEOHead";
import ListingsFooter from "@/components/listings/ListingsFooter";
import MiniParcelMap from "@/components/maps/MiniParcelMap";
import { ProximityCard } from "@/components/listings/ProximityCard";
import { FullAccessBadge } from "@/components/listings/FullAccessBadge";
import { DetailShell } from "@/components/listings/DetailShell";
import { MapLockedOverlay } from "@/components/listings/LockedField";
import { PaywallDrawer } from "@/components/listings/PaywallDrawer";
import ScheduleCallPopup from "@/components/listings/ScheduleCallPopup";
import { SunnyScoreExplanation, type FeatureValues } from "@/components/listings/sunnyscore";
import { useAuth } from "@/hooks/useAuth";
import { useCalendlyResearchPrompt } from "@/hooks/useCalendlyResearchPrompt";
import { usePaywallAutoOpen } from "@/hooks/usePaywallAutoOpen";
import { markCallBooked } from "@/lib/calendlyPrompt";
import { OSM_DISTANCE_KEYS, type OsmDistanceFields } from "@/data/osmDistanceFields";
import type { DetailPageProps } from "./types";

// Lowest common denominator across the per-country detail-endpoint
// responses. Adapters extend this with country-specific fields (IT:
// foglio/particella/area_ha; US: list_price/lot_acres/property_url).
export interface DetailListing extends OsmDistanceFields {
  prob_solar: number | null;
  score: number | null;
  contributions: Record<string, number> | null;
  geom_json: Record<string, unknown> | null;
  location_accuracy_m: number | null;
  rank_global: number;
  access_granted: boolean;
  // Pipeline-passthrough features used by the SHAP card. All optional;
  // a row predating the rematerialization shows N/A for the bar.
  flat_5_acres_pct?: number | null;
  ghi_kwh_m2_yr?: number | null;
  dni_kwh_m2_yr?: number | null;
  pv_specific_yield_kwh_kwp_yr?: number | null;
}

// Build a feature → raw-value map for the SHAP card. Sources are
// free-tier safe per the public mart's passthrough list (OSM
// distances + the flat/irradiance trio), so this is identical across
// countries — locked and unlocked listings see the same values.
function buildFeatureValues(listing: DetailListing): FeatureValues {
  const out: FeatureValues = {};
  for (const k of OSM_DISTANCE_KEYS) out[k] = listing[k];
  out.flat_5_acres_pct = listing.flat_5_acres_pct ?? null;
  out.ghi_kwh_m2_yr = listing.ghi_kwh_m2_yr ?? null;
  out.dni_kwh_m2_yr = listing.dni_kwh_m2_yr ?? null;
  out.pv_specific_yield_kwh_kwp_yr = listing.pv_specific_yield_kwh_kwp_yr ?? null;
  return out;
}

// Strings the shared layout needs in the page's language. Per-country
// extras (e.g. price labels, area units) live inside each adapter's
// renderSpecTiles closure where they're naturally co-located with the
// fields they describe.
export interface DetailStrings {
  backLabel: string;
  propertyDetailsTitle: string;
  whyScoreLabel: (score: number) => string;
  solarProbabilityLabel: string;
  solarProbabilityDescription: (pct: number) => string;
  unlock: { heading: string; description: string; cta: string };
}

export interface DetailRenderCtx {
  accessGranted: boolean;
  openPaywall: () => void;
}

export interface DetailAdapter<T extends DetailListing> {
  lang: "en" | "it";
  unit: "imperial" | "metric";
  /** Suffix on the rank badge — "in US" / "in IT". */
  rankLabel: string;

  /** Country/region/province slugs used by the back URL, the breadcrumb,
   *  the parcel map's overlay catalog, and the listings footer. */
  location(listing: T): { country: string; region?: string; province?: string };

  /** Full SEO bundle (head tags + JSON-LD). RealEstateListing for US,
   *  Product for IT — kept inside the adapter so the schema choice
   *  travels with the country instead of branching in shared code. */
  buildSeo(listing: T): {
    title: string;
    description: string;
    keywords: string;
    structuredData: Record<string, unknown>;
  };

  /** Sub-h1 location line — e.g. "Madison County, AL" or "Bra, Piemonte". */
  formatMeta(listing: T): string;

  /** h1 — e.g. "Solar Land in Madison, AL" or "Solar Parcel - Bra". */
  formatHeading(listing: T): string;

  /** Body of the property-details card. US bundles its source-URL
   *  button below the spec grid (same card); IT puts only the grid here
   *  and uses renderExtras for the cadastral card. */
  renderSpecTiles(listing: T, ctx: DetailRenderCtx): ReactNode;

  /** Optional extra section after the property-details card. IT places
   *  its "Identificativo Catastale" table here; US has none. */
  renderExtras?(listing: T, ctx: DetailRenderCtx): ReactNode;

  strings: DetailStrings;
}

interface SharedDetailPageProps<T extends DetailListing> extends DetailPageProps<T> {
  adapter: DetailAdapter<T>;
}

export function SharedDetailPage<T extends DetailListing>({
  id,
  listing,
  onPaymentSuccess,
  adapter,
}: SharedDetailPageProps<T>) {
  const [paywallOpen, setPaywallOpen] = useState(false);
  usePaywallAutoOpen(() => setPaywallOpen(true));

  // Founder-research call (Trigger A): only signed-in free users are
  // in-audience. Anonymous visitors can't be followed up with; paying
  // users are out of scope for a sales-research conversation.
  const { user } = useAuth();
  const researchEnabled = !!user && !user.has_active_subscription;
  const researchPrompt = useCalendlyResearchPrompt({ enabled: researchEnabled });

  const accessGranted = listing.access_granted;
  const solarPercentage =
    listing.prob_solar != null ? Math.round(listing.prob_solar * 100) : null;
  const scoreInt = listing.score ?? solarPercentage;
  const hasExplanation =
    listing.score != null &&
    listing.contributions != null &&
    Object.keys(listing.contributions).length > 0;

  const featureValues = useMemo(() => buildFeatureValues(listing), [listing]);
  const openPaywall = () => setPaywallOpen(true);
  const ctx: DetailRenderCtx = { accessGranted, openPaywall };

  const location = adapter.location(listing);
  const seo = adapter.buildSeo(listing);
  // SPA listings live under /solar/app/... — the bare /<country>/...
  // shape is the legacy pSEO surface (Netlify-301'd, no route in App.tsx).
  const backParts = ["solar", "app", location.country, location.region, location.province]
    .filter(Boolean);
  const backUrl = `/${backParts.join("/")}`;

  return (
    <>
      <SEOHead
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        structuredData={seo.structuredData}
      />

      <DetailShell
        country={location.country}
        region={location.region}
        province={location.province}
        backUrl={backUrl}
        backLabel={adapter.strings.backLabel}
      >
        <section className="mb-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <MapPin className="w-3.5 h-3.5" />
            <span>{adapter.formatMeta(listing)}</span>
            {listing.rank_global ? (
              <Badge variant="outline" className="ml-auto bg-amber-50/90 border-amber-300 text-amber-700">
                <Trophy className="w-3 h-3 mr-1" />
                #{listing.rank_global} {adapter.rankLabel}
              </Badge>
            ) : null}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {adapter.formatHeading(listing)}
          </h1>
        </section>

        {/* Hero: map anchors the page, score badge overlays the corner,
            SHAP card below acts as the analytical centerpiece. */}
        <section className="relative rounded-xl overflow-hidden mb-6 h-64 md:h-96">
          <MiniParcelMap
            geomJson={listing.geom_json}
            locked={!accessGranted}
            locationAccuracyM={listing.location_accuracy_m}
            className="w-full h-full"
            interactive={accessGranted}
            country={location.country}
            regionSlug={location.region}
          />
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            {scoreInt !== null && (
              <Badge className="text-lg py-1 px-3 bg-primary">
                <Sun className="w-4 h-4 mr-1" />
                {scoreInt}
              </Badge>
            )}
          </div>
          {!accessGranted && <MapLockedOverlay onUnlock={openPaywall} lang={adapter.lang} />}
        </section>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {hasExplanation ? (
            <Card className="md:col-span-2 border-primary/20 bg-gradient-to-b from-primary/[0.03] to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="w-5 h-5 text-primary" />
                  {adapter.strings.whyScoreLabel(listing.score!)}
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
                  unit={adapter.unit}
                  expandable
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="md:col-span-2">
              <CardContent className="pt-6 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{adapter.strings.solarProbabilityLabel}</span>
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
                  {adapter.strings.solarProbabilityDescription(scoreInt ?? 0)}
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6 space-y-4">
              {accessGranted ? (
                <FullAccessBadge />
              ) : (
                <UnlockCTA strings={adapter.strings.unlock} onClick={openPaywall} />
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{adapter.strings.propertyDetailsTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {adapter.renderSpecTiles(listing, ctx)}
          </CardContent>
        </Card>

        {adapter.renderExtras?.(listing, ctx)}

        {/* Proximity table is premium-only: the SHAP card already
            surfaces the OSM distances that actually moved the score,
            so the full 51-field grid only earns its keep for unlocked
            listings where the user wants to inspect every category. */}
        {accessGranted && (
          <ProximityCard
            listing={listing}
            accessGranted={accessGranted}
            lang={adapter.lang}
            unit={adapter.unit}
          />
        )}

        <ListingsFooter
          currentCountry={location.country}
          currentRegion={location.region}
          currentProvince={location.province}
        />
      </DetailShell>

      <PaywallDrawer
        listingId={id}
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        onPaymentSuccess={onPaymentSuccess}
        lang={adapter.lang}
      />

      <ScheduleCallPopup
        open={researchPrompt.open}
        onClose={researchPrompt.close}
        onScheduled={markCallBooked}
      />
    </>
  );
}

function UnlockCTA({
  strings,
  onClick,
}: {
  strings: DetailStrings["unlock"];
  onClick: () => void;
}) {
  return (
    <div className="text-center space-y-3">
      <h3 className="text-lg font-semibold">{strings.heading}</h3>
      <p className="text-sm text-muted-foreground">{strings.description}</p>
      <Button className="w-full" size="lg" onClick={onClick}>
        <Lock className="w-4 h-4 mr-2" />
        {strings.cta}
      </Button>
    </div>
  );
}

// Single shared spec-tile primitive — both adapters render four tiles
// per listing, so factoring the visual primitive saves the duplication.
export function SpecTile({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
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
