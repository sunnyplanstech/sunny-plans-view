// SunnyScore™ explanation visual — gauge + helping/hurting bars + columns.
//
// Locked-in idiom from p2-e1-sunnyscore-visual.md. Three callers hand
// the same props in three sizes (card / detail / landing); the
// components below adapt density via the `size` and `expandable` props
// and otherwise render identically. All grouping, sign-splitting, and
// per-side normalisation lives in ./transform.ts — this file is pure
// rendering plus the shared hover-state hook.

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  baselineScoreFromPayload,
  buildExplanation,
  computeContributionBar,
  findFeature,
  formatFeatureValue,
  MIN_VISIBLE_SHARE,
  type ColumnSide,
  type ContributionBar,
  type ContributionFeature,
  type ContributionGroup,
  type Explanation,
  type FeatureUnit,
  type GroupRow,
  type HoverHandler,
  type HoverState,
  type ParcelPayload,
} from "./transform";

export type SunnyScoreSize = "sm" | "md" | "lg";

interface SunnyScoreExplanationProps {
  payload: ParcelPayload;
  size?: SunnyScoreSize;
  // Card surface caps the column to N rows per side and disables drill-
  // down; detail/landing surfaces leave both unset.
  maxRowsPerSide?: number;
  expandable?: boolean;
  // Show a "tap to expand" chevron on un-expandable rows (card surface
  // hint that the detail page has more).
  expandableHint?: boolean;
  // Unit system for distance-typed feature values. Defaults to imperial.
  unit?: FeatureUnit;
}

