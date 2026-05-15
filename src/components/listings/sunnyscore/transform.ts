// SunnyScore™ explanation — pure transform.
//
// Turns the model-side payload (`{ score, contributions }`) into a
// renderable structure: groups → features, sign-split, per-side
// normalised. The taxonomy and labels live here too — they're owned
// by the FE per the data contract in p2-e1-sunnyscore-visual.md, so
// adding/renaming a group never requires a model retrain.

export type Contributions = Record<string, number>;

export interface ParcelPayload {
  score: number;
  // `feature_name → SHAP value`, plus one reserved non-feature key
  // `baseline` (= BASELINE_KEY) carrying the model's bias in logit
  // units. The pipeline (pipelines/core/sunnyscore/apply.py) emits
  // `baseline` on every scored row; callers should guard on a
  // populated `contributions` dict before handing the payload in.
  // The grouping pass drops keys it doesn't recognise, so the
  // baseline silently falls out there; the reference-strip avg tick
  // reads it explicitly via baselineScoreFromPayload below.
  contributions: Contributions;
}

export type GroupKey =
  | "grid"
  | "solar"
  | "terrain"
  | "land_use"
  | "constraints";

export const GROUP_LABEL: Record<GroupKey, string> = {
  grid: "Grid",
  solar: "Solar resource",
  terrain: "Terrain",
  land_use: "Land use & surroundings",
  constraints: "Constraints & distances",
};

// Feature → group mapping. Confirmed against the live payload's actual
// feature names; unknown features fall through (silently dropped — they
// would log in a real impl). Update when adding model inputs.
export const FEATURE_TO_GROUP: Record<string, GroupKey> = {
  // Grid
  power_substation: "grid",
  power_line: "grid",
  power_tower: "grid",
  voltage_kv_within_5km: "grid",
  // Solar
  irradiance_annual_mean: "solar",
  cloud_cover_p50: "solar",
  temperature_factor: "solar",
  ghi_kwh_m2_yr: "solar",
  dni_kwh_m2_yr: "solar",
  pv_specific_yield_kwh_kwp_yr: "solar",
  // Terrain
  flat_5_acres: "terrain",
  flat_5_acres_pct: "terrain",
  slope_p95: "terrain",
  slope_p50: "terrain",
  slope_mean: "terrain",
  elevation_kurtosis: "terrain",
  // Land use
  landuse_residential: "land_use",
  landuse_residential_distance: "land_use",
  landuse_agricultural_share: "land_use",
  natural_wetland: "land_use",
  land_use_diversity_index: "land_use",
  // Constraints
  military_base: "constraints",
  protected_area: "constraints",
  airport_distance: "constraints",
  airport: "constraints",
  water_body_distance: "constraints",
  water_body: "constraints",
};

export const FEATURE_LABEL: Record<string, string> = {
  power_substation: "Distance to nearest substation",
  power_line: "Distance to transmission line",
  power_tower: "Distance to nearest tower",
  voltage_kv_within_5km: "Voltage class within 5 km",
  irradiance_annual_mean: "Average annual irradiance",
  ghi_kwh_m2_yr: "Annual global irradiance",
  dni_kwh_m2_yr: "Annual direct irradiance",
  pv_specific_yield_kwh_kwp_yr: "Expected PV yield",
  flat_5_acres: "Flat (<5%) acres on parcel",
  flat_5_acres_pct: "Share of parcel that's flat",
  landuse_residential: "Distance to nearest residential parcel",
  landuse_residential_distance: "Distance to nearest residential parcel",
  landuse_agricultural_share: "Share of agricultural neighbours",
  natural_wetland: "Distance to nearest wetland",
  military_base: "Distance to nearest military base",
  protected_area: "Distance to nearest protected area",
  airport: "Distance to nearest airport",
  airport_distance: "Distance to nearest airport",
  water_body: "Distance to nearest water body",
  water_body_distance: "Distance to nearest water body",
};

// Suffixes that mark a feature as opaque to a non-technical reader; it
// will collapse into a per-group residual instead of getting its own row.
const OPAQUE_PATTERN = /(_p\d+|_mean|_std|_kurtosis|_diversity_index|_log|_embedding)$/;

