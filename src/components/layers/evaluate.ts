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
