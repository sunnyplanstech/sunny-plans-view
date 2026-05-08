// SpecChipsHeader — the user's project spec rendered as a single line
// of removable pill chips above the workspace. Reframes the page
// identity around the spec: instead of "all listings, then filter",
// the page is "here is YOUR spec, applied to YOUR scope".
//
// Visual family — uses the landing page's `bg-gradient-card` rounded
// pill (see `Hero.tsx` "Geo-Analytics for Renewable Energy" badge) so
// it reads as part of the same brand surface as the marketing pages.
//
// Pure presentational — no fetching or mutation, just renders the
// spec the page already owns and forwards toggle/clear callbacks
// back up.
import { Layers, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Layer } from "./registry";
import { layerTag } from "./layerTag";

interface SpecChipsHeaderProps {
  // The user's selected constraints, in the order the bar shows them.
  // Empty array renders the ghost "build your spec" affordance.
  selectedLayers: Layer[];
  // Country / region / province segments already title-cased by the
  // page. Renders as a locked scope chip on the left so the user
  // always sees what their spec is being applied against.
  scopeSegments: string[];
  onRemove: (layerId: string) => void;
  onClear: () => void;
  // Optional: called when the user taps the empty-state ghost chip.
  // Mobile pages can route this to "open the constraints surface";
  // desktop pages can leave it undefined (the bar is always visible).
  onAddIntent?: () => void;
}

export function SpecChipsHeader({
  selectedLayers,
  scopeSegments,
  onRemove,
  onClear,
  onAddIntent,
}: SpecChipsHeaderProps) {
  const hasSpec = selectedLayers.length > 0;
  return (
    <div
      role="group"
      aria-label="Project spec"
      className="border-b border-border/60 bg-gradient-subtle"
    >
      <div className="container mx-auto flex flex-wrap items-center gap-2 px-4 py-2.5">
        <SpecLeadLabel hasSpec={hasSpec} />
        <ScopeChip segments={scopeSegments} />
        {hasSpec ? (
          <>
            {selectedLayers.map((layer) => (
              <ConstraintChip
                key={layer.id}
                layer={layer}
                onRemove={() => onRemove(layer.id)}
              />
            ))}
            <ClearAllButton onClear={onClear} />
          </>
        ) : (
          <AddIntentChip onClick={onAddIntent} />
        )}
      </div>
    </div>
  );
}

function SpecLeadLabel({ hasSpec }: { hasSpec: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <Layers className="h-3.5 w-3.5 text-primary" />
      {hasSpec ? "Your spec" : "No spec yet"}
    </span>
  );
}

function ScopeChip({ segments }: { segments: string[] }) {
  if (segments.length === 0) return null;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-gradient-card px-3 py-1 text-xs"
      aria-label={`Scope: ${segments.join(" › ")}`}
    >
      {segments.map((seg, i) => (
        <span key={`${seg}-${i}`} className="inline-flex items-center gap-1.5">
          <span
            className={cn(
              i === segments.length - 1
                ? "font-semibold text-foreground"
                : "text-muted-foreground",
            )}
          >
            {seg}
          </span>
          {i < segments.length - 1 && (
            <span aria-hidden className="text-muted-foreground/50">
              ›
            </span>
          )}
        </span>
      ))}
    </span>
  );
}

function ConstraintChip({
  layer,
  onRemove,
}: {
  layer: Layer;
  onRemove: () => void;
}) {
  const tag = layerTag(layer.id);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-gradient-card pl-2 pr-1 py-1 text-xs shadow-sm">
      <span className="tp-mono text-[9px] font-semibold tracking-wider text-primary">
        {tag}
      </span>
      <span className="font-medium text-foreground">{layer.label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        aria-label={`Remove ${layer.label} from spec`}
      >
        <X className="h-3 w-3" strokeWidth={2.5} />
      </button>
    </span>
  );
}

function ClearAllButton({ onClear }: { onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors"
    >
      Clear all
    </button>
  );
}

function AddIntentChip({ onClick }: { onClick?: () => void }) {
  const className =
    "inline-flex items-center gap-1.5 rounded-full border border-dashed border-border bg-background/60 px-3 py-1 text-[11px] text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors";
  if (!onClick) {
    return (
      <span className={className}>
        <Plus className="h-3 w-3" strokeWidth={2.5} />
        Pick a constraint to start your spec
      </span>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      <Plus className="h-3 w-3" strokeWidth={2.5} />
      Build your spec
    </button>
  );
}

export default SpecChipsHeader;
