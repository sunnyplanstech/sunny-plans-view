// Floating slope-render preset selector. Pinned top-right on the map so
// it doesn't crowd the scope HUD (top-left). Renders one anchor per
// preset declared in slopeRenderMode.ts so the user can right-click /
// open in new tab and compare side-by-side.
//
// This is a transient dev-comparison surface: once we pick a winner
// the preset gets folded into pmtilesLayers.ts SUITABLE_BASE and this
// component goes away with `slopeRenderMode.ts`.
//
// The chip is presentational only — it doesn't manage state. The
// active preset is read from the URL on render, and selection happens
// via plain anchor navigation (replacing the search param). This keeps
// it framework-light and lets browser controls (back, copy URL) work
// as expected.
import { cn } from "@/lib/utils";
import {
  SLOPE_PRESET_ORDER,
  SLOPE_RENDER_PRESETS,
  getSlopeRenderPreset,
  urlForSlopeRenderPreset,
} from "./slopeRenderMode";

interface SlopeRenderModeChipProps {
  // Caller-side gate. The chip is only meaningful when the slope
  // overlay is actually being painted; otherwise hide it so it doesn't
  // pollute the map for users who aren't comparing presets.
  visible: boolean;
}

export function SlopeRenderModeChip({ visible }: SlopeRenderModeChipProps) {
  if (!visible) return null;
  const active = getSlopeRenderPreset();
  const activeSpec = SLOPE_RENDER_PRESETS[active];
  return (
    <div className="pointer-events-auto absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5">
      <div className="tp-hud" role="status" aria-label="Slope render preset">
        <span>Slope</span>
        <b>{activeSpec.label}</b>
      </div>
      <nav
        aria-label="Switch slope render preset"
        className="flex flex-col items-stretch gap-1 rounded-md border border-border/70 bg-card/95 p-1 shadow-sm backdrop-blur"
      >
        {SLOPE_PRESET_ORDER.map((preset) => {
          const spec = SLOPE_RENDER_PRESETS[preset];
          const isActive = preset === active;
          return (
            <a
              key={preset}
              href={urlForSlopeRenderPreset(preset)}
              title={spec.description}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "min-w-[140px] rounded px-2 py-1 text-left text-[11px] leading-tight transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground/80 hover:bg-muted",
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span>{spec.label}</span>
                <PresetSwatch rgb={spec.rgb} alpha={spec.alpha} />
              </div>
            </a>
          );
        })}
      </nav>
    </div>
  );
}

// Tiny colour chip showing exactly what the scrim will look like on a
// painted pixel. The user-facing label tells you the intent ("Deep
// dim"); the swatch tells you the literal pixel that will hit the
// basemap. Cheap to compute and keeps the comparison honest.
function PresetSwatch({
  rgb,
  alpha,
}: {
  rgb: [number, number, number];
  alpha: number;
}) {
  const [r, g, b] = rgb;
  const a = (alpha / 255).toFixed(2);
  return (
    <span
      aria-hidden
      className="inline-block h-3 w-6 rounded-sm border border-border/40"
      style={{ backgroundColor: `rgba(${r}, ${g}, ${b}, ${a})` }}
    />
  );
}

export default SlopeRenderModeChip;
