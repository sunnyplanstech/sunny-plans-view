// SunnyScore™ explanation preview (roadmap p2-e1-sunnyscore-visual).
//
// A throwaway visual sandbox for evaluating the proposed design before
// implementation. Renders the gauge + helping/hurting bar idiom across
// the three target surfaces (listing card / listing detail / landing
// example) and three score scenarios (high, mid, low) so we can stress-
// test glanceability, honesty about negatives, and per-side calibration
// before wiring anything to live data.
//
// Mounted at /preview/sunnyscore. All grouping, sign-splitting, and
// per-side normalisation lives in this file — the model-side payload
// is just `{ score, contributions: { feature: float } }` plus a single
// baseline_logit constant, exactly as specced in the roadmap card.

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Data contract — what the model side ships per parcel.
// ---------------------------------------------------------------------------

type Contributions = Record<string, number>; // feature → raw TreeSHAP, logit units

interface ParcelPayload {
  score: number; // round(predict_proba × 100)
  contributions: Contributions;
}

// Single per-model constant, exposed via a config endpoint.
// sigmoid(0) = 0.5, so a baseline_logit of 0 places the average
// parcel at score 50. Most realistic classifiers land slightly off-
// centre; we use −0.20 here so the average tick sits near 45.
const BASELINE_LOGIT = -0.2;

// ---------------------------------------------------------------------------
// Mock parcels — three scenarios across the score range.
// ---------------------------------------------------------------------------

const PARCEL_HIGH: ParcelPayload = {
  score: 82,
  contributions: {
    power_substation: 1.04,
    power_line: 0.42,
    voltage_kv_within_5km: 0.28,
    irradiance_annual_mean: 0.31,
    cloud_cover_p50: 0.12,
    military_base: 0.21,
    protected_area: 0.18,
    landuse_residential_distance: -0.18,
    slope_p95: -0.31,
    slope_p50: -0.09,
    elevation_kurtosis: -0.04,
  },
};

const PARCEL_MID: ParcelPayload = {
  score: 54,
  contributions: {
    power_substation: 0.18,
    power_line: 0.06,
    irradiance_annual_mean: 0.22,
    landuse_residential_distance: -0.14,
    landuse_agricultural_share: 0.09,
    slope_p95: -0.21,
    slope_p50: -0.11,
    military_base: 0.04,
    airport_distance: -0.07,
    water_body_distance: 0.03,
  },
};

const PARCEL_LOW: ParcelPayload = {
  score: 27,
  contributions: {
    power_substation: -0.62,
    power_line: -0.24,
    irradiance_annual_mean: 0.18,
    landuse_residential_distance: -0.41,
    landuse_agricultural_share: -0.12,
    slope_p95: -0.38,
    slope_p50: -0.14,
    elevation_kurtosis: -0.06,
    military_base: 0.09,
    airport_distance: -0.22,
  },
};

// ---------------------------------------------------------------------------
// Group taxonomy — fixed, ~5 buckets. Front-end-owned per the data contract.
// ---------------------------------------------------------------------------

type GroupKey = "grid" | "solar" | "terrain" | "land_use" | "constraints";

const GROUP_LABEL: Record<GroupKey, string> = {
  grid: "Grid",
  solar: "Solar resource",
  terrain: "Terrain",
  land_use: "Land use & surroundings",
  constraints: "Constraints & distances",
};

const FEATURE_TO_GROUP: Record<string, GroupKey> = {
  power_substation: "grid",
  power_line: "grid",
  voltage_kv_within_5km: "grid",
  irradiance_annual_mean: "solar",
  cloud_cover_p50: "solar",
  temperature_factor: "solar",
  slope_p95: "terrain",
  slope_p50: "terrain",
  slope_mean: "terrain",
  elevation_kurtosis: "terrain",
  landuse_residential_distance: "land_use",
  landuse_agricultural_share: "land_use",
  land_use_diversity_index: "land_use",
  military_base: "constraints",
  protected_area: "constraints",
  airport_distance: "constraints",
  water_body_distance: "constraints",
};

// Human-readable labels for explainable features. Anything not in this
// map (or matching the opaque pattern below) collapses into a residual.
const FEATURE_LABEL: Record<string, string> = {
  power_substation: "Distance to nearest substation",
  power_line: "Distance to transmission line",
  voltage_kv_within_5km: "Voltage class within 5 km",
  irradiance_annual_mean: "Average annual irradiance",
  landuse_residential_distance: "Distance to nearest residential parcel",
  landuse_agricultural_share: "Share of agricultural neighbours",
  military_base: "Distance to nearest military base",
  protected_area: "Distance to nearest protected area",
  airport_distance: "Distance to nearest airport",
  water_body_distance: "Distance to nearest water body",
};

// Opaque feature suffixes — never break out into their own row.
const OPAQUE_PATTERN = /(_p\d+|_mean|_std|_kurtosis|_diversity_index|_log|_embedding)$/;

