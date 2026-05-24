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
import { Check, Loader2, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Layer, LayerRole } from "./registry";
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
  // Cost-of-constraint per layer — how many listings would change if
  // this single layer were toggled, holding all other selections
  // fixed. `null` means the layer has no per-listing chip and we
  // can't compute the cost locally. See `costFor` in evaluate.ts.
  costsById: Record<string, number | null>;
  // Total listings in the current scope. The denominator for the row's
  // counter ("740 / 12,400 qualify") and the empty-selection summary.
  totalListings: number;
  // Current map zoom. Layers with `minZoom > currentZoom` show a
  // "zoom in to use" hint; their toggle stays selectable.
  currentZoom?: number;
  // Per-layer PMTiles load progress. When present, rows whose overlay
  // is mid-stream (header fetch or in-flight tiles) show a small
  // spinner + tile-counter chip. Streaming has no honest total — the
  // chip clears once the viewport is fully painted.
  layerProgress?: Record<string, { headerLoading: boolean; tilesInflight: number }>;
}

interface RowState {
  belowMinZoom: boolean;
  effect?: LayerEffect;
}

// Display order: avoid before target. Mirrors the visual-language
// doc §10 ("is this parcel even legal?" must precede "is it suitable?").
const ROLE_ORDER: LayerRole[] = ["avoid", "target"];

interface RoleSectionMeta {
  label: string;
  caption: string;
}

const ROLE_SECTION_META: Record<LayerRole, RoleSectionMeta> = {
  avoid: {
    label: "Avoid · hard exclusion",
    caption: "Areas where development is restricted or permit-blocked",
  },
  target: {
    label: "Target · soft suitability",
    caption: "Areas that are positively suitable for solar / BESS",
  },
};

function groupByRole(layers: Layer[]): { role: LayerRole; items: Layer[] }[] {
  const buckets = new Map<LayerRole, Layer[]>();
  for (const layer of layers) {
    const bucket = buckets.get(layer.role) ?? [];
    bucket.push(layer);
    buckets.set(layer.role, bucket);
  }
  return ROLE_ORDER
    .map((role) => ({ role, items: buckets.get(role) ?? [] }))
    .filter((g) => g.items.length > 0);
}

