import { Lock, MapPin, Ruler, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LockedField } from "@/components/listings/LockedField";
import {
  SharedDetailPage,
  SpecTile,
  type DetailAdapter,
  type DetailListing,
} from "../SharedDetailPage";
import type { DetailPageProps } from "../types";

/**
 * IT detail-endpoint response — same locked-payload pattern as US.
 * area_m2/area_ha and the cadastral identifiers (comune_code, foglio,
 * particella) are the IT premium fields: "****" when locked, formatted
 * display strings when unlocked.
 */
export interface ITListingDetail extends DetailListing {
  id: string;
  comune_code: string;
  comune_name: string | null;
  comune_slug: string;
  region_slug: string;
  area_m2: string;
  area_ha: string;
  foglio: string;
  particella: string;
  rank_in_comune: number;
}

function formatSubstationDistance(meters: number | null): string {
  // See US DetailPage — `== null` so 0 m doesn't render as "N/A".
  if (meters == null) return "N/A";
  return `${Math.round(meters)} m`;
}

function formatRegionSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

const itAdapter: DetailAdapter<ITListingDetail> = {
  lang: "it",
  unit: "metric",
  rankLabel: "in IT",

  location(listing) {
    return {
      country: "italy",
      region: listing.region_slug,
      province: listing.comune_slug,
    };
  },

  formatMeta(listing) {
    return `${listing.comune_name}, ${formatRegionSlug(listing.region_slug)}`;
  },

  formatHeading(listing) {
    return `Solar Parcel - ${listing.comune_name}`;
  },

  buildSeo(listing) {
    const regionName = formatRegionSlug(listing.region_slug);
    const solarPercentage =
      listing.prob_solar != null ? Math.round(listing.prob_solar * 100) : null;
    const description = `Particella catastale in ${listing.comune_name}, ${regionName}. Probabilita solare: ${solarPercentage}%. Pre-analizzata per fotovoltaico e BESS.`;
    return {
      title: `Solar Parcel - ${listing.comune_name}, ${regionName} | Sunnyplans`,
      description,
      keywords: `terreni fotovoltaico ${listing.comune_name}, BESS Italia, solare ${regionName}, particelle catastali`,
      structuredData: {
        "@context": "https://schema.org",
        "@type": "Product",
        name: `Solar Parcel - ${listing.comune_name}`,
        description,
        additionalProperty: [
          { "@type": "PropertyValue", name: "Solar Probability", value: `${solarPercentage}%` },
        ],
      },
    };
  },

  renderSpecTiles(listing, { openPaywall }) {
    const regionName = formatRegionSlug(listing.region_slug);
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SpecTile icon={MapPin} label="Comune">{listing.comune_name}</SpecTile>
        <SpecTile icon={MapPin} label="Regione">{regionName}</SpecTile>
        <SpecTile icon={Ruler} label="Area">
          <LockedField value={listing.area_ha} onUnlock={openPaywall} /> ha
        </SpecTile>
        <SpecTile icon={Zap} label="Cabina primaria">
          {formatSubstationDistance(listing.power_substation)}
        </SpecTile>
      </div>
    );
  },

  // Cadastral identifier table — IT-specific second card. Clicking any
  // locked cell opens the paywall (parity with the LockedField pattern
  // used elsewhere on the page).
  renderExtras(listing, { accessGranted, openPaywall }) {
    return (
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
    );
  },

  strings: {
    backLabel: "Torna ai risultati",
    propertyDetailsTitle: "Dettagli Particella",
    whyScoreLabel: (score) => `Perche questa particella ha punteggio ${score}`,
    solarProbabilityLabel: "Probabilita Solare",
    solarProbabilityDescription: (pct) =>
      `Questa particella ha una probabilita del ${pct}% di essere idonea allo sviluppo fotovoltaico.`,
    unlock: {
      heading: "Sblocca questa particella",
      description: "Abbonati per accesso completo, o paga $49 per sbloccare solo questa particella.",
      cta: "Vedi opzioni",
    },
  },
};

function LockedCell() {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      ****
      <Lock className="w-3 h-3" />
    </span>
  );
}

export function ITDetailPage(props: DetailPageProps<ITListingDetail>) {
  return <SharedDetailPage {...props} adapter={itAdapter} />;
}
