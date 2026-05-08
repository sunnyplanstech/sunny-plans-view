// Pure layer-evaluation helpers. Given a listing and a Layer, return a
// trinary verdict — `pass` / `fail` / `unknown`. Unknown is a real
// answer, not a placeholder: it's what we say when the per-listing
// field a constraint depends on isn't on this listing payload yet (e.g.
// per-parcel wetlands flag while the pipeline still surfaces wetlands
// only as a map overlay).
//
// Constraint bar effect counters, evaluate-drawer pass/fail strips, and
// future ranking-aware sorts all run through these helpers.
import type { BaseListing } from "@/countries/types";
import type { Layer } from "./registry";

export type Verdict = "pass" | "fail" | "unknown";

export function evaluateLayer(listing: BaseListing, layer: Layer): Verdict {
  const chip = layer.chip;
  if (!chip) return "unknown";
  const value = (listing as unknown as Record<string, unknown>)[chip.fieldKey];
  if (typeof value !== "number") return "unknown";
  return chip.condition(value) ? "pass" : "fail";
}

export interface LayerEffect {
  passing: number;
  failing: number;
  unknown: number;
}

// Aggregate verdicts for one layer across a listings array. Used by the
// constraint bar to show "740 qualify of 12,400" when the layer can be
// evaluated locally; for unknown-only layers the bar suppresses the
// counter rather than showing a meaningless zero.
export function effectFor(
  listings: BaseListing[],
  layer: Layer,
): LayerEffect {
  let passing = 0;
  let failing = 0;
  let unknown = 0;
  for (const listing of listings) {
    switch (evaluateLayer(listing, layer)) {
      case "pass":
        passing += 1;
        break;
      case "fail":
        failing += 1;
        break;
      case "unknown":
        unknown += 1;
        break;
    }
  }
  return { passing, failing, unknown };
}

// True when this layer narrows the listings array — i.e. it has a chip
// (per-listing field) we can evaluate. Layers without a chip toggle the
// map overlay only and don't affect counts in the rail.
function isEvaluable(layer: Layer): boolean {
  return !!layer.chip;
}

// Listings that aren't a definitive `fail` on any layer in `layers`
// (skipping unevaluable ones — those don't filter, only the overlay).
//
// Unknown verdicts pass through. We only drop a listing when we KNOW
// it fails — e.g. the slope sidecar reported `flat_5_acres = 0`. A
// missing field (null `flat_5_acres`) is "we don't have the data
// here yet", not "this parcel doesn't qualify"; treating it as fail
// would empty the cohort whenever a sidecar lags the listings mart.
function filterBy(
  listings: ReadonlyArray<BaseListing>,
  layers: ReadonlyArray<Layer>,
): BaseListing[] {
  const evaluable = layers.filter(isEvaluable);
  if (evaluable.length === 0) return [...listings];
  return listings.filter((l) =>
    evaluable.every((layer) => evaluateLayer(l, layer) !== "fail"),
  );
}

// Cost-of-constraint signal — how many listings would change if a
// single layer were toggled, holding all other selections fixed.
//
// For an unselected layer: returns the count of currently-visible
// listings that would FAIL this layer (i.e. how many would be
// eliminated if the user added it). Read as "−N if added".
//
// For a selected layer: returns how many ADDITIONAL listings would
// qualify if this layer were removed (i.e. listings that pass every
// other selected layer but fail this one). Read as "+N if removed".
//
// Returns `null` when the layer has no per-listing chip — we don't
// know its cost locally and showing a fake number would be misleading.
export function costFor(
  allListings: ReadonlyArray<BaseListing>,
  layer: Layer,
  selectedLayers: ReadonlyArray<Layer>,
): number | null {
  if (!isEvaluable(layer)) return null;
  const isSelected = selectedLayers.some((l) => l.id === layer.id);
  if (isSelected) {
    const others = selectedLayers.filter((l) => l.id !== layer.id);
    const passingOthers = filterBy(allListings, others);
    const survivingAll = passingOthers.filter(
      (l) => evaluateLayer(l, layer) !== "fail",
    );
    return passingOthers.length - survivingAll.length;
  }
  const visible = filterBy(allListings, selectedLayers);
  let wouldFail = 0;
  for (const l of visible) {
    if (evaluateLayer(l, layer) === "fail") wouldFail += 1;
  }
  return wouldFail;
}

// Stepped narrowing for the SpecFunnel — given the user's selected
// layers in registry order, return the qualifying count after each
// step is applied cumulatively. Only evaluable (chip-bearing) layers
// contribute steps; unevaluable selections are skipped silently.
export interface FunnelStep {
  layer: Layer;
  // Listings remaining after applying this layer on top of all prior
  // steps in the funnel.
  remaining: number;
  // Listings eliminated by this step alone.
  eliminated: number;
}

export function funnelSteps(
  allListings: ReadonlyArray<BaseListing>,
  selectedLayers: ReadonlyArray<Layer>,
): FunnelStep[] {
  const evaluable = selectedLayers.filter(isEvaluable);
  const steps: FunnelStep[] = [];
  let cohort: BaseListing[] = [...allListings];
  for (const layer of evaluable) {
    const before = cohort.length;
    cohort = cohort.filter((l) => evaluateLayer(l, layer) !== "fail");
    steps.push({
      layer,
      remaining: cohort.length,
      eliminated: before - cohort.length,
    });
  }
  return steps;
}
