// SunnyScore™ explanation — pure transform.
//
// Turns the model-side payload (`{ score, contributions }`) into a
// renderable structure: groups → features, sign-split, per-side
// normalised. The taxonomy and labels live here too — they're owned
// by the FE per the data contract in p2-e1-sunnyscore-visual.md, so
// adding/renaming a group never requires a model retrain.

export type Contributions = Record<string, number>;
export type FeatureValues = Record<string, number | null | undefined>;

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
  // Optional raw feature values keyed by the same names as `contributions`
  // — e.g. `power_substation → 850` (metres). When supplied the SHAP card
  // surfaces the measured value next to each feature row so the reader
  // sees both "how strong is this signal" (SHAP) and "what is its
  // underlying measurement" (the raw value). Missing keys render blank.
  featureValues?: FeatureValues;
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

// Feature → group mapping. Source of truth is the trained model's
// `feature_names_in_` (`model_solar_xgb@prod`, shared US+IT), which is
// the union of:
//   - the OSM tag pairs in
//     pipelines/dbt/models/osm/solar_osm_candidate_features.sql,
//     materialised by pipelines/core/common/osm_distances.py with the
//     column-name convention `{osm_key}_{osm_value}` (53 distance
//     features in metres), and
//   - `flat_5_acres_pct` + `ghi_kwh_m2_yr` + `dni_kwh_m2_yr` +
//     `pv_specific_yield_kwh_kwp_yr` from
//     pipelines/dbt/models/us/sunnyscore/feat_solar_all.sql.
// `pad_acres`, `nwi_acres`, and `flat_5_acres` are excluded at training
// time (pipelines/core/notebooks/sunnyscore/model_solar_xgb.py
// NON_FEATURE_COLS), so they never appear in the SHAP payload.
// Every key the model emits has an entry here so it counts toward the
// helping/hurting totals — unknown keys are silently dropped at
// buildExplanation, which would distort the gauge. Refresh this dict
// when adding/removing rows from solar_osm_candidate_features or
// feat_solar_all.
export const FEATURE_TO_GROUP: Record<string, GroupKey> = {
  // Grid — power infrastructure (closer = positive signal)
  power_line: "grid",
  power_minor_line: "grid",
  power_pole: "grid",
  power_tower: "grid",
  power_substation: "grid",
  power_transformer: "grid",

  // Solar resource (GSA-derived per-parcel sample)
  ghi_kwh_m2_yr: "solar",
  dni_kwh_m2_yr: "solar",
  pv_specific_yield_kwh_kwp_yr: "solar",

  // Terrain (parcel-internal buildability)
  flat_5_acres_pct: "terrain",

  // Land use — surrounding land character: residential / industrial /
  // commercial neighbours, plus civil infrastructure proximity. Driver
  // for "what's next door?"
  landuse_residential: "land_use",
  landuse_commercial: "land_use",
  landuse_industrial: "land_use",
  landuse_retail: "land_use",
  landuse_reservoir: "land_use",
  landuse_brownfield: "land_use",
  landuse_landfill: "land_use",
  landuse_quarry: "land_use",
  landuse_railway: "land_use",
  building_residential: "land_use",
  building_commercial: "land_use",
  building_industrial: "land_use",
  building_school: "land_use",
  building_hospital: "land_use",
  building_university: "land_use",
  amenity_hospital: "land_use",
  amenity_school: "land_use",
  amenity_university: "land_use",
  natural_wood: "land_use",
  natural_water: "land_use",
  tourism_attraction: "land_use",
  tourism_museum: "land_use",
  tourism_zoo: "land_use",
  highway_motorway: "land_use",
  highway_trunk: "land_use",
  highway_primary: "land_use",
  highway_secondary: "land_use",
  highway_tertiary: "land_use",
  railway_rail: "land_use",
  railway_station: "land_use",

  // Constraints — regulatory exclusions, hazard buffers, water-body
  // setbacks. Distances that hurt suitability when too small.
  landuse_military: "constraints",
  military_base: "constraints",
  military_airfield: "constraints",
  military_danger_area: "constraints",
  military_training_area: "constraints",
  aeroway_aerodrome: "constraints",
  aeroway_heliport: "constraints",
  leisure_nature_reserve: "constraints",
  leisure_park: "constraints",
  natural_wetland: "constraints",
  natural_cliff: "constraints",
  natural_peak: "constraints",
  natural_ridge: "constraints",
  waterway_river: "constraints",
  waterway_stream: "constraints",
  waterway_canal: "constraints",
  waterway_dam: "constraints",
};

