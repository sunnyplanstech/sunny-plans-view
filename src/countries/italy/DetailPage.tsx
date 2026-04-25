import { useQuery } from "@tanstack/react-query";
import { MapPin, Zap, Sun, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient, publicApi } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { getParcelCenter } from "@/lib/geo";
import SEOHead from "@/components/listings/SEOHead";
import ListingsFooter from "@/components/listings/ListingsFooter";
import MiniParcelMap from "@/components/maps/MiniParcelMap";
import { ProximityCard } from "@/components/listings/ProximityCard";
import { SubscribeCTA, FullAccessBadge } from "@/components/listings/SubscribeCTA";
import { DetailShell, DetailLoading, DetailNotFound } from "@/components/listings/DetailShell";
import type { OsmDistanceFields } from "@/data/osmDistanceFields";
import type { DetailPageProps } from "../types";
import type { ITListing } from "./index";

export interface ITPremiumListing extends OsmDistanceFields {
  id: string;
  comune_code: string;
  comune_name: string | null;
  comune_slug: string;
  region_slug: string;
  prob_solar: number;
  lat: number;
  lon: number;
  area_m2: number | null;
  area_ha: number | null;
  geom_json: Record<string, unknown> | null;
  rank_global: number;
  rank_in_comune: number;
}

function useITPublicListing(id: string) {
  return useQuery({
    queryKey: ["it-listing", id],
    queryFn: () => publicApi<ITListing>(`/api/listings/it/public/${id}/`),
  });
}

function useITPremiumListing(id: string, isAuthenticated: boolean) {
  return useQuery({
    queryKey: ["it-premium-listing", id],
    queryFn: async () => {
      const res = await apiClient(`/api/listings/it/${id}/detail/`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return (await res.json()) as ITPremiumListing;
    },
    enabled: isAuthenticated,
  });
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

export function ITDetailPage({ id, country, region, province }: DetailPageProps) {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { data: publicListing, isLoading, error } = useITPublicListing(id);
  const { data: premium } = useITPremiumListing(id, isAuthenticated);

  if (isLoading) return <DetailLoading />;
  if (error || !publicListing) return <DetailNotFound country={country} />;

  const solarPercentage = publicListing.prob_solar ? Math.round(publicListing.prob_solar * 100) : null;
  const center = premium
    ? { lat: premium.lat, lng: premium.lon }
    : getParcelCenter(publicListing.geom_json);
  const regionName = formatRegionSlug(publicListing.region_slug);

  const seoTitle = `Solar Parcel - ${publicListing.comune_name}, ${regionName} | Sunnyplans`;
  const seoDescription = `Particella catastale in ${publicListing.comune_name}, ${regionName}. Probabilita solare: ${solarPercentage}%. Pre-analizzata per fotovoltaico e BESS.`;
  const combinedKeywords = `terreni fotovoltaico ${publicListing.comune_name}, BESS Italia, solare ${regionName}, particelle catastali`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `Solar Parcel - ${publicListing.comune_name}`,
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
          <MiniParcelMap lat={center?.lat ?? null} lon={center?.lng ?? null} className="w-full h-full" />
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            {solarPercentage !== null && (
              <Badge className="text-lg py-1 px-3 bg-primary">
                <Sun className="w-4 h-4 mr-1" />
                {solarPercentage}%
              </Badge>
            )}
            {publicListing.rank_global && (
              <Badge variant="outline" className="bg-amber-50/90 border-amber-300 text-amber-700 py-1">
                <Trophy className="w-3 h-3 mr-1" />
                #{publicListing.rank_global} in IT
              </Badge>
            )}
          </div>
        </section>

        <section className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Solar Parcel - {publicListing.comune_name}
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>
              {publicListing.comune_name}, {regionName}
            </span>
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
                  {publicListing.comune_name}
                </SpecTile>
                <SpecTile icon={MapPin} label="Regione">
                  {regionName}
                </SpecTile>
                {premium && (
                  <SpecTile icon={Zap} label="Substation Distance">
                    {formatSubstationDistance(premium.power_substation)}
                  </SpecTile>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6 space-y-4">
              {isAuthenticated ? (
                <FullAccessBadge />
              ) : (
                <SubscribeCTA openAuthModal={openAuthModal} lang="it" />
              )}
            </CardContent>
          </Card>
        </div>

        <ProximityCard premium={premium} publicData={publicListing} lang="it" unit="metric" />

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
