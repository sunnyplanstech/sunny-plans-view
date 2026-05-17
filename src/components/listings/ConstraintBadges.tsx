import { Check, X, Minus } from "lucide-react";
import { evaluateLayer, type Verdict } from "@/components/layers/evaluate";
import type { Layer } from "@/components/layers/registry";
import type { BaseListing } from "@/countries/types";
import { cn } from "@/lib/utils";

// One badge per active filter layer that has a per-listing chip — overlay-only
// layers (PAD, NWI, Natura 2000) are mart-level invariants, so every visible
// listing trivially "passes" and a badge would be noise. Fails are rare in
// the rail (cohort is pre-filtered) but kept distinct so the EvaluateDrawer
// can reuse this without surprise.
interface Props {
  listing: BaseListing;
  selectedLayers: ReadonlyArray<Layer>;
  className?: string;
}

const TONE: Record<Verdict, string> = {
  pass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  fail: "bg-rose-50 text-rose-700 border-rose-200",
  unknown: "bg-muted text-muted-foreground border-border/60",
};

const ICON: Record<Verdict, typeof Check> = {
  pass: Check,
  fail: X,
  unknown: Minus,
};

export function ConstraintBadges({ listing, selectedLayers, className }: Props) {
  const evaluable = selectedLayers.filter((l) => l.chip);
  if (evaluable.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {evaluable.map((layer) => {
        const verdict = evaluateLayer(listing, layer);
        const Icon = ICON[verdict];
        return (
          <span
            key={layer.id}
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-medium leading-none",
              TONE[verdict],
            )}
            title={`${layer.label}: ${verdict}`}
          >
            <Icon className="h-2.5 w-2.5" />
            {layer.label}
          </span>
        );
      })}
    </div>
  );
}

export default ConstraintBadges;
