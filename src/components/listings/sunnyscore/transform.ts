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

export const isExplainable = (feature: string): boolean =>
  feature in FEATURE_LABEL && !OPAQUE_PATTERN.test(feature);

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

    const fv = payload.featureValues ?? {};
    const bars: FeatureRow[] = explainable
      .map((f) => ({
        feature: f.name,
        label: FEATURE_LABEL[f.name] ?? f.name,
        value: Math.abs(f.value),
        signedValue: f.value,
        shareOfSide: 0,
        shareOfTotal: 0,
        rawValue: fv[f.name] ?? null,
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
        shareOfTotal: 0,
        rawValue: null,
        isResidual: true,
      });
    }

    const row: GroupRow = {
      group,
      label: GROUP_LABEL[group],
      total: Math.abs(net),
      signedSum: net,
      shareOfSide: 0,
      shareOfTotal: 0,
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

  const overallTotal = Math.max(helpingTotal + hurtingTotal, 1e-9);
  helping.forEach((g) => {
    g.shareOfSide = g.total / Math.max(helpingTotal, 1e-9);
    g.shareOfTotal = g.total / overallTotal;
    g.bars.forEach((b) => {
      b.shareOfSide = b.value / Math.max(helpingTotal, 1e-9);
      b.shareOfTotal = b.value / overallTotal;
    });
  });
  hurting.forEach((g) => {
    g.shareOfSide = g.total / Math.max(hurtingTotal, 1e-9);
    g.shareOfTotal = g.total / overallTotal;
    g.bars.forEach((b) => {
      b.shareOfSide = b.value / Math.max(hurtingTotal, 1e-9);
      b.shareOfTotal = b.value / overallTotal;
    });
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