const isExplainable = (feature: string): boolean =>
  feature in FEATURE_LABEL && !OPAQUE_PATTERN.test(feature);

// ---------------------------------------------------------------------------
// Explanation transform — payload → renderable structure.
//
// 1. Aggregate features into groups (sum SHAP).
// 2. Sign-split per parcel: a group whose net contribution is positive
//    goes to the helping column; net-negative goes to hurting.
// 3. Within each side, normalise against the side total.
// 4. Between columns, scale relative to the dominant side's total so
//    the dominant column visually outweighs the weaker one.
// ---------------------------------------------------------------------------

interface FeatureRow {
  feature: string;
  label: string; // explainable label or "Other <group> factors" residual
  value: number; // |contribution|, used for column-bar widths
  signedValue: number; // signed contribution (logit units), used by the
  // gauge to lay out the score-deviation span proportionally
  // 0..1 share of the side total (helping or hurting). Children of a
  // group sum to that group's shareOfSide — one consistent unit across
  // the whole tree, so a reader can mentally add features back up to
  // their group and groups back up to 100% of their side.
  shareOfSide: number;
  isResidual: boolean;
}

interface GroupRow {
  group: GroupKey;
  label: string;
  total: number; // |sum of contributions in group|
  signedSum: number; // signed sum, sign tells us which column the group lives in
  shareOfSide: number; // 0..1
  bars: FeatureRow[]; // children for drill-down
}

interface Explanation {
  helping: GroupRow[];
  hurting: GroupRow[];
  helpingTotal: number;
  hurtingTotal: number;
  maxSideTotal: number;
}

function buildExplanation(payload: ParcelPayload): Explanation {
  // Group the contributions.
  const byGroup: Record<GroupKey, { name: string; value: number }[]> = {
    grid: [],
    solar: [],
    terrain: [],
    land_use: [],
    constraints: [],
  };

  for (const [feature, value] of Object.entries(payload.contributions)) {
    const group = FEATURE_TO_GROUP[feature];
    if (!group) continue; // unknown feature — would log in real impl
    byGroup[group].push({ name: feature, value });
  }

  // Compute per-group net contribution; sign-split.
  const helping: GroupRow[] = [];
  const hurting: GroupRow[] = [];
  let helpingTotal = 0;
  let hurtingTotal = 0;

  (Object.keys(byGroup) as GroupKey[]).forEach((group) => {
    const features = byGroup[group];
    if (features.length === 0) return;
    const net = features.reduce((s, f) => s + f.value, 0);
    if (Math.abs(net) < 1e-6) return;

    // Build the drill-down rows: explainable features keep their own
    // row (signed in line with the group's net direction; opaque
    // features collapse into a residual). The residual carries any
    // contribution that fights the group's net direction too — we
    // deliberately surface the *group-level* signal, not feature-level
    // crosscurrents, so the user reads one direction per group.
    const sameSign = features.filter((f) => Math.sign(f.value) === Math.sign(net));
    const explainable = sameSign.filter((f) => isExplainable(f.name));
    const residualValue =
      sameSign.reduce((s, f) => s + f.value, 0) -
      explainable.reduce((s, f) => s + f.value, 0) +
      // Counter-direction features fold into the residual too; their
      // magnitude reduces the residual, never goes negative on the bar.
      features
        .filter((f) => Math.sign(f.value) !== Math.sign(net))
        .reduce((s, f) => s + f.value, 0);

    const bars: FeatureRow[] = explainable
      .map((f) => ({
        feature: f.name,
        label: FEATURE_LABEL[f.name] ?? f.name,
        value: Math.abs(f.value),
        signedValue: f.value,
        shareOfSide: 0, // filled in the second pass once the side total is known
        isResidual: false,
      }))
      .sort((a, b) => b.value - a.value);

    if (Math.abs(residualValue) > 0.01) {
      bars.push({
        feature: `__residual_${group}`,
        label: `Other ${GROUP_LABEL[group].toLowerCase()} factors`,
        value: Math.abs(residualValue),
        signedValue: residualValue,
        shareOfSide: 0,
        isResidual: true,
      });
    }

    const row: GroupRow = {
      group,
      label: GROUP_LABEL[group],
      total: Math.abs(net),
      signedSum: net,
      shareOfSide: 0, // filled below
      bars,
    };

    if (net > 0) {
      helping.push(row);
      helpingTotal += Math.abs(net);
    } else {
      hurting.push(row);
      hurtingTotal += Math.abs(net);
    }
  });

  helping.forEach((g) => {
    g.shareOfSide = g.total / Math.max(helpingTotal, 1e-9);
    g.bars.forEach((b) => (b.shareOfSide = b.value / Math.max(helpingTotal, 1e-9)));
  });
  hurting.forEach((g) => {
    g.shareOfSide = g.total / Math.max(hurtingTotal, 1e-9);
    g.bars.forEach((b) => (b.shareOfSide = b.value / Math.max(hurtingTotal, 1e-9)));
  });

  helping.sort((a, b) => b.total - a.total);
  hurting.sort((a, b) => b.total - a.total);

  return {
    helping,
    hurting,
    helpingTotal,
    hurtingTotal,
    maxSideTotal: Math.max(helpingTotal, hurtingTotal, 1e-9),
  };
}