// Curated subset of FEATURE_TO_GROUP — only the entries here render as
// their own bar; everything else folds into the per-group "Other ___
// factors" residual. Keep this lean so the explanation stays scannable.
export const FEATURE_LABEL: Record<string, string> = {
  // Grid
  power_substation: "Distance to nearest substation",
  power_line: "Distance to transmission line",
  power_tower: "Distance to transmission tower",
  // Solar
  ghi_kwh_m2_yr: "Annual global irradiance",
  dni_kwh_m2_yr: "Annual direct irradiance",
  pv_specific_yield_kwh_kwp_yr: "Expected PV yield",
  // Terrain
  flat_5_acres_pct: "Share of parcel that's flat",
  // Land use
  landuse_residential: "Distance to nearest residential parcel",
  landuse_industrial: "Distance to nearest industrial area",
  landuse_commercial: "Distance to nearest commercial area",
  landuse_brownfield: "Distance to nearest brownfield",
  landuse_landfill: "Distance to nearest landfill",
  landuse_quarry: "Distance to nearest quarry",
  building_residential: "Distance to nearest residential building",
  natural_wood: "Distance to nearest forest",
  natural_water: "Distance to nearest water body",
  highway_motorway: "Distance to nearest motorway",
  highway_primary: "Distance to nearest primary road",
  railway_rail: "Distance to nearest railway",
  // Constraints
  military_base: "Distance to nearest military base",
  aeroway_aerodrome: "Distance to nearest airport",
  leisure_nature_reserve: "Distance to nearest nature reserve",
  leisure_park: "Distance to nearest park",
  natural_wetland: "Distance to nearest wetland",
  waterway_river: "Distance to nearest river",
};

// Suffixes that mark a feature as opaque to a non-technical reader; it
// will collapse into a per-group residual instead of getting its own row.
const OPAQUE_PATTERN = /(_p\d+|_mean|_std|_kurtosis|_diversity_index|_log|_embedding)$/;

// Per-group cap on how many features render as their own row. The top-N
// by |SHAP| win their own bar; the rest fold into "Other ___ factors".
// Tune here to make the card denser or sparser.
const MAX_FEATURES_PER_GROUP = 5;

export const isExplainable = (feature: string): boolean =>
  !OPAQUE_PATTERN.test(feature);

// Fallback label for OSM distance features that aren't in FEATURE_LABEL.
// The model emits `{osm_key}_{osm_value}` (see osm_distances.py); we
// humanize both halves. `military_danger_area` → key=`military`,
// value=`danger area`. Non-distance features always have a curated entry.
const humanizeOsmFeature = (feature: string): string => {
  const idx = feature.indexOf("_");
  if (idx < 0) return feature.replace(/_/g, " ");
  const value = feature.slice(idx + 1).replace(/_/g, " ");
  return `Distance to nearest ${value}`;
};

export const labelFor = (feature: string): string =>
  FEATURE_LABEL[feature] ?? humanizeOsmFeature(feature);

export interface FeatureRow {
  feature: string;
  label: string;
  value: number;
  signedValue: number;
  shareOfSide: number;
  // |SHAP value| / (helpingTotal + hurtingTotal) — i.e. this feature's
  // share of all SHAP magnitude moving the score away from the baseline.
  // Comparable across helping/hurting; used to report "% of overall".
  shareOfTotal: number;
  // Raw measured value pulled from ParcelPayload.featureValues, or null
  // for residuals / when the caller didn't supply a value.
  rawValue: number | null;
  isResidual: boolean;
}