function rowState(
  layer: Layer,
  effectsById: Record<string, LayerEffect>,
  currentZoom?: number,
): RowState {
  return {
    belowMinZoom: currentZoom !== undefined && currentZoom < layer.minZoom,
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

// Cost label for the right-aligned "what does this constraint do"
// signal. Reads as a permanent inline trade-off, not a hover tooltip.
//   selected   → "+N if removed"  (count that comes back if you drop it)
//   unselected → "−N if added"    (count it would eliminate)
//   delta=0 + some data → quiet "no effect" (the constraint genuinely
//                                            doesn't bite this cohort)
//   delta=0 + no data   → "no data yet" (per-listing field is null on
//                                        every visible listing — usually
//                                        a sidecar lag, not a no-op)
//   delta=null → no label         (layer has no chip; we can't compute)
interface CostLabel {
  text: string;
  tone: "positive" | "negative" | "neutral";
}

function costLabel(
  delta: number | null,
  selected: boolean,
  effect?: LayerEffect,
): CostLabel | null {
  if (delta === null) return null;
  if (delta === 0) {
    const evaluated = (effect?.passing ?? 0) + (effect?.failing ?? 0);
    if (evaluated === 0 && (effect?.unknown ?? 0) > 0) {
      return { text: "no data yet", tone: "neutral" };
    }
    return { text: "no effect here", tone: "neutral" };
  }
  if (selected) {
    return { text: `+${delta.toLocaleString()} if removed`, tone: "positive" };
  }
  return { text: `−${delta.toLocaleString()} if added`, tone: "negative" };
}

export function ConstraintBar({
  layers,
  selectedIds,
  onToggle,
  onClear,
  effectsById,
  costsById,
  totalListings,
  currentZoom,
  layerProgress,
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
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {selectedCount} of {layers.length} on
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

      {groupByRole(layers).map(({ role, items }) => (
        <section key={role} aria-labelledby={`constraint-role-${role}`}>
          <RoleHeader role={role} id={`constraint-role-${role}`} />
          <ul className="divide-y divide-border/60">
            {items.map((layer) => (
              <LayerRow
                key={layer.id}
                layer={layer}
                selected={selectedIds.has(layer.id)}
                onToggle={onToggle}
                effectsById={effectsById}
                costsById={costsById}
                totalListings={totalListings}
                currentZoom={currentZoom}
                layerProgress={layerProgress}
              />
            ))}
          </ul>
        </section>
      ))}
    </aside>
  );
}

// Section header above each role group. Slate for avoid, olive for
// target — the same role-coded vocabulary the map encoding uses
// (hatched slate / cream spotlight wash). The caption explains the
// role in one line; the section's heading is its label.
function RoleHeader({ role, id }: { role: LayerRole; id: string }) {
  const meta = ROLE_SECTION_META[role];
  const tone =
    role === "avoid"
      ? "text-slate-700 dark:text-slate-300 border-slate-300/60 dark:border-slate-700/60 bg-slate-100/60 dark:bg-slate-900/30"
      : "text-primary border-primary/30 bg-primary/5";
  return (
    <header
      className={cn(
        "px-4 py-2 border-y first:border-t-0",
        tone,
      )}
    >
      <h3
        id={id}
        className="tp-mono text-[10.5px] font-semibold uppercase tracking-[0.14em]"
      >
        {meta.label}
      </h3>
      <p className="mt-0.5 text-[10.5px] leading-snug text-muted-foreground">
        {meta.caption}
      </p>
    </header>
  );
}

interface LayerRowProps {
  layer: Layer;
  selected: boolean;
  onToggle: (id: string) => void;
  effectsById: Record<string, LayerEffect>;
  costsById: Record<string, number | null>;
  totalListings: number;
  currentZoom?: number;
  layerProgress?: Record<string, { headerLoading: boolean; tilesInflight: number }>;
}

function LayerRow({
  layer,
  selected,
  onToggle,
  effectsById,
  costsById,
  totalListings,
  currentZoom,
  layerProgress,
}: LayerRowProps) {
  const state = rowState(layer, effectsById, currentZoom);
  const ratio = state.effect ? effectRatio(state.effect, totalListings) : null;
  const showRatio = !state.belowMinZoom && ratio !== null;
  const tag = layerTag(layer.id);
  const cost = state.belowMinZoom
    ? null
    : costLabel(costsById[layer.id] ?? null, selected, state.effect);
  const progress = layer.pmtilesLayerId
    ? layerProgress?.[layer.pmtilesLayerId]
    : undefined;
  const isLoading =
    selected &&
    !!progress &&
    (progress.headerLoading || progress.tilesInflight > 0);
  return (
    <li>
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
            {cost && <CostBadge cost={cost} />}
          </div>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
            {layer.description}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {showRatio && (
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {ratio} qualify
              </span>
            )}
            {state.belowMinZoom && (
              <ScopeHint
                icon={<ZoomIn className="h-3 w-3" />}
                text="Zoom in to use"
              />
            )}
            {isLoading && progress && (
              <LoadingChip progress={progress} />
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
}

// Inline guidance for a row that's selectable but can't visualize at
// the current scope/zoom — small icon + italic muted phrase telling
// the user the single navigation step to take. Reads as instruction,
// not warning. Same shape for both zoom-gated and region-gated rows
// so the bar's visual cadence stays consistent.
function ScopeHint({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] italic text-muted-foreground">
      {icon}
      {text}
    </span>
  );
}

// Right-aligned cost-of-constraint chip on each row. Tone follows
// brand semantics: positive deltas (more land if you relax) lean
// primary olive, negative deltas (less land if you add) lean toward
// the destructive ramp without shouting.
function CostBadge({ cost }: { cost: CostLabel }) {
  return (
    <span
      className={cn(
        "flex-shrink-0 whitespace-nowrap text-[11px] tabular-nums",
        cost.tone === "positive" && "text-primary",
        cost.tone === "negative" && "text-destructive/80",
        cost.tone === "neutral" && "text-muted-foreground/70",
      )}
    >
      {cost.text}
    </span>
  );
}

// Inline loading indicator for a row whose PMTiles overlay is mid-stream.
// Spinner is indeterminate (tile streams have no honest total); the
// counter shows in-flight tiles when > 0 so power users can see the
// stream draining as they pan/zoom.
function LoadingChip({
  progress,
}: {
  progress: { headerLoading: boolean; tilesInflight: number };
}) {
  const aria = progress.headerLoading
    ? "Loading layer metadata"
    : `Loading ${progress.tilesInflight} tile${progress.tilesInflight === 1 ? "" : "s"}`;
  return (
    <span
      role="status"
      aria-label={aria}
      className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground"
    >
      <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
      {progress.tilesInflight > 0 ? progress.tilesInflight : null}
    </span>
  );
}

export default ConstraintBar;
