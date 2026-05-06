// Layer chip strip — small data tags rendered above each listing
// card in the preview page. Each selected layer that exposes a
// `chip` config and finds matching data on the listing yields one
// pill. Wraps the existing card components so they don't need
// per-layer awareness during the preview phase.
import { cn } from "@/lib/utils";
import type { Layer } from "./registry";
import type { BaseListing } from "@/countries/types";

interface LayerChipsProps {
  listing: BaseListing;
  selectedLayers: Layer[];
  className?: string;
}

interface ChipDescriptor {
  layerId: string;
  label: string;
  text: string;
}

function chipsFor(
  listing: BaseListing,
  selectedLayers: Layer[],
): ChipDescriptor[] {
  const out: ChipDescriptor[] = [];
  for (const layer of selectedLayers) {
    const chip = layer.chip;
    if (!chip) continue;
    const value = (listing as unknown as Record<string, unknown>)[chip.fieldKey];
    if (typeof value !== "number") continue;
    if (!chip.condition(value)) continue;
    out.push({ layerId: layer.id, label: layer.label, text: chip.format(value) });
  }
  return out;
}

export function LayerChips({
  listing,
  selectedLayers,
  className,
}: LayerChipsProps) {
  const chips = chipsFor(listing, selectedLayers);
  if (chips.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
        Layer fit
      </span>
      {chips.map((c) => (
        <span
          key={c.layerId}
          title={c.label}
          className={cn(
            "inline-flex items-center gap-1 rounded-sm border border-primary/30 bg-primary/8 px-1.5 py-0.5",
            "font-mono text-[10px] font-medium text-primary tabular-nums",
          )}
        >
          <span
            aria-hidden
            className="inline-block h-1 w-1 rounded-full bg-primary"
          />
          {c.text}
        </span>
      ))}
    </div>
  );
}

export default LayerChips;
