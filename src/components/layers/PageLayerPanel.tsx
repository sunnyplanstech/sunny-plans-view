// Page-level LayerPanel — the primary control surface for the
// layer-first listings UI (roadmap p1-e3-layer-first-ui). Sits on the
// left rail and drives both the listings filter and the map overlay
// selection. The in-map deck.gl LayerPanel is suppressed when this
// page-level panel is mounted (selection is page-level, not map-local).
//
// Visual direction: field workstation. Bundle presets at the top read
// like "fieldkits"; layer rows have a tile-style swatch that mimics
// the on-map fill so the map ↔ panel mapping is legible at a glance.
import { useMemo } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type Layer,
  type Vertical,
  VERTICAL_BUNDLES,
  layersInVertical,
} from "./registry";

interface PageLayerPanelProps {
  layers: Layer[];
  selectedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onSelectBundle: (vertical: Vertical) => void;
  onClear: () => void;
  // True when the user is on a state/region (or deeper) page. Layers
  // declaring `requiresRegionScope` show a hint here even though the
  // checkbox stays usable — for filter-only layers (e.g. slope_lt_5
  // with min_flat_5_acres) the listings filter still works at the
  // national level, only the map overlay is scope-gated. We surface
  // the hint without disabling the row.
  hasRegionScope: boolean;
}

// CSS background patterns that telegraph the on-map look without
// embedding a full preview tile. Defined inline so the panel stays
// portable; if we ever add a 4th layer style, lift this to a util.
function swatchStyle(layer: Layer, selected: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    transition: "all 200ms ease",
  };
  if (layer.id.startsWith("slope_lt_5")) {
    return {
      ...base,
      background: selected
        ? "repeating-linear-gradient(45deg, hsl(95 55% 50% / 0.95) 0 4px, hsl(95 55% 42% / 0.95) 4px 8px)"
        : "repeating-linear-gradient(45deg, hsl(95 30% 70% / 0.5) 0 4px, hsl(95 30% 60% / 0.5) 4px 8px)",
    };
  }
  if (layer.id === "nwi_us") {
    return {
      ...base,
      background: selected
        ? "repeating-linear-gradient(135deg, hsl(218 80% 50% / 0.85) 0 3px, hsl(218 80% 42% / 0.85) 3px 6px)"
        : "repeating-linear-gradient(135deg, hsl(218 35% 70% / 0.5) 0 3px, hsl(218 35% 62% / 0.5) 3px 6px)",
    };
  }
  // Protected areas (PAD-US, Natura 2000) — warm crimson cross-hatch.
  return {
    ...base,
    background: selected
      ? "repeating-linear-gradient(45deg, hsl(355 60% 50% / 0.85) 0 3px, hsl(355 60% 42% / 0.85) 3px 7px)"
      : "repeating-linear-gradient(45deg, hsl(355 30% 70% / 0.5) 0 3px, hsl(355 30% 62% / 0.5) 3px 7px)",
  };
}

export function PageLayerPanel({
  layers,
  selectedIds,
  onToggle,
  onSelectBundle,
  onClear,
  hasRegionScope,
}: PageLayerPanelProps) {
  const verticals = useMemo(
    () =>
      VERTICAL_BUNDLES.filter(
        (b) => layersInVertical(layers, b.vertical).length > 0,
      ),
    [layers],
  );
  const selectedCount = selectedIds.size;

  if (layers.length === 0) {
    return (
      <aside className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No layers configured for this country yet.
        </p>
      </aside>
    );
  }

  return (
    <aside className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      <header className="border-b border-border bg-gradient-to-b from-muted/30 to-transparent px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">
          Layer-first preview · workspace
        </p>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground">Layers</h2>
          <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
            {selectedCount}/{layers.length} on
          </span>
        </div>
      </header>

      {verticals.length > 0 && (
        <section className="border-b border-border px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            Fieldkits
          </p>
          <div className="flex flex-wrap gap-1.5">
            {verticals.map((bundle) => {
              const bundleLayers = layersInVertical(layers, bundle.vertical);
              const allOn =
                bundleLayers.length > 0 &&
                bundleLayers.every((l) => selectedIds.has(l.id));
              return (
                <button
                  key={bundle.vertical}
                  type="button"
                  onClick={() => onSelectBundle(bundle.vertical)}
                  title={bundle.description}
                  className={cn(
                    "group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
                    "text-[11px] font-medium transition-all",
                    allOn
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:border-primary/60 hover:bg-muted/40",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "inline-block h-1.5 w-1.5 rounded-full",
                      allOn ? "bg-primary-foreground" : "bg-primary/70",
                    )}
                  />
                  {bundle.label}
                  <span className="font-mono text-[10px] opacity-70 tabular-nums">
                    ·{bundleLayers.length}
                  </span>
                </button>
              );
            })}
            {selectedCount > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="ml-auto inline-flex items-center rounded-full border border-transparent px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </section>
      )}

      <ul className="divide-y divide-border">
        {layers.map((layer) => {
          const selected = selectedIds.has(layer.id);
          const scopeHint =
            !!layer.requiresRegionScope &&
            !hasRegionScope &&
            !!layer.pmtilesLayerId;
          return (
            <li key={layer.id}>
              <button
                type="button"
                onClick={() => onToggle(layer.id)}
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
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
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
                    {layer.listingsFilter && (
                      <span className="font-mono text-[10px] text-muted-foreground/80">
                        ?{layer.listingsFilter.param}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                    {layer.description}
                  </p>
                  {scopeHint && (
                    <p className="mt-1 font-mono text-[10px] italic text-muted-foreground/80">
                      Map overlay activates inside a state / region
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

export default PageLayerPanel;
