// Evaluate drawer — opens when the user clicks a parcel pin or card
// in the layer-first preview. Answers four questions, in order:
// (1) does it pass my spec, (2) what's the SunnyScore, (3) where is
// it, (4) how do I act on it. Sections are flat (border-t dividers,
// no nested cards) so the drawer reads as one document. The detail
// route (ListingDetail.tsx) is still the deep-link target; this is
// the in-context evaluation surface.
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, Check, ExternalLink, HelpCircle, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { optionalAuthApi } from "@/lib/apiClient";
import { evaluateLayer, type Verdict } from "@/components/layers/evaluate";
import type { Layer } from "@/components/layers/registry";
import type { BaseListing } from "@/countries/types";
import type { OsmDistanceFields } from "@/data/osmDistanceFields";
import MiniParcelMap from "@/components/maps/MiniParcelMap";

interface EvaluateDrawerProps {
  // The parcel under evaluation. `null` collapses the drawer.
  listing: BaseListing | null;
  // The user's currently selected constraints. Drives the spec
  // section — when empty, the section is suppressed and the drawer
  // shows only score + location + CTA.
  selectedLayers: Layer[];
  // Free-text title for the clicked parcel (e.g. "Madison County, AL"
  // or "Bra"). The page composes this from the listing's own admin
  // fields since the drawer itself is country-agnostic.
  title: string;
  // Country-formatted spec line under the title — typically
  // ["~12.4 ac", "~$285k", "~0.8 mi to substation"]. Joined with
  // `·` separators. Composed by the page since size/price/distance
  // fields are country-specific.
  summary?: string[];
  // Distance unit for the proximity section — imperial for US,
  // metric for IT. Defaults to imperial.
  unit?: "imperial" | "metric";
  onClose: () => void;
}

// Detail-endpoint response. The endpoint returns "****" for locked
// text fields and a jittered Point for locked geom_json;
// `access_granted` is the single source of truth for whether the
// user paid. OSM distance fields are real numbers regardless — they
// aren't parcel-identifying so the API returns them in the clear.
type ListingDetail = OsmDistanceFields & {
  access_granted: boolean;
  property_url: string;
  geom_json: unknown;
};

function useListingDetail(id: string | null) {
  return useQuery({
    queryKey: ["listing-detail", id],
    queryFn: () => optionalAuthApi<ListingDetail>(`/api/listings/${id}/detail/`),
    enabled: !!id,
  });
}

