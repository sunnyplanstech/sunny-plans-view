// Evaluate drawer — opens when the user clicks a parcel pin or card
// in the layer-first preview. Answers four questions, in order:
// (1) does it pass my spec, (2) what's the SunnyScore, (3) where is
// it, (4) how do I act on it. Sections are flat (border-t dividers,
// no nested cards) so the drawer reads as one document. The detail
// route (ListingDetail.tsx) is still the deep-link target; this is
// the in-context evaluation surface.
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Check, ExternalLink, HelpCircle, Lock, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { optionalAuthApi } from "@/lib/apiClient";
import { getParcelCenter } from "@/lib/geo";
import { evaluateLayer, type Verdict } from "@/components/layers/evaluate";
import type { Layer } from "@/components/layers/registry";
import type { BaseListing } from "@/countries/types";

interface EvaluateDrawerProps {
  // The parcel under evaluation. `null` collapses the drawer.
  listing: BaseListing | null;
  // The user's currently selected constraints. Drives the spec
  // section — when empty, the section is suppressed and the drawer
  // shows only score + location + CTA.
  selectedLayers: Layer[];
  // Free-text title surfaced at the top ("Madison County, AL" or
  // "Comune di Bra"). The page composes this from the adapter's
  // `formatScopeName` since the drawer itself is country-agnostic.
  title: string;
  onClose: () => void;
}

// Subset of the listing-detail endpoint we actually read here. The
// endpoint returns "****" for locked text fields and a jittered Point
// for locked geom_json; `access_granted` is the single source of
// truth for whether the user paid.
interface ListingDetail {
  access_granted: boolean;
  property_url: string;
  geom_json: unknown;
}

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
            </header>

            <div className="flex-1 overflow-y-auto">
              <ScoreSection listing={listing} />
              <SpecSection listing={listing} layers={selectedLayers} />
              <LocationSection
                detail={detail.data}
                fallbackGeom={listing.geom_json}
              />
            </div>

            <footer className="border-t border-border bg-card px-5 py-4">
              <SourceBlock detail={detail.data} />
            </footer>
          </>
        )}
      </SheetContent>
    </Sheet>
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
        <h3 className="tp-eyebrow">SunnyScore</h3>
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
        <h3 className="tp-eyebrow">Spec</h3>
        <span className="tp-mono text-[11px] tabular-nums">
          <span className={cn(allPass ? "text-primary font-semibold" : "text-foreground")}>
            {pass}/{total}
          </span>
          <span className="text-muted-foreground/70"> pass</span>
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

// Lat/lng with a single inline "approximate" tag when locked. The
// numeric precision (2 vs 6 decimals) carries the rest of the signal.
function LocationSection({
  detail,
  fallbackGeom,
}: {
  detail: ListingDetail | undefined;
  fallbackGeom: unknown;
}) {
  const accessGranted = detail?.access_granted ?? false;
  // When granted, the detail endpoint returns the unlocked exact
  // polygon; otherwise we read the public listing's jittered geom.
  const sourceGeom = accessGranted
    ? detail?.geom_json ?? fallbackGeom
    : fallbackGeom;
  const center = getParcelCenter(sourceGeom);

  return (
    <section className="border-t border-border px-5 py-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="tp-eyebrow">Location</h3>
        {!accessGranted && (
          <span className="tp-mono text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-300">
            Approximate
          </span>
        )}
      </div>
      {center ? (
        <dl className="mt-3 space-y-1.5">
          <CoordRow
            label="Lat"
            value={
              accessGranted ? center.lat.toFixed(6) : center.lat.toFixed(2)
            }
          />
          <CoordRow
            label="Lng"
            value={
              accessGranted ? center.lng.toFixed(6) : center.lng.toFixed(2)
            }
          />
        </dl>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          No geometry on this parcel.
        </p>
      )}
    </section>
  );
}

function CoordRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="tp-eyebrow">{label}</span>
      <span className="tp-mono tabular-nums text-foreground">{value}</span>
    </div>
  );
}

// Single CTA. Primary in both states — acting on the parcel and
// upgrading to act are equally important from the user's POV.
function SourceBlock({ detail }: { detail: ListingDetail | undefined }) {
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
      <Link to="/checkout">
        <Lock className="mr-2 h-4 w-4" />
        Subscribe to unlock source listing
      </Link>
    </Button>
  );
}

export default EvaluateDrawer;