export interface GroupRow {
  group: GroupKey;
  label: string;
  total: number;
  signedSum: number;
  shareOfSide: number;
  shareOfTotal: number;
  bars: FeatureRow[];
}

export interface Explanation {
  helping: GroupRow[];
  hurting: GroupRow[];
  helpingTotal: number;
  hurtingTotal: number;
  maxSideTotal: number;
}

// ---------------------------------------------------------------------------
// buildExplanation — pure pipeline from raw contributions to the
// renderable per-side structure. Lifted helpers below the constants keep
// the orchestrator at the bottom readable as prose.
// ---------------------------------------------------------------------------

export type ColumnSide = "helping" | "hurting";

// SHAP magnitudes below this are treated as no signal: zero-net groups
// and floating-point dust would otherwise emit empty rows.
const EPSILON_SIGNAL = 1e-6;

// Residuals below this magnitude are dropped — a sub-0.01 "Other ___"
// sliver adds no information and just lengthens the column.
const RESIDUAL_THRESHOLD = 0.01;

// Column rows/bars strictly below 1% of the total SHAP magnitude are
// hidden in the Strengths/Weaknesses columns — once percentages are the
// unit, a sub-1% driver isn't worth a row. Visible percentages won't sum
// to exactly 100%; that's intentional. The gauge segments still render
// everything so the full distribution stays visible at a glance.
export const MIN_VISIBLE_SHARE = 0.01;

// A side whose total |SHAP| is below this threshold is suppressed
// entirely (empty rows, zero-width gauge bar). The pathological case is
// a parcel with one tiny lone negative that, without this floor, fills
// 100% of the hurting bar and reads as a meaningful drag — answers Open
// Question 5 in p2-e1-sunnyscore-visual.md. Applied symmetrically so
// near-baseline parcels also don't fabricate a helping side from noise.
const MIN_SIDE_TOTAL = 0.05;

// Side-specific noun for the residual label: "Other land use strengths"
// vs "Other land use weaknesses". Centralised so the strings are easy to
// audit. Note: ColumnSide values stay "helping"/"hurting" internally —
// only the display strings reframe the column as parcel attributes.
const RESIDUAL_NOUN: Record<ColumnSide, string> = {
  helping: "strengths",
  hurting: "weaknesses",
};

interface RawFeature {
  name: string;
  value: number;
}

const bucketFeaturesByGroup = (
  contributions: Contributions,
): Record<GroupKey, RawFeature[]> => {
  const byGroup: Record<GroupKey, RawFeature[]> = {
    grid: [],
    solar: [],
    terrain: [],
    land_use: [],
    constraints: [],
  };
  for (const [name, value] of Object.entries(contributions)) {
    const group = FEATURE_TO_GROUP[name];
    if (group) byGroup[group].push({ name, value });
  }
  return byGroup;
};

const splitBySign = (
  features: RawFeature[],
): { positives: RawFeature[]; negatives: RawFeature[] } => ({
  positives: features.filter((f) => f.value > 0),
  negatives: features.filter((f) => f.value < 0),
});

const sumValues = (features: RawFeature[]): number =>
  features.reduce((s, f) => s + f.value, 0);

// Top-N most informative features for this side, ranked by |SHAP|.
// Opaque-named features (see OPAQUE_PATTERN) are excluded from the
// surfaced list and fall into the residual instead.
const rankSurfaceableFeatures = (features: RawFeature[]): RawFeature[] =>
  features
    .filter((f) => isExplainable(f.name))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, MAX_FEATURES_PER_GROUP);

const buildFeatureBar = (
  feature: RawFeature,
  rawValue: number | null,
): FeatureRow => ({
  feature: feature.name,
  label: labelFor(feature.name),
  value: Math.abs(feature.value),
  signedValue: feature.value,
  shareOfSide: 0,
  shareOfTotal: 0,
  rawValue,
  isResidual: false,
});

