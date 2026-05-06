// Page-level constraint bar — the primary control surface for the
// layer-first listings UI (roadmap p1-e3-layer-first-ui). Sits on the
// left rail and drives both the listings filter and the map overlay
// selection. The in-map deck.gl LayerPanel is suppressed when this
// page-level bar is mounted (selection is page-level, not map-local).
//
// Each row exposes:
//   - the constraint name in user-language
//   - a toggle (selection persists across zoom / scope changes)
//   - the constraint's current effect on the visible listings, when it
//     can be evaluated locally
//   - an "out-of-scope" hint when the user is below the layer's
//     minZoom or outside the region the overlay needs
//
// No bundle / preset UI — v1 of the layer-first redesign explicitly
// drops the fieldkit shortcut. If user testing shows expert users want
// presets we add them back as a thin wrapper over `onToggle`.
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Layer } from "./registry";
import type { LayerEffect } from "./evaluate";
import { layerTag } from "./layerTag";

interface ConstraintBarProps {
  layers: Layer[];
  selectedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onClear: () => void;
  // Effect counters per layer, derived from the visible listings array.
  // Layers without an entry render with no counter — that's an honest
  // "we don't know per-listing yet", not a 0.
  effectsById: Record<string, LayerEffect>;
  // Total listings in the current scope. The denominator for the row's
  // counter ("740 / 12,400 qualify") and the empty-selection summary.
  totalListings: number;
  // Current map zoom. Layers with `minZoom > currentZoom` show a
  // "zoom in to apply" hint; their toggle stays selectable.
  currentZoom?: number;
  // True when the user is on a region (state / italian region) page or
  // deeper. Drives the `requiresRegionScope` hint independently of zoom.
  hasRegionScope: boolean;
}

interface RowState {
  belowMinZoom: boolean;
  needsRegion: boolean;
  effect?: LayerEffect;
}

function rowState(
  layer: Layer,
  effectsById: Record<string, LayerEffect>,
  hasRegionScope: boolean,
  currentZoom?: number,
): RowState {
  return {
    belowMinZoom: currentZoom !== undefined && currentZoom < layer.minZoom,
    needsRegion: !!layer.requiresRegionScope && !hasRegionScope,
    effect: effectsById[layer.id],
  };
}

// "740/12,400" — fixed-width-friendly. Returns null when the layer has
// no per-listing data on the payload yet (so the row stays honest
// instead of showing a meaningless zero).
function effectRatio(effect: LayerEffect, total: number): string | null {
  const evaluated = effect.passing + effect.failing;
  if (evaluated === 0) return null;
  return `${effect.passing.toLocaleString()}/${total.toLocaleString()}`;
}

export function ConstraintBar({
  layers,
  selectedIds,
  onToggle,
  onClear,
  effectsById,
  totalListings,
  currentZoom,
  hasRegionScope,
}: ConstraintBarProps) {
  if (layers.length === 0) {
    return (
      <aside className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No constraints configured for this country yet.
        </p>
      </aside>
    );
  }

  const selectedCount = selectedIds.size;

  return (
    <aside className="rounded-lg border border-border/70 bg-card shadow-sm overflow-hidden">
      <header className="flex items-baseline justify-between gap-3 border-b border-border/60 bg-gradient-subtle px-4 py-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-semibold text-foreground">Constraints</h2>
          <span className="tp-mono text-[10px] text-muted-foreground tabular-nums">
            {selectedCount}/{layers.length} on
          </span>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={selectedCount === 0}
          className={cn(
            "text-[11px] font-medium transition-colors",
            selectedCount === 0
              ? "text-muted-foreground/40 cursor-default"
              : "text-muted-foreground hover:text-primary",
          )}
        >
          Clear all
        </button>
      </header>

      <ul className="divide-y divide-border/60">
        {layers.map((layer) => {
          const selected = selectedIds.has(layer.id);
          const state = rowState(layer, effectsById, hasRegionScope, currentZoom);
          const ratio = state.effect ? effectRatio(state.effect, totalListings) : null;
          const showRatio = !state.belowMinZoom && ratio !== null;
          const tag = layerTag(layer.id);
          return (
            <li key={layer.id}>
              <button
                type="button"
                className="tp-row focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                aria-pressed={selected}
                onClick={() => onToggle(layer.id)}
              >
                <span
                  aria-hidden
                  className={cn(
                    "tp-mono mt-0.5 inline-flex h-6 min-w-[44px] items-center justify-center rounded-md border px-1.5 text-[10px] font-semibold tracking-wider transition-colors",
                    selected
                      ? "border-primary/60 bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground",
                  )}
                >
                  {tag}
                </span>
                <div className="min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={cn(
                        "text-[13px] leading-tight",
                        selected
                          ? "font-semibold text-foreground"
                          : "font-medium text-foreground/90",
                      )}
                    >
                      {layer.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                    {layer.description}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {showRatio && (
                      <span className="tp-mono text-[10px] tabular-nums text-muted-foreground">
                        {ratio} qualify
                      </span>
                    )}
                    {state.belowMinZoom && (
                      <Badge variant="outline" className="h-4 gap-1 border-amber-300 bg-amber-50 px-1.5 text-[9px] font-medium tracking-wider text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                        Z{layer.minZoom}+
                      </Badge>
                    )}
                    {!state.belowMinZoom && state.needsRegion && (
                      <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-medium tracking-wider text-muted-foreground">
                        Region
                      </Badge>
                    )}
                  </div>
                </div>
                <span
                  aria-hidden
                  className={cn(
                    "mt-1 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition-colors",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-transparent",
                  )}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

export default ConstraintBar;
