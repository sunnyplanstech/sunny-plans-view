// SunnyScore™ explanation visual.
//
// First-principles redesign (2026-05): one ranked list of drivers, each
// rendered as a diverging bar centered on a zero midline — helpers
// extend right (primary), hurters extend left (negative). Per-row raw
// feature value and signed % of overall sit on the row. No hover or
// expansion is required to see the signal; the bar IS the visualisation.
//
// All grouping, sign-splitting, and per-side normalisation lives in
// ./transform.ts (buildExplanation + buildDrivers). This file is pure
// rendering, and adapts density to three surfaces (card / detail /
// landing) via the `size` and `maxDrivers` props.

import { useMemo } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  baselineScoreFromPayload,
  buildDrivers,
  buildExplanation,
  formatFeatureValue,
  GROUP_LABEL,
  type Driver,
  type FeatureUnit,
  type ParcelPayload,
} from "./transform";

export type SunnyScoreSize = "sm" | "md" | "lg";

interface SunnyScoreExplanationProps {
  payload: ParcelPayload;
  size?: SunnyScoreSize;
  // Card surface caps the driver list to N rows; detail/landing surfaces
  // leave this unset and render every explainable driver.
  maxDrivers?: number;
  // Unit system for distance-typed feature values. Defaults to imperial.
  unit?: FeatureUnit;
}

export const SunnyScoreExplanation = ({
  payload,
  size = "md",
  maxDrivers,
  unit = "imperial",
}: SunnyScoreExplanationProps) => {
  const explanation = useMemo(() => buildExplanation(payload), [payload]);
  const drivers = useMemo(() => buildDrivers(explanation), [explanation]);
  const baselineScore = useMemo(
    () => baselineScoreFromPayload(payload),
    [payload],
  );
  const visible = maxDrivers != null ? drivers.slice(0, maxDrivers) : drivers;
  // Bar widths are normalised against the largest driver in the visible
  // set, so the strongest signal always pegs to the edge regardless of
  // absolute SHAP magnitude. Empty/edge-case fallbacks to 1e-9.
  const maxShare = Math.max(...visible.map((d) => d.shareOfTotal), 1e-9);

  return (
    <div className="space-y-4">
      <ScoreHeader
        score={payload.score}
        baselineScore={baselineScore}
        size={size}
      />
      {visible.length > 0 && (
        <DriverList
          drivers={visible}
          maxShare={maxShare}
          unit={unit}
          size={size}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// ScoreHeader — score number, delta vs avg, 0–100 reference strip.
// ---------------------------------------------------------------------------

interface ScoreHeaderProps {
  score: number;
  baselineScore: number;
  size?: SunnyScoreSize;
}

const ScoreHeader = ({ score, baselineScore, size = "md" }: ScoreHeaderProps) => {
  const delta = score - baselineScore;
  const aboveAvg = delta >= 0;
  const numberSize =
    size === "sm" ? "text-2xl" : size === "lg" ? "text-5xl" : "text-3xl";

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-3">
        <span className={cn("font-bold tabular-nums text-foreground", numberSize)}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground">/ 100</span>
        <Badge
          variant="outline"
          className={cn(
            "ml-auto gap-1 tabular-nums border-0",
            aboveAvg
              ? "bg-primary/10 text-primary"
              : "bg-negative/10 text-negative",
          )}
        >
          {aboveAvg ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {aboveAvg ? "+" : "−"}
          {Math.abs(delta)} vs avg
        </Badge>
      </div>

      <div className="relative h-1.5 bg-muted/40 rounded-full">
        <div
          className="absolute -top-0.5 -bottom-0.5 w-px bg-foreground/40"
          style={{ left: `${baselineScore}%` }}
          title={`Average parcel: ${baselineScore}`}
        />
        <div
          className={cn(
            "absolute -top-1 -bottom-1 w-1.5 -translate-x-1/2 rounded-full",
            aboveAvg ? "bg-primary" : "bg-negative",
          )}
          style={{ left: `${score}%` }}
          title={`This parcel: ${score}`}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
        <span>0</span>
        <span>avg {baselineScore}</span>
        <span>100</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// DriverList — ranked, diverging bars.
// ---------------------------------------------------------------------------

interface DriverListProps {
  drivers: Driver[];
  maxShare: number;
  unit: FeatureUnit;
  size: SunnyScoreSize;
}

const DriverList = ({ drivers, maxShare, unit, size }: DriverListProps) => {
  const rowGap = size === "sm" ? "space-y-2" : "space-y-3";
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
        <span>What's moving the score</span>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-negative" />
            hurts
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-primary" />
            helps
          </span>
        </div>
      </div>
      <ul className={cn(rowGap)}>
        {drivers.map((d) => (
          <DriverRow key={d.feature} driver={d} maxShare={maxShare} unit={unit} />
        ))}
      </ul>
    </div>
  );
};

interface DriverRowProps {
  driver: Driver;
  maxShare: number;
  unit: FeatureUnit;
}

const DriverRow = ({ driver, maxShare, unit }: DriverRowProps) => {
  const isHelping = driver.side === "helping";
  const pct = Math.round(driver.shareOfTotal * 100);
  // Bar width as a fraction of one half of the row. The strongest
  // visible driver gets the full half; everything else scales linearly.
  const halfWidthPct = (driver.shareOfTotal / maxShare) * 100;
  const valueText = formatFeatureValue(driver.feature, driver.rawValue, unit);

  return (
    <li className="space-y-1">
      <div className="flex items-baseline gap-2 min-w-0">
        <Badge
          variant="outline"
          className="px-1.5 py-0 h-4 text-[9px] uppercase tracking-wider font-medium text-muted-foreground border-border/60 shrink-0"
        >
          {GROUP_LABEL[driver.group]}
        </Badge>
        <span
          className={cn(
            "text-sm truncate",
            driver.isResidual && "italic text-muted-foreground",
          )}
        >
          {driver.label}
        </span>
        {valueText && (
          <span className="text-xs text-muted-foreground tabular-nums shrink-0">
            {valueText}
          </span>
        )}
        <span
          className={cn(
            "ml-auto text-xs font-semibold tabular-nums shrink-0",
            isHelping ? "text-primary" : "text-negative",
          )}
        >
          {isHelping ? "+" : "−"}
          {pct}%
        </span>
      </div>
      <DivergingBar isHelping={isHelping} halfWidthPct={halfWidthPct} />
    </li>
  );
};

interface DivergingBarProps {
  isHelping: boolean;
  halfWidthPct: number;
}

// Two equal half-tracks separated by a zero midline. Hurters fill the
// left half from the midline outward; helpers fill the right half from
// the midline outward. Width within the half is proportional to this
// driver's share relative to the strongest visible driver.
const DivergingBar = ({ isHelping, halfWidthPct }: DivergingBarProps) => (
  <div className="relative h-1.5 flex">
    <div className="flex-1 bg-muted/30 rounded-l-sm relative">
      {!isHelping && (
        <div
          className="absolute top-0 bottom-0 right-0 bg-negative rounded-l-sm"
          style={{ width: `${halfWidthPct}%` }}
        />
      )}
    </div>
    <div className="w-px bg-foreground/40" />
    <div className="flex-1 bg-muted/30 rounded-r-sm relative">
      {isHelping && (
        <div
          className="absolute top-0 bottom-0 left-0 bg-primary rounded-r-sm"
          style={{ width: `${halfWidthPct}%` }}
        />
      )}
    </div>
  </div>
);