export const SunnyScoreExplanation = ({
  payload,
  size = "md",
  maxRowsPerSide,
  expandable = false,
  expandableHint = false,
  unit = "imperial",
}: SunnyScoreExplanationProps) => {
  const explanation = useMemo(() => buildExplanation(payload), [payload]);
  const contributionBar = useMemo(
    () => computeContributionBar(explanation),
    [explanation],
  );
  const baselineScore = useMemo(
    () => baselineScoreFromPayload(payload),
    [payload],
  );
  const [hovered, setHovered] = useState<HoverState | null>(null);

  return (
    <div className="space-y-3">
      <ScoreGauge
        score={payload.score}
        baselineScore={baselineScore}
        size={size}
        contributionBar={contributionBar}
        hovered={hovered}
        onHover={setHovered}
      />
      <HelpingHurtingColumns
        explanation={explanation}
        expandable={expandable}
        expandableHint={expandableHint}
        maxRowsPerSide={maxRowsPerSide}
        unit={unit}
        hovered={hovered}
        onHover={setHovered}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Gauge — score number, 0–100 reference strip, helping/hurting bars.
// ---------------------------------------------------------------------------

interface ScoreGaugeProps {
  score: number;
  baselineScore: number;
  size?: SunnyScoreSize;
  contributionBar: ContributionBar;
  hovered?: HoverState | null;
  onHover?: HoverHandler;
}

const ScoreGauge = ({
  score,
  baselineScore,
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
          label="Strengths"
          icon={<TrendingUp className="h-3 w-3" />}
          labelClass="text-primary"
          groups={helpingGroups}
          sideWidth={helpingWidth}
          height={barHeight}
          hovered={hovered}
          onHover={onHover}
        />
        <SideBar
          label="Weaknesses"
          icon={<TrendingDown className="h-3 w-3" />}
          labelClass="text-negative"
          groups={hurtingGroups}
          sideWidth={hurtingWidth}
          height={barHeight}
          hovered={hovered}
          onHover={onHover}
        />
      </div>

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
              {Math.round(hoveredFeature.shareOfTotal * 100)}% of score
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
  const isGroupHov =
    !!hovered &&
    hovered.groupKey === group.key &&
    hovered.side === group.side &&
    !hovered.key;
  // Same side hovered, but a *different* group — fade this one back so
  // the active group reads as the foreground.
  const isOtherGroupOnSide =
    !!hovered &&
    hovered.side === group.side &&
    hovered.groupKey !== group.key;
  const isHelping = group.side === "helping";
  const widthPctOfGroup = feature.widthOfGroup * 100;

  // Default state is one solid colour per side; structure (dividers,
  // residual shading) only appears while the user is interrogating
  // this side via hover, so the at-a-glance signal stays unfragmented.
  const showStructure = hovered?.side === group.side;

  const isFirstOfSide = groupIndexInSide === 0 && featureIndexInGroup === 0;
  const isFirstOfGroup = featureIndexInGroup === 0;
  const dividerThickness = !showStructure
    ? 0
    : isFirstOfSide
    ? 0
    : isFirstOfGroup
    ? 3
    : 1;

  const baseColor = isHelping
    ? showStructure && feature.isResidual
      ? "bg-primary/40"
      : "bg-primary"
    : showStructure && feature.isResidual
    ? "bg-negative/40"
    : "bg-negative";

  const sharePct = Math.round(feature.shareOfTotal * 100);

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
        isGroupHov && "brightness-125",
        isOtherGroupOnSide && "opacity-40",
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
      title={`${feature.label} — ${sharePct}% of score`}
    />
  );
};

// ---------------------------------------------------------------------------
// Helping/Hurting columns — ranked named drivers with optional drill-down.
// ---------------------------------------------------------------------------

interface HelpingHurtingColumnsProps {
  explanation: Explanation;
  expandable?: boolean;
  expandableHint?: boolean;
  maxRowsPerSide?: number;
  unit?: FeatureUnit;
  hovered?: HoverState | null;
  onHover?: HoverHandler;
}

const HelpingHurtingColumns = ({
  explanation,
  expandable,
  expandableHint,
  maxRowsPerSide,
  unit = "imperial",
  hovered,
  onHover,
}: HelpingHurtingColumnsProps) => {
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    if (!expandable) return new Set();
    const all = new Set<string>();
    for (const r of explanation.helping) all.add(`helping_${r.group}`);
    for (const r of explanation.hurting) all.add(`hurting_${r.group}`);
    return all;
  });

  const toggle = (key: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // Drop rows that round to 0% before applying the per-side row cap, so
  // the cap surfaces the next-most-significant driver rather than burning
  // a slot on a sub-1% sliver.
  const trim = (rows: GroupRow[]): GroupRow[] => {
    const visible = rows.filter((r) => r.shareOfTotal >= MIN_VISIBLE_SHARE);
    return maxRowsPerSide ? visible.slice(0, maxRowsPerSide) : visible;
  };

  const renderColumn = (rows: GroupRow[], side: ColumnSide) => (
    <div className="flex-1 min-w-0">
      <SideHeader side={side} />
      {rows.length === 0 ? (
        <div className="text-xs text-muted-foreground italic py-2">
          {side === "helping"
            ? "No notable strengths."
            : "No notable weaknesses."}
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
                unit={unit}
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
      {isHelping ? "Strengths" : "Weaknesses"}
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
  unit?: FeatureUnit;
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
  unit = "imperial",
  hovered,
  onHover,
}: GroupRowItemProps) => {
  const isHelping = side === "helping";
  const sharePct = Math.round(row.shareOfTotal * 100);
  const groupHovered =
    hovered?.groupKey === row.group && hovered?.side === side;
  const visibleBars = row.bars.filter(
    (b) => b.shareOfTotal >= MIN_VISIBLE_SHARE,
  );

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

      {expandable && isOpen && visibleBars.length > 0 && (
        <ul className="mt-2 ml-5 space-y-0.5 text-xs border-l border-border/60 pl-3">
          {visibleBars.map((feat) => {
            const isHov = hovered?.key === feat.feature;
            const valueText = formatFeatureValue(feat.feature, feat.rawValue, unit);
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
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {Math.round(feat.shareOfTotal * 100)}%
                </span>
                {valueText && (
                  <span
                    className={cn(
                      "ml-auto text-xs font-semibold tabular-nums rounded px-1.5 py-0.5",
                      isHelping
                        ? "bg-primary/10 text-primary"
                        : "bg-negative/10 text-negative",
                    )}
                  >
                    {valueText}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