export function EvaluateDrawer({
  listing,
  selectedLayers,
  title,
  summary,
  unit = "imperial",
  onClose,
}: EvaluateDrawerProps) {
  const isOpen = listing !== null;
  const detail = useListingDetail(listing?.id ?? null);
  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="right"
        className={cn(
          "w-full sm:max-w-md flex flex-col gap-0 p-0",
          "data-[state=open]:duration-300",
        )}
      >
        {listing && (
          <>
            <header className="border-b border-border bg-gradient-subtle px-5 py-4 pr-12">
              <h2 className="text-lg font-semibold tracking-tight text-foreground truncate">
                {title}
              </h2>
              {summary && summary.length > 0 && (
                <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                  {summary.join(" · ")}
                </p>
              )}
            </header>

            <div className="flex-1 overflow-y-auto">
              <ThumbnailSection
                detail={detail.data}
                fallbackGeom={listing.geom_json}
                fallbackAccuracyM={listing.location_accuracy_m}
              />
              <ScoreSection listing={listing} />
              <SpecSection listing={listing} layers={selectedLayers} />
              <ProximitySection detail={detail.data} unit={unit} />
            </div>

            <footer className="border-t border-border bg-card px-5 py-4">
              <SourceBlock detail={detail.data} listingId={listing.id} />
            </footer>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Visual confirmation. The same parcel is shown on the protagonist
// map already, but the drawer is anchored to one parcel — a small
// thumbnail removes the "wait, which one did I click?" moment.
function ThumbnailSection({
  detail,
  fallbackGeom,
  fallbackAccuracyM,
}: {
  detail: ListingDetail | undefined;
  fallbackGeom: unknown;
  fallbackAccuracyM: number | null;
}) {
  const accessGranted = detail?.access_granted ?? false;
  const geom = accessGranted ? detail?.geom_json ?? fallbackGeom : fallbackGeom;
  return (
    <section className="px-5 pt-5">
      <div className="h-40 w-full overflow-hidden rounded-md border border-border bg-muted/30">
        <MiniParcelMap
          geomJson={geom}
          locationAccuracyM={accessGranted ? null : fallbackAccuracyM}
          className="w-full h-full"
        />
      </div>
    </section>
  );
}

// SunnyScore — single signal carrying grid viability that's not
// exposed as a toggleable layer. Tone-graded against brand primary.
function ScoreSection({ listing }: { listing: BaseListing }) {
  const value =
    listing.prob_solar === null ? null : Math.round(listing.prob_solar * 100);
  const tone =
    value === null
      ? "text-muted-foreground/60"
      : value >= 70
        ? "text-primary"
        : value >= 50
          ? "text-foreground"
          : "text-muted-foreground";
  return (
    <section className="px-5 py-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">SunnyScore</h3>
        <span
          className={cn(
            "text-3xl font-semibold leading-none tabular-nums",
            tone,
          )}
        >
          {value ?? "—"}
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
          style={{ width: `${value ?? 0}%` }}
        />
      </div>
    </section>
  );
}

// Pass/fail per active constraint. Icon + label only — the icon
// carries the verdict, layer.label is already user-language.
function SpecSection({
  listing,
  layers,
}: {
  listing: BaseListing;
  layers: Layer[];
}) {
  if (layers.length === 0) return null;
  const verdicts = layers.map((l) => ({
    layer: l,
    verdict: evaluateLayer(listing, l),
  }));
  const pass = verdicts.filter((v) => v.verdict === "pass").length;
  const total = verdicts.length;
  const allPass = pass === total;

  return (
    <section className="border-t border-border px-5 py-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Spec</h3>
        <span className="text-xs tabular-nums">
          <span className={cn(allPass ? "text-primary font-semibold" : "text-foreground")}>
            {pass} of {total}
          </span>
          <span className="text-muted-foreground"> pass</span>
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        {verdicts.map(({ layer, verdict }) => (
          <li key={layer.id} className="flex items-center gap-3">
            <VerdictIcon verdict={verdict} />
            <span className="text-sm text-foreground truncate">
              {layer.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function VerdictIcon({ verdict }: { verdict: Verdict }) {
  if (verdict === "pass") {
    return (
      <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
    );
  }
  if (verdict === "fail") {
    return (
      <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
        <X className="h-3 w-3" strokeWidth={3} />
      </span>
    );
  }
  return (
    <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <HelpCircle className="h-3 w-3" />
    </span>
  );
}

// Key OSM proximities. Solar/BESS developers care most about (a) how
// far to the grid (substation + transmission line), (b) road access
// for construction, (c) distance to load centers / nearest built-up
// area. The full 53-field breakdown lives on the detail page; the
// drawer surfaces only these four because they drive most of the
// site-usability gut-check.
const PROXIMITY_ROWS: ReadonlyArray<{
  label: string;
  // First non-null wins so we always show the closest of a category.
  fields: ReadonlyArray<keyof OsmDistanceFields>;
}> = [
  { label: "Substation", fields: ["power_substation"] },
  { label: "Transmission line", fields: ["power_line"] },
  {
    label: "Major road",
    fields: ["highway_motorway", "highway_trunk", "highway_primary"],
  },
  {
    label: "Built-up area",
    fields: ["landuse_residential", "landuse_commercial"],
  },
];

function nearestOf(
  detail: ListingDetail,
  fields: ReadonlyArray<keyof OsmDistanceFields>,
): number | null {
  let best: number | null = null;
  for (const f of fields) {
    const v = detail[f];
    if (v != null && Number.isFinite(v) && (best == null || v < best)) best = v;
  }
  return best;
}

function formatMeters(meters: number, unit: "imperial" | "metric"): string {
  if (unit === "imperial") {
    const miles = meters * 0.000621371;
    if (miles < 0.1) return `${Math.round(meters)} m`;
    return `${miles.toFixed(miles < 10 ? 2 : 1)} mi`;
  }
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  return `${km.toFixed(km < 10 ? 2 : 1)} km`;
}

function ProximitySection({
  detail,
  unit,
}: {
  detail: ListingDetail | undefined;
  unit: "imperial" | "metric";
}) {
  if (!detail) return null;
  const accessGranted = detail.access_granted;
  const rows = PROXIMITY_ROWS.map(({ label, fields }) => ({
    label,
    meters: nearestOf(detail, fields),
  })).filter((r) => r.meters !== null) as Array<{ label: string; meters: number }>;
  if (rows.length === 0) return null;
  return (
    <section className="border-t border-border px-5 py-5">
      <h3 className="text-sm font-semibold text-foreground">Proximity</h3>
      <dl className="mt-3 space-y-1.5">
        {rows.map(({ label, meters }) => (
          <div
            key={label}
            className="flex items-baseline justify-between gap-3 text-sm"
          >
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="tabular-nums font-medium text-foreground">
              {accessGranted ? "" : "~"}
              {formatMeters(meters, unit)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// Single CTA. Unlocked users jump straight to the source listing on
// realtor.com; everyone else gets a path into the full detail page,
// where the per-object proximity breakdown lives and where premium
// fields show their own paywall CTAs.
function SourceBlock({
  detail,
  listingId,
}: {
  detail: ListingDetail | undefined;
  listingId: string;
}) {
  const granted = detail?.access_granted ?? false;
  const propertyUrl = granted ? detail?.property_url : null;

  if (granted && propertyUrl) {
    return (
      <Button asChild className="w-full" size="lg">
        <a href={propertyUrl} target="_blank" rel="noopener noreferrer">
          Open on realtor.com
          <ExternalLink className="ml-2 h-4 w-4" />
        </a>
      </Button>
    );
  }
  return (
    <Button asChild className="w-full" size="lg">
      <Link to={`/listing/${listingId}`}>
        View full details
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </Button>
  );
}

export default EvaluateDrawer;