const buildResidualBar = (
  group: GroupKey,
  side: ColumnSide,
  residualValue: number,
): FeatureRow => ({
  feature: `__residual_${side}_${group}`,
  label: `Other ${GROUP_LABEL[group].toLowerCase()} ${RESIDUAL_NOUN[side]}`,
  value: Math.abs(residualValue),
  signedValue: residualValue,
  shareOfSide: 0,
  shareOfTotal: 0,
  rawValue: null,
  isResidual: true,
});

// Build the GroupRow for one (group, side) combination. Each feature
// lands on its own side by SHAP sign, so a group with mixed signal
// produces two rows — one per column. Returns null when the side has no
// meaningful signal for this group.
const buildSideRow = (
  group: GroupKey,
  sideFeatures: RawFeature[],
  side: ColumnSide,
  featureValues: FeatureValues,
): GroupRow | null => {
  const sideSum = sumValues(sideFeatures);
  if (Math.abs(sideSum) < EPSILON_SIGNAL) return null;

  const surfaced = rankSurfaceableFeatures(sideFeatures);
  const residualValue = sideSum - sumValues(surfaced);

  const bars: FeatureRow[] = surfaced.map((f) =>
    buildFeatureBar(f, featureValues[f.name] ?? null),
  );
  if (Math.abs(residualValue) > RESIDUAL_THRESHOLD) {
    bars.push(buildResidualBar(group, side, residualValue));
  }

  return {
    group,
    label: GROUP_LABEL[group],
    total: Math.abs(sideSum),
    signedSum: sideSum,
    shareOfSide: 0,
    shareOfTotal: 0,
    bars,
  };
};

// In-place share normalisation: each row gets shareOfSide (weight within
// its column) and shareOfTotal (weight across both columns). The
// denominators are floored so empty sides can't divide by zero.
const assignShares = (
  rows: GroupRow[],
  sideTotal: number,
  overallTotal: number,
): void => {
  const sideDenominator = Math.max(sideTotal, EPSILON_SIGNAL);
  const overallDenominator = Math.max(overallTotal, EPSILON_SIGNAL);
  for (const row of rows) {
    row.shareOfSide = row.total / sideDenominator;
    row.shareOfTotal = row.total / overallDenominator;
    for (const bar of row.bars) {
      bar.shareOfSide = bar.value / sideDenominator;
      bar.shareOfTotal = bar.value / overallDenominator;
    }
  }
};

export function buildExplanation(payload: ParcelPayload): Explanation {
  const featureValues = payload.featureValues ?? {};
  const byGroup = bucketFeaturesByGroup(payload.contributions);

  const helping: GroupRow[] = [];
  const hurting: GroupRow[] = [];
  for (const group of Object.keys(byGroup) as GroupKey[]) {
    const { positives, negatives } = splitBySign(byGroup[group]);
    const helpingRow = buildSideRow(group, positives, "helping", featureValues);
    const hurtingRow = buildSideRow(group, negatives, "hurting", featureValues);
    if (helpingRow) helping.push(helpingRow);
    if (hurtingRow) hurting.push(hurtingRow);
  }

  const rawHelpingTotal = helping.reduce((s, r) => s + r.total, 0);
  const rawHurtingTotal = hurting.reduce((s, r) => s + r.total, 0);
  const helpingSuppressed = rawHelpingTotal < MIN_SIDE_TOTAL;
  const hurtingSuppressed = rawHurtingTotal < MIN_SIDE_TOTAL;
  const visibleHelping = helpingSuppressed ? [] : helping;
  const visibleHurting = hurtingSuppressed ? [] : hurting;
  const helpingTotal = helpingSuppressed ? 0 : rawHelpingTotal;
  const hurtingTotal = hurtingSuppressed ? 0 : rawHurtingTotal;
  const overallTotal = helpingTotal + hurtingTotal;
  assignShares(visibleHelping, helpingTotal, overallTotal);
  assignShares(visibleHurting, hurtingTotal, overallTotal);

  visibleHelping.sort((a, b) => b.total - a.total);
  visibleHurting.sort((a, b) => b.total - a.total);

  return {
    helping: visibleHelping,
    hurting: visibleHurting,
    helpingTotal,
    hurtingTotal,
    maxSideTotal: Math.max(helpingTotal, hurtingTotal, EPSILON_SIGNAL),
  };
}