const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));
const baselineScore = Math.round(sigmoid(BASELINE_LOGIT) * 100);

// ---------------------------------------------------------------------------
// Contribution bar — single zero-centred decomposition of the score.
//
// Hurters fill leftward from zero, helpers fill rightward. Per-side
// normalisation from the spec: the dominant side's half fills its
// container; the weaker side reaches only (weakerTotal / dominantTotal)
// of the same allowance. Within each side, groups are visible via 3px
// dividers; features inside each group via 1px dividers. The largest
// contribution sits closest to zero on each side.
//
// For the helping side we iterate normally (largest first, left-to-
// right places largest at the left edge of the helping half = adjacent
// to zero). For hurting we reverse the iteration so the rightmost
// element in DOM order is the largest hurter (adjacent to zero on the
// left side of the centre).
// ---------------------------------------------------------------------------

type ColumnSide = "helping" | "hurting";

interface ContributionFeature {
  key: string; // feature row key (matches FeatureRow.feature)
  label: string;
  groupKey: GroupKey;
  isResidual: boolean;
  widthOfGroup: number; // 0..1 share within parent group
  shareOfSide: number; // 0..1 share within the side, used by the
  // hover label to display "X% of helping/hurting".
}

interface ContributionGroup {
  key: GroupKey;
  label: string;
  side: ColumnSide;
  widthOfSide: number; // 0..1 share within the side
  features: ContributionFeature[];
}

interface ContributionBar {
  helpingWidth: number; // 0..1, side total relative to the dominant side
  hurtingWidth: number;
  helpingGroups: ContributionGroup[]; // DOM order matches visual order
  hurtingGroups: ContributionGroup[];
}

function computeContributionBar(explanation: Explanation): ContributionBar {
  const max = Math.max(
    explanation.helpingTotal,
    explanation.hurtingTotal,
    1e-9,
  );

  const mapGroup = (
    g: GroupRow,
    sideTotal: number,
    side: ColumnSide,
  ): ContributionGroup => ({
    key: g.group,
    label: g.label,
    side,
    widthOfSide: g.total / Math.max(sideTotal, 1e-9),
    features: g.bars.map((b) => ({
      key: b.feature,
      label: b.label,
      groupKey: g.group,
      isResidual: b.isResidual,
      widthOfGroup: b.value / Math.max(g.total, 1e-9),
      shareOfSide: b.shareOfSide,
    })),
  });

  // Both sides iterate largest-first, left-to-right — each bar reads
  // independently. Cross-side normalisation against `max` keeps the
  // imbalance signal: dominant side's bar fills its container, weaker
  // side's bar is proportionally shorter.
  return {
    helpingWidth: explanation.helpingTotal / max,
    hurtingWidth: explanation.hurtingTotal / max,
    helpingGroups: explanation.helping.map((g) =>
      mapGroup(g, explanation.helpingTotal, "helping"),
    ),
    hurtingGroups: explanation.hurting.map((g) =>
      mapGroup(g, explanation.hurtingTotal, "hurting"),
    ),
  };
}

// Lookup helper for the inline label: given a hovered key, find the
// matching feature on whichever side it lives. O(features), small.
function findFeature(
  bar: ContributionBar,
  hovered: HoverState | null,
): ContributionFeature | null {
  if (!hovered?.key) return null;
  const groups =
    hovered.side === "helping" ? bar.helpingGroups : bar.hurtingGroups;
  for (const g of groups) {
    const f = g.features.find((f) => f.key === hovered.key);
    if (f) return f;
  }
  return null;
}

// Hover state shared at the surface level so a single hover key drives
// every visual on the page (currently just the bar; columns are gone).
interface HoverState {
  key: string | null;
  groupKey: GroupKey;
  side: ColumnSide;
}
type HoverHandler = (next: HoverState | null) => void;

// ---------------------------------------------------------------------------
// Score gauge — score number + two stacked side bars.
//
// Helpers and hurters live on their own bars: same direction, same
// alignment, different colour. Each bar uses cross-side normalisation
// so the dominant side fills its container and the weaker side reads
// proportionally shorter — that's the imbalance signal. Inside each
// bar, features are the smallest segments by default, with 3px
// dividers between groups and 1px dividers between features in a
// group. A reserved label line below the bars updates on hover with
// `<feature> — X% of side`; segments also carry a native tooltip.
// ---------------------------------------------------------------------------

interface ScoreGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  contributionBar: ContributionBar;
  hovered?: HoverState | null;
  onHover?: HoverHandler;
}

interface ContributionSegmentProps {
  group: ContributionGroup;
  feature: ContributionFeature;
  groupIndexInSide: number;
  featureIndexInGroup: number;
  hovered?: HoverState | null;
  onHover?: HoverHandler;
}

