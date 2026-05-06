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
import { cn } from "@/lib/utils";
import type { Layer } from "./registry";
import type { LayerEffect } from "./evaluate";

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

function swatchStyle(layer: Layer, selected: boolean): React.CSSProperties {
  if (layer.id.startsWith("slope_lt_5")) {
    return {
      background: selected
        ? "repeating-linear-gradient(45deg, hsl(95 55% 50% / 0.95) 0 4px, hsl(95 55% 42% / 0.95) 4px 8px)"
        : "repeating-linear-gradient(45deg, hsl(95 30% 70% / 0.5) 0 4px, hsl(95 30% 60% / 0.5) 4px 8px)",
    };
  }
  if (layer.id === "nwi_us") {
    return {
      background: selected
        ? "repeating-linear-gradient(135deg, hsl(218 80% 50% / 0.85) 0 3px, hsl(218 80% 42% / 0.85) 3px 6px)"
        : "repeating-linear-gradient(135deg, hsl(218 35% 70% / 0.5) 0 3px, hsl(218 35% 62% / 0.5) 3px 6px)",
    };
  }
  return {
    background: selected
      ? "repeating-linear-gradient(45deg, hsl(355 60% 50% / 0.85) 0 3px, hsl(355 60% 42% / 0.85) 3px 7px)"
      : "repeating-linear-gradient(45deg, hsl(355 30% 70% / 0.5) 0 3px, hsl(355 30% 62% / 0.5) 3px 7px)",
  };
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

function effectLabel(effect: LayerEffect, total: number): string | null {
  const evaluated = effect.passing + effect.failing;
  if (evaluated === 0) return null;
  return `${effect.passing} / ${total} qualify`;
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
    <aside className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      <header className="border-b border-border bg-gradient-to-b from-muted/30 to-transparent px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">
          Layer-first preview · constraints
        </p>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground">Constraints</h2>
          <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
            {selectedCount}/{layers.length} on
          </span>
        </div>
        {selectedCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="mt-2 inline-flex items-center rounded-sm border border-transparent text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear all
          </button>
        )}
      </header>

      <ul className="divide-y divide-border">
        {layers.map((layer) => {
          const selected = selectedIds.has(layer.id);
          const state = rowState(layer, effectsById, hasRegionScope, currentZoom);
          const effectText = state.effect
            ? effectLabel(state.effect, totalListings)
            : null;
          const showCounter = !state.belowMinZoom && effectText !== null;
          return (
            <li key={layer.id}>
              <button
                type="button"
                onClick={() => onToggle(layer.id)}
                aria-pressed={selected}
                className={cn(
                  "group relative flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                  "hover:bg-muted/40",
                  selected && "bg-muted/30",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-y-0 left-0 w-[3px] transition-all",
                    selected ? "bg-primary" : "bg-transparent",
                  )}
                />
                <span
                  aria-hidden
                  className={cn(
                    "relative mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border",
                    selected
                      ? "border-foreground/20 shadow-inner"
                      : "border-border/70 opacity-70 group-hover:opacity-100",
                  )}
                  style={swatchStyle(layer, selected)}
                >
                  {selected && (
                    <Check
                      strokeWidth={3}
                      className="h-3.5 w-3.5 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]"
                    />
                  )}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={cn(
                        "text-sm leading-tight",
                        selected
                          ? "font-semibold text-foreground"
                          : "font-medium text-foreground/85",
                      )}
                    >
                      {layer.label}
                    </span>
                    {showCounter && (
                      <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                        {effectText}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] leading-snug text-muted-foreground">
                    {layer.description}
                  </p>
                  {state.belowMinZoom && (
                    <p className="font-mono text-[10px] italic text-muted-foreground/80">
                      Zoom in to apply (z{layer.minZoom}+)
                    </p>
                  )}
                  {!state.belowMinZoom && state.needsRegion && (
                    <p className="font-mono text-[10px] italic text-muted-foreground/80">
                      Map overlay activates inside a region
                    </p>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

export default ConstraintBar;
