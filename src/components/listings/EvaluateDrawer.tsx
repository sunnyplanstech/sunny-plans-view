// Evaluate drawer — opens when the user clicks a parcel card in the
// layer-first preview. Shows a per-active-constraint pass/fail strip,
// the parcel's SunnyScore, and the subscription-gated coordinates +
// source URL block. The card spec keeps this drawer over the map
// instead of routing to a separate detail page; the URL detail page
// (ListingDetail.tsx) stays in place for direct deep-links until it's
// reworked separately.
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Check, ExternalLink, HelpCircle, Lock, Sun, X } from "lucide-react";
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { optionalAuthApi } from "@/lib/apiClient";
import { getParcelCenter } from "@/lib/geo";
import { evaluateLayer, type Verdict } from "@/components/layers/evaluate";
import type { Layer } from "@/components/layers/registry";
import type { BaseListing } from "@/countries/types";

interface EvaluateDrawerProps {
  // The parcel under evaluation. `null` collapses the drawer.
  listing: BaseListing | null;
  // The user's currently selected constraints. Drives the pass/fail
  // strip — when empty, the strip is suppressed and only the
  // SunnyScore + coords block render.
  selectedLayers: Layer[];
  // Free-text title surfaced at the top of the drawer ("Madison
  // County, AL" or "Comune di Bra"). The page composes this from the
  // adapter's `formatScopeName` since the drawer itself is country-
  // agnostic.
  title: string;
  onClose: () => void;
}

// Subset of the listing-detail endpoint we actually read here. The
// endpoint returns "****" for locked text fields and a jittered Point
// for locked geom_json; `access_granted` is the single source of truth
// for whether the user paid.
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

function VerdictIcon({ verdict }: { verdict: Verdict }) {
  if (verdict === "pass") {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
    );
  }
  if (verdict === "fail") {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-700">
        <X className="h-3 w-3" strokeWidth={3} />
      </span>
    );
  }
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <HelpCircle className="h-3 w-3" />
    </span>
  );
}

function verdictLabel(verdict: Verdict): string {
  switch (verdict) {
    case "pass":
      return "Passes";
    case "fail":
      return "Fails";
    case "unknown":
      return "Unknown";
  }
}

function PassFailStrip({
  listing,
  layers,
}: {
  listing: BaseListing;
  layers: Layer[];
}) {
  if (layers.length === 0) return null;
  return (
    <section>
      <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Constraints
      </h3>
      <ul className="divide-y divide-border rounded-md border border-border">
        {layers.map((layer) => {
          const verdict = evaluateLayer(listing, layer);
          return (
            <li
              key={layer.id}
              className="flex items-center gap-3 px-3 py-2.5"
            >
              <VerdictIcon verdict={verdict} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {layer.label}
                </p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {verdictLabel(verdict)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SunnyScoreRow({ listing }: { listing: BaseListing }) {
  const pct =
    listing.prob_solar === null
      ? null
      : Math.round(listing.prob_solar * 100);
  return (
    <section>
      <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        SunnyScore
      </h3>
      <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5">
        <Sun className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {pct === null ? "Not scored" : `${pct}%`}
          </p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary"
              style={{ width: `${pct ?? 0}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function CoordRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <span className="font-mono tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function CoordsBlock({
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
    <section>
      <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Location
      </h3>
      <div className="space-y-2 rounded-md border border-border px-3 py-2.5">
        {center ? (
          <>
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
          </>
        ) : (
          <p className="font-mono text-[10px] text-muted-foreground">
            No geometry on this parcel.
          </p>
        )}
        {!accessGranted && (
          <div className="border-t border-border pt-2">
            <Badge
              variant="outline"
              className="gap-1 border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-200"
            >
              <Lock className="h-3 w-3" />
              Approximate (subscribe for exact)
            </Badge>
          </div>
        )}
      </div>
    </section>
  );
}

function SourceBlock({ detail }: { detail: ListingDetail | undefined }) {
  const granted = detail?.access_granted ?? false;
  const propertyUrl = granted ? detail?.property_url : null;

  if (granted && propertyUrl) {
    return (
      <Button asChild className="w-full" size="lg">
        <a href={propertyUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="mr-2 h-4 w-4" />
          Open on realtor.com
        </a>
      </Button>
    );
  }
  return (
    <Button asChild className="w-full" size="lg" variant="outline">
      <Link to="/checkout">
        <Lock className="mr-2 h-4 w-4" />
        Subscribe to unlock the source listing
      </Link>
    </Button>
  );
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
            <header className="flex items-start justify-between gap-3 border-b border-border bg-gradient-to-b from-muted/30 to-transparent px-5 py-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Evaluate parcel
                </p>
                <h2 className="mt-0.5 text-base font-semibold tracking-tight text-foreground">
                  {title}
                </h2>
              </div>
              <SheetClose className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </SheetClose>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              <PassFailStrip listing={listing} layers={selectedLayers} />
              <SunnyScoreRow listing={listing} />
              <CoordsBlock detail={detail.data} fallbackGeom={listing.geom_json} />
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

export default EvaluateDrawer;