const ContributionSegment = ({
  group,
  feature,
  groupIndexInSide,
  featureIndexInGroup,
  hovered,
  onHover,
}: ContributionSegmentProps) => {
  const isHov = hovered?.key === feature.key;
  const isHelping = group.side === "helping";
  // Width within the parent group container — sums to 100% across siblings.
  const widthPctOfGroup = feature.widthOfGroup * 100;

  // Reveal the internal structure (dividers + residual shading) only
  // when this side is being interrogated by hover — either the user's
  // mouse is over this bar, or they're hovering a row in the matching
  // column. Default state is a single colour blob, so the at-a-glance
  // signal is just the ratio of the helping bar to the hurting bar.
  const showStructure = hovered?.side === group.side;

  // Dividers in DOM order (left-to-right): 3px at group boundaries,
  // 1px between features inside a group. Suppressed entirely when the
  // bar isn't showing structure.
  const isFirstOfSide = groupIndexInSide === 0 && featureIndexInGroup === 0;
  const isFirstOfGroup = featureIndexInGroup === 0;
  const dividerThickness = !showStructure
    ? 0
    : isFirstOfSide
    ? 0
    : isFirstOfGroup
    ? 3
    : 1;

  // Residual shading also gates on showStructure — collapsed state
  // shows one solid colour per side; hover lightens the residual.
  const baseColor = isHelping
    ? showStructure && feature.isResidual
      ? "bg-primary/40"
      : "bg-primary"
    : showStructure && feature.isResidual
    ? "bg-negative/40"
    : "bg-negative";

  const sharePct = Math.round(feature.shareOfSide * 100);

  return (
    <div
      onMouseEnter={() =>
        onHover?.({
          key: feature.key,
          groupKey: group.key,
          side: group.side,
        })
      }
      onMouseLeave={() => onHover?.(null)}
      className={cn(
        "h-full transition-all cursor-default",
        baseColor,
        // Strong hover: brightness lift + opaque foreground outline +
        // raised z-index so the highlight sits above neighbours.
        isHov &&
          "brightness-150 outline outline-[3px] -outline-offset-[3px] outline-foreground z-30 relative",
      )}
      style={{
        width: `${widthPctOfGroup}%`,
        boxShadow:
          dividerThickness > 0
            ? `inset ${dividerThickness}px 0 0 hsl(var(--card))`
            : undefined,
      }}
      title={`${feature.label} — ${sharePct}% of ${
        isHelping ? "helping" : "hurting"
      }`}
    />
  );
};

const ScoreGauge = ({
  score,
  size = "md",
  contributionBar,
  hovered,
  onHover,
}: ScoreGaugeProps) => {
  const delta = score - baselineScore;
  const aboveAvg = delta >= 0;
  const barHeight = size === "sm" ? "h-3" : size === "lg" ? "h-5" : "h-4";
  const numberSize =
    size === "sm" ? "text-2xl" : size === "lg" ? "text-5xl" : "text-3xl";
  const labelSize = size === "sm" ? "text-[11px]" : "text-xs";

  const { helpingWidth, hurtingWidth, helpingGroups, hurtingGroups } =
    contributionBar;

  const hoveredFeature = findFeature(contributionBar, hovered);

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

      {/* Thin 0–100 reference strip — spatial anchor for where the
          score sits on the scale. No fill, no segmentation; the bars
          below explain why it landed here. */}
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

      <div className="space-y-2">
        <SideBar
          label="Helping"
          icon={<TrendingUp className="h-3 w-3" />}
          labelClass="text-primary"
          groups={helpingGroups}
          sideWidth={helpingWidth}
          height={barHeight}
          hovered={hovered}
          onHover={onHover}
        />
        <SideBar
          label="Hurting"
          icon={<TrendingDown className="h-3 w-3" />}
          labelClass="text-negative"
          groups={hurtingGroups}
          sideWidth={hurtingWidth}
          height={barHeight}
          hovered={hovered}
          onHover={onHover}
        />
      </div>

      {/* Reserved label line — fixed height so the layout doesn't
          shift on hover. Defaults to a faint hint; on hover, fills
          with the active feature's label and side share. */}
      <div className={cn("min-h-[1.25rem] flex items-center", labelSize)}>
        {hoveredFeature ? (
          <span>
            <span
              className={cn(
                "font-semibold",
                hovered?.side === "helping"
                  ? "text-primary"
                  : "text-negative",
              )}
            >
              {hoveredFeature.label}
            </span>
            <span className="text-muted-foreground">
              {" — "}
              {Math.round(hoveredFeature.shareOfSide * 100)}% of{" "}
              {hovered?.side}
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground/60 italic">
            Hover any segment to see what it represents
          </span>
        )}
      </div>
    </div>
  );
};

