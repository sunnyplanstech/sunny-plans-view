// SpecFunnel — visualises how the user's selected constraint stack
// narrows the listings cohort, step by step.
//
// Reads as a small "watershed" diagram: the top bar is everything in
// scope, each subsequent bar is everything that survives applying one
// more constraint, with a small "−N" delta between steps. Width is
// proportional to count / total so the elimination is geometric, not
// just numeric.
//
// Pure presentational component — accepts pre-computed steps from
// `funnelSteps()` so the layer-evaluation logic stays in one place.
//
// Visually anchored to the brand palette (gradient-card / primary
// olive) so it lives in the same family as the landing-page badges
// and the constraint rows above it.
import { layerTag } from "./layerTag";
import type { FunnelStep } from "./evaluate";

interface SpecFunnelProps {
  totalListings: number;
  steps: FunnelStep[];
}

// Bars under ~3% would render as invisible slivers; floor them so the
// elimination story stays readable even at extreme narrowing.
const MIN_BAR_WIDTH_PCT = 3;

function widthPct(count: number, total: number): number {
  if (total <= 0) return 0;
  const raw = (count / total) * 100;
  if (raw <= 0) return 0;
  return Math.max(MIN_BAR_WIDTH_PCT, Math.min(100, raw));
}

export function SpecFunnel({ totalListings, steps }: SpecFunnelProps) {
  if (steps.length === 0) return null;
  if (totalListings <= 0) return null;

  const finalCount = steps[steps.length - 1].remaining;

  return (
    <section
      aria-label="Spec funnel"
      className="border-t border-border/60 bg-gradient-subtle px-4 py-3"
    >
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-foreground">Your spec narrows</span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {finalCount.toLocaleString()} of {totalListings.toLocaleString()} qualify
        </span>
      </div>
      <ol className="space-y-1.5">
        <FunnelBar
          label="In scope"
          count={totalListings}
          total={totalListings}
          tone="muted"
        />
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          return (
            <li key={step.layer.id} className="space-y-1.5">
              <FunnelDelta
                tag={layerTag(step.layer.id)}
                eliminated={step.eliminated}
              />
              <FunnelBar
                label={step.layer.label}
                count={step.remaining}
                total={totalListings}
                tone={isLast ? "primary" : "muted"}
                isFinal={isLast}
              />
            </li>
          );
        })}
      </ol>
    </section>
  );
}

interface FunnelBarProps {
  label: string;
  count: number;
  total: number;
  tone: "muted" | "primary";
  isFinal?: boolean;
}

function FunnelBar({ label, count, total, tone, isFinal }: FunnelBarProps) {
  const pct = widthPct(count, total);
  const isPrimary = tone === "primary";
  return (
    <li className="grid grid-cols-[6.5rem_1fr_3.5rem] items-center gap-2">
      <span
        className={
          isPrimary
            ? "truncate text-[11px] font-medium text-foreground"
            : "truncate text-[11px] text-muted-foreground"
        }
        title={label}
      >
        {label}
      </span>
      <span
        className="block h-2 overflow-hidden rounded-full bg-muted"
        aria-hidden
      >
        <span
          className={
            isPrimary
              ? "block h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-[width] duration-500 ease-out"
              : "block h-full rounded-full bg-gradient-to-r from-muted-foreground/30 to-muted-foreground/50 transition-[width] duration-500 ease-out"
          }
          style={{ width: `${pct}%` }}
        />
      </span>
      <span
        className={
          isFinal
            ? "text-right text-[11px] font-semibold tabular-nums text-primary"
            : "text-right text-[11px] tabular-nums text-foreground"
        }
      >
        {count.toLocaleString()}
      </span>
    </li>
  );
}

function FunnelDelta({
  tag,
  eliminated,
}: {
  tag: string;
  eliminated: number;
}) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr_3.5rem] items-center gap-2 text-[10px]">
      <span className="text-right text-muted-foreground/60" aria-hidden>
        ↓
      </span>
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <span className="tp-mono rounded-sm border border-border/70 bg-background px-1 py-px text-[9px] font-semibold tracking-wider text-muted-foreground">
          {tag}
        </span>
        <span className="tabular-nums">eliminates {eliminated.toLocaleString()}</span>
      </span>
      <span aria-hidden />
    </div>
  );
}

export default SpecFunnel;