// ---------------------------------------------------------------------------
// Contribution-bar layout — per-side normalised widths for the gauge.
// (ColumnSide is declared above so buildExplanation's helpers can use it.)
// ---------------------------------------------------------------------------

export interface ContributionFeature {
  key: string;
  label: string;
  groupKey: GroupKey;
  isResidual: boolean;
  widthOfGroup: number;
  shareOfSide: number;
  shareOfTotal: number;
  rawValue: number | null;
}

export interface ContributionGroup {
  key: GroupKey;
  label: string;
  side: ColumnSide;
  widthOfSide: number;
  shareOfTotal: number;
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
    shareOfTotal: g.shareOfTotal,
    features: g.bars.map((b) => ({
      key: b.feature,
      label: b.label,
      groupKey: g.group,
      isResidual: b.isResidual,
      widthOfGroup: b.value / Math.max(g.total, 1e-9),
      shareOfSide: b.shareOfSide,
      shareOfTotal: b.shareOfTotal,
      rawValue: b.rawValue,
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

// Flat driver projection — each explainable feature row, tagged with its
// group and helping/hurting side, sorted by |SHAP| descending. The
// detail-page card renders this directly instead of the two-column
// helping/hurting split: one ranked list with diverging bars reads
// better at a glance than two parallel columns.
export interface Driver extends FeatureRow {
  group: GroupKey;
  side: ColumnSide;
}

export function buildDrivers(explanation: Explanation): Driver[] {
  const drivers: Driver[] = [];
  for (const row of explanation.helping) {
    for (const bar of row.bars) drivers.push({ ...bar, group: row.group, side: "helping" });
  }
  for (const row of explanation.hurting) {
    for (const bar of row.bars) drivers.push({ ...bar, group: row.group, side: "hurting" });
  }
  drivers.sort((a, b) => b.value - a.value);
  return drivers;
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

// Per-feature value formatting. OSM distance features fold into one
// "metres" branch (with imperial conversion when requested); the
// non-distance features each have their own unit. Keep in sync with
// the FEATURE_TO_GROUP mapping above: any new feature key needs an
// entry here or it falls through to the generic numeric formatter.
export type FeatureUnit = "imperial" | "metric";

const isDistanceFeature = (feature: string): boolean =>
  feature in FEATURE_TO_GROUP &&
  !(
    feature === "flat_5_acres_pct" ||
    feature === "ghi_kwh_m2_yr" ||
    feature === "dni_kwh_m2_yr" ||
    feature === "pv_specific_yield_kwh_kwp_yr"
  );

const fmtDistance = (meters: number, unit: FeatureUnit): string => {
  if (unit === "imperial") {
    const miles = meters * 0.000621371;
    if (miles < 0.1) return `${Math.round(meters)} m`;
    return `${miles.toFixed(miles < 10 ? 2 : 1)} mi`;
  }
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  return `${km.toFixed(km < 10 ? 2 : 1)} km`;
};

export function formatFeatureValue(
  feature: string,
  value: number | null,
  unit: FeatureUnit = "imperial",
): string {
  if (value == null || !Number.isFinite(value)) return "";
  if (feature === "flat_5_acres_pct") return `${Math.round(value * 100)}% flat`;
  if (feature === "ghi_kwh_m2_yr") return `${Math.round(value)} kWh/m²/yr GHI`;
  if (feature === "dni_kwh_m2_yr") return `${Math.round(value)} kWh/m²/yr DNI`;
  if (feature === "pv_specific_yield_kwh_kwp_yr")
    return `${Math.round(value)} kWh/kWp/yr`;
  if (isDistanceFeature(feature)) return fmtDistance(value, unit);
  return `${value}`;
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