interface SideBarProps {
  label: string;
  icon: React.ReactNode;
  labelClass: string;
  groups: ContributionGroup[];
  sideWidth: number;
  height: string;
  hovered?: HoverState | null;
  onHover?: HoverHandler;
}

const SideBar = ({
  label,
  icon,
  labelClass,
  groups,
  sideWidth,
  height,
  hovered,
  onHover,
}: SideBarProps) => (
  <div className="flex items-center gap-3">
    <div
      className={cn(
        "flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider w-16 shrink-0",
        labelClass,
      )}
    >
      {icon}
      {label}
    </div>
    <div className={cn("relative flex-1 bg-muted/40 rounded-sm", height)}>
      <div
        className="absolute inset-y-0 left-0 flex overflow-hidden rounded-sm"
        style={{ width: `${sideWidth * 100}%` }}
      >
        {groups.map((g, gi) => (
          <div
            key={g.key}
            className="h-full flex"
            style={{ width: `${g.widthOfSide * 100}%` }}
          >
            {g.features.map((f, fi) => (
              <ContributionSegment
                key={f.key}
                group={g}
                feature={f}
                groupIndexInSide={gi}
                featureIndexInGroup={fi}
                hovered={hovered}
                onHover={onHover}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Pro/Con columns — ranked group lists with click-to-expand drill-down.
//
// The gauge above answers "what's the score and what does it look
// like"; the columns answer "what are the named drivers, ranked, with
// numbers I can quote in a meeting." Hover state is shared with the
// gauge: hovering a feature segment in the gauge highlights its row
// here and auto-expands its parent group; hovering a row here lights
// up the matching segment in the gauge.
// ---------------------------------------------------------------------------

const SideHeader = ({ side }: { side: ColumnSide }) => {
  const isHelping = side === "helping";
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider mb-2",
        isHelping ? "text-primary" : "text-negative",
      )}
    >
      {isHelping ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {isHelping ? "Helping" : "Hurting"}
    </div>
  );
};

interface GroupRowItemProps {
  row: GroupRow;
  side: ColumnSide;
  expandable: boolean;
  expandableHint?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  hovered?: HoverState | null;
  onHover?: HoverHandler;
}

const GroupRowItem = ({
  row,
  side,
  expandable,
  expandableHint,
  isOpen,
  onToggle,
  hovered,
  onHover,
}: GroupRowItemProps) => {
  const isHelping = side === "helping";
  const sharePct = Math.round(row.shareOfSide * 100);
  const groupHovered =
    hovered?.groupKey === row.group && hovered?.side === side;

  return (
    <div>
      <button
        type="button"
        disabled={!expandable}
        onClick={onToggle}
        onMouseEnter={() =>
          onHover?.({ key: null, groupKey: row.group, side })
        }
        onMouseLeave={() => onHover?.(null)}
        className={cn(
          "block w-full text-left rounded transition-colors px-2 py-1 -mx-1.5",
          expandable && "cursor-pointer",
          groupHovered &&
            (isHelping ? "bg-primary/10" : "bg-negative/10"),
        )}
      >
        <div className="flex items-center gap-1.5">
          {expandable && (
            <span className="text-muted-foreground">
              {isOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </span>
          )}
          <span className="text-sm font-medium">{row.label}</span>
          <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">
            {sharePct}%
          </span>
          {expandableHint && !expandable && (
            <ChevronRight className="h-3 w-3 text-muted-foreground/70" />
          )}
        </div>
        <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden mt-1.5">
          <div
            className={cn(
              "h-full rounded-full",
              isHelping ? "bg-primary" : "bg-negative",
            )}
            style={{ width: `${sharePct}%` }}
          />
        </div>
      </button>

      {expandable && isOpen && row.bars.length > 0 && (
        <ul className="mt-2 ml-5 space-y-0.5 text-xs border-l border-border/60 pl-3">
          {row.bars.map((feat) => {
            const isHov = hovered?.key === feat.feature;
            return (
              <li
                key={feat.feature}
                onMouseEnter={() =>
                  onHover?.({
                    key: feat.feature,
                    groupKey: row.group,
                    side,
                  })
                }
                onMouseLeave={() => onHover?.(null)}
                className={cn(
                  "flex items-baseline gap-2 px-2 py-1 -mx-1.5 rounded transition-colors",
                  isHov &&
                    (isHelping
                      ? "bg-primary/30 ring-2 ring-primary/70"
                      : "bg-negative/30 ring-2 ring-negative/70"),
                )}
              >
                <span
                  className={cn(
                    feat.isResidual && "italic text-muted-foreground",
                    isHov && "font-semibold",
                  )}
                >
                  {feat.label}
                </span>
                <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">
                  {Math.round(feat.shareOfSide * 100)}%
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

interface HelpingHurtingColumnsProps {
  explanation: Explanation;
  expandable?: boolean;
  expandableHint?: boolean;
  maxRowsPerSide?: number;
  hovered?: HoverState | null;
  onHover?: HoverHandler;
}

const HelpingHurtingColumns = ({
  explanation,
  expandable,
  expandableHint,
  maxRowsPerSide,
  hovered,
  onHover,
}: HelpingHurtingColumnsProps) => {
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const toggle = (key: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const trim = (rows: GroupRow[]): GroupRow[] =>
    maxRowsPerSide ? rows.slice(0, maxRowsPerSide) : rows;

  const renderColumn = (rows: GroupRow[], side: ColumnSide) => (
    <div className="flex-1 min-w-0">
      <SideHeader side={side} />
      {rows.length === 0 ? (
        <div className="text-xs text-muted-foreground italic py-2">
          {side === "helping"
            ? "No significant helpers."
            : "No drags worth flagging."}
        </div>
      ) : (
        <div className="space-y-1">
          {rows.map((row) => {
            const key = `${side}_${row.group}`;
            const clickedOpen = openGroups.has(key);
            const hoverOpen =
              hovered?.groupKey === row.group && hovered?.side === side;
            const isOpen = clickedOpen || hoverOpen;
            return (
              <GroupRowItem
                key={key}
                row={row}
                side={side}
                expandable={!!expandable}
                expandableHint={expandableHint}
                isOpen={isOpen}
                onToggle={() => expandable && toggle(key)}
                hovered={hovered}
                onHover={onHover}
              />
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-6">
      {renderColumn(trim(explanation.helping), "helping")}
      {renderColumn(trim(explanation.hurting), "hurting")}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Surface variants — three places the explanation appears.
// ---------------------------------------------------------------------------

interface SurfaceProps {
  payload: ParcelPayload;
  parcelLabel: string;
  parcelMeta: string;
}

// Hook that bundles everything a surface needs: explanation tree,
// contribution-bar layout, and shared hover state.
const useExplanationView = (payload: ParcelPayload) => {
  const explanation = useMemo(() => buildExplanation(payload), [payload]);
  const contributionBar = useMemo(
    () => computeContributionBar(explanation),
    [explanation],
  );
  const [hovered, setHovered] = useState<HoverState | null>(null);
  return { explanation, contributionBar, hovered, setHovered };
};

const CardSurface = ({ payload, parcelLabel, parcelMeta }: SurfaceProps) => {
  const { explanation, contributionBar, hovered, setHovered } =
    useExplanationView(payload);
  return (
    <Card className="w-full max-w-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
      <div className="h-32 bg-gradient-to-br from-muted to-muted/40 border-b" />
      <CardContent className="p-4 space-y-3">
        <div>
          <div className="text-sm font-semibold truncate">{parcelLabel}</div>
          <div className="text-xs text-muted-foreground">{parcelMeta}</div>
        </div>
        <ScoreGauge
          score={payload.score}
          size="sm"
          contributionBar={contributionBar}
          hovered={hovered}
          onHover={setHovered}
        />
        <HelpingHurtingColumns
          explanation={explanation}
          maxRowsPerSide={2}
          expandableHint
          hovered={hovered}
          onHover={setHovered}
        />
        <div className="pt-2 mt-1 border-t border-border/50 flex items-center justify-end text-[11px] text-primary font-medium">
          <span className="flex items-center gap-0.5">
            View full breakdown <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

const DetailSurface = ({ payload, parcelLabel, parcelMeta }: SurfaceProps) => {
  const { explanation, contributionBar, hovered, setHovered } =
    useExplanationView(payload);
  return (
    <Card>
      <CardHeader>
        <div className="flex items-baseline justify-between">
          <CardTitle className="text-base">{parcelLabel}</CardTitle>
          <span className="text-xs text-muted-foreground">{parcelMeta}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <ScoreGauge
          score={payload.score}
          size="lg"
          contributionBar={contributionBar}
          hovered={hovered}
          onHover={setHovered}
        />
        <HelpingHurtingColumns
          explanation={explanation}
          expandable
          hovered={hovered}
          onHover={setHovered}
        />
        <div className="text-xs text-muted-foreground italic flex items-center gap-1.5">
          <Info className="h-3 w-3" />
          Click any group to see which features inside it move the score, or
          hover the bars above.
        </div>
      </CardContent>
    </Card>
  );
};

const LandingSurface = ({ payload, parcelLabel, parcelMeta }: SurfaceProps) => {
  const { explanation, contributionBar, hovered, setHovered } =
    useExplanationView(payload);

  const topHelper = explanation.helping[0];
  const topDrag = explanation.hurting[0];

  return (
    <Card className="border-2 border-primary/20 bg-gradient-card">
      <CardHeader>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-primary font-semibold">
            Example parcel
          </div>
          <CardTitle className="text-xl">{parcelLabel}</CardTitle>
          <div className="text-xs text-muted-foreground">{parcelMeta}</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <ScoreGauge
          score={payload.score}
          size="lg"
          contributionBar={contributionBar}
          hovered={hovered}
          onHover={setHovered}
        />
        <HelpingHurtingColumns
          explanation={explanation}
          expandable
          hovered={hovered}
          onHover={setHovered}
        />
        {(topHelper || topDrag) && (
          <div className="space-y-2 text-sm pt-2 border-t border-border/40">
            {topHelper && (
              <p className="leading-snug">
                <span className="font-semibold text-primary">
                  {topHelper.label}
                </span>{" "}
                <span className="text-muted-foreground">
                  is the largest helper — closest substation sits 1.2 km away,
                  well inside the cost-effective interconnect range for this
                  state.
                </span>
              </p>
            )}
            {topDrag && (
              <p className="leading-snug">
                <span className="font-semibold text-negative">
                  {topDrag.label}
                </span>{" "}
                <span className="text-muted-foreground">
                  is the only meaningful drag — slope tops 18% on the north
                  edge, pushing some grading work into the development cost.
                </span>
              </p>
            )}
          </div>
        )}
        <div className="pt-4 border-t border-border/60 text-sm text-muted-foreground">
          Every parcel ships with the same breakdown — no editorial copy, no
          marketing-driven sort key. Just the model showing its work.
        </div>
      </CardContent>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Page composition.
// ---------------------------------------------------------------------------

interface ParcelChoice {
  key: string;
  label: string;
  meta: string;
  payload: ParcelPayload;
  pitch: string;
}

const PARCELS: ParcelChoice[] = [
  {
    key: "high",
    label: "Pecos County, TX · 217 ac",
    meta: "Texas · semi-arid · grid-adjacent",
    payload: PARCEL_HIGH,
    pitch: "Top-decile candidate — helpers heavily outweigh drags.",
  },
  {
    key: "mid",
    label: "Custer County, OK · 142 ac",
    meta: "Oklahoma · mixed agricultural · moderate slope",
    payload: PARCEL_MID,
    pitch: "Middle-of-the-pack — small helpers and drags roughly balance.",
  },
  {
    key: "low",
    label: "Boone County, WV · 96 ac",
    meta: "West Virginia · ridge terrain · far from substation",
    payload: PARCEL_LOW,
    pitch: "Below-average — drags dominate; explanation tells the user why fast.",
  },
];

const SectionHeader = ({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) => (
  <div className="space-y-2 max-w-3xl">
    <div className="text-[11px] uppercase tracking-wider text-primary font-semibold">
      {eyebrow}
    </div>
    <h2 className="text-2xl font-bold">{title}</h2>
    <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
  </div>
);

const SunnyScorePreview = () => {
  const [activeParcelKey, setActiveParcelKey] = useState<string>("high");
  const activeParcel =
    PARCELS.find((p) => p.key === activeParcelKey) ?? PARCELS[0];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Page header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to homepage
          </Link>
          <div className="text-[11px] uppercase tracking-wider text-primary font-semibold">
            Roadmap preview · p2-e1-sunnyscore-visual
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mt-2">
            SunnyScore™ — gauge and helping/hurting columns
          </h1>
          <p className="text-base text-muted-foreground mt-3 max-w-3xl leading-relaxed">
            A throwaway visual sandbox for the proposed explanation idiom. Three
            sample parcels, three surfaces (listing card, listing detail,
            landing-page example), wired to a model-side payload that&apos;s a
            single TreeSHAP call away. Nothing here is live — all numbers are
            mocked from the spec. Pick a parcel below to see the same idiom
            adapt across the score range.
          </p>
        </div>
      </header>

      {/* Parcel selector */}
      <section className="border-b bg-card/60 sticky top-0 z-10 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground mr-2">Sample parcel:</span>
          {PARCELS.map((p) => (
            <Button
              key={p.key}
              size="sm"
              variant={p.key === activeParcelKey ? "default" : "outline"}
              onClick={() => setActiveParcelKey(p.key)}
              className="gap-2"
            >
              <span className="tabular-nums font-semibold">{p.payload.score}</span>
              <span className="text-xs opacity-80">· {p.label.split("·")[0].trim()}</span>
            </Button>
          ))}
          <span className="text-xs text-muted-foreground ml-auto italic">
            {activeParcel.pitch}
          </span>
        </div>
      </section>

      {/* Surface 1 — landing-page example */}
      <section className="container mx-auto px-4 py-12 space-y-6">
        <SectionHeader
          eyebrow="Surface 1 · Landing page"
          title="The explanation as a trust object"
          body="A cold prospect lands on the marketing page with no other evidence the product is doing real analysis. The fully-expanded explanation, plus two hand-written captions tied to the largest helper and the largest drag, is what proves the score is more than a sort key. The captions are written for the example only — they&apos;re not produced by the model."
        />
        <LandingSurface
          payload={activeParcel.payload}
          parcelLabel={activeParcel.label}
          parcelMeta={activeParcel.meta}
        />
      </section>

      {/* Surface 2 — listing detail */}
      <section className="container mx-auto px-4 py-12 space-y-6">
        <SectionHeader
          eyebrow="Surface 2 · Listing detail"
          title="Default state, then drill-down"
          body="All groups visible, qualitative chips, click any group to expand into its explainable features. Opaque features (slope_p95, slope_p50, elevation_kurtosis) collapse into a single residual labelled in plain language — they never break out. Bar length is share within the side; the score on the gauge is the only cross-parcel comparable quantity."
        />
        <DetailSurface
          payload={activeParcel.payload}
          parcelLabel={activeParcel.label}
          parcelMeta={activeParcel.meta}
        />
      </section>

      {/* Surface 3 — listing card */}
      <section className="container mx-auto px-4 py-12 space-y-6">
        <SectionHeader
          eyebrow="Surface 3 · Listing card"
          title="Glanceable in the densest surface"
          body="The card is the constraint: ~280×80 px for the explanation. Labels only, no magnitude numbers, max two bars per column, ≥10% within-side threshold. A two-second glance gives the user the score, the dominant helper, and the dominant drag — enough to decide whether to open the detail page."
        />
        <div className="flex flex-wrap gap-6">
          <CardSurface
            payload={activeParcel.payload}
            parcelLabel={activeParcel.label}
            parcelMeta={activeParcel.meta}
          />
          <div className="text-xs text-muted-foreground max-w-xs space-y-2">
            <p>
              The card&apos;s only job is to answer{" "}
              <em>should I look at this parcel at all?</em>
            </p>
            <p>
              Tapping the card opens the listing detail page — no drill-down on
              the card itself.
            </p>
          </div>
        </div>
      </section>

      {/* All-at-once comparison */}
      <section className="container mx-auto px-4 py-12 space-y-6">
        <SectionHeader
          eyebrow="Stress test · Across the score range"
          title="The same idiom holds at 27, 54, and 82"
          body="The acceptance bar: a user shown two parcels with the same score but different drivers can identify how they differ without opening either detail page. The bar columns adapt their amplitude to the parcel — a helpers-dominant parcel shows long green and short red, a drags-dominant parcel shows the reverse."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PARCELS.map((p) => (
            <CardSurface
              key={p.key}
              payload={p.payload}
              parcelLabel={p.label}
              parcelMeta={p.meta}
            />
          ))}
        </div>
      </section>

      {/* Data contract */}
      <section className="container mx-auto px-4 py-12 space-y-6 max-w-4xl">
        <SectionHeader
          eyebrow="Data contract"
          title="What the model side has to ship"
          body="A single JSON object per parcel, plus one baseline_logit constant alongside the model artifact. All grouping, sign-splitting, normalisation, residual collapse, and labelling is done in the front end — that&apos;s why the same payload renders cleanly across all three surfaces above."
        />
        <Card>
          <CardContent className="p-6">
            <pre className="text-xs overflow-x-auto bg-muted/50 p-4 rounded-md">
              <code>{JSON.stringify(activeParcel.payload, null, 2)}</code>
            </pre>
            <div className="mt-4 text-xs text-muted-foreground space-y-1">
              <div>
                <strong className="text-foreground">score</strong> = round(predict_proba × 100)
              </div>
              <div>
                <strong className="text-foreground">contributions</strong> = raw TreeSHAP
                output, logit units, no scaling. Whatever{" "}
                <code className="text-[10px]">
                  booster.predict(DMatrix, pred_contribs=True)
                </code>{" "}
                returns minus the bias column.
              </div>
              <div className="pt-2 border-t border-border/60 mt-2">
                <strong className="text-foreground">baseline_logit</strong> = {BASELINE_LOGIT} —
                published once per model, used to render the &ldquo;average parcel&rdquo;
                tick on the gauge.
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* What's locked vs open */}
      <section className="container mx-auto px-4 py-12 space-y-6 max-w-4xl">
        <SectionHeader
          eyebrow="Reading guide"
          title="What this preview is and isn&apos;t deciding"
          body=""
        />
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                Locked by this preview
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>· Gauge + two-column helping/hurting bars as the idiom.</p>
              <p>· Per-side normalisation; bars are not in score-point units.</p>
              <p>· Group-then-drill-down structure with opaque-features residual.</p>
              <p>· Free-tier visible — no premium-data dependency in the visual.</p>
            </CardContent>
          </Card>
          <Card className="border-secondary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4 text-secondary" />
                Still open
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>· Final colour palette, bar geometry, motion, dark-mode treatment.</p>
              <p>· Hide-threshold tuning on borderline parcels (open question 5).</p>
              <p>· Drill-down interaction model — tap, hover, or always-expanded.</p>
              <p>· Sort-affordance breadth on the list page.</p>
              <p>· Whether to render baseline tick raw or normalised across regions.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t bg-card mt-8">
        <div className="container mx-auto px-4 py-6 text-xs text-muted-foreground">
          Mock preview only · See{" "}
          <code>sunnyplans-docs/01_roadmap/p2-e1-sunnyscore-visual.md</code> for
          the full design proposal.
        </div>
      </footer>
    </div>
  );
};

export default SunnyScorePreview;
