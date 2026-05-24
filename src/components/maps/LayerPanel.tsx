import { useState } from "react";
import { ChevronDown, ChevronUp, Layers, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { PMTilesLayerConfig } from "./pmtilesLayers";
import type {
  LayerHeader,
  LayerProgress,
  PMTilesLayerState,
} from "./usePMTilesOverlays";

interface LayerPanelProps {
  layers: PMTilesLayerConfig[];
  state: Record<string, PMTilesLayerState>;
  onToggle: (id: string) => void;

  // Per-layer header zoom range from the .pmtiles file plus the map's
  // current zoom. When the current zoom is below header.minZoom, the
  // toggle is disabled with a "Zoom in" hint — the bake config drives
  // the threshold, no frontend literal involved.
  layerHeaders?: Record<string, LayerHeader>;

  // Per-layer load progress (header fetch + in-flight tiles). When
  // present, an indeterminate spinner + tile counter chip appears on
  // the right of each row that's actively loading. Streams are
  // continuous as the user pans/zooms — there's no honest total.
  layerProgress?: Record<string, LayerProgress>;
  currentZoom?: number;
}

function rgbCss([r, g, b]: [number, number, number, number]): string {
  return `rgb(${r}, ${g}, ${b})`;
}

// Mirrors the four hatch atlas patterns in hatchPatternAtlas.ts using
// CSS gradients, so the legend swatch reads the same as what's rendered
// on the map. Kept in CSS (not a canvas image) because a 12px swatch
// doesn't need atlas precision and we avoid loading the deck.gl chunks
// just to render a legend.
function patternBackground(
  pattern: PMTilesLayerConfig["pattern"],
  rgb: string,
): string {
  switch (pattern) {
    case "diagonal-right":
      return `repeating-linear-gradient(135deg, ${rgb} 0 2px, transparent 2px 5px)`;
    case "diagonal-left":
      return `repeating-linear-gradient(45deg, ${rgb} 0 2px, transparent 2px 5px)`;
    case "horizontal":
      return `repeating-linear-gradient(0deg, ${rgb} 0 2px, transparent 2px 5px)`;
    case "dots":
      return `radial-gradient(${rgb} 1px, transparent 1.5px) 0 0 / 4px 4px`;
    default:
      return rgb;
  }
}

export function LayerPanel({
  layers,
  state,
  onToggle,
  layerHeaders,
  layerProgress,
  currentZoom,
}: LayerPanelProps) {
  const [open, setOpen] = useState(false);

  if (layers.length === 0) return null;

  const visibleCount = layers.filter((l) => state[l.id]?.visible).length;

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
          {layers.map((layer) => {
            const s = state[layer.id] ?? {
              visible: layer.defaultVisible ?? false,
            };
            const header = layerHeaders?.[layer.id];
            const zoomGated =
              header != null &&
              currentZoom != null &&
              currentZoom < header.minZoom;
            const gated = zoomGated;
            const hint = zoomGated ? "Zoom in to see this layer." : null;
            const labelClass = gated
              ? "flex items-start gap-2 text-sm opacity-50"
              : "flex cursor-pointer items-start gap-2 text-sm";
            const progress = layerProgress?.[layer.id];
            const loading =
              s.visible &&
              !!progress &&
              (progress.headerLoading || progress.tilesInflight > 0);
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
                      style={{
                        background: patternBackground(
                          layer.pattern,
                          rgbCss(layer.fillColor),
                        ),
                      }}
                    />
                    <span className="leading-tight">{layer.label}</span>
                    {loading && <LayerProgressChip progress={progress!} />}
                  </span>
                </label>
                {hint ? (
                  <p className="pl-6 text-xs italic text-white/50">{hint}</p>
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

/**
 * Inline status chip for a loading layer. Indeterminate spinner
 * paired with a tile counter; the counter is suppressed during the
 * brief header-fetch window when no tiles are in flight yet.
 */
function LayerProgressChip({ progress }: { progress: LayerProgress }) {
  const label = progress.tilesInflight > 0 ? `${progress.tilesInflight}` : null;
  const aria = progress.headerLoading
    ? "Loading layer metadata"
    : `Loading ${progress.tilesInflight} tile${progress.tilesInflight === 1 ? "" : "s"}`;
  return (
    <span
      role="status"
      aria-label={aria}
      className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[11px] tabular-nums text-white/80"
    >
      <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
      {label}
    </span>
  );
}

export default LayerPanel;