export const isExplainable = (feature: string): boolean =>
  feature in FEATURE_LABEL && !OPAQUE_PATTERN.test(feature);

export interface FeatureRow {
  feature: string;
  label: string;
  value: number;
  signedValue: number;
  shareOfSide: number;
  isResidual: boolean;
}

export interface GroupRow {
  group: GroupKey;
  label: string;
  total: number;
  signedSum: number;
  shareOfSide: number;
  bars: FeatureRow[];
}

export interface Explanation {
  helping: GroupRow[];
  hurting: GroupRow[];
  helpingTotal: number;
  hurtingTotal: number;
  maxSideTotal: number;
}

export function buildExplanation(payload: ParcelPayload): Explanation {
  const byGroup: Record<GroupKey, { name: string; value: number }[]> = {
    grid: [],
    solar: [],
    terrain: [],
    land_use: [],
    constraints: [],
  };

  for (const [feature, value] of Object.entries(payload.contributions)) {
    const group = FEATURE_TO_GROUP[feature];
    if (!group) continue;
    byGroup[group].push({ name: feature, value });
  }

  const helping: GroupRow[] = [];
  const hurting: GroupRow[] = [];
  let helpingTotal = 0;
  let hurtingTotal = 0;

  (Object.keys(byGroup) as GroupKey[]).forEach((group) => {
    const features = byGroup[group];
    if (features.length === 0) return;
    const net = features.reduce((s, f) => s + f.value, 0);
    if (Math.abs(net) < 1e-6) return;

    // Surface group-level signal; counter-direction features fold into
    // the residual rather than fighting the group's headline direction.
    const sameSign = features.filter((f) => Math.sign(f.value) === Math.sign(net));
    const explainable = sameSign.filter((f) => isExplainable(f.name));
    const residualValue =
      sameSign.reduce((s, f) => s + f.value, 0) -
      explainable.reduce((s, f) => s + f.value, 0) +
      features
        .filter((f) => Math.sign(f.value) !== Math.sign(net))
        .reduce((s, f) => s + f.value, 0);

    const bars: FeatureRow[] = explainable
      .map((f) => ({
        feature: f.name,
        label: FEATURE_LABEL[f.name] ?? f.name,
        value: Math.abs(f.value),
        signedValue: f.value,
        shareOfSide: 0,
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
      shareOfSide: 0,
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

// ---------------------------------------------------------------------------
// Contribution-bar layout — per-side normalised widths for the gauge.
// ---------------------------------------------------------------------------

export type ColumnSide = "helping" | "hurting";

export interface ContributionFeature {
  key: string;
  label: string;
  groupKey: GroupKey;
  isResidual: boolean;
  widthOfGroup: number;
  shareOfSide: number;
}

export interface ContributionGroup {
  key: GroupKey;
  label: string;
  side: ColumnSide;
  widthOfSide: number;
  features: ContributionFeature[];
}

export interface ContributionBar {
  helpingWidth: number;
  hurtingWidth: number;
  helpingGroups: ContributionGroup[];
  hurtingGroups: ContributionGroup[];
}

export function computeContributionBar(explanation: Explanation): ContributionBar {
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

export interface HoverState {
  key: string | null;
  groupKey: GroupKey;
  side: ColumnSide;
}

export type HoverHandler = (next: HoverState | null) => void;

export function findFeature(
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

// Reserved non-feature key in `contributions` that carries the model's
// bias in logit units. Mirror of
// pipelines/core/sunnyscore/apply.py:BASELINE_KEY — keep both sides
// in sync if the pipeline-side constant ever moves.
export const BASELINE_KEY = "baseline";

const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));

// The reference-strip avg tick lives at sigmoid(baseline) × 100. Derived
// per render from the payload so a per-model (or per-region) baseline
// flows through without any config plumbing. Assumes the caller has
// guarded on a populated `contributions` dict — the pipeline contract
// guarantees `baseline` is present on every non-empty row.
export const baselineScoreFromPayload = (payload: ParcelPayload): number =>
  Math.round(sigmoid(payload.contributions[BASELINE_KEY]) * 100);
