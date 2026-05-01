import { useState } from "react";
import { ChevronDown, ChevronUp, Layers, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { PMTilesLayerConfig } from "./pmtilesLayers";
import type { PMTilesLayerState } from "./usePMTilesOverlays";

interface LayerPanelProps {
  layers: PMTilesLayerConfig[];
  state: Record<string, PMTilesLayerState>;
  onToggle: (id: string) => void;

  // True when the user is on a state/region (or deeper) page. Layers
  // declaring `requiresRegionScope` stay disabled until this flips.
  hasRegionScope?: boolean;

  // Heatmap is special-cased here so the user has one place to manage
  // every overlay; the underlying data shape (server-rendered hexes vs.
  // client-loaded PMTiles) is incidental.
  showHeatmap?: boolean;
  hexLoading?: boolean;
  onToggleHeatmap?: () => void;
}

function rgbCss([r, g, b]: [number, number, number, number]): string {
  return `rgb(${r}, ${g}, ${b})`;
}

export function LayerPanel({
  layers,
  state,
  onToggle,
  hasRegionScope,
  showHeatmap,
  hexLoading,
  onToggleHeatmap,
}: LayerPanelProps) {
  const [open, setOpen] = useState(false);

  const showHeatmapRow = !!onToggleHeatmap;
  const showLayerRows = layers.length > 0;
  if (!showHeatmapRow && !showLayerRows) return null;

  const visibleCount =
    (showHeatmap ? 1 : 0) +
    layers.filter((l) => state[l.id]?.visible).length;

  return (
    <div className="absolute top-3 left-3 z-10 w-64 rounded-lg border-0 bg-gray-800/85 text-white shadow-lg backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm font-medium"
      >
        <span className="flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Layers
          {visibleCount > 0 && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
              {visibleCount}
            </span>
          )}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {open && (
        <div className="space-y-3 border-t border-white/10 px-3 py-3">
          {showHeatmapRow && (
            <div className="space-y-1.5">
              <Button
                variant={showHeatmap ? "default" : "outline"}
                size="sm"
                onClick={onToggleHeatmap}
                disabled={hexLoading}
                className="w-full justify-start border-white/20 bg-transparent text-white hover:bg-white/10"
              >
                {hexLoading ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span
                    className="mr-2 inline-block h-3 w-3 rounded-sm"
                    style={{
                      background:
                        "linear-gradient(90deg, hsl(60,100%,50%), hsl(0,100%,50%))",
                    }}
                  />
                )}
                {hexLoading
                  ? "Loading heatmap…"
                  : showHeatmap
                    ? "Hide heatmap"
                    : "Show heatmap"}
              </Button>
            </div>
          )}

          {layers.map((layer) => {
            const s = state[layer.id] ?? {
              visible: layer.defaultVisible ?? false,
            };
            const gated = !!layer.requiresRegionScope && !hasRegionScope;
            const labelClass = gated
              ? "flex items-start gap-2 text-sm opacity-50"
              : "flex cursor-pointer items-start gap-2 text-sm";
            return (
              <div key={layer.id} className="space-y-1.5">
                <label className={labelClass}>
                  <Checkbox
                    checked={!gated && s.visible}
                    disabled={gated}
                    onCheckedChange={() => !gated && onToggle(layer.id)}
                    className="mt-0.5 border-white/40 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
                  />
                  <span className="flex flex-1 items-center gap-2">
                    <span
                      aria-hidden
                      className="inline-block h-3 w-3 rounded-sm border border-white/30"
                      style={{ background: rgbCss(layer.fillColor) }}
                    />
                    <span className="leading-tight">{layer.label}</span>
                  </span>
                </label>
                {gated ? (
                  <p className="pl-6 text-xs italic text-white/50">
                    Open a state to enable this layer.
                  </p>
                ) : (
                  layer.description && (
                    <p className="pl-6 text-xs text-white/60">
                      {layer.description}
                    </p>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LayerPanel;
